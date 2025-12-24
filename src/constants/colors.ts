export const colors = {
  // Primary
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  
  // Neutral
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Semantic
  success: {
    light: '#D1FAE5',
    main: '#10B981',
    dark: '#059669',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#D97706',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#DC2626',
  },
  
  // Base
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
}

export const lightTheme = {
  background: colors.white,
  surface: colors.gray[50],
  text: colors.gray[900],
  textSecondary: colors.gray[600],
  border: colors.gray[200],
  primary: colors.primary[600],
  primaryLight: colors.primary[100],
}

export const darkTheme = {
  background: colors.gray[900],
  surface: colors.gray[800],
  text: colors.white,
  textSecondary: colors.gray[400],
  border: colors.gray[700],
  primary: colors.primary[500],
  primaryLight: colors.primary[900],
}
