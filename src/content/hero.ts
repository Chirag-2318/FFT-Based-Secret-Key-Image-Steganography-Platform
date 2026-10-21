/**
 * Configuration and copy for the Landing Page Hero section.
 * Centralizes all copy strings, animation timings, rotation speeds,
 * tilt angles, and secret message cycles.
 */
export interface HeroConfig {
  labels: {
    eyebrow: string;
    lead: string;
    availability: string;
    buttonCaption: string;
    ctaButton: string;
  };
  headline: {
    line1: string;
    line2: string;
  };
  ring: {
    fragments: string[];
    rotationDurationSeconds: number;
    concentricRadiusOffset: number;
  };
  ribbon: {
    messages: string[];
    tiltAngleDeg: number;
    loopDurationMs: number;
    mobileLoopDurationMs: number;
    charDissolveDurationMs: number;
    pillHoldDurationMs: number;
    charDelayStepMs: number;
    particleCount: number;
    pillGridPatterns?: number[][];
  };
  /** 6x4 lit patterns for the pill's PixelGrid, one pattern per message */
  pillGridPatterns: number[][];
}

const PILL_GRID_PATTERNS = [
  // Pattern 1: Scattered wave
  [1, 3, 6, 8, 11, 12, 15, 17, 20, 22],
  // Pattern 2: Center density
  [2, 3, 7, 8, 9, 10, 13, 14, 15, 16, 20, 21],
  // Pattern 3: Diagonals
  [0, 5, 7, 10, 13, 16, 18, 23],
  // Pattern 4: Outer frame corners & core
  [0, 1, 4, 5, 8, 9, 14, 15, 18, 19, 22, 23],
];

export const heroConfig: HeroConfig = {
  labels: {
    eyebrow: 'HIDE MESSAGES IN IMAGES',
    lead: 'Put a secret message inside any photo. Only someone with your key can read it.',
    availability: 'Works in any browser. Your files never leave your control.',
    buttonCaption: 'No account. Nothing is stored.',
    ctaButton: 'Open the tool',
  },
  headline: {
    line1: 'Hide words',
    line2: 'in plain sight.',
  },
  ring: {
    fragments: [
      'meet at the north gate at six',
      'come alone',
      'bring the blue folder',
      'the key is in the second drawer',
      "don't forward this",
    ],
    rotationDurationSeconds: 90,
    concentricRadiusOffset: 36,
  },
  ribbon: {
    messages: [
      'Meet at 6, north gate.',
      'The package arrives Friday.',
      "Happy birthday, Dad. Don't tell Mum.",
      'Bring the blue folder.',
    ],
    tiltAngleDeg: -8,
    loopDurationMs: 8000,
    mobileLoopDurationMs: 12000,
    charDissolveDurationMs: 600,
    pillHoldDurationMs: 1000,
    charDelayStepMs: 140,
    particleCount: 14,
    pillGridPatterns: PILL_GRID_PATTERNS,
  },
  pillGridPatterns: PILL_GRID_PATTERNS,
};
