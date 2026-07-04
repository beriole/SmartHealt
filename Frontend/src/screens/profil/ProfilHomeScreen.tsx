import React from 'react';
import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import {
  UserPen,
  HousePlus,
  ShieldCheck,
  ChevronRight,
  LogOut,
  LucideIcon,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, Badge, Button, Card, OptionGroup, Screen, ScreenHeader } from '@/components';
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

  type Tone = 'primary' | 'secondary' | 'tertiary';
  const toneColor = (tone: Tone) =>
    tone === 'secondary'
      ? theme.colors.secondary
      : tone === 'tertiary'
      ? theme.colors.tertiary
      : theme.colors.primary;

  const sections: {
    title: string;
    items: { icon: LucideIcon; label: string; hint: string; tone: Tone; onPress: () => void }[];
  }[] = [
    {
      title: 'COMPTE',
      items: [
        { icon: UserPen, label: 'Modifier le profil', hint: 'Nom, téléphone…', tone: 'primary', onPress: () => navigation.navigate('EditProfil') },
      ],
    },
    {
      title: 'MÉDICAL',
      items: [
        { icon: HousePlus, label: 'Interventions à domicile', hint: 'Soins infirmiers planifiés', tone: 'secondary', onPress: () => navigation.navigate('Interventions') },
        { icon: ShieldCheck, label: 'Partager mon dossier', hint: 'Code de consentement', tone: 'tertiary', onPress: () => navigation.navigate('PartageDossier') },
      ],
    },
  ];

  const renderRow = (item: {
    icon: LucideIcon;
    label: string;
    hint: string;
    tone: Tone;
    onPress: () => void;
  }) => {
    const Icon = item.icon;
    const color = toneColor(item.tone);
    return (
      <Pressable key={item.label} onPress={item.onPress} android_ripple={{ color: theme.colors.muted }}>
        <Card style={styles.menuItem}>
          <View style={[styles.rowIcon, { backgroundColor: color + '1A', borderRadius: theme.radius.md }]}>
            <Icon size={20} color={color} />
          </View>
          <View style={styles.flex}>
            <AppText weight="semibold">{item.label}</AppText>
            <AppText variant="small" color={theme.colors.textSecondary}>
              {item.hint}
            </AppText>
          </View>
          <ChevronRight size={20} color={theme.colors.outline} />
        </Card>
      </Pressable>
    );
  };

  return (
    <Screen edges={['top']} padded={false}>
      <ScreenHeader title="Mon profil" subtitle="Compte, préférences et dossier médical." />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {user ? (
          <Card style={styles.identity}>
            <View
              style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}
            >
              <AppText variant="h3" weight="bold" color={theme.colors.primary}>
                {`${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="h3" numberOfLines={1}>
                {user.prenom} {user.nom}
              </AppText>
              <AppText
                variant="small"
                color={theme.colors.textSecondary}
                numberOfLines={1}
              >
                {user.email}
              </AppText>
              <View style={styles.roleBadge}>
                <Badge label={user.type_utilisateur} tone="info" />
              </View>
            </View>
          </Card>
        ) : null}

        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <AppText variant="label" color={theme.colors.outline} style={styles.sectionLabel}>
              {section.title}
            </AppText>
            <View style={styles.menu}>{section.items.map(renderRow)}</View>
          </View>
        ))}

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
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: { marginTop: 6 },
  section: { gap: 8 },
  sectionLabel: { marginLeft: 4 },
  menu: { gap: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  logout: { marginTop: 8 },
});
