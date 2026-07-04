import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { tokenManager } from '@/api/tokenManager';
import { getMe } from '@/features/auth/auth.api';
import { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { PatientTabs } from './PatientTabs';
import { LivreurTabs } from './LivreurTabs';
import { ProTabs } from './ProTabs';
import { PharmacienTabs } from './PharmacienTabs';
import { RoleUnavailableScreen } from '@/screens/common/RoleUnavailableScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const PATIENT_ROLES = ['PATIENT', 'TUTEUR'];
const PRO_ROLES = ['MEDECIN', 'INFIRMIER'];

function Splash() {
  const theme = useTheme();
  return (
    <View style={[styles.splash, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

export function RootNavigator() {
  const status = useAuthStore(s => s.status);
  const user = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);
  const setStatus = useAuthStore(s => s.setStatus);
  const clear = useAuthStore(s => s.clear);

  useEffect(() => {
    (async () => {
      const tokens = await tokenManager.loadFromStorage();
      if (!tokens) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const me = await getMe();
        setUser(me);
      } catch {
        await tokenManager.clear();
        clear();
      }
    })();
  }, [setUser, setStatus, clear]);

  if (status === 'loading') {
    return <Splash />;
  }

  const role = user?.type_utilisateur;
  const isPatient = role && PATIENT_ROLES.includes(role);
  const isPro = role && PRO_ROLES.includes(role);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status !== 'authenticated' ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : isPatient ? (
        <Stack.Screen name="Patient" component={PatientTabs} />
      ) : isPro ? (
        <Stack.Screen name="Pro" component={ProTabs} />
      ) : role === 'PHARMACIEN' ? (
        <Stack.Screen name="Pharmacien" component={PharmacienTabs} />
      ) : role === 'LIVREUR' ? (
        <Stack.Screen name="Livreur" component={LivreurTabs} />
      ) : (
        <Stack.Screen name="Patient" component={RoleUnavailableScreen} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
