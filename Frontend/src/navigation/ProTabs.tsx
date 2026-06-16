import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FolderHeart, Stethoscope, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { ProTabParamList } from './types';
import { DossierStack } from './DossierStack';
import { InterventionsProStack } from './InterventionsProStack';
import { ProfilProScreen } from '@/screens/pro/ProfilProScreen';

const Tab = createBottomTabNavigator<ProTabParamList>();

type TabIconProps = { color: string; size: number };
const renderDossierIcon = ({ color, size }: TabIconProps) => (
  <FolderHeart color={color} size={size} />
);
const renderInterventionsIcon = ({ color, size }: TabIconProps) => (
  <Stethoscope color={color} size={size} />
);
const renderProfilIcon = ({ color, size }: TabIconProps) => (
  <User color={color} size={size} />
);

export function ProTabs() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Dossier"
        component={DossierStack}
        options={{ title: t('pro.dossier'), tabBarIcon: renderDossierIcon }}
      />
      <Tab.Screen
        name="InterventionsPro"
        component={InterventionsProStack}
        options={{ title: t('pro.interventions'), tabBarIcon: renderInterventionsIcon }}
      />
      <Tab.Screen
        name="ProfilPro"
        component={ProfilProScreen}
        options={{ title: t('tabs.profil'), tabBarIcon: renderProfilIcon }}
      />
    </Tab.Navigator>
  );
}
