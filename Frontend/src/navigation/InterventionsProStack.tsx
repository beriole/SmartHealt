import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { InterventionsProStackParamList } from './types';
import { InterventionsProListScreen } from '@/screens/pro/InterventionsProListScreen';
import { TerminerInterventionScreen } from '@/screens/pro/TerminerInterventionScreen';

const Stack = createNativeStackNavigator<InterventionsProStackParamList>();

export function InterventionsProStack() {
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
        name="InterventionsProList"
        component={InterventionsProListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TerminerIntervention"
        component={TerminerInterventionScreen}
        options={{ title: t('pro.terminerTitle') }}
      />
    </Stack.Navigator>
  );
}
