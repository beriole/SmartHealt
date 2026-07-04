import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { WelcomeScreen } from '@/screens/auth/WelcomeScreen';
import { RoleSelectScreen } from '@/screens/auth/RoleSelectScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { RegisterProScreen } from '@/screens/auth/RegisterProScreen';
import { RegisterPharmacieScreen } from '@/screens/auth/RegisterPharmacieScreen';
import { RegisterLivreurScreen } from '@/screens/auth/RegisterLivreurScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { VerifyEmailNoticeScreen } from '@/screens/auth/VerifyEmailNoticeScreen';
import { ResetPasswordScreen } from '@/screens/auth/ResetPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: true, title: '' }}
      />
      <Stack.Screen
        name="RegisterPro"
        component={RegisterProScreen}
        options={{ headerShown: true, title: '' }}
      />
      <Stack.Screen
        name="RegisterPharmacie"
        component={RegisterPharmacieScreen}
        options={{ headerShown: true, title: '' }}
      />
      <Stack.Screen
        name="RegisterLivreur"
        component={RegisterLivreurScreen}
        options={{ headerShown: true, title: '' }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: true, title: '' }}
      />
      <Stack.Screen
        name="VerifyEmailNotice"
        component={VerifyEmailNoticeScreen}
        options={{ headerShown: true, title: '' }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ headerShown: true, title: '' }}
      />
    </Stack.Navigator>
  );
}
