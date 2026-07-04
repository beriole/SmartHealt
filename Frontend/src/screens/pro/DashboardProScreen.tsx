import React from 'react';
import { ScrollView, View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import {
  QrCode,
  Stethoscope,
  FileText,
  Syringe,
  CalendarClock,
  ClipboardList,
  User,
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
  EmptyState,
  ErrorState,
} from '@/components';
import { useTheme } from '@/theme';
import { formatHeure } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { useProfessionnelMe } from '@/features/professionnel/hooks';
import { ProTabParamList } from '@/navigation/types';

type Nav = BottomTabNavigationProp<ProTabParamList, 'Accueil'>;
type Tone = 'primary' | 'secondary' | 'tertiary';

export function DashboardProScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore(s => s.user);
  const { data, isLoading, isError, refetch } = useProfessionnelMe();

  const toneColor = (tone: Tone) =>
    tone === 'secondary'
      ? theme.colors.secondary
      : tone === 'tertiary'
      ? theme.colors.tertiary
      : theme.colors.primary;

  const actions: { icon: LucideIcon; label: string; tone: Tone; onPress: () => void }[] = [
    {
      icon: QrCode,
      label: 'Scanner un carnet',
      tone: 'primary',
      onPress: () => navigation.navigate('Dossier', { screen: 'ScanCarnet' }),
    },
    {
      icon: Stethoscope,
      label: 'Mes consultations',
      tone: 'secondary',
      onPress: () => navigation.navigate('Activite'),
    },
    {
      icon: Syringe,
      label: 'Interventions',
      tone: 'tertiary',
      onPress: () => navigation.navigate('InterventionsPro', { screen: 'InterventionsProList' }),
    },
  ];

  const stats = data?.stats;

  return (
    <Screen edges={['top']} padded={false}>
      <ScreenHeader
        title={user ? `Dr ${user.nom}` : 'Tableau de bord'}
        subtitle={data?.specialite ? `${data.specialite}` : 'Votre activité médicale.'}
      />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {data && data.statut_verification !== 'verifie' ? (
            <View style={styles.alignStart}>
              <Badge
                label={
                  data.statut_verification === 'rejete'
                    ? 'Vérification rejetée'
                    : 'En attente de vérification'
                }
                tone={data.statut_verification === 'rejete' ? 'danger' : 'warning'}
              />
            </View>
          ) : null}

          {/* Statistiques */}
          <View style={styles.statsRow}>
            <StatCard
              icon={CalendarClock}
              value={String(stats?.consultations_aujourdhui ?? 0)}
              label="Aujourd'hui"
              tone="primary"
            />
            <StatCard
              icon={ClipboardList}
              value={String(stats?.consultations_total ?? 0)}
              label="Consultations"
              tone="secondary"
            />
            <StatCard
              icon={FileText}
              value={String(stats?.ordonnances_total ?? 0)}
              label="Ordonnances"
              tone="tertiary"
            />
          </View>

          {/* Actions rapides */}
          <AppText variant="h3" weight="semibold" style={styles.sectionTitle}>
            Actions rapides
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
                  </View>
                  <AppText variant="small" weight="semibold" center>
                    {a.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {/* Agenda du jour */}
          <AppText variant="h3" weight="semibold" style={styles.sectionTitle}>
            Agenda du jour
          </AppText>
          {data && data.agenda.length > 0 ? (
            <View style={styles.list}>
              {data.agenda.map(c => (
                <Card key={c.id_consultation} style={styles.agendaCard}>
                  <View style={[styles.agendaTime, { backgroundColor: theme.colors.primaryContainer }]}>
                    <AppText weight="bold" color={theme.colors.primary}>
                      {formatHeure(c.date_consultation)}
                    </AppText>
                  </View>
                  <View style={styles.flex}>
                    <View style={styles.patientRow}>
                      <User size={14} color={theme.colors.outline} />
                      <AppText weight="semibold" numberOfLines={1} style={styles.flex}>
                        {c.patient?.utilisateur
                          ? `${c.patient.utilisateur.prenom} ${c.patient.utilisateur.nom}`
                          : 'Patient'}
                      </AppText>
                    </View>
                    <AppText variant="small" color={theme.colors.textSecondary} numberOfLines={1}>
                      {c.motif}
                    </AppText>
                  </View>
                  <ChevronRight size={18} color={theme.colors.outline} />
                </Card>
              ))}
            </View>
          ) : (
            <EmptyState
              title="Aucun rendez-vous"
              description="Vous n'avez pas de consultation planifiée aujourd'hui."
            />
          )}
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
  list: { gap: 10 },
  agendaCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agendaTime: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
});
