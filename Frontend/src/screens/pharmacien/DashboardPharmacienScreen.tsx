import React from 'react';
import { ScrollView, View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import {
  ClipboardList,
  Truck,
  Wallet,
  Boxes,
  TriangleAlert,
  PackageCheck,
  Store,
  ChevronRight,
  LucideIcon,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  AppText,
  Badge,
  Card,
  Screen,
  ScreenHeader,
  ErrorState,
} from '@/components';
import { useTheme } from '@/theme';
import { formatFCFA } from '@/lib/format';
import { useMyPharmacie } from '@/features/pharmacien/hooks';
import { PharmacienTabParamList } from '@/navigation/types';

type Nav = BottomTabNavigationProp<PharmacienTabParamList, 'AccueilPharmacien'>;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'danger';

export function DashboardPharmacienScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useMyPharmacie();

  const toneColor = (tone: Tone) =>
    tone === 'secondary'
      ? theme.colors.secondary
      : tone === 'tertiary'
      ? theme.colors.tertiary
      : tone === 'danger'
      ? theme.colors.destructive
      : theme.colors.primary;

  const stats = data?.stats;
  const aTraiter = (stats?.commandes_en_attente ?? 0) + (stats?.commandes_a_confirmer ?? 0);

  const actions: { icon: LucideIcon; label: string; tone: Tone; badge?: number; onPress: () => void }[] = [
    {
      icon: PackageCheck,
      label: 'Commandes',
      tone: 'primary',
      badge: aTraiter,
      onPress: () => navigation.navigate('CommandesPharmacien', { screen: 'CommandesPharmacienList' }),
    },
    {
      icon: Boxes,
      label: 'Inventaire',
      tone: 'secondary',
      onPress: () => navigation.navigate('Inventaire', { screen: 'InventaireList' }),
    },
    {
      icon: TriangleAlert,
      label: 'Alertes',
      tone: 'danger',
      badge: stats?.nb_alertes,
      onPress: () => navigation.navigate('Inventaire', { screen: 'InventaireList' }),
    },
  ];

  return (
    <Screen edges={['top']} padded={false}>
      <ScreenHeader
        title={data?.nom_pharmacie ?? 'Ma pharmacie'}
        subtitle="Activité et gestion de l'officine."
      />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {data && data.statut_verification && data.statut_verification !== 'verifie' ? (
            <View style={styles.alignStart}>
              <Badge
                label={
                  data.statut_verification === 'rejete'
                    ? 'Établissement rejeté'
                    : 'En attente de vérification'
                }
                tone={data.statut_verification === 'rejete' ? 'danger' : 'warning'}
              />
            </View>
          ) : null}

          {/* Chiffre d'affaires du jour */}
          <View style={[styles.caCard, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.flex}>
              <AppText variant="label" color={theme.colors.primaryOn} style={styles.caLabel}>
                CHIFFRE D'AFFAIRES · AUJOURD'HUI
              </AppText>
              <AppText variant="h1" weight="bold" color={theme.colors.primaryOn}>
                {formatFCFA(stats?.ca_jour_fcfa ?? 0)}
              </AppText>
            </View>
            <View style={styles.caIcon}>
              <Wallet size={26} color={theme.colors.primaryOn} />
            </View>
          </View>

          {/* Stats commandes */}
          <View style={styles.statsRow}>
            <StatCard
              icon={ClipboardList}
              value={String(aTraiter)}
              label="À traiter"
              tone="primary"
            />
            <StatCard
              icon={Truck}
              value={String(stats?.commandes_en_livraison ?? 0)}
              label="En livraison"
              tone="tertiary"
            />
            <StatCard
              icon={Boxes}
              value={String(stats?.nb_references ?? 0)}
              label="Références"
              tone="secondary"
            />
          </View>

          {/* Actions rapides */}
          <AppText variant="h3" weight="semibold" style={styles.sectionTitle}>
            Gestion
          </AppText>
          <View style={styles.actionsRow}>
            {actions.map(a => {
              const Icon = a.icon;
              const color = toneColor(a.tone);
              return (
                <Pressable
                  key={a.label}
                  onPress={a.onPress}
                  android_ripple={{ color: theme.colors.muted }}
                  style={({ pressed }) => [
                    styles.actionTile,
                    theme.elevation.level1,
                    {
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.radius.lg,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View style={[styles.actionIcon, { backgroundColor: color + '1A' }]}>
                    <Icon size={24} color={color} />
                    {a.badge ? (
                      <View style={[styles.badgeDot, { backgroundColor: theme.colors.destructive }]}>
                        <AppText variant="caption" color={theme.colors.primaryOn} weight="bold">
                          {a.badge > 9 ? '9+' : a.badge}
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                  <AppText variant="small" weight="semibold" center>
                    {a.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {/* Raccourci pharmacie */}
          <Pressable onPress={() => navigation.navigate('Pharmacie')} style={styles.shortcut}>
            <Card style={styles.shortcutCard}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                <Store size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.flex}>
                <AppText weight="semibold">Mon établissement</AppText>
                <AppText variant="small" color={theme.colors.textSecondary} numberOfLines={1}>
                  {data?.adresse ?? 'Coordonnées et livraison'}
                </AppText>
              </View>
              <ChevronRight size={20} color={theme.colors.outline} />
            </Card>
          </Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  tone: Tone;
}) {
  const theme = useTheme();
  const color =
    tone === 'secondary'
      ? theme.colors.secondary
      : tone === 'tertiary'
      ? theme.colors.tertiary
      : theme.colors.primary;
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '1A' }]}>
        <Icon size={18} color={color} />
      </View>
      <AppText variant="h3">{value}</AppText>
      <AppText variant="caption" color={theme.colors.textSecondary} center>
        {label}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { padding: 16, paddingBottom: 40 },
  alignStart: { flexDirection: 'row', marginBottom: 12 },
  caCard: {
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  caLabel: { opacity: 0.85, marginBottom: 4 },
  caIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sectionTitle: { marginTop: 24, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionTile: { flex: 1, alignItems: 'center', gap: 8, padding: 14 },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcut: { marginTop: 16 },
  shortcutCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
});
