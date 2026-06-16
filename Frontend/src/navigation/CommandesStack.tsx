import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { CommandesStackParamList } from './types';
import { CommandesListScreen } from '@/screens/commande/CommandesListScreen';
import { CommandeDetailScreen } from '@/screens/commande/CommandeDetailScreen';
import { PaymentScreen } from '@/screens/commande/PaymentScreen';

const Stack = createNativeStackNavigator<CommandesStackParamList>();

export function CommandesStack() {
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
        name="CommandesList"
        component={CommandesListScreen}
        options={{ title: t('tabs.commandes') }}
      />
      <Stack.Screen
        name="CommandeDetail"
        component={CommandeDetailScreen}
        options={{ title: t('commande.detailTitle') }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: t('commande.paymentTitle'), headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}
