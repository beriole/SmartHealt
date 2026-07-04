import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { AccueilStackParamList } from './types';
import { AccueilHomeScreen } from '@/screens/accueil/AccueilHomeScreen';
import { ArticleDetailScreen } from '@/screens/accueil/ArticleDetailScreen';

const Stack = createNativeStackNavigator<AccueilStackParamList>();

export function AccueilStack() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: theme.colors.foreground },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="AccueilHome"
        component={AccueilHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetailScreen}
        options={{ title: t('article.title') }}
      />
    </Stack.Navigator>
  );
}
