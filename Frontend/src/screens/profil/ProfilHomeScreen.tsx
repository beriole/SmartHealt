import React from 'react';
import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { UserPen, HousePlus, ShieldCheck, ChevronRight, LucideIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, OptionGroup, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/hooks';
import { useUpdateProfil } from '@/features/profil/hooks';
import { Langue } from '@/types';
import { ProfilStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ProfilStackParamList>;

export function ProfilHomeScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore(s => s.user);
  const logout = useLogout();
  const updateProfil = useUpdateProfil();

  const changerLangue = (langue: Langue) => {
    i18n.changeLanguage(langue);
    if (user) {
      updateProfil.mutate({ id: user.id_utilisateur, data: { langue_preferee: langue } });
    }
  };

  const menu: { icon: LucideIcon; label: string; onPress: () => void }[] = [
    { icon: UserPen, label: 'Modifier le profil', onPress: () => navigation.navigate('EditProfil') },
    { icon: HousePlus, label: 'Interventions à domicile', onPress: () => navigation.navigate('Interventions') },
    { icon: ShieldCheck, label: 'Partager mon dossier', onPress: () => navigation.navigate('PartageDossier') },
  ];

  return (
    <Screen edges={['top']} padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {user ? (
          <Card style={styles.identity}>
            <AppText variant="h3">
              {user.prenom} {user.nom}
            </AppText>
            <AppText color={theme.colors.textSecondary}>{user.email}</AppText>
          </Card>
        ) : null}

        <View style={styles.langue}>
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

        <View style={styles.menu}>
          {menu.map(item => {
            const Icon = item.icon;
            return (
              <Pressable key={item.label} onPress={item.onPress}>
                <Card style={styles.menuItem}>
                  <Icon size={22} color={theme.colors.primary} />
                  <AppText weight="medium" style={styles.flex}>
                    {item.label}
                  </AppText>
                  <ChevronRight size={20} color={theme.colors.textSecondary} />
                </Card>
              </Pressable>
            );
          })}
        </View>

        <Button
          label={t('auth.logout')}
          variant="destructive"
          loading={logout.isPending}
          onPress={() => logout.mutate()}
          style={styles.logout}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  identity: { gap: 2 },
  langue: {},
  menu: { gap: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  logout: { marginTop: 8 },
});
