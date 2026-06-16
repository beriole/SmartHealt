import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Card, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store/authStore';

export function AccueilScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="small" color={theme.colors.textSecondary}>
          {t('tabs.accueil')}
        </AppText>
        <AppText variant="h2">
          {user ? `Bonjour, ${user.prenom}` : t('common.appName')}
        </AppText>
      </View>

      <Card>
        <AppText weight="semibold">Prochaine prise</AppText>
        <AppText color={theme.colors.textSecondary}>
          Les rappels apparaîtront ici (Sprint S5).
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4, marginTop: 16, marginBottom: 24 },
});
