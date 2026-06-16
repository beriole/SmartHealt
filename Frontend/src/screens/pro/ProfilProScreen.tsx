import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/hooks';

export function ProfilProScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const logout = useLogout();

  return (
    <Screen edges={['top']}>
      <View style={styles.content}>
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
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: 16 },
  card: { gap: 4 },
  footer: { marginTop: 'auto', paddingBottom: 16 },
});
