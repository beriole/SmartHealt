import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/theme';
import { EditProfilScreen } from '@/screens/profil/EditProfilScreen';
import { StaffProfilStackParamList } from './types';

/**
 * Fabrique une pile de profil (écran d'accueil du rôle + édition du profil)
 * partagée par les espaces pro / livreur / pharmacien.
 */
export function createProfilStack(Home: React.ComponentType) {
  const Stack = createNativeStackNavigator<StaffProfilStackParamList>();

  return function ProfilStack() {
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
        <Stack.Screen name="ProfilHome" component={Home} options={{ headerShown: false }} />
        <Stack.Screen
          name="EditProfil"
          component={EditProfilScreen}
          options={{ title: 'Modifier le profil' }}
        />
      </Stack.Navigator>
    );
  };
}
