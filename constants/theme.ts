import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive utility
export const metrics = {
  screenWidth: width,
  screenHeight: height,
  baseMargin: 16,
  basePadding: 16,
  smallPadding: 8,
  largePadding: 24,
  borderRadius: 14,
  smallBorderRadius: 8,
  largeBorderRadius: 24,
  buttonHeight: 52,
};

// Typography
export const typography = {
  h1: { fontSize: 32, fontFamily: 'Inter_700Bold', lineHeight: 40 },
  h2: { fontSize: 24, fontFamily: 'Inter_700Bold', lineHeight: 32 },
  h3: { fontSize: 20, fontFamily: 'Inter_600SemiBold', lineHeight: 28 },
  body1: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  body2: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  caption: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  button: { fontSize: 16, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
};

// Colors
export const Colors = {
  light: {
    text: '#0f172a',
    textSecondary: '#64748b',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceSecondary: '#f1f5f9',
    border: '#e2e8f0',
    primary: '#4f6ef7',
    primaryAlpha: 'rgba(79, 110, 247, 0.1)',
    bubbleMe: '#4f6ef7',
    bubbleThem: '#ffffff',
    bubbleTextMe: '#ffffff',
    bubbleTextThem: '#0f172a',
    headerBackground: '#ffffff',
    headerIcon: '#0f172a',
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#4f6ef7',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    skeleton: '#e2e8f0',
    icon: '#64748b', // Added missing icon token
  },
  dark: {
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    background: '#020617', // Very dark slate
    surface: '#0f172a',   // Dark slate
    surfaceSecondary: '#1e293b',
    border: '#334155',
    primary: '#4f6ef7',
    primaryAlpha: 'rgba(79, 110, 247, 0.2)',
    bubbleMe: '#4f6ef7',
    bubbleThem: '#1e293b',
    bubbleTextMe: '#ffffff',
    bubbleTextThem: '#f8fafc',
    headerBackground: '#0f172a',
    headerIcon: '#f8fafc',
    tabIconDefault: '#64748b',
    tabIconSelected: '#4f6ef7',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    skeleton: '#1e293b',
    icon: '#94a3b8', // Added missing icon token
  },
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  }
};
