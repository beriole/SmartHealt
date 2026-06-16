import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Input, Screen } from '@/components';
import { useTheme } from '@/theme';
import {
  forgotPasswordSchema,
  ForgotPasswordForm,
} from '@/features/auth/schema';
import { useForgotPassword } from '@/features/auth/hooks';
import { AuthStackParamList } from '@/navigation/types';

export function ForgotPasswordScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const forgot = useForgotPassword();
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, formState } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (values: ForgotPasswordForm) => {
    forgot.mutate(values.email, { onSuccess: () => setSent(true) });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="h2">{t('auth.forgotPassword')}</AppText>
        <AppText color={theme.colors.textSecondary}>
          {t('auth.forgotPasswordHint')}
        </AppText>
      </View>

      {sent ? (
        <View style={styles.form}>
          <AppText color={theme.colors.success}>
            {t('auth.forgotPasswordSent')}
          </AppText>
          <Button
            label={t('auth.backToLogin')}
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      ) : (
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
          <Button
            label={t('auth.sendResetLink')}
            loading={forgot.isPending}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4, marginTop: 16, marginBottom: 24 },
  form: { gap: 16 },
});
