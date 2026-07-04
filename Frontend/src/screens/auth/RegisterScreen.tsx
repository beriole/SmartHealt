import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ShieldPlus, User, Mail, Phone, Lock } from 'lucide-react-native';
import { AppText, Button, Card, Input, OptionGroup, Screen } from '@/components';
import { useTheme } from '@/theme';
import { registerSchema, RegisterForm } from '@/features/auth/schema';
import { useRegister } from '@/features/auth/hooks';
import { AuthStackParamList } from '@/navigation/types';

const SEXE_OPTIONS = [
  { value: 'F' as const, label: 'Femme' },
  { value: 'M' as const, label: 'Homme' },
  { value: 'AUTRE' as const, label: 'Autre' },
];

export function RegisterScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const register = useRegister();

  const { control, handleSubmit, formState, setError } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      mot_de_passe: '',
      confirmation: '',
    },
  });

  const onSubmit = (values: RegisterForm) => {
    register.mutate(
      {
        nom: values.nom,
        prenom: values.prenom,
        email: values.email,
        telephone: values.telephone,
        sexe: values.sexe,
        mot_de_passe: values.mot_de_passe,
        type_utilisateur: 'PATIENT',
      },
      {
        onSuccess: () =>
          navigation.navigate('VerifyEmailNotice', { email: values.email }),
        onError: err => {
          if (err.fields) {
            Object.entries(err.fields).forEach(([field, message]) => {
              setError(field as keyof RegisterForm, { message });
            });
          } else {
            Alert.alert(t('auth.registerTitle'), err.message);
          }
        },
      },
    );
  };

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <View style={styles.brand}>
          <ShieldPlus size={22} color={theme.colors.primary} />
          <AppText variant="h3" weight="bold" color={theme.colors.primary}>
            {t('common.appName')}
          </AppText>
        </View>
        <AppText variant="h1" center style={styles.title}>
          {t('auth.registerTitle')}
        </AppText>
        <AppText center color={theme.colors.textSecondary}>
          {t('auth.registerSubtitle')}
        </AppText>
      </View>

      <Card padding="lg" style={styles.form}>
        <Controller
          control={control}
          name="prenom"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('auth.firstName')}
              required
              leftIcon={<User size={20} color={theme.colors.outline} />}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={formState.errors.prenom?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="nom"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('auth.lastName')}
              required
              leftIcon={<User size={20} color={theme.colors.outline} />}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={formState.errors.nom?.message}
            />
          )}
        />
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
              placeholder="nom@exemple.com"
              leftIcon={<Mail size={20} color={theme.colors.outline} />}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={formState.errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="telephone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('auth.phone')}
              required
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholder="+237…"
              leftIcon={<Phone size={20} color={theme.colors.outline} />}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={formState.errors.telephone?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="sexe"
          render={({ field: { onChange, value } }) => (
            <OptionGroup
              label={t('auth.sex')}
              required
              options={SEXE_OPTIONS}
              value={value}
              onChange={onChange}
              error={formState.errors.sexe?.message}
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
              isPassword
              helper={t('auth.passwordHelper')}
              leftIcon={<Lock size={20} color={theme.colors.outline} />}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={formState.errors.mot_de_passe?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmation"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('auth.confirmPassword')}
              required
              isPassword
              leftIcon={<Lock size={20} color={theme.colors.outline} />}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={formState.errors.confirmation?.message}
            />
          )}
        />

        <Button
          label={t('auth.register')}
          loading={register.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </Card>

      <View style={styles.footer}>
        <AppText center color={theme.colors.textSecondary}>
          <AppText
            weight="bold"
            color={theme.colors.primary}
            onPress={() => navigation.navigate('Login')}
          >
            {t('auth.haveAccount')}
          </AppText>
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { marginTop: 4 },
  form: { gap: 18 },
  footer: { marginTop: 24, marginBottom: 12, alignItems: 'center' },
});
