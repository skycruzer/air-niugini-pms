/**
 * Air Niugini Design System Tokens
 * Complete design token system for Air Niugini B767 Pilot Management System
 * Maintains brand consistency across all components
 */

// ============================================================================
// COLOR SYSTEM
// ============================================================================

export const colors = {
  // Air Niugini Brand Colors (Primary)
  brand: {
    red: {
      DEFAULT: '#E4002B',
      dark: '#C00020',
      light: '#FF1A4D',
      50: '#FFF5F7',
      100: '#FFE5EA',
      200: '#FFCCD5',
      300: '#FF99AA',
      400: '#FF6680',
      500: '#E4002B',
      600: '#C00020',
      700: '#9C0019',
      800: '#780013',
      900: '#54000D',
    },
    gold: {
      DEFAULT: '#FFC72C',
      dark: '#E6B800',
      light: '#FFD75C',
      50: '#FFFDF5',
      100: '#FFF9E5',
      200: '#FFF3CC',
      300: '#FFE799',
      400: '#FFDB66',
      500: '#FFC72C',
      600: '#E6B800',
      700: '#B38F00',
      800: '#806600',
      900: '#4D3D00',
    },
    black: '#000000',
    white: '#FFFFFF',
  },

  // Aviation Professional Colors
  aviation: {
    navy: {
      DEFAULT: '#1E3A8A',
      light: '#3B82F6',
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E3A8A',
      900: '#1E293B',
    },
    blue: {
      DEFAULT: '#0EA5E9',
      light: '#38BDF8',
      50: '#F0F9FF',
      100: '#E0F2FE',
      200: '#BAE6FD',
      300: '#7DD3FC',
      400: '#38BDF8',
      500: '#0EA5E9',
      600: '#0284C7',
      700: '#0369A1',
      800: '#075985',
      900: '#0C4A6E',
    },
    slate: {
      DEFAULT: '#475569',
      light: '#64748B',
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
  },

  // Semantic Colors
  semantic: {
    success: {
      DEFAULT: '#10B981',
      light: '#34D399',
      dark: '#059669',
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },
    warning: {
      DEFAULT: '#F59E0B',
      light: '#FCD34D',
      dark: '#D97706',
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },
    error: {
      DEFAULT: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
    info: {
      DEFAULT: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
  },

  // Neutral Scale
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
};

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export const typography = {
  fontFamily: {
    sans: [
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'sans-serif',
    ],
    mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Courier New', 'monospace'],
  },

  fontSize: {
    // Display sizes for hero sections
    'display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
    'display-md': ['2.875rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
    'display-sm': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],

    // Heading sizes
    'heading-lg': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }],
    'heading-md': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
    'heading-sm': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],

    // Body sizes
    'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
    'body-md': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
    'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],

    // Utility sizes
    caption: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.025em', fontWeight: '500' }],
    overline: [
      '0.625rem',
      { lineHeight: '1.2', letterSpacing: '0.1em', fontWeight: '600', textTransform: 'uppercase' },
    ],
  },

  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
};

// ============================================================================
// SPACING SYSTEM (4px base grid)
// ============================================================================

export const spacing = {
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
};

// ============================================================================
// BORDER RADIUS SYSTEM
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem', // 4px
  DEFAULT: '0.375rem', // 6px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
};

// ============================================================================
// SHADOW SYSTEM
// ============================================================================

export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
};

// ============================================================================
// ANIMATION SYSTEM
// ============================================================================

export const animations = {
  // Duration values
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
    slowest: '700ms',
  },

  // Easing functions
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Custom easings for smooth professional animations
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  },

  // Transition presets
  transition: {
    fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors:
      'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ============================================================================
// GRADIENT SYSTEM
// ============================================================================

export const gradients = {
  primary: 'linear-gradient(135deg, #E4002B 0%, #C00020 100%)',
  secondary: 'linear-gradient(135deg, #FFC72C 0%, #E6B800 100%)',
  aviation: 'linear-gradient(135deg, #1E3A8A 0%, #0EA5E9 100%)',
  surface: 'linear-gradient(135deg, #FAFAFA 0%, #FFFFFF 100%)',
  success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
};

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

export const components = {
  button: {
    height: {
      xs: '1.75rem', // 28px
      sm: '2rem', // 32px
      md: '2.5rem', // 40px
      lg: '3rem', // 48px
      xl: '3.5rem', // 56px
    },
    padding: {
      xs: '0.5rem 0.75rem',
      sm: '0.5rem 1rem',
      md: '0.625rem 1.5rem',
      lg: '0.75rem 2rem',
      xl: '1rem 2.5rem',
    },
  },

  card: {
    padding: {
      sm: '1rem', // 16px
      md: '1.5rem', // 24px
      lg: '2rem', // 32px
      xl: '2.5rem', // 40px
    },
  },

  input: {
    height: {
      sm: '2rem', // 32px
      md: '2.5rem', // 40px
      lg: '3rem', // 48px
    },
  },
};

// ============================================================================
// AVIATION-SPECIFIC STATUS COLORS
// ============================================================================

export const aviationStatus = {
  current: {
    bg: colors.semantic.success[100],
    text: colors.semantic.success[800],
    border: colors.semantic.success[200],
  },
  expiringSoon: {
    bg: colors.semantic.warning[100],
    text: colors.semantic.warning[800],
    border: colors.semantic.warning[200],
  },
  expired: {
    bg: colors.semantic.error[100],
    text: colors.semantic.error[800],
    border: colors.semantic.error[200],
  },
  pending: {
    bg: colors.semantic.info[100],
    text: colors.semantic.info[800],
    border: colors.semantic.info[200],
  },
  inactive: {
    bg: colors.neutral[100],
    text: colors.neutral[600],
    border: colors.neutral[200],
  },
};

// ============================================================================
// EXPORT ALL TOKENS
// ============================================================================

export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  gradients,
  breakpoints,
  zIndex,
  components,
  aviationStatus,
};

export default designTokens;
