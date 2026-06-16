import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Store, HeartPulse, Package, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { PatientTabParamList } from './types';
import { AccueilStack } from './AccueilStack';
import { PharmacieStack } from './PharmacieStack';
import { SanteStack } from './SanteStack';
import { CommandesStack } from './CommandesStack';
import { ProfilStack } from './ProfilStack';

const Tab = createBottomTabNavigator<PatientTabParamList>();

type TabIconProps = { color: string; size: number };

const renderAccueilIcon = ({ color, size }: TabIconProps) => (
  <Home color={color} size={size} />
);
const renderPharmacieIcon = ({ color, size }: TabIconProps) => (
  <Store color={color} size={size} />
);
const renderSanteIcon = ({ color, size }: TabIconProps) => (
  <HeartPulse color={color} size={size} />
);
const renderCommandesIcon = ({ color, size }: TabIconProps) => (
  <Package color={color} size={size} />
);
const renderProfilIcon = ({ color, size }: TabIconProps) => (
  <User color={color} size={size} />
);

export function PatientTabs() {
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
        name="Accueil"
        component={AccueilStack}
        options={{ title: t('tabs.accueil'), tabBarIcon: renderAccueilIcon }}
      />
      <Tab.Screen
        name="Pharmacie"
        component={PharmacieStack}
        options={{ title: t('tabs.pharmacie'), tabBarIcon: renderPharmacieIcon }}
      />
      <Tab.Screen
        name="Sante"
        component={SanteStack}
        options={{ title: t('tabs.sante'), tabBarIcon: renderSanteIcon }}
      />
      <Tab.Screen
        name="Commandes"
        component={CommandesStack}
        options={{ title: t('tabs.commandes'), tabBarIcon: renderCommandesIcon }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilStack}
        options={{ title: t('tabs.profil'), tabBarIcon: renderProfilIcon }}
      />
    </Tab.Navigator>
  );
}
