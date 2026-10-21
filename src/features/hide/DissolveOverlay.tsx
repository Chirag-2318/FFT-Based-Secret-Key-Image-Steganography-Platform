import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

export interface DissolveOverlayProps {
  text: string;
  sourceRect: DOMRect | null;
  targetRect: DOMRect | null;
  containerRect: DOMRect | null;
  onAnimationComplete: () => void;
  className?: string;
}

interface CharacterParticle {
  char: string;
  startX: number;
  startY: number;
  ctrlX: number;
  ctrlY: number;
  targetX: number;
  targetY: number;
  delay: number;
}

interface GrainParticle {
  id: number;
  x: number;
  y: number;
  delay: number;
}

/**
 * DissolveOverlay (design.md 6.2 C)
 * The signature moment: typed message text lifts from the textarea,
 * travels along a smooth curved path over the image preview, and
 * dissolves into soft grain squares on the photo.
 */
export const DissolveOverlay: React.FC<DissolveOverlayProps> = ({
  text,
  sourceRect,
  targetRect,
  containerRect,
  onAnimationComplete,
  className = '',
}) => {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      const timer = setTimeout(onAnimationComplete, 150);
      return () => clearTimeout(timer);
    }
  }, [prefersReducedMotion, onAnimationComplete]);

  // Prepare particles
  const { chars, grains } = useMemo(() => {
    if (!sourceRect || !targetRect || !containerRect || prefersReducedMotion) {
      return { chars: [], grains: [] };
    }

    // Extract first line or cap at 60 characters for performance
    const firstLine = text.split('\n')[0] || '';
    const sliceLength = Math.min(60, firstLine.length);
    const charsList: CharacterParticle[] = [];

    // Coordinates relative to card container
    const textareaPaddingLeft = 16;
    const textareaPaddingTop = 18;
    const charWidth = 9.5;
    const lineHeight = 26;
    const maxCharsPerLine = Math.max(
      20,
      Math.floor((sourceRect.width - textareaPaddingLeft * 2) / charWidth)
    );

    // Target landing point: center of image preview
    const destCenterX = targetRect.left - containerRect.left + targetRect.width / 2;
    const destCenterY = targetRect.top - containerRect.top + targetRect.height / 2;

    for (let i = 0; i < sliceLength; i++) {
      const ch = firstLine[i];
      if (!ch || ch === ' ') continue;

      const lineIndex = Math.floor(i / maxCharsPerLine);
      const colIndex = i % maxCharsPerLine;

      const startX =
        sourceRect.left - containerRect.left + textareaPaddingLeft + colIndex * charWidth;
      const startY =
        sourceRect.top - containerRect.top + textareaPaddingTop + lineIndex * lineHeight;

      // Small jitter around target
      const jitterX = (Math.sin(i * 99) * 36);
      const jitterY = (Math.cos(i * 33) * 28);
      const targetX = destCenterX + jitterX;
      const targetY = destCenterY + jitterY;

      // Smooth upward arc control point
      const midX = (startX + targetX) / 2 + (Math.sin(i * 17) * 40);
      const midY = Math.min(startY, targetY) - 40 - (Math.abs(Math.sin(i * 7)) * 30);

      charsList.push({
        char: ch,
        startX,
        startY,
        ctrlX: midX,
        ctrlY: midY,
        targetX,
        targetY,
        delay: i * 0.012, // 12ms stagger
      });
    }

    // Small cluster of 2px grain squares at the landing zone
    const grainList: GrainParticle[] = [];
    const grainCount = 18;
    for (let g = 0; g < grainCount; g++) {
      grainList.push({
        id: g,
        x: destCenterX + (Math.sin(g * 47) * 44),
        y: destCenterY + (Math.cos(g * 71) * 36),
        delay: 0.65 + g * 0.02,
      });
    }

    return { chars: charsList, grains: grainList };
  }, [text, sourceRect, targetRect, containerRect, prefersReducedMotion]);

  if (prefersReducedMotion || chars.length === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-30 ${className}`}
    >
      {/* Flying per-character spans */}
      {chars.map((particle, index) => {
        const isLast = index === chars.length - 1;

        return (
          <motion.span
            key={`char-${index}`}
            initial={{
              x: particle.startX,
              y: particle.startY,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: [particle.startX, particle.ctrlX, particle.targetX],
              y: [particle.startY, particle.ctrlY, particle.targetY],
              opacity: [1, 0.95, 0],
              scale: [1, 1.05, 0.6],
            }}
            transition={{
              duration: 1.15,
              delay: particle.delay,
              ease: [0.22, 1, 0.36, 1],
              times: [0, 0.5, 1],
            }}
            onAnimationComplete={isLast ? onAnimationComplete : undefined}
            className="absolute top-0 left-0 font-sans text-[18px] text-ink font-normal leading-relaxed origin-center inline-block"
          >
            {particle.char}
          </motion.span>
        );
      })}

      {/* Landing 2px grain squares dissolving into photo */}
      {grains.map((grain) => (
        <motion.div
          key={`grain-${grain.id}`}
          initial={{
            x: grain.x,
            y: grain.y,
            opacity: 0,
            scale: 0.5,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.2],
          }}
          transition={{
            duration: 0.5,
            delay: grain.delay,
            ease: 'easeOut',
          }}
          className="absolute top-0 left-0 w-[2px] h-[2px] bg-ink rounded-[0.5px]"
        />
      ))}
    </div>
  );
};
