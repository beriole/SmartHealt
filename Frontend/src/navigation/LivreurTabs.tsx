import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, PackageSearch, Truck, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { getTabBarScreenOptions } from './tabBarOptions';
import { LivreurTabParamList } from './types';
import { DashboardScreen } from '@/screens/livreur/DashboardScreen';
import { CoursesScreen } from '@/screens/livreur/CoursesScreen';
import { LivraisonsStack } from './LivraisonsStack';
import { ProfilLivreurScreen } from '@/screens/livreur/ProfilLivreurScreen';
import { createProfilStack } from './createProfilStack';

const Tab = createBottomTabNavigator<LivreurTabParamList>();
const ProfilLivreurStack = createProfilStack(ProfilLivreurScreen);

type TabIconProps = { color: string; size: number };
const renderDashboardIcon = ({ color, size }: TabIconProps) => (
  <LayoutDashboard color={color} size={size} />
);
const renderCoursesIcon = ({ color, size }: TabIconProps) => (
  <PackageSearch color={color} size={size} />
);
const renderLivraisonsIcon = ({ color, size }: TabIconProps) => (
  <Truck color={color} size={size} />
);
const renderProfilIcon = ({ color, size }: TabIconProps) => (
  <User color={color} size={size} />
);

export function LivreurTabs() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator screenOptions={getTabBarScreenOptions(theme)}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: t('livreur.dashboard'), tabBarIcon: renderDashboardIcon }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesScreen}
        options={{ title: t('livreur.courses'), tabBarIcon: renderCoursesIcon }}
      />
      <Tab.Screen
        name="Livraisons"
        component={LivraisonsStack}
        options={{ title: t('livreur.livraisons'), tabBarIcon: renderLivraisonsIcon }}
      />
      <Tab.Screen
        name="ProfilLivreur"
        component={ProfilLivreurStack}
        options={{ title: t('tabs.profil'), tabBarIcon: renderProfilIcon }}
      />
    </Tab.Navigator>
  );
}
