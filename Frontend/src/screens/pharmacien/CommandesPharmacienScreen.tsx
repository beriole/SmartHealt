import React, { useState } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MapPin, Package, User, ChevronRight, CreditCard } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { formatFCFA, formatDate } from '@/lib/format';
import { useCommandesPharmacie } from '@/features/pharmacien/hooks';
import { Commande, StatutCommande } from '@/types';
import { CommandesPharmacienStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<CommandesPharmacienStackParamList>;
type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export const STATUT_CMD: Record<StatutCommande, { tone: Tone; label: string }> = {
  en_attente: { tone: 'warning', label: 'En attente' },
  confirmee: { tone: 'info', label: 'Confirmée' },
  preparee: { tone: 'info', label: 'Préparée' },
  en_livraison: { tone: 'warning', label: 'En livraison' },
  livree: { tone: 'success', label: 'Livrée' },
  annulee: { tone: 'neutral', label: 'Annulée' },
};

const FILTRES: { key: StatutCommande | 'all'; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'confirmee', label: 'Confirmées' },
  { key: 'preparee', label: 'Préparées' },
  { key: 'en_livraison', label: 'En livraison' },
  { key: 'livree', label: 'Livrées' },
];

export function CommandesPharmacienScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [filtre, setFiltre] = useState<StatutCommande | 'all'>('all');

  const { data, isLoading, isError, refetch, isRefetching } = useCommandesPharmacie(
    filtre === 'all' ? undefined : filtre,
  );

  const renderPatient = (item: Commande) => {
    const u = item.patient?.utilisateur;
    return u ? `${u.prenom} ${u.nom}` : 'Client';
  };

  return (
    <Screen edges={['top']} padded={false}>
      <ScreenHeader title="Commandes" subtitle="Traitez et suivez vos commandes." />

      <View style={styles.filtersWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTRES.map(f => {
            const active = filtre === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFiltre(f.key)}
                style={[
                  styles.chip,
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
                  {f.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(c: Commande) => c.id_commande}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <EmptyState
              title="Aucune commande"
              description="Les commandes de vos clients apparaîtront ici."
            />
          }
          renderItem={({ item }) => {
            const s = STATUT_CMD[item.statut_commande];
            const paye = item.statut_paiement === 'paye';
            return (
              <Pressable
                onPress={() =>
                  navigation.navigate('CommandePharmacienDetail', { id: item.id_commande })
                }
                android_ripple={{ color: theme.colors.muted }}
              >
                <Card style={styles.card}>
                  <View style={styles.cardHead}>
                    <View style={styles.patientRow}>
                      <User size={14} color={theme.colors.outline} />
                      <AppText weight="semibold" numberOfLines={1} style={styles.flex}>
                        {renderPatient(item)}
                      </AppText>
                    </View>
                    <Badge label={s.label} tone={s.tone} />
                  </View>

                  <View style={styles.metaRow}>
                    <Package size={13} color={theme.colors.outline} />
                    <AppText variant="small" color={theme.colors.textSecondary}>
                      {item.lignes?.length ?? 0} article(s) · {formatDate(item.date_commande)}
                    </AppText>
                  </View>

                  {item.adresse_livraison ? (
                    <View style={styles.metaRow}>
                      <MapPin size={13} color={theme.colors.outline} />
                      <AppText
                        variant="small"
                        color={theme.colors.textSecondary}
                        numberOfLines={1}
                        style={styles.flex}
                      >
                        {item.adresse_livraison}
                      </AppText>
                    </View>
                  ) : null}

                  <View style={styles.footer}>
                    <View style={styles.payRow}>
                      <CreditCard size={14} color={paye ? theme.colors.success : theme.colors.warning} />
                      <AppText
                        variant="small"
                        weight="semibold"
                        color={paye ? theme.colors.success : theme.colors.warning}
                      >
                        {paye ? 'Payé' : 'Non payé'}
                      </AppText>
                    </View>
                    <View style={styles.amountRow}>
                      <AppText weight="bold" color={theme.colors.primary}>
                        {formatFCFA(item.montant_total_fcfa)}
                      </AppText>
                      <ChevronRight size={18} color={theme.colors.outline} />
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filtersWrap: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'transparent' },
  filters: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  loader: { marginTop: 32 },
  list: { padding: 16, paddingTop: 4, gap: 12, flexGrow: 1 },
  card: { gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
});
