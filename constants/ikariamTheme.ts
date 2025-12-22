/**
 * Ikariam Theme - Inspired by the ancient Greek/Mediterranean aesthetics
 * Color palette based on wood, stone, parchment, and bronze elements
 */

import { Platform } from 'react-native';

/**
 * Color Palette - Ikariam Style
 */
export const IkariamColors = {
  // Primary Colors (Parchment & Wood tones)
  parchment: {
    light: '#F4E8D0',
    base: '#E5D4B5',
    dark: '#D4C5A0',
  },
  wood: {
    light: '#A68A5C',
    base: '#8B6F47',
    dark: '#6B5536',
    darkest: '#4A3C2A',
  },

  // Accent Colors
  mediterranean: {
    light: '#5B9FC7',
    base: '#4A90B5',
    dark: '#2C5F7F',
  },
  gold: {
    light: '#F0D787',
    base: '#D4AF37',
    dark: '#B8860B',
  },
  bronze: {
    light: '#E09563',
    base: '#CD7F32',
    dark: '#A0622A',
  },

  // Resource Colors
  resources: {
    wood: '#8B6F47',
    wine: '#8B2252',
    marble: '#E8E8E8',
    crystal: '#87CEEB',
    sulfur: '#FFD700',
    gold: '#D4AF37',
  },

  // Semantic Colors
  success: '#6B7C3E', // Olive green
  warning: '#D4AF37', // Gold
  error: '#C1440E', // Terracotta red
  info: '#4A90B5', // Mediterranean blue

  // Neutral Colors (Stone & Gray tones)
  stone: {
    lightest: '#E8E6E3',
    light: '#C8C5C0',
    base: '#8B8680',
    dark: '#736D69',
  },

  // Text Colors
  text: {
    primary: '#2C2416',
    secondary: '#6B5536',
    tertiary: '#8B8680',
    light: '#F4E8D0',
    inverse: '#FFFFFF',
  },

  // Background Colors
  background: {
    primary: '#F4E8D0',
    secondary: '#E5D4B5',
    tertiary: '#D4C5A0',
    dark: '#4A3C2A',
    overlay: 'rgba(74, 60, 42, 0.9)',
  },

  // Border & Divider
  border: {
    light: '#D4C5A0',
    base: '#8B6F47',
    dark: '#6B5536',
  },

  // Shadow colors
  shadow: {
    light: 'rgba(107, 85, 54, 0.1)',
    base: 'rgba(107, 85, 54, 0.2)',
    dark: 'rgba(74, 60, 42, 0.4)',
  },
};

/**
 * Typography System
 */
export const IkariamTypography = {
  fontFamily: Platform.select({
    ios: {
      title: 'ui-serif', // Serif for titles (ancient feel)
      body: 'system-ui', // Sans-serif for body text (readability)
      mono: 'ui-monospace',
    },
    android: {
      title: 'serif',
      body: 'normal',
      mono: 'monospace',
    },
    web: {
      title: "Georgia, 'Times New Roman', 'Palatino Linotype', serif",
      body: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "Consolas, 'Courier New', monospace",
    },
    default: {
      title: 'serif',
      body: 'normal',
      mono: 'monospace',
    },
  }),

  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },

  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

/**
 * Spacing System (based on 4px grid)
 */
export const IkariamSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

/**
 * Border Radius
 */
export const IkariamBorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

/**
 * Shadows (Elevation)
 */
export const IkariamShadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: IkariamColors.shadow.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: IkariamColors.shadow.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: IkariamColors.shadow.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  lg: {
    shadowColor: IkariamColors.shadow.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: IkariamColors.shadow.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
};

/**
 * Complete Theme Export
 */
export const IkariamTheme = {
  colors: IkariamColors,
  typography: IkariamTypography,
  spacing: IkariamSpacing,
  borderRadius: IkariamBorderRadius,
  shadows: IkariamShadows,

  // Common component styles
  components: {
    card: {
      backgroundColor: IkariamColors.parchment.light,
      borderColor: IkariamColors.wood.base,
      borderWidth: 2,
      borderRadius: IkariamBorderRadius.md,
      padding: IkariamSpacing.base,
      ...IkariamShadows.md,
    },
    button: {
      primary: {
        backgroundColor: IkariamColors.wood.base,
        borderColor: IkariamColors.wood.dark,
        textColor: IkariamColors.text.light,
      },
      secondary: {
        backgroundColor: IkariamColors.mediterranean.base,
        borderColor: IkariamColors.mediterranean.dark,
        textColor: IkariamColors.text.inverse,
      },
      success: {
        backgroundColor: IkariamColors.success,
        borderColor: '#556B2F',
        textColor: IkariamColors.text.inverse,
      },
      warning: {
        backgroundColor: IkariamColors.gold.base,
        borderColor: IkariamColors.gold.dark,
        textColor: IkariamColors.text.primary,
      },
      danger: {
        backgroundColor: IkariamColors.error,
        borderColor: '#A0522D',
        textColor: IkariamColors.text.inverse,
      },
    },
    input: {
      backgroundColor: IkariamColors.parchment.base,
      borderColor: IkariamColors.wood.base,
      borderWidth: 2,
      borderRadius: IkariamBorderRadius.base,
      padding: IkariamSpacing.md,
      color: IkariamColors.text.primary,
    },
    badge: {
      backgroundColor: IkariamColors.gold.base,
      borderColor: IkariamColors.gold.dark,
      textColor: IkariamColors.text.primary,
    },
  },
};

export default IkariamTheme;
