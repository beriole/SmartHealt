import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutGrid, FolderHeart, ClipboardList, Stethoscope, User } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { getTabBarScreenOptions } from './tabBarOptions';
import { ProTabParamList } from './types';
import { DashboardProScreen } from '@/screens/pro/DashboardProScreen';
import { DossierStack } from './DossierStack';
import { ActiviteProScreen } from '@/screens/pro/ActiviteProScreen';
import { InterventionsProStack } from './InterventionsProStack';
import { ProfilProScreen } from '@/screens/pro/ProfilProScreen';
import { createProfilStack } from './createProfilStack';

const Tab = createBottomTabNavigator<ProTabParamList>();
const ProfilProStack = createProfilStack(ProfilProScreen);

type TabIconProps = { color: string; size: number };
const renderAccueilIcon = ({ color, size }: TabIconProps) => (
  <LayoutGrid color={color} size={size} />
);
const renderDossierIcon = ({ color, size }: TabIconProps) => (
  <FolderHeart color={color} size={size} />
);
const renderActiviteIcon = ({ color, size }: TabIconProps) => (
  <ClipboardList color={color} size={size} />
);
const renderInterventionsIcon = ({ color, size }: TabIconProps) => (
  <Stethoscope color={color} size={size} />
);
const renderProfilIcon = ({ color, size }: TabIconProps) => (
  <User color={color} size={size} />
);

export function ProTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator screenOptions={getTabBarScreenOptions(theme)}>
      <Tab.Screen
        name="Accueil"
        component={DashboardProScreen}
        options={{ title: 'Accueil', tabBarIcon: renderAccueilIcon }}
      />
      <Tab.Screen
        name="Dossier"
        component={DossierStack}
        options={{ title: 'Patients', tabBarIcon: renderDossierIcon }}
      />
      <Tab.Screen
        name="Activite"
        component={ActiviteProScreen}
        options={{ title: 'Activité', tabBarIcon: renderActiviteIcon }}
      />
      <Tab.Screen
        name="InterventionsPro"
        component={InterventionsProStack}
        options={{ title: 'Soins', tabBarIcon: renderInterventionsIcon }}
      />
      <Tab.Screen
        name="ProfilPro"
        component={ProfilProStack}
        options={{ title: 'Profil', tabBarIcon: renderProfilIcon }}
      />
    </Tab.Navigator>
  );
}
