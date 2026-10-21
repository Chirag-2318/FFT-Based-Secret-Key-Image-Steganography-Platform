import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseCountdownReturn {
  secondsLeft: number;
  isActive: boolean;
  start: (seconds: number) => void;
  reset: () => void;
}

/**
 * Hook to manage a countdown timer (e.g. for rate-limiting 429 Retry-After).
 * Ticks each second and executes an optional callback when reaching zero.
 */
export function useCountdown(
  initialSeconds = 0,
  onEnd?: () => void
): UseCountdownReturn {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(initialSeconds > 0);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const start = useCallback((seconds: number) => {
    if (seconds <= 0) {
      setSecondsLeft(0);
      setIsActive(false);
      onEndRef.current?.();
      return;
    }
    setSecondsLeft(seconds);
    setIsActive(true);
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
    setSecondsLeft(0);
  }, []);

  useEffect(() => {
    if (!isActive || secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsActive(false);
          onEndRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, secondsLeft]);

  return {
    secondsLeft,
    isActive,
    start,
    reset,
  };
}
