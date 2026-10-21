import React, { useState, useEffect, useMemo } from 'react';
import { PixelGrid } from '@/components/ui';
import { heroConfig } from '@/content/hero';

export interface HeroRibbonProps {
  isStatic?: boolean;
}

// Pseudo-random deterministic offsets for character drift
const DRIFT_OFFSETS = [
  { x: -10, y: 3 },
  { x: -14, y: -4 },
  { x: -8, y: 5 },
  { x: -12, y: -2 },
  { x: -7, y: 4 },
  { x: -13, y: -5 },
  { x: -9, y: 2 },
  { x: -11, y: -3 },
];

// Pseudo-random offsets for grain particles
const GRAIN_PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  driftX: (i % 2 === 0 ? 1 : -1) * (4 + ((i * 3) % 10)),
  driftY: (i % 3 === 0 ? -1 : 1) * (3 + ((i * 5) % 8)),
  delayMs: 1200 + i * 220,
}));

/**
 * HeroRibbon: A tilted band where a dark ink sentence sweeps into a pill glyph
 * and dissolves character-by-character into grain particles.
 * Cycles through 4 secret messages every ~8s on desktop (~12s on mobile).
 */
export const HeroRibbon: React.FC<HeroRibbonProps> = ({ isStatic = false }) => {
  const { messages = [], tiltAngleDeg = -8, loopDurationMs = 8000, charDelayStepMs = 140 } =
    heroConfig.ribbon;
  const pillGridPatterns =
    heroConfig.pillGridPatterns ??
    (heroConfig.ribbon as { pillGridPatterns?: number[][] }).pillGridPatterns ??
    [];

  const [messageIndex, setMessageIndex] = useState(0);

  // Message cycling effect: runs only when not static
  useEffect(() => {
    if (isStatic || !messages.length) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, loopDurationMs);

    return () => clearInterval(interval);
  }, [isStatic, loopDurationMs, messages.length]);

  const currentMessage = messages[messageIndex] ?? messages[0] ?? '';
  const currentGridPattern = pillGridPatterns[messageIndex] ?? pillGridPatterns[0] ?? [];

  // Split current message into characters with computed delays
  const characters = useMemo(() => {
    return currentMessage.split('').map((char, index) => {
      const drift = DRIFT_OFFSETS[index % DRIFT_OFFSETS.length]!;
      // Start dissolve after initial travel delay of 1000ms
      const delayMs = 1000 + index * charDelayStepMs;
      return {
        char,
        index,
        driftX: drift.x,
        driftY: drift.y,
        delayMs,
      };
    });
  }, [currentMessage, charDelayStepMs]);

  return (
    <div
      className="relative flex items-center justify-start pointer-events-none select-none z-10"
      style={{
        transform: `rotate(${tiltAngleDeg}deg)`,
      }}
      aria-hidden="true"
    >
      {/* Pill with PixelGrid Glyph */}
      <div className="relative shrink-0 flex items-center justify-center h-[56px] min-h-[56px] px-6 bg-paper border-2 border-ink rounded-pill shadow-none z-20 animate-pill-pulse">
        <PixelGrid
          cellSize={3.5}
          gap={1.5}
          litCells={currentGridPattern}
          animated={!isStatic}
          className="text-ink"
        />

        {/* Grain particles cluster at the pill interface */}
        {!isStatic && (
          <div className="hero-grain-container absolute -right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            {GRAIN_PARTICLES.map((p) => (
              <span
                key={`${messageIndex}-${p.id}`}
                className="animate-grain-particle absolute w-[2px] h-[2px] bg-ink rounded-none"
                style={
                  {
                    '--drift-x': `${p.driftX}px`,
                    '--drift-y': `${p.driftY}px`,
                    animationDelay: `${p.delayMs}ms`,
                    top: `${p.driftY}px`,
                    left: 0,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Travelling & Dissolving Text Line */}
      <div
        key={messageIndex}
        className="ml-4 flex items-center whitespace-nowrap overflow-visible font-sans font-medium text-[22px] sm:text-[26px] text-ink"
      >
        {isStatic
          ? currentMessage
          : characters.map((c) => (
              <span
                key={`${messageIndex}-${c.index}`}
                className="animate-char-dissolve inline-block"
                style={
                  {
                    '--drift-x': `${c.driftX}px`,
                    '--drift-y': `${c.driftY}px`,
                    animationDelay: `${c.delayMs}ms`,
                  } as React.CSSProperties
                }
              >
                {c.char === ' ' ? '\u00A0' : c.char}
              </span>
            ))}
      </div>
    </div>
  );
};
