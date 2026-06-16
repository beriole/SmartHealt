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
import { AppText, Button, Input, Screen } from '@/components';
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
    <Screen>
      <View style={styles.header}>
        <AppText variant="h2">{t('auth.resetPasswordTitle')}</AppText>
      </View>

      {done ? (
        <View style={styles.form}>
          <AppText color={theme.colors.success}>
            {t('auth.resetPasswordSuccess')}
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
            name="mot_de_passe"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.newPassword')}
                required
                secureTextEntry
                helper={t('auth.passwordHelper')}
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
                secureTextEntry
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
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 16, marginBottom: 24 },
  form: { gap: 16 },
});
