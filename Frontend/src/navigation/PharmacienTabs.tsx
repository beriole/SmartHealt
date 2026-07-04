import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutGrid, ClipboardList, Boxes, Store, User } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { getTabBarScreenOptions } from './tabBarOptions';
import { PharmacienTabParamList } from './types';
import { DashboardPharmacienScreen } from '@/screens/pharmacien/DashboardPharmacienScreen';
import { CommandesPharmacienStack } from './CommandesPharmacienStack';
import { InventaireStack } from './InventaireStack';
import { PharmacieProfilScreen } from '@/screens/pharmacien/PharmacieProfilScreen';
import { ProfilPharmacienScreen } from '@/screens/pharmacien/ProfilPharmacienScreen';
import { createProfilStack } from './createProfilStack';

const Tab = createBottomTabNavigator<PharmacienTabParamList>();
const ProfilPharmacienStack = createProfilStack(ProfilPharmacienScreen);

type TabIconProps = { color: string; size: number };
const renderAccueilIcon = ({ color, size }: TabIconProps) => (
  <LayoutGrid color={color} size={size} />
);
const renderCommandesIcon = ({ color, size }: TabIconProps) => (
  <ClipboardList color={color} size={size} />
);
const renderInventaireIcon = ({ color, size }: TabIconProps) => (
  <Boxes color={color} size={size} />
);
const renderPharmacieIcon = ({ color, size }: TabIconProps) => (
  <Store color={color} size={size} />
);
const renderProfilIcon = ({ color, size }: TabIconProps) => (
  <User color={color} size={size} />
);

export function PharmacienTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator screenOptions={getTabBarScreenOptions(theme)}>
      <Tab.Screen
        name="AccueilPharmacien"
        component={DashboardPharmacienScreen}
        options={{ title: 'Accueil', tabBarIcon: renderAccueilIcon }}
      />
      <Tab.Screen
        name="CommandesPharmacien"
        component={CommandesPharmacienStack}
        options={{ title: 'Commandes', tabBarIcon: renderCommandesIcon }}
      />
      <Tab.Screen
        name="Inventaire"
        component={InventaireStack}
        options={{ title: 'Inventaire', tabBarIcon: renderInventaireIcon }}
      />
      <Tab.Screen
        name="Pharmacie"
        component={PharmacieProfilScreen}
        options={{ title: 'Officine', tabBarIcon: renderPharmacieIcon }}
      />
      <Tab.Screen
        name="ProfilPharmacien"
        component={ProfilPharmacienStack}
        options={{ title: 'Profil', tabBarIcon: renderProfilIcon }}
      />
    </Tab.Navigator>
  );
}
