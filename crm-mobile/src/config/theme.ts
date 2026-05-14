import { MD3LightTheme } from 'react-native-paper';

export const COLORS = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#F0FDFA',
  primaryMid: '#CCFBF1',
  primaryBorder: '#99F6E4',

  accent: '#F59E0B',
  accentLight: '#FFFBEB',
  accentMid: '#FEF3C7',

  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  blue: '#3B82F6',
  blueLight: '#EFF6FF',
  rose: '#F43F5E',
  roseLight: '#FFF1F2',

  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',

  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surface2: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F8FAFC',

  text1: '#0F172A',
  text2: '#1E293B',
  text3: '#64748B',
  text4: '#94A3B8',
  text5: '#CBD5E1',

  // Legacy aliases kept for backward compat
  info: '#3B82F6',
  infoLight: '#EFF6FF',
  orange: '#F59E0B',
  orangeLight: '#FEF3C7',

  statusColors: {
    planned:     '#3B82F6',
    in_progress: '#F59E0B',
    completed:   '#10B981',
    cancelled:   '#94A3B8',
    draft:       '#94A3B8',
    active:      '#10B981',
    inactive:    '#94A3B8',
  },
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 9999 };

export const SHADOW = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  teal: {
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
};

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: COLORS.text1, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, color: COLORS.text1, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const, color: COLORS.text1 },
  h4: { fontSize: 16, fontWeight: '600' as const, color: COLORS.text1 },
  body1: { fontSize: 15, fontWeight: '400' as const, color: COLORS.text2 },
  body2: { fontSize: 14, fontWeight: '400' as const, color: COLORS.text2 },
  caption: { fontSize: 12, fontWeight: '400' as const, color: COLORS.text3 },
  label: { fontSize: 13, fontWeight: '500' as const, color: COLORS.text3, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  badge: { fontSize: 11, fontWeight: '700' as const },
  mono: { fontSize: 13, fontFamily: 'monospace' as const, color: COLORS.text2 },
};

export const lightTheme = {
  ...MD3LightTheme,
  roundness: 5,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    primaryContainer: COLORS.primaryMid,
    secondary: COLORS.accent,
    secondaryContainer: COLORS.accentMid,
    tertiary: COLORS.purple,
    tertiaryContainer: COLORS.purpleLight,
    error: COLORS.error,
    errorContainer: COLORS.errorLight,
    background: COLORS.bg,
    surface: COLORS.surface,
    surfaceVariant: COLORS.surface2,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: COLORS.text1,
    onSurface: COLORS.text1,
    onSurfaceVariant: COLORS.text3,
    outline: COLORS.border,
    outlineVariant: COLORS.borderLight,
    elevation: {
      level0: 'transparent',
      level1: COLORS.surface,
      level2: COLORS.surface,
      level3: COLORS.surface,
      level4: COLORS.surface,
      level5: COLORS.surface,
    },
  },
};

export default lightTheme;
