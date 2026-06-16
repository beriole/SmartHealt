import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { SanteStackParamList } from './types';
import { SanteHomeScreen } from '@/screens/sante/SanteHomeScreen';
import { TriageScreen } from '@/screens/sante/TriageScreen';
import { MedecineTraditionnelleScreen } from '@/screens/sante/MedecineTraditionnelleScreen';
import { CompatibiliteScreen } from '@/screens/sante/CompatibiliteScreen';
import { HistoriqueIaScreen } from '@/screens/sante/HistoriqueIaScreen';
import { AnalyseDetailScreen } from '@/screens/sante/AnalyseDetailScreen';
import { CarnetScreen } from '@/screens/sante/CarnetScreen';
import { OrdonnancesScreen } from '@/screens/sante/OrdonnancesScreen';
import { OrdonnanceDetailScreen } from '@/screens/sante/OrdonnanceDetailScreen';
import { RappelsScreen } from '@/screens/sante/RappelsScreen';
import { NouveauRappelScreen } from '@/screens/sante/NouveauRappelScreen';

const Stack = createNativeStackNavigator<SanteStackParamList>();

export function SanteStack() {
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
        name="SanteHome"
        component={SanteHomeScreen}
        options={{ title: t('tabs.sante') }}
      />
      <Stack.Screen
        name="Triage"
        component={TriageScreen}
        options={{ title: t('sante.triage') }}
      />
      <Stack.Screen
        name="MedecineTraditionnelle"
        component={MedecineTraditionnelleScreen}
        options={{ title: t('sante.medecineTraditionnelle') }}
      />
      <Stack.Screen
        name="Compatibilite"
        component={CompatibiliteScreen}
        options={{ title: t('sante.compatibilite') }}
      />
      <Stack.Screen
        name="HistoriqueIa"
        component={HistoriqueIaScreen}
        options={{ title: t('sante.historique') }}
      />
      <Stack.Screen
        name="AnalyseDetail"
        component={AnalyseDetailScreen}
        options={{ title: t('sante.analyseDetail') }}
      />
      <Stack.Screen
        name="Carnet"
        component={CarnetScreen}
        options={{ title: t('sante.carnet') }}
      />
      <Stack.Screen
        name="Ordonnances"
        component={OrdonnancesScreen}
        options={{ title: t('sante.ordonnances') }}
      />
      <Stack.Screen
        name="OrdonnanceDetail"
        component={OrdonnanceDetailScreen}
        options={{ title: t('sante.ordonnance') }}
      />
      <Stack.Screen
        name="Rappels"
        component={RappelsScreen}
        options={{ title: t('sante.rappels') }}
      />
      <Stack.Screen
        name="NouveauRappel"
        component={NouveauRappelScreen}
        options={{ title: t('sante.nouveauRappel') }}
      />
    </Stack.Navigator>
  );
}
