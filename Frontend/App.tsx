import 'react-native-gesture-handler';
import '@/i18n';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  Theme as NavTheme,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, lightColors, darkColors } from '@/theme';
import { RootNavigator } from '@/navigation/RootNavigator';
import { linking } from '@/navigation/linking';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// Thèmes React Navigation calés sur nos tokens (évite les flashs blancs en sombre).
const navLight: NavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: lightColors.background,
    card: lightColors.surface,
    text: lightColors.foreground,
    primary: lightColors.primary,
    border: lightColors.border,
  },
};
const navDark: NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: darkColors.background,
    card: darkColors.surface,
    text: darkColors.foreground,
    primary: darkColors.primary,
    border: darkColors.border,
  },
};

export default function App() {
  const scheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <StatusBar style="auto" />
            <NavigationContainer
              theme={scheme === 'dark' ? navDark : navLight}
              linking={linking}
            >
              <RootNavigator />
            </NavigationContainer>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
