import React, { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Stethoscope, FileText, User, CalendarDays } from 'lucide-react-native';
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
import { formatDate } from '@/lib/format';
import {
  useProfessionnelMe,
  useMesConsultations,
  useMesOrdonnances,
} from '@/features/professionnel/hooks';
import { Consultation, Ordonnance, StatutConsultation, StatutOrdonnance } from '@/types';

type Tab = 'consultations' | 'ordonnances';
type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const STATUT_CONSULT: Record<StatutConsultation, { tone: Tone; label: string }> = {
  planifiee: { tone: 'info', label: 'Planifiée' },
  effectuee: { tone: 'success', label: 'Effectuée' },
  annulee: { tone: 'neutral', label: 'Annulée' },
  no_show: { tone: 'danger', label: 'Absent' },
};

const STATUT_ORDO: Record<StatutOrdonnance, { tone: Tone; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  partiellement_servie: { tone: 'warning', label: 'Partiellement servie' },
  servie: { tone: 'neutral', label: 'Servie' },
  expiree: { tone: 'danger', label: 'Expirée' },
};

export function ActiviteProScreen() {
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>('consultations');
  const { data: me } = useProfessionnelMe();
  const idPro = me?.id_professionnel;

  const consultations = useMesConsultations(idPro);
  const ordonnances = useMesOrdonnances(idPro);

  const renderTabButton = (key: Tab, label: string) => {
    const active = tab === key;
    return (
      <Pressable
        key={key}
        onPress={() => setTab(key)}
        style={[
          styles.segment,
          {
            backgroundColor: active ? theme.colors.primary : theme.colors.surface,
            borderColor: active ? theme.colors.primary : theme.colors.border,
          },
        ]}
      >
        <AppText
          variant="small"
          weight="semibold"
          color={active ? theme.colors.primaryOn : theme.colors.textSecondary}
        >
          {label}
        </AppText>
      </Pressable>
    );
  };

  const renderConsultation = ({ item }: { item: Consultation }) => {
    const s = STATUT_CONSULT[item.statut] ?? STATUT_CONSULT.planifiee;
    return (
      <Card style={styles.card}>
        <View style={styles.cardHead}>
          <View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
            <Stethoscope size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.flex}>
            <AppText weight="semibold" numberOfLines={1}>
              {item.patient?.utilisateur
                ? `${item.patient.utilisateur.prenom} ${item.patient.utilisateur.nom}`
                : 'Patient'}
            </AppText>
            <View style={styles.metaRow}>
              <CalendarDays size={13} color={theme.colors.outline} />
              <AppText variant="small" color={theme.colors.textSecondary}>
                {formatDate(item.date_consultation)}
              </AppText>
            </View>
          </View>
          <Badge label={s.label} tone={s.tone} />
        </View>
        {item.motif ? (
          <AppText variant="small" color={theme.colors.textSecondary} numberOfLines={2}>
            {item.motif}
          </AppText>
        ) : null}
      </Card>
    );
  };

  const renderOrdonnance = ({ item }: { item: Ordonnance }) => {
    const s = STATUT_ORDO[item.statut] ?? STATUT_ORDO.active;
    const patient = item.patient;
    return (
      <Card style={styles.card}>
        <View style={styles.cardHead}>
          <View style={[styles.icon, { backgroundColor: theme.colors.secondary + '1A' }]}>
            <FileText size={18} color={theme.colors.secondary} />
          </View>
          <View style={styles.flex}>
            <View style={styles.metaRow}>
              <User size={13} color={theme.colors.outline} />
              <AppText weight="semibold" numberOfLines={1}>
                {patient?.utilisateur
                  ? `${patient.utilisateur.prenom} ${patient.utilisateur.nom}`
                  : 'Patient'}
              </AppText>
            </View>
            <AppText variant="small" color={theme.colors.textSecondary}>
              {formatDate(item.date_emission)} · {item.lignes?.length ?? 0} médicament(s)
            </AppText>
          </View>
          <Badge label={s.label} tone={s.tone} />
        </View>
      </Card>
    );
  };

  const loading = tab === 'consultations' ? consultations.isLoading : ordonnances.isLoading;
  const error = tab === 'consultations' ? consultations.isError : ordonnances.isError;

  return (
    <Screen edges={['top']} padded={false}>
      <ScreenHeader title="Activité médicale" subtitle="Vos consultations et ordonnances." />
      <View style={styles.segments}>
        {renderTabButton('consultations', 'Consultations')}
        {renderTabButton('ordonnances', 'Ordonnances')}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      ) : error ? (
        <ErrorState
          onRetry={tab === 'consultations' ? consultations.refetch : ordonnances.refetch}
        />
      ) : tab === 'consultations' ? (
        <FlatList
          data={consultations.data?.data ?? []}
          keyExtractor={i => i.id_consultation}
          contentContainerStyle={styles.list}
          renderItem={renderConsultation}
          ListEmptyComponent={
            <EmptyState
              title="Aucune consultation"
              description="Les consultations que vous réalisez apparaîtront ici."
            />
          }
        />
      ) : (
        <FlatList
          data={ordonnances.data?.data ?? []}
          keyExtractor={i => i.id_ordonnance}
          contentContainerStyle={styles.list}
          renderItem={renderOrdonnance}
          ListEmptyComponent={
            <EmptyState
              title="Aucune ordonnance"
              description="Les ordonnances que vous émettez apparaîtront ici."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segments: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  loader: { marginTop: 32 },
  list: { padding: 16, paddingTop: 4, gap: 12, flexGrow: 1 },
  card: { gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  flex: { flex: 1 },
});
