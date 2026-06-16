import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { MailCheck } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useResendVerification } from '@/features/auth/hooks';
import { AuthStackParamList } from '@/navigation/types';

export function VerifyEmailNoticeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'VerifyEmailNotice'>>();
  const email = route.params?.email;
  const resend = useResendVerification();

  const onResend = () => {
    if (!email) {
      return;
    }
    resend.mutate(email, {
      onSuccess: () =>
        Alert.alert(t('auth.verifyEmailTitle'), t('auth.verifyEmailResent')),
      onError: err => Alert.alert(t('auth.verifyEmailTitle'), err.message),
    });
  };

  return (
    <Screen>
      <View style={styles.container}>
        <MailCheck size={56} color={theme.colors.primary} />
        <AppText variant="h2" center>
          {t('auth.verifyEmailTitle')}
        </AppText>
        <AppText center color={theme.colors.textSecondary}>
          {t('auth.verifyEmailBody', { email: email ?? '' })}
        </AppText>

        <View style={styles.actions}>
          <Button
            label={t('auth.resendVerification')}
            variant="secondary"
            loading={resend.isPending}
            onPress={onResend}
          />
          <Button
            label={t('auth.backToLogin')}
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actions: { alignSelf: 'stretch', gap: 12, marginTop: 16 },
});
