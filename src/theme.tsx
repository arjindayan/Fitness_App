import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

const STORAGE_KEY = 'fitness_app_theme';

const baseRadii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

const baseSpacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
};

const baseTypography = {
  title: 28,
  heading: 22,
  body: 16,
  small: 13,
};

export type ThemeMode = 'light' | 'dark';

export type Theme = {
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    primary: string;
    primarySoft: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    text: string;
    muted: string;
    subtle: string;
    inputBg: string;
  };
  radii: typeof baseRadii;
  spacing: typeof baseSpacing;
  typography: typeof baseTypography;
};

export const lightTheme: Theme = {
  colors: {
    background: '#f6f8ff',
    surface: 'rgba(255,255,255,0.86)',
    surfaceAlt: '#ffffff',
    border: 'rgba(224,230,244,0.9)',
    primary: '#b9c7ff',
    primarySoft: '#e9dcff',
    accent: '#8dd5ff',
    success: '#7ad4b5',
    warning: '#ffc966',
    danger: '#ff9fa5',
    text: '#0f1d3d',
    muted: '#5d6a8c',
    subtle: '#9aa5c0',
    inputBg: '#eef1fb',
  },
  radii: baseRadii,
  spacing: baseSpacing,
  typography: baseTypography,
};

export const darkTheme: Theme = {
  colors: {
    background: '#0c1324',
    surface: 'rgba(19,24,38,0.92)',
    surfaceAlt: '#131a2c',
    border: 'rgba(255,255,255,0.08)',
    primary: '#7aa2ff',
    primarySoft: '#1f2d4a',
    accent: '#6cd1ff',
    success: '#6de2c3',
    warning: '#ffcb6b',
    danger: '#ff9fa5',
    text: '#e5ebf8',
    muted: '#a3acc5',
    subtle: '#6f7894',
    inputBg: '#0b1220',
  },
  radii: baseRadii,
  spacing: baseSpacing,
  typography: baseTypography,
};

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function ThemeProvider({ children }: Props) {
  const deviceScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(deviceScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((storedMode) => {
        if (storedMode === 'light' || storedMode === 'dark') {
          setMode(storedMode);
        } else if (deviceScheme === 'dark') {
          setMode('dark');
        }
      })
      .catch((err) => {
        console.warn('Tema tercihi okunamadŽñ', err);
      });
  }, [deviceScheme]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, mode).catch((err) => {
      console.warn('Tema tercihi kaydedilemedi', err);
    });
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: mode === 'dark' ? darkTheme : lightTheme,
      mode,
      isDark: mode === 'dark',
      setMode,
      toggleMode,
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error('useTheme yalnŽñzca ThemeProvider iÇõinde kullanŽñlabilir');
  }

  return ctx;
}

export function useThemedStyles<T>(factory: (theme: Theme) => T) {
  const { theme } = useTheme();

  return useMemo(() => factory(theme), [factory, theme]);
}
