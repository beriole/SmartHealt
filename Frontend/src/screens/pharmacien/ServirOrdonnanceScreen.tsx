import React, { useState } from 'react';
import { ScrollView, View, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, Square, CheckSquare, Pill, ShieldCheck, XCircle } from 'lucide-react-native';
import {
  AppText,
  Badge,
  Button,
  Card,
  Input,
  Screen,
  ErrorState,
} from '@/components';
import { useTheme } from '@/theme';
import { formatDate } from '@/lib/format';
import { useOrdonnance, useTraiterOrdonnance } from '@/features/pharmacien/hooks';
import { CommandesPharmacienStackParamList } from '@/navigation/types';

type Rt = RouteProp<CommandesPharmacienStackParamList, 'ServirOrdonnance'>;
type Nav = NativeStackNavigationProp<CommandesPharmacienStackParamList>;

export function ServirOrdonnanceScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { data: ordo, isLoading, isError, refetch } = useOrdonnance(params.id_ordonnance);
  const traiter = useTraiterOrdonnance();

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [refus, setRefus] = useState(false);
  const [motif, setMotif] = useState('');

  if (isLoading) {
    return (
      <Screen edges={['bottom']}>
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      </Screen>
    );
  }
  if (isError || !ordo) {
    return (
      <Screen edges={['bottom']}>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const lignes = ordo.lignes ?? [];
  const aServir = lignes.filter(l => !l.servi);
  const toggle = (id: string) => setSelected(s => ({ ...s, [id]: !s[id] }));
  const chosen = lignes.filter(l => selected[l.id_ligne]).map(l => l.id_ligne);

  const onError = (e: { message: string }) => Alert.alert('Ordonnance', e.message);

  const onServir = () => {
    if (chosen.length === 0) {
      Alert.alert('Servir l\'ordonnance', 'Sélectionnez au moins un médicament à servir.');
      return;
    }
    traiter.mutate(
      { id: ordo.id_ordonnance, payload: { action: 'servir', lignes_servies: chosen } },
      {
        onSuccess: () => {
          Alert.alert('Ordonnance', 'Médicaments servis avec succès.');
          navigation.goBack();
        },
        onError,
      },
    );
  };

  const onRefuser = () => {
    if (!motif.trim()) {
      Alert.alert('Refuser', 'Indiquez le motif du refus.');
      return;
    }
    traiter.mutate(
      { id: ordo.id_ordonnance, payload: { action: 'refuser', notes_pharmacien: motif.trim() } },
      {
        onSuccess: () => {
          Alert.alert('Ordonnance', 'Ordonnance refusée.');
          navigation.goBack();
        },
        onError,
      },
    );
  };

  const statutTone =
    ordo.statut === 'servie'
      ? 'neutral'
      : ordo.statut === 'expiree'
      ? 'danger'
      : ordo.statut === 'partiellement_servie'
      ? 'warning'
      : 'success';

  return (
    <Screen edges={['bottom']} padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card style={styles.headCard}>
          <View style={styles.headRow}>
            <ShieldCheck size={20} color={theme.colors.primary} />
            <AppText weight="semibold" style={styles.flex}>
              Ordonnance numérique
            </AppText>
            <Badge label={ordo.statut.replace(/_/g, ' ')} tone={statutTone} />
          </View>
          <AppText variant="small" color={theme.colors.textSecondary}>
            Émise le {formatDate(ordo.date_emission)} · expire le {formatDate(ordo.date_expiration)}
          </AppText>
          {ordo.patient?.utilisateur ? (
            <AppText variant="small" color={theme.colors.textSecondary}>
              Patient : {ordo.patient.utilisateur.prenom} {ordo.patient.utilisateur.nom}
            </AppText>
          ) : null}
        </Card>

        <AppText variant="h3" weight="semibold" style={styles.sectionTitle}>
          Médicaments prescrits
        </AppText>

        <View style={styles.list}>
          {lignes.map(l => {
            const checked = !!selected[l.id_ligne];
            const Box = checked ? CheckSquare : Square;
            return (
              <Pressable
                key={l.id_ligne}
                onPress={() => !l.servi && !refus && toggle(l.id_ligne)}
                disabled={l.servi || refus}
              >
                <Card style={[styles.ligne, l.servi && styles.ligneServed]}>
                  <View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Pill size={18} color={theme.colors.primary} />
                  </View>
                  <View style={styles.flex}>
                    <AppText weight="semibold" numberOfLines={1}>
                      {l.medicament?.nom_commercial ?? 'Médicament'}
                    </AppText>
                    <AppText variant="small" color={theme.colors.textSecondary}>
                      {l.posologie} · {l.quantite} unité(s)
                    </AppText>
                  </View>
                  {l.servi ? (
                    <View style={styles.servedTag}>
                      <Check size={16} color={theme.colors.success} />
                      <AppText variant="small" weight="semibold" color={theme.colors.success}>
                        Servi
                      </AppText>
                    </View>
                  ) : refus ? null : (
                    <Box size={24} color={checked ? theme.colors.primary : theme.colors.outline} />
                  )}
                </Card>
              </Pressable>
            );
          })}
        </View>

        {refus ? (
          <View style={styles.refusBox}>
            <Input
              label="Motif du refus"
              value={motif}
              onChangeText={setMotif}
              placeholder="Ex. ordonnance illisible, médicament indisponible…"
              multiline
            />
            <Button
              label="Confirmer le refus"
              variant="destructive"
              loading={traiter.isPending}
              onPress={onRefuser}
            />
            <Button label="Retour" variant="secondary" onPress={() => setRefus(false)} />
          </View>
        ) : (
          <View style={styles.actions}>
            <Button
              label={`Servir ${chosen.length > 0 ? `(${chosen.length})` : ''}`.trim()}
              loading={traiter.isPending}
              disabled={aServir.length === 0}
              onPress={onServir}
              icon={<Check size={20} color={theme.colors.primaryOn} />}
            />
            <Button
              label="Refuser l'ordonnance"
              variant="secondary"
              onPress={() => setRefus(true)}
              icon={<XCircle size={20} color={theme.colors.destructive} />}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  headCard: { gap: 6 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { marginTop: 8 },
  list: { gap: 10 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ligneServed: { opacity: 0.6 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  servedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { gap: 12, marginTop: 8 },
  refusBox: { gap: 12, marginTop: 8 },
  flex: { flex: 1 },
});
