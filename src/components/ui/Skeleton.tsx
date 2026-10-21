import React from 'react';

export interface SkeletonProps {
  /** Width override (e.g. '100%', '240px') */
  width?: string | number;
  /** Height override (e.g. '20px', '48px') */
  height?: string | number;
  /** Corner radius token: default is btn (14px) */
  rounded?: 'btn' | 'pill' | 'card' | 'none';
  className?: string;
}

const roundedClassMap = {
  btn: 'rounded-btn',
  pill: 'rounded-pill',
  card: 'rounded-card',
  none: 'rounded-none',
};

/**
 * Skeleton primitive: flat sand-soft bar with subtle opacity pulse.
 * Pulse animation is automatically disabled when prefers-reduced-motion is active.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  rounded = 'btn',
  className = '',
}) => {
  const roundedClass = roundedClassMap[rounded];

  return (
    <div
      role="status"
      aria-label="Loading..."
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      className={`bg-sand-soft animate-pulse ${roundedClass} ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
