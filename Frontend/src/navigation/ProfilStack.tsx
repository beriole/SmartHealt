import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { ProfilStackParamList } from './types';
import { ProfilHomeScreen } from '@/screens/profil/ProfilHomeScreen';
import { EditProfilScreen } from '@/screens/profil/EditProfilScreen';
import { InterventionsScreen } from '@/screens/profil/InterventionsScreen';
import { InterventionDetailScreen } from '@/screens/profil/InterventionDetailScreen';
import { NouvelleInterventionScreen } from '@/screens/profil/NouvelleInterventionScreen';
import { PartageDossierScreen } from '@/screens/profil/PartageDossierScreen';

const Stack = createNativeStackNavigator<ProfilStackParamList>();

export function ProfilStack() {
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
        name="ProfilHome"
        component={ProfilHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfil"
        component={EditProfilScreen}
        options={{ title: t('profil.edit') }}
      />
      <Stack.Screen
        name="Interventions"
        component={InterventionsScreen}
        options={{ title: t('profil.interventions') }}
      />
      <Stack.Screen
        name="InterventionDetail"
        component={InterventionDetailScreen}
        options={{ title: t('profil.intervention') }}
      />
      <Stack.Screen
        name="NouvelleIntervention"
        component={NouvelleInterventionScreen}
        options={{ title: t('profil.nouvelleIntervention') }}
      />
      <Stack.Screen
        name="PartageDossier"
        component={PartageDossierScreen}
        options={{ title: t('profil.partage') }}
      />
    </Stack.Navigator>
  );
}
