import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, Screen } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/hooks';

export function RoleUnavailableScreen() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const logout = useLogout();

  return (
    <Screen>
      <EmptyState
        title="Espace bientôt disponible"
        description={`Le rôle ${user?.type_utilisateur ?? ''} n'est pas encore pris en charge dans l'application mobile.`}
      />
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
  footer: { paddingBottom: 16 },
});
