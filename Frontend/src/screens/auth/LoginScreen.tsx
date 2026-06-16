import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Input, Screen } from '@/components';
import { useTheme } from '@/theme';
import { loginSchema, LoginForm } from '@/features/auth/schema';
import { useLogin } from '@/features/auth/hooks';
import { AuthStackParamList } from '@/navigation/types';

export function LoginScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const login = useLogin();

  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', mot_de_passe: '' },
  });

  const onSubmit = (values: LoginForm) => {
    login.mutate(values, {
      onError: err => Alert.alert(t('auth.loginTitle'), err.message),
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="h1" color={theme.colors.primary}>
          {t('common.appName')}
        </AppText>
        <AppText color={theme.colors.textSecondary}>
          {t('auth.loginTitle')}
        </AppText>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('auth.email')}
              required
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={formState.errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="mot_de_passe"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('auth.password')}
              required
              secureTextEntry
              autoComplete="password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={formState.errors.mot_de_passe?.message}
            />
          )}
        />

        <Button
          label={t('auth.login')}
          loading={login.isPending}
          onPress={handleSubmit(onSubmit)}
        />

        <Button
          label={t('auth.forgotPassword')}
          variant="ghost"
          onPress={() => navigation.navigate('ForgotPassword')}
        />
        <Button
          label={t('auth.register')}
          variant="ghost"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4, marginTop: 48, marginBottom: 32 },
  form: { gap: 16 },
});
