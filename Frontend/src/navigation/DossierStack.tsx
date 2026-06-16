import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { DossierStackParamList } from './types';
import { ScanCarnetScreen } from '@/screens/pro/ScanCarnetScreen';
import { DossierPatientScreen } from '@/screens/pro/DossierPatientScreen';
import { NouvelleConsultationScreen } from '@/screens/pro/NouvelleConsultationScreen';
import { NouvelleOrdonnanceScreen } from '@/screens/pro/NouvelleOrdonnanceScreen';

const Stack = createNativeStackNavigator<DossierStackParamList>();

export function DossierStack() {
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
        name="ScanCarnet"
        component={ScanCarnetScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DossierPatient"
        component={DossierPatientScreen}
        options={{ title: t('pro.dossierTitle') }}
      />
      <Stack.Screen
        name="NouvelleConsultation"
        component={NouvelleConsultationScreen}
        options={{ title: t('pro.consultationTitle') }}
      />
      <Stack.Screen
        name="NouvelleOrdonnance"
        component={NouvelleOrdonnanceScreen}
        options={{ title: t('pro.ordonnanceTitle') }}
      />
    </Stack.Navigator>
  );
}
