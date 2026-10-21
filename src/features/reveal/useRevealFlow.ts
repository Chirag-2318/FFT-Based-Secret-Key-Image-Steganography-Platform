import { useReducer, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/api/types';
import { validateImage } from '@/lib/validateImage';
import { isKeyComplete, verifyKeyChecksum } from '@/lib/key';
import { useCountdown } from '@/hooks/useCountdown';

export type RevealState =
  | {
      status: 'empty';
      file: File | null;
      previewUrl: string | null;
      key: string;
      validationError?: string | null;
    }
  | {
      status: 'ready';
      file: File;
      previewUrl: string;
      key: string;
    }
  | {
      status: 'revealing';
      file: File;
      previewUrl: string;
      key: string;
      startedAt: number;
      slowNotice: boolean;
    }
  | {
      status: 'success';
      file: File;
      previewUrl: string;
      key: string;
      message: string;
    }
  | {
      status: 'failed';
      file: File;
      previewUrl: string;
      key: string;
    }
  | {
      status: 'error';
      file: File | null;
      previewUrl: string | null;
      key: string;
      error: ApiError;
    };

export type RevealAction =
  | { type: 'SET_FILE_VALID'; file: File; previewUrl: string }
  | { type: 'SET_FILE_INVALID'; file: File; error: string }
  | { type: 'CLEAR_FILE' }
  | { type: 'SET_KEY'; key: string }
  | { type: 'START_REVEALING'; startedAt: number }
  | { type: 'SLOW_NOTICE' }
  | { type: 'DECODE_SUCCESS'; message: string }
  | { type: 'DECODE_FAILED' }
  | { type: 'DECODE_ERROR'; error: ApiError }
  | { type: 'RATE_LIMIT_RESET' }
  | { type: 'RETRY' }
  | { type: 'RESET' };


export const initialRevealState: RevealState = {
  status: 'empty',
  file: null,
  previewUrl: null,
  key: '',
};

function evaluateRevealReadiness(
  file: File | null,
  previewUrl: string | null,
  key: string
): RevealState {
  if (!file || !previewUrl) {
    return {
      status: 'empty',
      file,
      previewUrl,
      key,
    };
  }

  const isComplete = isKeyComplete(key);
  const isValid = isComplete && verifyKeyChecksum(key);

  if (isComplete && isValid) {
    return {
      status: 'ready',
      file,
      previewUrl,
      key,
    };
  }

  return {
    status: 'empty',
    file,
    previewUrl,
    key,
  };
}

export function revealReducer(state: RevealState, action: RevealAction): RevealState {
  switch (action.type) {
    case 'SET_FILE_VALID': {
      return evaluateRevealReadiness(action.file, action.previewUrl, state.key);
    }

    case 'SET_FILE_INVALID': {
      return {
        status: 'empty',
        file: null,
        previewUrl: null,
        key: state.key,
        validationError: action.error,
      };
    }

    case 'CLEAR_FILE': {
      return {
        status: 'empty',
        file: null,
        previewUrl: null,
        key: state.key,
      };
    }

    case 'SET_KEY': {
      if (state.status === 'revealing') return state;
      const file = state.file;
      const previewUrl = state.previewUrl;
      return evaluateRevealReadiness(file, previewUrl, action.key);
    }

    case 'START_REVEALING': {
      if (state.status !== 'ready') return state;
      return {
        status: 'revealing',
        file: state.file,
        previewUrl: state.previewUrl,
        key: state.key,
        startedAt: action.startedAt,
        slowNotice: false,
      };
    }

    case 'SLOW_NOTICE': {
      if (state.status !== 'revealing') return state;
      return {
        ...state,
        slowNotice: true,
      };
    }

    case 'DECODE_SUCCESS': {
      if (state.status !== 'revealing') return state;
      return {
        status: 'success',
        file: state.file,
        previewUrl: state.previewUrl,
        key: state.key,
        message: action.message,
      };
    }

    case 'DECODE_FAILED': {
      if (state.status !== 'revealing') return state;
      return {
        status: 'failed',
        file: state.file,
        previewUrl: state.previewUrl,
        key: state.key,
      };
    }

    case 'DECODE_ERROR': {
      if (state.status !== 'revealing') return state;
      return {
        status: 'error',
        file: state.file,
        previewUrl: state.previewUrl,
        key: state.key,
        error: action.error,
      };
    }

    case 'RATE_LIMIT_RESET': {
      if (state.status === 'error' && state.error.kind === 'rate_limited') {
        return evaluateRevealReadiness(state.file, state.previewUrl, state.key);
      }
      return state;
    }

    case 'RETRY': {
      if (state.status === 'failed' || state.status === 'error') {
        return evaluateRevealReadiness(state.file, state.previewUrl, state.key);
      }
      return state;
    }

    case 'RESET': {
      return initialRevealState;
    }


    default:
      return state;
  }
}

/**
 * useRevealFlow hook
 * Explicit state machine for the Reveal (decode) flow.
 * Manages image input, key formatting/validation, rate limit countdowns,
 * and zero persistence cleanup.
 */
export function useRevealFlow() {
  const [state, dispatch] = useReducer(revealReducer, initialRevealState);

  const activeUrlsRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  const createTrackedUrl = useCallback((blob: Blob): string => {
    const url = URL.createObjectURL(blob);
    activeUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeTrackedUrl = useCallback((url: string | null) => {
    if (url && activeUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      activeUrlsRef.current.delete(url);
    }
  }, []);

  const cleanupAllUrls = useCallback(() => {
    activeUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    activeUrlsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      cleanupAllUrls();
    };
  }, [cleanupAllUrls]);

  // Rate-limit countdown timer
  const onCountdownEnd = useCallback(() => {
    dispatch({ type: 'RATE_LIMIT_RESET' });
  }, []);

  const {
    secondsLeft,
    isActive: isRateLimited,
    start: startCountdown,
    reset: resetCountdown,
  } = useCountdown(0, onCountdownEnd);

  // Set file handler
  const setFile = useCallback(
    async (file: File | null) => {
      abortControllerRef.current?.abort();

      if (!file) {
        if (state.previewUrl) {
          revokeTrackedUrl(state.previewUrl);
        }
        dispatch({ type: 'CLEAR_FILE' });
        return;
      }

      const validation = await validateImage(file, 'reveal');
      if (!validation.isValid) {
        dispatch({
          type: 'SET_FILE_INVALID',
          file,
          error: validation.error ?? 'Invalid image',
        });
        return;
      }

      if (state.previewUrl) {
        revokeTrackedUrl(state.previewUrl);
      }
      const previewUrl = createTrackedUrl(file);

      dispatch({
        type: 'SET_FILE_VALID',
        file,
        previewUrl,
      });
    },
    [state.previewUrl, createTrackedUrl, revokeTrackedUrl]
  );

  // Slow notice timer effect (triggers after 6 seconds of revealing)
  useEffect(() => {
    if (state.status !== 'revealing') return;

    const timer = setTimeout(() => {
      dispatch({ type: 'SLOW_NOTICE' });
    }, 6000);

    return () => clearTimeout(timer);
  }, [state.status]);

  // Set key handler
  const setKey = useCallback((key: string) => {
    dispatch({ type: 'SET_KEY', key });
  }, []);

  // Execute reveal action
  const reveal = useCallback(async () => {
    if (state.status !== 'ready') return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    dispatch({ type: 'START_REVEALING', startedAt: Date.now() });

    try {
      const result = await api.decode(state.file, state.key, controller.signal);
      dispatch({ type: 'DECODE_SUCCESS', message: result.message });
    } catch (err) {
      if (controller.signal.aborted) return;

      const apiError =
        err instanceof ApiError
          ? err
          : new ApiError('decode_failed', 'Nothing to reveal.', { cause: err });

      if (apiError.kind === 'decode_failed') {
        dispatch({ type: 'DECODE_FAILED' });
      } else {
        if (apiError.kind === 'rate_limited' && apiError.retryAfterSeconds) {
          startCountdown(apiError.retryAfterSeconds);
        }
        dispatch({ type: 'DECODE_ERROR', error: apiError });
      }
    }
  }, [state, startCountdown]);

  // Cancel ongoing reveal operation
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    dispatch({ type: 'RESET' });
  }, []);

  // Return to input state from failed/error while preserving image and key
  const retry = useCallback(() => {
    dispatch({ type: 'RETRY' });
  }, []);

  // Reset entire flow
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    resetCountdown();
    cleanupAllUrls();
    dispatch({ type: 'RESET' });
  }, [cleanupAllUrls, resetCountdown]);

  return {
    state,
    secondsLeft,
    isRateLimited,
    setFile,
    setKey,
    reveal,
    cancel,
    retry,
    reset,
  };
}

