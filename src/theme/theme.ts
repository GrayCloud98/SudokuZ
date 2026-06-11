import { Platform } from 'react-native';

/** Native driver is unavailable on react-native-web; JS fallback warns loudly. */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Inter is loaded app-wide in app/_layout.tsx via expo-font.
 * RN maps weights through explicit family names, so text styles should set
 * BOTH fontFamily (from here) and the matching fontWeight (for web CSS).
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const colors = {
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceElevated: '#243347',
  surfaceInput: '#0a1120',

  cellDefault: '#1a2844',
  cellSelected: '#1d4ed8',
  cellHighlight: 'rgba(37,99,235,0.14)',
  cellSameNumber: 'rgba(37,99,235,0.26)',
  cellError: 'rgba(239,68,68,0.22)',
  cellErrorSelected: 'rgba(239,68,68,0.55)',

  border: 'rgba(148,163,184,0.10)',
  borderBox: 'rgba(148,163,184,0.32)',
  borderOuter: 'rgba(148,163,184,0.55)',

  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textGiven: '#f1f5f9',
  textUser: '#93c5fd',
  textSelected: '#ffffff',
  textError: '#f87171',
  textNote: '#64748b',
  textNoteSelected: 'rgba(255,255,255,0.7)',

  accent: '#3b82f6',
  accentDark: '#1d4ed8',
  accentSubtle: 'rgba(59,130,246,0.15)',
  accentBorder: 'rgba(59,130,246,0.40)',

  success: '#10b981',
  successSubtle: 'rgba(16,185,129,0.15)',
  error: '#ef4444',
  errorSubtle: 'rgba(239,68,68,0.15)',
  warning: '#f59e0b',

  controlBg: '#1e293b',
  controlBorder: 'rgba(148,163,184,0.12)',
  controlActive: 'rgba(59,130,246,0.22)',
  controlActiveBorder: 'rgba(59,130,246,0.45)',

  numBg: '#1e2d47',
  numBorder: 'rgba(148,163,184,0.12)',
  numText: '#e2e8f0',
  numCount: '#64748b',
  numDisabled: '#374151',
} as const;

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
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 999,
} as const;
