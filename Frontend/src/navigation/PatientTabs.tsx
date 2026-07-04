import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Store, HeartPulse, Package, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { getTabBarScreenOptions } from './tabBarOptions';
import { PatientTabParamList } from './types';
import { AccueilStack } from './AccueilStack';
import { PharmacieStack } from './PharmacieStack';
import { SanteStack } from './SanteStack';
import { CommandesStack } from './CommandesStack';
import { ProfilStack } from './ProfilStack';

const Tab = createBottomTabNavigator<PatientTabParamList>();

type TabIconProps = { color: string; size: number; focused: boolean };

const makeIcon = (Icon: typeof Home) => {
  const TabIcon = ({ color, focused }: TabIconProps) => (
    <Icon color={color} size={24} strokeWidth={focused ? 2.6 : 2} />
  );
  return TabIcon;
};

const renderAccueilIcon = makeIcon(Home);
const renderPharmacieIcon = makeIcon(Store);
const renderSanteIcon = makeIcon(HeartPulse);
const renderCommandesIcon = makeIcon(Package);
const renderProfilIcon = makeIcon(User);

export function PatientTabs() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator screenOptions={getTabBarScreenOptions(theme)}>
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
