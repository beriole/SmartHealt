import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/theme';
import { InventaireStackParamList } from './types';
import { InventaireScreen } from '@/screens/pharmacien/InventaireScreen';
import { EditStockScreen } from '@/screens/pharmacien/EditStockScreen';
import { AjouterStockScreen } from '@/screens/pharmacien/AjouterStockScreen';

const Stack = createNativeStackNavigator<InventaireStackParamList>();

export function InventaireStack() {
  const theme = useTheme();

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
        name="InventaireList"
        component={InventaireScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditStock"
        component={EditStockScreen}
        options={{ title: 'Modifier le stock' }}
      />
      <Stack.Screen
        name="AjouterStock"
        component={AjouterStockScreen}
        options={{ title: 'Ajouter un médicament' }}
      />
    </Stack.Navigator>
  );
}
