import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Mail, CheckCircle2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, Input, Screen } from '@/components';
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
    <Screen scroll>
      <View style={styles.hero}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <KeyRound size={30} color={theme.colors.primary} />
        </View>
        <AppText variant="h2" center>
          {t('auth.forgotPassword')}
        </AppText>
        <AppText center color={theme.colors.textSecondary}>
          {t('auth.forgotPasswordHint')}
        </AppText>
      </View>

      {sent ? (
        <Card padding="lg" style={styles.form}>
          <View style={styles.sentRow}>
            <CheckCircle2 size={22} color={theme.colors.success} />
            <AppText color={theme.colors.success} style={styles.flex}>
              {t('auth.forgotPasswordSent')}
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
          <Button
            label={t('auth.sendResetLink')}
            loading={forgot.isPending}
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
