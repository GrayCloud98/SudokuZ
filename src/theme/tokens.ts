/**
 * Design tokens — single source of truth for the admin surface.
 * Indigo/glass dark theme: deep-indigo base, layered surfaces with subtle
 * indigo-tinted borders, an indigo accent that glows on hover/active, and
 * semantic status colors that hold up against the cooler base.
 */

export const colors = {
  // Surfaces (back-to-front layering)
  background: '#0b0d1f',
  surface: '#14172e',
  surfaceElevated: '#1d2147',
  surfaceHover: '#232752',
  surfaceInput: '#0e1124',

  // Borders (indigo-tinted whites for cohesion with the accent)
  border: 'rgba(99, 102, 241, 0.10)',
  borderStrong: 'rgba(99, 102, 241, 0.22)',
  borderFocus: '#6366f1',

  // Text
  textPrimary: '#f5f5fa',
  textSecondary: '#a8aac1',
  textTertiary: '#828599',
  textMuted: '#6b6f85',
  textDisabled: '#4b4f63',
  textInverse: '#0b0d1f',

  // Accent (interactive indigo)
  accent: '#6366f1',
  accentHover: '#4f46e5',
  accentSubtle: 'rgba(99, 102, 241, 0.14)',
  accentBorder: 'rgba(99, 102, 241, 0.36)',
  accentGlow: 'rgba(99, 102, 241, 0.40)',

  // Danger (destructive actions)
  danger: '#ef4444',
  dangerHover: '#dc2626',
  dangerSubtle: 'rgba(239, 68, 68, 0.14)',
  dangerBorder: 'rgba(239, 68, 68, 0.36)',
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
