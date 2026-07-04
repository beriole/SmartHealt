import React from 'react';
import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { LogOut, UserPen, Phone, Mail, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, Badge, Button, Card, OptionGroup, Screen, ScreenHeader } from '@/components';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/hooks';
import { useUpdateProfil } from '@/features/profil/hooks';
import { useProfessionnelMe } from '@/features/professionnel/hooks';
import { Langue } from '@/types';
import { StaffProfilStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<StaffProfilStackParamList>;

export function ProfilProScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore(s => s.user);
  const logout = useLogout();
  const updateProfil = useUpdateProfil();
  const { data: me } = useProfessionnelMe();

  const changerLangue = (langue: Langue) => {
    i18n.changeLanguage(langue);
    if (user) {
      updateProfil.mutate({ id: user.id_utilisateur, data: { langue_preferee: langue } });
    }
  };

  return (
    <Screen edges={['top']} padded={false}>
      <ScreenHeader title="Mon profil" subtitle="Compte et préférences." />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {user ? (
          <Card style={styles.identity}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
              <AppText variant="h3" weight="bold" color={theme.colors.primary}>
                {`${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="h3" numberOfLines={1}>
                {user.prenom} {user.nom}
              </AppText>
              {me?.specialite ? (
                <AppText variant="small" color={theme.colors.textSecondary} numberOfLines={1}>
                  {me.specialite}
                </AppText>
              ) : null}
              <View style={styles.badgeRow}>
                <Badge label={user.type_utilisateur} tone="info" />
                {me ? (
                  <Badge
                    label={me.statut_verification === 'verifie' ? 'Vérifié' : 'En attente'}
                    tone={me.statut_verification === 'verifie' ? 'success' : 'warning'}
                  />
                ) : null}
              </View>
            </View>
          </Card>
        ) : null}

        <View style={styles.section}>
          <AppText variant="label" color={theme.colors.outline} style={styles.sectionLabel}>
            COMPTE
          </AppText>
          <Card style={styles.menu} padding="sm">
            <Pressable
              onPress={() => navigation.navigate('EditProfil')}
              android_ripple={{ color: theme.colors.muted }}
              style={styles.row}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.colors.primary + '1A' }]}>
                <UserPen size={18} color={theme.colors.primary} />
              </View>
              <AppText weight="semibold" style={styles.flex}>
                Modifier le profil
              </AppText>
              <ChevronRight size={20} color={theme.colors.outline} />
            </Pressable>
            <View style={[styles.infoRow, { borderTopColor: theme.colors.border }]}>
              <Phone size={16} color={theme.colors.outline} />
              <AppText color={theme.colors.textSecondary}>{user?.telephone ?? '—'}</AppText>
            </View>
            <View style={[styles.infoRow, { borderTopColor: theme.colors.border }]}>
              <Mail size={16} color={theme.colors.outline} />
              <AppText color={theme.colors.textSecondary} numberOfLines={1}>
                {user?.email ?? '—'}
              </AppText>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <OptionGroup<Langue>
            label="Langue"
            value={i18n.language as Langue}
            onChange={changerLangue}
            options={[
              { value: 'fr', label: 'Français' },
              { value: 'en', label: 'English' },
            ]}
          />
        </View>

        <Button
          label={t('auth.logout')}
          variant="destructive"
          loading={logout.isPending}
          onPress={() => logout.mutate()}
          icon={<LogOut size={20} color={theme.colors.destructiveOn} />}
          style={styles.logout}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 20 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  section: { gap: 8 },
  sectionLabel: { marginLeft: 4 },
  menu: { gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
  logout: { marginTop: 8 },
});
