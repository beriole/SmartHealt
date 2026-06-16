import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/hooks';

export function ProfilScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const logout = useLogout();

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="h2">{t('tabs.profil')}</AppText>
      </View>

      {user ? (
        <Card style={styles.card}>
          <AppText variant="h3">
            {user.prenom} {user.nom}
          </AppText>
          <AppText color={theme.colors.textSecondary}>{user.email}</AppText>
          <AppText variant="small" color={theme.colors.textSecondary}>
            {user.type_utilisateur}
          </AppText>
        </Card>
      ) : null}

      <View style={styles.footer}>
        <Button
          label={t('auth.logout')}
          variant="destructive"
          loading={logout.isPending}
          onPress={() => logout.mutate()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 16, marginBottom: 24 },
  card: { gap: 4 },
  footer: { marginTop: 'auto', paddingBottom: 16 },
});
