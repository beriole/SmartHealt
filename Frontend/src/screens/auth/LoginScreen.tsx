import React from 'react';
import { View, StyleSheet, Alert, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import {
  AppText,
  AuthBackdrop,
  BrandLogo,
  Button,
  Card,
  FadeInView,
  Input,
  Screen,
} from '@/components';
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
    <Screen scroll>
      <AuthBackdrop />

      {/* Hero */}
      <FadeInView delay={0}>
        <View style={styles.brand}>
          <BrandLogo size={28} withWordmark wordmarkSize={20} />
        </View>
        <View style={styles.hero}>
          <BrandLogo size={72} />
          <AppText variant="h1" center color={theme.colors.foreground} style={styles.heroTitle}>
            Bon retour
          </AppText>
          <AppText variant="body" center color={theme.colors.textSecondary}>
            Accès sécurisé à votre espace santé
          </AppText>
        </View>
      </FadeInView>

      {/* Formulaire */}
      <FadeInView delay={90}>
      <Card padding="lg" style={styles.card}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('auth.email')}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="nom@exemple.com"
              leftIcon={<Mail size={20} color={theme.colors.outline} />}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={formState.errors.email?.message}
            />
          )}
        />

        <View style={styles.pwdHeader}>
          <AppText variant="label" color={theme.colors.textSecondary}>
            {t('auth.password').toUpperCase()}
          </AppText>
          <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
            <AppText variant="small" weight="semibold" color={theme.colors.primary}>
              {t('auth.forgotPassword')}
            </AppText>
          </Pressable>
        </View>
        <Controller
          control={control}
          name="mot_de_passe"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              isPassword
              accessibilityLabel={t('auth.password')}
              autoComplete="password"
              placeholder="••••••••"
              leftIcon={<Lock size={20} color={theme.colors.outline} />}
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
          icon={<ArrowRight size={20} color={theme.colors.primaryOn} />}
        />
      </Card>
      </FadeInView>

      {/* Pied de page */}
      <View style={styles.footer}>
        <AppText center color={theme.colors.textSecondary}>
          {t('auth.noAccount')}{' '}
          <AppText
            weight="bold"
            color={theme.colors.primary}
            onPress={() => navigation.navigate('Register')}
          >
            {t('auth.register')}
          </AppText>
        </AppText>
        <AppText variant="caption" center color={theme.colors.outline} style={styles.copy}>
          © {new Date().getFullYear()} SmartHealth Medical Systems. Tous droits réservés.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginTop: 8 },
  hero: { alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 24 },
  heroTitle: { marginTop: 8 },
  card: { gap: 18 },
  pwdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -10,
  },
  footer: { marginTop: 28, gap: 16, alignItems: 'center' },
  copy: { marginTop: 4 },
});
