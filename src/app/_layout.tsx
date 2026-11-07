import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { useWafa } from '@/store/useWafa';
import {
  Nunito_500Medium,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Uniwind, useUniwind } from 'uniwind';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  const hydrated = useWafa((s) => s.hydrated);
  const preference = useWafa((s) => s.theme);
  const { theme } = useUniwind();

  React.useEffect(() => {
    Uniwind.setTheme(preference);
  }, [preference]);

  // A missing font shouldn't strand the user on the splash; system type is fine.
  const ready = hydrated && (fontsLoaded || !!fontError);
  React.useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  const mode = theme === 'dark' ? 'dark' : 'light';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={NAV_THEME[mode]}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
        <PortalHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
