import React from 'react';
import { ScrollView, View, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { Package, Wallet, Star } from 'lucide-react-native';
import { AppText, Badge, Card, Screen, ScreenHeader, ErrorState } from '@/components';
import { useTheme } from '@/theme';
import { formatFCFA } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { useDashboard, useSetDisponibilite } from '@/features/livreur/hooks';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
const VERIF: Record<string, { tone: Tone; label: string }> = {
  en_attente: { tone: 'warning', label: 'En attente de vérification' },
  verifie: { tone: 'success', label: 'Compte vérifié' },
  rejete: { tone: 'danger', label: 'Vérification rejetée' },
};

export function DashboardScreen() {
  const theme = useTheme();
  const user = useAuthStore(s => s.user);
  const { data, isLoading, isError, refetch } = useDashboard();
  const setDispo = useSetDisponibilite();

  if (isLoading) {
    return (
      <Screen edges={['top']}>
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      </Screen>
    );
  }
  if (isError || !data) {
    return (
      <Screen edges={['top']}>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const verif = VERIF[data.statut_verification] ?? VERIF.en_attente;

  return (
    <Screen edges={['top']} padded={false}>
      <ScreenHeader
        title={user ? `Bonjour, ${user.prenom}` : 'Livreur'}
        subtitle="Votre activité de livraison."
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statutRow}>
          <Badge label={verif.label} tone={verif.tone} />
        </View>

        <Card style={styles.dispoCard}>
          <View style={styles.flex}>
            <AppText weight="semibold">Disponibilité</AppText>
            <AppText variant="small" color={theme.colors.textSecondary}>
              {data.disponible ? 'Vous recevez des courses' : 'Vous êtes hors ligne'}
            </AppText>
          </View>
          <Switch
            value={data.disponible}
            onValueChange={v => setDispo.mutate(v)}
            trackColor={{ true: theme.colors.primary }}
          />
        </Card>

        <View style={styles.stats}>
          <Stat icon={Package} label="Livraisons" value={String(data.total_livraisons)} />
          <Stat icon={Wallet} label="Gains" value={formatFCFA(data.commission_totale_fcfa)} />
          <Stat icon={Star} label="Note" value={Number(data.note_moyenne).toFixed(1)} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: theme.colors.primaryContainer }]}>
        <Icon size={20} color={theme.colors.primary} />
      </View>
      <AppText variant="h3">{value}</AppText>
      <AppText variant="caption" color={theme.colors.textSecondary}>
        {label}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { padding: 16, gap: 16 },
  statutRow: { flexDirection: 'row', marginTop: 4 },
  dispoCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  stats: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', gap: 6 },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
