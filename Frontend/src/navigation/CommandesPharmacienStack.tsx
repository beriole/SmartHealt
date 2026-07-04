import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/theme';
import { CommandesPharmacienStackParamList } from './types';
import { CommandesPharmacienScreen } from '@/screens/pharmacien/CommandesPharmacienScreen';
import { CommandePharmacienDetailScreen } from '@/screens/pharmacien/CommandePharmacienDetailScreen';
import { ServirOrdonnanceScreen } from '@/screens/pharmacien/ServirOrdonnanceScreen';

const Stack = createNativeStackNavigator<CommandesPharmacienStackParamList>();

export function CommandesPharmacienStack() {
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
        name="CommandesPharmacienList"
        component={CommandesPharmacienScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CommandePharmacienDetail"
        component={CommandePharmacienDetailScreen}
        options={{ title: 'Détail commande' }}
      />
      <Stack.Screen
        name="ServirOrdonnance"
        component={ServirOrdonnanceScreen}
        options={{ title: "Servir l'ordonnance" }}
      />
    </Stack.Navigator>
  );
}
