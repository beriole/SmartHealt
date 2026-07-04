import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Theme } from '@/theme';

/**
 * Options communes pour une barre d'onglets « vivante » (pastille active arrondie,
 * coins arrondis, élévation) partagées par tous les rôles (Patient, Pro, Livreur)
 * afin de garder un design cohérent.
 */
export function getTabBarScreenOptions(theme: Theme): BottomTabNavigationOptions {
  return {
    headerShown: false,
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.outline,
    tabBarActiveBackgroundColor: theme.colors.primaryContainer,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    tabBarItemStyle: {
      marginHorizontal: 6,
      marginVertical: 8,
      borderRadius: 16,
      paddingTop: 6,
    },
    tabBarStyle: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 0,
      height: 76,
      paddingBottom: 10,
      paddingTop: 4,
      paddingHorizontal: 4,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -4 },
      elevation: 16,
    },
    tabBarHideOnKeyboard: true,
  };
}
