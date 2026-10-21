import React from 'react';

export interface PixelGridProps {
  /** Width/height of each square in pixels */
  cellSize?: number;
  /** Gap between squares in pixels */
  gap?: number;
  /** Array of lit cell indices (0..23) or a 4x6 boolean matrix */
  litCells?: number[] | boolean[][];
  /** Whether to animate cells in a pseudo-random opacity wave */
  animated?: boolean;
  className?: string;
}

// Default lit pattern: balanced distribution across 6 columns x 4 rows
const DEFAULT_LIT_INDICES = [1, 3, 6, 8, 11, 12, 15, 17, 20, 22];

// Precomputed pseudo-random animation delays (in milliseconds) for 24 cells
const STAGGERED_DELAYS = [
  0, 240, 520, 120, 440, 310, 380, 150, 480, 20, 350, 590, 180, 420, 80, 500, 270, 100, 460, 290,
  70, 390, 160, 540,
];

/**
 * PixelGrid primitive meeting Section 5.1 & 7.6 of design.md.
 * Renders a 6x4 grid of small squares. Supports static lit patterns
 * and a pure CSS wave animation that respects prefers-reduced-motion.
 */
export const PixelGrid: React.FC<PixelGridProps> = ({
  cellSize = 3.5,
  gap = 2,
  litCells = DEFAULT_LIT_INDICES,
  animated = false,
  className = '',
}) => {
  const cols = 6;
  const rows = 4;
  const totalWidth = cols * cellSize + (cols - 1) * gap;
  const totalHeight = rows * cellSize + (rows - 1) * gap;

  // Determine if a cell at index (row * 6 + col) is lit
  const isCellLit = (row: number, col: number): boolean => {
    const index = row * cols + col;
    if (Array.isArray(litCells)) {
      if (litCells.length > 0 && Array.isArray(litCells[0])) {
        const matrix = litCells as boolean[][];
        return Boolean(matrix[row]?.[col]);
      }
      return (litCells as number[]).includes(index);
    }
    return false;
  };

  return (
    <svg
      width={totalWidth}
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => {
          const index = r * cols + c;
          const x = c * (cellSize + gap);
          const y = r * (cellSize + gap);
          const lit = isCellLit(r, c);
          const delay = STAGGERED_DELAYS[index] ?? 0;

          return (
            <rect
              key={`${r}-${c}`}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              rx={0.5}
              fill="currentColor"
              className={animated ? 'animate-pixel-pulse' : undefined}
              style={{
                opacity: animated ? (lit ? 0.9 : 0.2) : lit ? 1 : 0.2,
                animationDelay: animated ? `${delay}ms` : undefined,
              }}
            />
          );
        }),
      )}
    </svg>
  );
};
