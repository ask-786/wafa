import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';

/**
 * JS mirror of the few tokens React Navigation needs as plain strings (screen
 * background, header, borders). Everything else reads `global.css` through
 * classes or `useCSSVariable`. Keep these in step with the CSS.
 */
export const THEME = {
  light: {
    background: '#FFF8EC',
    foreground: '#1E2433',
    card: '#FFFFFF',
    border: '#EEE3D0',
    primary: '#16B47E',
    destructive: '#EF4E5B',
  },
  dark: {
    background: '#12131F',
    foreground: '#F4F1EA',
    card: '#1C1E2E',
    border: '#2D3047',
    primary: '#34D399',
    destructive: '#F87171',
  },
} as const;

const navTheme = (base: Theme, t: (typeof THEME)['light' | 'dark']): Theme => ({
  ...base,
  colors: {
    background: t.background,
    border: t.border,
    card: t.background,
    notification: t.destructive,
    primary: t.primary,
    text: t.foreground,
  },
});

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: navTheme(DefaultTheme, THEME.light),
  dark: navTheme(DarkTheme, THEME.dark),
};
