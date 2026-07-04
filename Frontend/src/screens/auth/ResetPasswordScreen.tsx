import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Lock, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { AppText, Button, Card, Input, Screen } from '@/components';
import { useTheme } from '@/theme';
import {
  resetPasswordSchema,
  ResetPasswordForm,
} from '@/features/auth/schema';
import { useResetPassword } from '@/features/auth/hooks';
import { AuthStackParamList } from '@/navigation/types';

export function ResetPasswordScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'ResetPassword'>>();
  const token = route.params?.token;
  const reset = useResetPassword();
  const [done, setDone] = useState(false);

  const { control, handleSubmit, formState } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { mot_de_passe: '', confirmation: '' },
  });

  const onSubmit = (values: ResetPasswordForm) => {
    if (!token) {
      Alert.alert(t('auth.resetPasswordTitle'), t('auth.resetTokenMissing'));
      return;
    }
    reset.mutate(
      { token, mot_de_passe: values.mot_de_passe },
      {
        onSuccess: () => setDone(true),
        onError: err => Alert.alert(t('auth.resetPasswordTitle'), err.message),
      },
    );
  };

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <ShieldCheck size={30} color={theme.colors.primary} />
        </View>
        <AppText variant="h2" center>
          {t('auth.resetPasswordTitle')}
        </AppText>
      </View>

      {done ? (
        <Card padding="lg" style={styles.form}>
          <View style={styles.sentRow}>
            <CheckCircle2 size={22} color={theme.colors.success} />
            <AppText color={theme.colors.success} style={styles.flex}>
              {t('auth.resetPasswordSuccess')}
            </AppText>
          </View>
          <Button
            label={t('auth.backToLogin')}
            onPress={() => navigation.navigate('Login')}
          />
        </Card>
      ) : (
        <Card padding="lg" style={styles.form}>
          <Controller
            control={control}
            name="mot_de_passe"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.newPassword')}
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
            label={t('auth.resetPasswordTitle')}
            loading={reset.isPending}
            onPress={handleSubmit(onSubmit)}
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 24 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  form: { gap: 18 },
  sentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
});
