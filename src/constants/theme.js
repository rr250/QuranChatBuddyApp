import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Islamic color palette
const colors = {
  // Primary colors - Islamic green tones
  primary: '#2E8B57',      // Sea Green
  primaryContainer: '#A8E6A3',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#1B5E20',

  // Secondary colors - Golden/amber tones
  secondary: '#DAA520',    // Goldenrod
  secondaryContainer: '#FFF8E1',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#B8860B',

  // Background colors
  background: '#F8F9FA',
  onBackground: '#1C1B1F',
  surface: '#FFFFFF',
  onSurface: '#1C1B1F',
  surfaceVariant: '#E7E0EC',
  onSurfaceVariant: '#49454F',

  // Prayer-specific colors
  fajr: '#4A90E2',        // Dawn blue
  dhuhr: '#F5A623',       // Noon gold
  asr: '#F39C12',         // Afternoon orange
  maghrib: '#E67E22',     // Sunset orange
  isha: '#8E44AD',        // Night purple

  // Status colors
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',

  // Outline colors
  outline: '#79747E',
  outlineVariant: '#CAC4D0',

  // Islamic pattern colors
  islamicGreen: '#00A86B',
  islamicGold: '#FFD700',
  islamicBlue: '#003366',

  // Text colors
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  textDisabled: '#BDC3C7',

  // Shadow
  shadow: 'rgba(46, 139, 87, 0.1)',
};

// Spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Typography system
export const typography = {
  displayLarge: {
    fontSize: 57,
    fontWeight: '400',
    lineHeight: 64,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: '400',
    lineHeight: 52,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 44,
  },
  headlineLarge: {
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 40,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 36,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 32,
  },
  titleLarge: {
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 28,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
};

// Light theme
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
  },
  spacing,
  typography,
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#A8E6A3',
    onPrimary: '#1B5E20',
    primaryContainer: '#2E8B57',
    onPrimaryContainer: '#FFFFFF',
    background: '#121212',
    surface: '#1E1E1E',
    onSurface: '#FFFFFF',
    surfaceVariant: '#2C2C2C',
    onSurfaceVariant: '#E0E0E0',
    ...colors,
  },
  spacing,
  typography,
};

// Border radius system
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

// Elevation/Shadow system
export const elevation = {
  level0: {
    shadowOpacity: 0,
    elevation: 0,
  },
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  level3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  level4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
};

export { colors };