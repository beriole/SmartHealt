import React from 'react';
import { ScrollView, View, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  User,
  Phone,
  MapPin,
  Pill,
  ShieldCheck,
  KeyRound,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react-native';
import {
  AppText,
  Badge,
  Button,
  Card,
  OrderStatusTimeline,
  Screen,
  ErrorState,
} from '@/components';
import { useTheme } from '@/theme';
import { formatFCFA, formatDate } from '@/lib/format';
import {
  useCommandePharmacie,
  useUpdateCommandeStatus,
  useAttribuerLivreur,
  useAnnulerCommande,
} from '@/features/pharmacien/hooks';
import { CommandesPharmacienStackParamList } from '@/navigation/types';
import { STATUT_CMD } from './CommandesPharmacienScreen';

type Rt = RouteProp<CommandesPharmacienStackParamList, 'CommandePharmacienDetail'>;

export function CommandePharmacienDetailScreen() {
  const theme = useTheme();
  const { params } = useRoute<Rt>();
  const navigation = useNavigation<NativeStackNavigationProp<CommandesPharmacienStackParamList>>();
  const { data: cmd, isLoading, isError, refetch } = useCommandePharmacie(params.id);
  const updateStatus = useUpdateCommandeStatus();
  const attribuer = useAttribuerLivreur();
  const annuler = useAnnulerCommande();

  if (isLoading) {
    return (
      <Screen edges={['bottom']}>
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      </Screen>
    );
  }
  if (isError || !cmd) {
    return (
      <Screen edges={['bottom']}>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const s = STATUT_CMD[cmd.statut_commande];
  const paye = cmd.statut_paiement === 'paye';
  const patient = cmd.patient?.utilisateur;
  const livraison = cmd.type_livraison === 'livraison_domicile';
  const busy = updateStatus.isPending || attribuer.isPending || annuler.isPending;

  const onError = (e: { message: string }) => Alert.alert('Commande', e.message);

  const setStatut = (statut: typeof cmd.statut_commande, okMsg: string) =>
    updateStatus.mutate(
      { id: cmd.id_commande, statut },
      { onSuccess: () => Alert.alert('Commande', okMsg), onError },
    );

  const onConfirmer = () => setStatut('confirmee', 'Commande confirmée.');
  const onPreparer = () => setStatut('preparee', 'Commande marquée comme préparée.');
  const onRemettre = () => setStatut('livree', 'Commande remise au client.');
  const onAttribuer = () =>
    attribuer.mutate(cmd.id_commande, {
      onSuccess: () => Alert.alert('Livraison', 'Un livreur a été attribué automatiquement.'),
      onError,
    });
  const onAnnuler = () =>
    Alert.alert('Annuler la commande', 'Confirmer l\'annulation ? Le stock sera réapprovisionné.', [
      { text: 'Retour', style: 'cancel' },
      {
        text: 'Annuler la commande',
        style: 'destructive',
        onPress: () =>
          annuler.mutate(
            { id: cmd.id_commande },
            { onSuccess: () => Alert.alert('Commande', 'Commande annulée.'), onError },
          ),
      },
    ]);

  const renderActions = () => {
    switch (cmd.statut_commande) {
      case 'en_attente':
        return (
          <Button
            label="Confirmer la commande"
            loading={busy}
            onPress={onConfirmer}
            icon={<CheckCircle2 size={20} color={theme.colors.primaryOn} />}
          />
        );
      case 'confirmee':
        return (
          <>
            {!paye ? (
              <AppText variant="small" color={theme.colors.warning} center style={styles.hint}>
                En attente du paiement du client avant préparation.
              </AppText>
            ) : null}
            <Button
              label="Marquer comme préparée"
              loading={busy}
              disabled={!paye}
              onPress={onPreparer}
              icon={<Pill size={20} color={theme.colors.primaryOn} />}
            />
          </>
        );
      case 'preparee':
        return livraison ? (
          <Button
            label="Attribuer un livreur"
            loading={busy}
            onPress={onAttribuer}
            icon={<Truck size={20} color={theme.colors.primaryOn} />}
          />
        ) : (
          <Button
            label="Remettre au client"
            loading={busy}
            onPress={onRemettre}
            icon={<CheckCircle2 size={20} color={theme.colors.primaryOn} />}
          />
        );
      default:
        return null;
    }
  };

  const canCancel = !['livree', 'annulee'].includes(cmd.statut_commande);

  return (
    <Screen edges={['bottom']} padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Statut */}
        <View style={styles.statusRow}>
          <Badge label={s.label} tone={s.tone} />
          <Badge label={paye ? 'Payé' : 'Non payé'} tone={paye ? 'success' : 'warning'} />
          <Badge
            label={livraison ? 'Livraison' : 'Retrait'}
            tone="info"
          />
        </View>

        {/* Suivi */}
        <Card style={styles.card}>
          <AppText variant="label" color={theme.colors.outline}>
            SUIVI
          </AppText>
          <OrderStatusTimeline
            statut={cmd.statut_commande}
            typeLivraison={cmd.type_livraison}
            dateCommande={cmd.date_commande}
            dateLivraisonEffective={cmd.date_livraison_effective}
          />
        </Card>

        {/* Client */}
        <Card style={styles.card}>
          <AppText variant="label" color={theme.colors.outline}>
            CLIENT
          </AppText>
          <View style={styles.metaRow}>
            <User size={16} color={theme.colors.primary} />
            <AppText weight="semibold">
              {patient ? `${patient.prenom} ${patient.nom}` : 'Client'}
            </AppText>
          </View>
          {patient?.telephone ? (
            <View style={styles.metaRow}>
              <Phone size={16} color={theme.colors.outline} />
              <AppText color={theme.colors.textSecondary}>{patient.telephone}</AppText>
            </View>
          ) : null}
          {cmd.adresse_livraison ? (
            <View style={styles.metaRow}>
              <MapPin size={16} color={theme.colors.outline} />
              <AppText color={theme.colors.textSecondary} style={styles.flex}>
                {cmd.adresse_livraison}
              </AppText>
            </View>
          ) : null}
          <AppText variant="small" color={theme.colors.textSecondary}>
            Commande du {formatDate(cmd.date_commande)}
          </AppText>
        </Card>

        {/* Ordonnance */}
        {cmd.id_ordonnance ? (
          <Pressable
            onPress={() =>
              navigation.navigate('ServirOrdonnance', { id_ordonnance: cmd.id_ordonnance as string })
            }
            android_ripple={{ color: theme.colors.muted }}
          >
            <Card style={styles.ordoCard} padding="sm">
              <ShieldCheck size={18} color={theme.colors.success} />
              <View style={styles.flex}>
                <AppText variant="small" weight="semibold" color={theme.colors.success}>
                  Ordonnance numérique jointe
                </AppText>
                <AppText variant="caption" color={theme.colors.textSecondary}>
                  Voir et servir les médicaments prescrits
                </AppText>
              </View>
              <ChevronRight size={18} color={theme.colors.outline} />
            </Card>
          </Pressable>
        ) : null}

        {/* PIN de livraison */}
        {cmd.statut_commande === 'en_livraison' && cmd.code_validation_livraison ? (
          <Card style={styles.pinCard} accent>
            <View style={styles.metaRow}>
              <KeyRound size={18} color={theme.colors.primary} />
              <AppText weight="semibold">Code de validation livraison</AppText>
            </View>
            <AppText variant="h2" weight="bold" color={theme.colors.primary}>
              {cmd.code_validation_livraison}
            </AppText>
            <AppText variant="small" color={theme.colors.textSecondary}>
              Communiqué au client pour confirmer la réception.
            </AppText>
          </Card>
        ) : null}

        {/* Articles */}
        <AppText variant="h3" weight="semibold" style={styles.sectionTitle}>
          Articles
        </AppText>
        <Card style={styles.card}>
          {(cmd.lignes ?? []).map((l, idx) => (
            <View
              key={l.id_ligne_cmd}
              style={[styles.ligne, idx > 0 && styles.ligneBorder, { borderTopColor: theme.colors.border }]}
            >
              <View style={[styles.ligneIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                <Pill size={16} color={theme.colors.primary} />
              </View>
              <View style={styles.flex}>
                <AppText weight="semibold" numberOfLines={1}>
                  {l.stock?.medicament?.nom_commercial ?? 'Médicament'}
                </AppText>
                <AppText variant="small" color={theme.colors.textSecondary}>
                  {l.quantite_commandee} × {formatFCFA(l.prix_unitaire_fcfa)}
                </AppText>
              </View>
              <AppText weight="semibold">{formatFCFA(l.sous_total_fcfa)}</AppText>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: theme.colors.border }]}>
            <AppText weight="bold">Total</AppText>
            <AppText variant="h3" weight="bold" color={theme.colors.primary}>
              {formatFCFA(cmd.montant_total_fcfa)}
            </AppText>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          {renderActions()}
          {canCancel ? (
            <Button
              label="Annuler la commande"
              variant="secondary"
              loading={annuler.isPending}
              onPress={onAnnuler}
              icon={<XCircle size={20} color={theme.colors.destructive} />}
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ordoCard: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pinCard: { gap: 4, alignItems: 'flex-start' },
  sectionTitle: { marginTop: 4 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  ligneBorder: { borderTopWidth: StyleSheet.hairlineWidth },
  ligneIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 4,
  },
  actions: { gap: 12, marginTop: 4 },
  hint: { marginBottom: 4 },
  flex: { flex: 1 },
});
