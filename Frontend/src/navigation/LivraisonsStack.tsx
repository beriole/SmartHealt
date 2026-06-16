import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { LivraisonsStackParamList } from './types';
import { LivraisonsListScreen } from '@/screens/livreur/LivraisonsListScreen';
import { ValiderLivraisonScreen } from '@/screens/livreur/ValiderLivraisonScreen';

const Stack = createNativeStackNavigator<LivraisonsStackParamList>();

export function LivraisonsStack() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.foreground,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="LivraisonsList"
        component={LivraisonsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ValiderLivraison"
        component={ValiderLivraisonScreen}
        options={{ title: t('livreur.validerTitle') }}
      />
    </Stack.Navigator>
  );
}
