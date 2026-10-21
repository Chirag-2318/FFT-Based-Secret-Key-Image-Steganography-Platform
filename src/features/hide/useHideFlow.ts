import { useReducer, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { EncodeResult, ApiError } from '@/lib/api/types';
import { validateImage, ImageDimensions } from '@/lib/validateImage';
import { maxMessageBytes } from '@/lib/limits';

export type HideInvalidReason =
  | 'no_image'
  | 'no_message'
  | 'over_capacity'
  | 'image_invalid';

export type HideState =
  | {
      status: 'empty';
      file: null;
      previewUrl: null;
      dimensions: null;
      message: string;
      usedBytes: number;
      capacityBytes: number | null;
      isCapacityLoading: boolean;
    }
  | {
      status: 'ready';
      file: File;
      previewUrl: string;
      dimensions: ImageDimensions;
      message: string;
      usedBytes: number;
      capacityBytes: number | null;
      isCapacityLoading: boolean;
    }
  | {
      status: 'invalid';
      file: File | null;
      previewUrl: string | null;
      dimensions: ImageDimensions | null;
      message: string;
      usedBytes: number;
      capacityBytes: number | null;
      isCapacityLoading: boolean;
      reason: HideInvalidReason;
      validationError?: string | null;
    }
  | {
      status: 'hiding';
      file: File;
      previewUrl: string;
      dimensions: ImageDimensions;
      message: string;
      usedBytes: number;
      capacityBytes: number | null;
      isCapacityLoading: boolean;
      startedAt: number;
      slowNotice: boolean;
    }
  | {
      status: 'done';
      file: File;
      previewUrl: string;
      dimensions: ImageDimensions;
      message: string;
      usedBytes: number;
      capacityBytes: number | null;
      isCapacityLoading: boolean;
      result: EncodeResult;
      stegoUrl: string;
      keySaved: boolean;
      keyCopied: boolean;
    }
  | {
      status: 'error';
      file: File | null;
      previewUrl: string | null;
      dimensions: ImageDimensions | null;
      message: string;
      usedBytes: number;
      capacityBytes: number | null;
      isCapacityLoading: boolean;
      error: ApiError;
      retryable: boolean;
    };

export type HideAction =
  | {
      type: 'SET_FILE_VALID';
      file: File;
      previewUrl: string;
      dimensions: ImageDimensions;
    }
  | {
      type: 'SET_FILE_INVALID';
      file: File;
      previewUrl: string | null;
      error: string;
    }
  | { type: 'CLEAR_FILE' }
  | { type: 'SET_MESSAGE'; message: string; usedBytes: number }
  | { type: 'SET_CAPACITY_LOADING'; isLoading: boolean }
  | { type: 'SET_CAPACITY_SUCCESS'; capacityBytes: number }
  | { type: 'START_HIDING'; startedAt: number }
  | { type: 'SLOW_NOTICE' }
  | { type: 'ENCODE_SUCCESS'; result: EncodeResult; stegoUrl: string }
  | { type: 'ENCODE_ERROR'; error: ApiError }
  | { type: 'MARK_KEY_SAVED'; saved: boolean }
  | { type: 'MARK_KEY_COPIED' }
  | { type: 'RESET' };

export const initialHideState: HideState = {
  status: 'empty',
  file: null,
  previewUrl: null,
  dimensions: null,
  message: '',
  usedBytes: 0,
  capacityBytes: null,
  isCapacityLoading: false,
};

/**
 * Computes whether the current parameters satisfy the 'ready' state criteria.
 */
function evaluateReadiness(
  file: File | null,
  previewUrl: string | null,
  dimensions: ImageDimensions | null,
  message: string,
  usedBytes: number,
  capacityBytes: number | null,
  isCapacityLoading: boolean
): HideState {
  if (!file || !previewUrl || !dimensions) {
    return {
      status: 'empty',
      file: null,
      previewUrl: null,
      dimensions: null,
      message,
      usedBytes,
      capacityBytes,
      isCapacityLoading,
    };
  }

  if (!message.trim()) {
    return {
      status: 'invalid',
      file,
      previewUrl,
      dimensions,
      message,
      usedBytes,
      capacityBytes,
      isCapacityLoading,
      reason: 'no_message',
    };
  }

  const effectiveCapacity =
    capacityBytes !== null ? Math.min(capacityBytes, maxMessageBytes) : maxMessageBytes;

  if (usedBytes > effectiveCapacity) {
    return {
      status: 'invalid',
      file,
      previewUrl,
      dimensions,
      message,
      usedBytes,
      capacityBytes,
      isCapacityLoading,
      reason: 'over_capacity',
    };
  }

  return {
    status: 'ready',
    file,
    previewUrl,
    dimensions,
    message,
    usedBytes,
    capacityBytes,
    isCapacityLoading,
  };
}

export function hideReducer(state: HideState, action: HideAction): HideState {
  switch (action.type) {
    case 'SET_FILE_VALID': {
      return evaluateReadiness(
        action.file,
        action.previewUrl,
        action.dimensions,
        state.message,
        state.usedBytes,
        state.capacityBytes,
        state.isCapacityLoading
      );
    }

    case 'SET_FILE_INVALID': {
      return {
        status: 'invalid',
        file: action.file,
        previewUrl: action.previewUrl,
        dimensions: null,
        message: state.message,
        usedBytes: state.usedBytes,
        capacityBytes: null,
        isCapacityLoading: false,
        reason: 'image_invalid',
        validationError: action.error,
      };
    }

    case 'CLEAR_FILE': {
      return {
        status: 'empty',
        file: null,
        previewUrl: null,
        dimensions: null,
        message: state.message,
        usedBytes: state.usedBytes,
        capacityBytes: null,
        isCapacityLoading: false,
      };
    }

    case 'SET_MESSAGE': {
      if (state.status === 'hiding' || state.status === 'done') {
        return state;
      }
      return evaluateReadiness(
        state.file,
        state.previewUrl,
        state.dimensions,
        action.message,
        action.usedBytes,
        state.capacityBytes,
        state.isCapacityLoading
      );
    }

    case 'SET_CAPACITY_LOADING': {
      if (state.status === 'hiding' || state.status === 'done') {
        return state;
      }
      return {
        ...state,
        isCapacityLoading: action.isLoading,
      };
    }

    case 'SET_CAPACITY_SUCCESS': {
      if (state.status === 'hiding' || state.status === 'done') {
        return state;
      }
      return evaluateReadiness(
        state.file,
        state.previewUrl,
        state.dimensions,
        state.message,
        state.usedBytes,
        action.capacityBytes,
        false
      );
    }

    case 'START_HIDING': {
      if (state.status !== 'ready') return state;
      return {
        status: 'hiding',
        file: state.file,
        previewUrl: state.previewUrl,
        dimensions: state.dimensions,
        message: state.message,
        usedBytes: state.usedBytes,
        capacityBytes: state.capacityBytes,
        isCapacityLoading: false,
        startedAt: action.startedAt,
        slowNotice: false,
      };
    }

    case 'SLOW_NOTICE': {
      if (state.status !== 'hiding') return state;
      return {
        ...state,
        slowNotice: true,
      };
    }

    case 'ENCODE_SUCCESS': {
      if (state.status !== 'hiding') return state;
      return {
        status: 'done',
        file: state.file,
        previewUrl: state.previewUrl,
        dimensions: state.dimensions,
        message: state.message,
        usedBytes: state.usedBytes,
        capacityBytes: state.capacityBytes,
        isCapacityLoading: false,
        result: action.result,
        stegoUrl: action.stegoUrl,
        keySaved: false,
        keyCopied: false,
      };
    }

    case 'ENCODE_ERROR': {
      if (state.status !== 'hiding') return state;
      const isRetryable =
        action.error.kind === 'server' ||
        action.error.kind === 'network' ||
        action.error.kind === 'rate_limited';

      return {
        status: 'error',
        file: state.file,
        previewUrl: state.previewUrl,
        dimensions: state.dimensions,
        message: state.message,
        usedBytes: state.usedBytes,
        capacityBytes: state.capacityBytes,
        isCapacityLoading: false,
        error: action.error,
        retryable: isRetryable,
      };
    }

    case 'MARK_KEY_SAVED': {
      if (state.status !== 'done') return state;
      return {
        ...state,
        keySaved: action.saved,
      };
    }

    case 'MARK_KEY_COPIED': {
      if (state.status !== 'done') return state;
      return {
        ...state,
        keyCopied: true,
      };
    }

    case 'RESET': {
      return initialHideState;
    }

    default:
      return state;
  }
}

/**
 * useHideFlow hook
 * Explicit state machine for the Hide (encode) flow.
 * Manages image selection, validation, capacity polling, cancellation,
 * and memory cleanup (revoking all created object URLs).
 */
export function useHideFlow() {
  const [state, dispatch] = useReducer(hideReducer, initialHideState);

  // Track all created object URLs for deterministic cleanup
  const activeUrlsRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const capacityAbortControllerRef = useRef<AbortController | null>(null);

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
      capacityAbortControllerRef.current?.abort();
      cleanupAllUrls();
    };
  }, [cleanupAllUrls]);

  // Set file handler
  const setFile = useCallback(
    async (file: File | null) => {
      // Cancel any ongoing operations
      abortControllerRef.current?.abort();
      capacityAbortControllerRef.current?.abort();

      if (!file) {
        if (state.previewUrl) {
          revokeTrackedUrl(state.previewUrl);
        }
        dispatch({ type: 'CLEAR_FILE' });
        return;
      }

      const validation = await validateImage(file, 'hide');
      if (!validation.isValid || !validation.dimensions) {
        dispatch({
          type: 'SET_FILE_INVALID',
          file,
          previewUrl: null,
          error: validation.error ?? 'Invalid image',
        });
        return;
      }

      // Revoke previous preview URL before creating new one
      if (state.previewUrl) {
        revokeTrackedUrl(state.previewUrl);
      }
      const previewUrl = createTrackedUrl(file);

      dispatch({
        type: 'SET_FILE_VALID',
        file,
        previewUrl,
        dimensions: validation.dimensions,
      });

      // Probe capacity
      dispatch({ type: 'SET_CAPACITY_LOADING', isLoading: true });
      const capController = new AbortController();
      capacityAbortControllerRef.current = capController;

      try {
        const capResult = await api.capacity(file, capController.signal);
        dispatch({ type: 'SET_CAPACITY_SUCCESS', capacityBytes: capResult.capacityBytes });
      } catch {
        if (capController.signal.aborted) return;
        // Graceful fallback: show no capacity meter and rely on server 422 if over capacity
        dispatch({ type: 'SET_CAPACITY_LOADING', isLoading: false });
      }
    },
    [state.previewUrl, createTrackedUrl, revokeTrackedUrl]
  );

  // Set message handler
  const setMessage = useCallback((message: string) => {
    const usedBytes = new TextEncoder().encode(message).length;
    dispatch({ type: 'SET_MESSAGE', message, usedBytes });
  }, []);

  // Slow notice timer effect (triggers after 6 seconds of hiding)
  useEffect(() => {
    if (state.status !== 'hiding') return;

    const timer = setTimeout(() => {
      dispatch({ type: 'SLOW_NOTICE' });
    }, 6000);

    return () => clearTimeout(timer);
  }, [state.status]);

  // Execute hide action
  const hide = useCallback(async () => {
    if (state.status !== 'ready') return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    dispatch({ type: 'START_HIDING', startedAt: Date.now() });

    try {
      const result = await api.encode(state.file, state.message, controller.signal);
      const stegoUrl = createTrackedUrl(result.stegoBlob);
      dispatch({ type: 'ENCODE_SUCCESS', result, stegoUrl });
    } catch (err) {
      if (controller.signal.aborted) return;
      const apiError =
        err instanceof ApiError
          ? err
          : new ApiError('network', 'Unexpected error occurred.', { cause: err });
      dispatch({ type: 'ENCODE_ERROR', error: apiError });
    }
  }, [state, createTrackedUrl]);

  // Cancel ongoing hide operation
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    dispatch({ type: 'RESET' });
  }, []);

  // Reset entire flow
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    capacityAbortControllerRef.current?.abort();
    cleanupAllUrls();
    dispatch({ type: 'RESET' });
  }, [cleanupAllUrls]);

  const markKeySaved = useCallback((saved: boolean) => {
    dispatch({ type: 'MARK_KEY_SAVED', saved });
  }, []);

  const markKeyCopied = useCallback(() => {
    dispatch({ type: 'MARK_KEY_COPIED' });
  }, []);

  return {
    state,
    setFile,
    setMessage,
    hide,
    cancel,
    reset,
    markKeySaved,
    markKeyCopied,
  };
}
