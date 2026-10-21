import React, { useState, useEffect, useRef } from 'react';

export interface TypewriterTextProps {
  text: string;
  duration?: number; // default ~1200ms
  onComplete?: () => void;
  className?: string;
  id?: string;
}

/**
 * TypewriterText (design.md 6.3 C & 8)
 * Types out a secret message character-by-character based on elapsed time
 * using requestAnimationFrame (adaptive to any frame rate).
 * - Instant under prefers-reduced-motion.
 * - Screen-reader safe: announces final text once via sr-only aria-live container,
 *   while the animated visual text is marked aria-hidden="true".
 * - Dynamic type scaling: serif 28px for short messages, 18px sans for long messages.
 */
export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  duration = 1200,
  onComplete,
  className = '',
  id,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(() => {
    // Check if user prefers reduced motion on initial render
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return text.length;
    }
    return 0;
  });

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Respect reduced motion: display instantly
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setVisibleCount(text.length);
      onCompleteRef.current?.();
      return;
    }

    if (!text) {
      setVisibleCount(0);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const tick = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const count = Math.floor(progress * text.length);

      setVisibleCount(count);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setVisibleCount(text.length);
        onCompleteRef.current?.();
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [text, duration]);

  // Default typographic scale: serif 28px for short messages (<=80 chars), 18px sans for longer
  const defaultTypography =
    text.length <= 80
      ? 'font-serif text-[28px] leading-snug text-ink'
      : 'font-sans text-[18px] leading-relaxed text-ink';

  return (
    <div id={id} className={`w-full ${className}`}>
      {/* Full text announced once to screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {text}
      </div>

      {/* Visual typewriter output */}
      <p
        aria-hidden="true"
        className={`whitespace-pre-wrap [overflow-wrap:anywhere] break-words select-text ${defaultTypography}`}
      >
        {text.slice(0, visibleCount)}
      </p>

    </div>
  );
};
