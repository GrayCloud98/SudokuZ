/**
 * Design tokens — single source of truth for the admin surface.
 * Aiming for a Vercel/Stripe-style dark theme: near-black background, layered
 * surfaces with subtle borders, restrained accent, semantic statuses.
 */

export const colors = {
  // Surfaces (back-to-front layering)
  background: '#0a0a0a',
  surface: '#111113',
  surfaceElevated: '#161618',
  surfaceHover: '#1c1c1f',
  surfaceInput: '#0d0d0f',

  // Borders
  border: 'rgba(255, 255, 255, 0.06)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',
  borderFocus: '#3b82f6',

  // Text
  textPrimary: '#fafafa',
  textSecondary: '#a1a1aa',
  textTertiary: '#71717a',
  textMuted: '#52525b',
  textDisabled: '#3f3f46',
  textInverse: '#0a0a0a',

  // Accent (interactive blue)
  accent: '#3b82f6',
  accentHover: '#2563eb',
  accentSubtle: 'rgba(59, 130, 246, 0.12)',
  accentBorder: 'rgba(59, 130, 246, 0.32)',

  // Danger (destructive actions)
  danger: '#ef4444',
  dangerHover: '#dc2626',
  dangerSubtle: 'rgba(239, 68, 68, 0.12)',
  dangerBorder: 'rgba(239, 68, 68, 0.32)',
} as const;

export type StatusKey = 'todo' | 'in_progress' | 'done' | 'parked';

export const statusPalette: Record<
  StatusKey,
  { fg: string; bg: string; border: string; solid: string }
> = {
  todo: {
    fg: '#a1a1aa',
    bg: 'rgba(161, 161, 170, 0.10)',
    border: 'rgba(161, 161, 170, 0.22)',
    solid: '#a1a1aa',
  },
  in_progress: {
    fg: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.10)',
    border: 'rgba(245, 158, 11, 0.28)',
    solid: '#f59e0b',
  },
  done: {
    fg: '#10b981',
    bg: 'rgba(16, 185, 129, 0.10)',
    border: 'rgba(16, 185, 129, 0.28)',
    solid: '#10b981',
  },
  parked: {
    fg: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.10)',
    border: 'rgba(167, 139, 250, 0.28)',
    solid: '#a78bfa',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 999,
} as const;

export const typography = {
  size: {
    xs: 11,
    sm: 12,
    md: 13,
    base: 14,
    lg: 15,
    xl: 17,
    '2xl': 20,
    '3xl': 26,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  tracking: {
    tight: -0.2,
    normal: 0,
    wide: 0.3,
    wider: 0.6,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const motion = {
  duration: {
    fast: 120,
    base: 180,
    slow: 240,
  },
} as const;
