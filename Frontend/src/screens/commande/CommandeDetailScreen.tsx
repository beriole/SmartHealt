import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AppText,
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  OrderStatusTimeline,
  Screen,
  StarRating,
} from '@/components';
import { useTheme } from '@/theme';
import {
  useCommande,
  useValiderLivraison,
  useEvaluer,
} from '@/features/commande/hooks';
import { commandeTone, paiementTone } from '@/features/commande/status';
import { formatFCFA, formatDate } from '@/lib/format';
import { CommandesStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<CommandesStackParamList, 'CommandeDetail'>;
type Route = RouteProp<CommandesStackParamList, 'CommandeDetail'>;

export function CommandeDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { data, isLoading, isError, refetch } = useCommande(params.id);

  const valider = useValiderLivraison(params.id);
  const evaluer = useEvaluer(params.id);

  const [code, setCode] = useState('');
  const [noteLivraison, setNoteLivraison] = useState(0);
  const [notePharmacie, setNotePharmacie] = useState(0);
  const [commentaire, setCommentaire] = useState('');

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      </Screen>
    );
  }
  if (isError || !data) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const peutPayer =
    data.statut_paiement === 'en_attente' || data.statut_paiement === 'echoue';
  const peutConfirmer = data.statut_commande === 'en_livraison';
  const dejaEvaluee =
    data.note_livraison != null || data.note_pharmacie != null;
  const peutEvaluer = data.statut_commande === 'livree' && !dejaEvaluee;

  const onConfirmer = () => {
    if (code.trim().length < 4) {
      Alert.alert(t('commande.confirmReceipt'), t('commande.codeInvalid'));
      return;
    }
    valider.mutate(code.trim(), {
      onSuccess: () =>
        Alert.alert(t('commande.confirmReceipt'), t('commande.receiptConfirmed')),
      onError: err => Alert.alert(t('commande.confirmReceipt'), err.message),
    });
  };

  const onEvaluer = () => {
    if (notePharmacie === 0 && noteLivraison === 0) {
      Alert.alert(t('commande.rateOrder'), t('commande.ratingRequired'));
      return;
    }
    evaluer.mutate(
      {
        note_pharmacie: notePharmacie || undefined,
        note_livraison: noteLivraison || undefined,
        commentaire_pharmacie: commentaire.trim() || undefined,
      },
      {
        onSuccess: () =>
          Alert.alert(t('commande.rateOrder'), t('commande.ratingThanks')),
        onError: err => Alert.alert(t('commande.rateOrder'), err.message),
      },
    );
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <AppText variant="h3">
          {data.pharmacie?.nom_pharmacie ?? t('tabs.commandes')}
        </AppText>
        <AppText variant="caption" color={theme.colors.textSecondary}>
          {formatDate(data.date_commande)}
        </AppText>
        <View style={styles.badges}>
          <Badge
            label={t(`commande.statut.${data.statut_commande}`)}
            tone={commandeTone(data.statut_commande)}
          />
          <Badge
            label={t(`commande.paiement.${data.statut_paiement}`)}
            tone={paiementTone(data.statut_paiement)}
          />
        </View>
      </View>

      <Card style={styles.section}>
        <AppText weight="semibold">{t('commande.tracking')}</AppText>
        <OrderStatusTimeline
          statut={data.statut_commande}
          typeLivraison={data.type_livraison}
          dateCommande={data.date_commande}
          dateLivraisonEffective={data.date_livraison_effective}
        />
      </Card>

      <Card style={styles.section}>
        {(data.lignes ?? []).map(ligne => (
          <View key={ligne.id_ligne_cmd} style={styles.lineRow}>
            <AppText style={styles.flex} numberOfLines={1}>
              {ligne.quantite_commandee}× {ligne.stock?.medicament?.nom_commercial ?? '—'}
            </AppText>
            <AppText weight="medium">{formatFCFA(ligne.sous_total_fcfa)}</AppText>
          </View>
        ))}
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.lineRow}>
          <AppText weight="semibold">{t('pharmacie.total')}</AppText>
          <AppText weight="bold" color={theme.colors.primary}>
            {formatFCFA(data.montant_total_fcfa)}
          </AppText>
        </View>
      </Card>

      {peutPayer ? (
        <Button
          label={t('commande.payOrder')}
          onPress={() =>
            navigation.navigate('Payment', {
              id_commande: data.id_commande,
              montant: Number(data.montant_total_fcfa),
            })
          }
        />
      ) : null}

      {peutConfirmer ? (
        <Card style={styles.section}>
          <AppText weight="semibold">{t('commande.confirmReceipt')}</AppText>
          <AppText variant="small" color={theme.colors.textSecondary}>
            {t('commande.confirmReceiptHint')}
          </AppText>
          <Input
            label={t('commande.validationCode')}
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            placeholder="••••"
          />
          <Button
            label={t('commande.confirmReceipt')}
            loading={valider.isPending}
            onPress={onConfirmer}
          />
        </Card>
      ) : null}

      {peutEvaluer ? (
        <Card style={styles.section}>
          <AppText weight="semibold">{t('commande.rateOrder')}</AppText>
          <AppText variant="small" color={theme.colors.textSecondary}>
            {t('commande.ratePharmacy')}
          </AppText>
          <StarRating value={notePharmacie} onChange={setNotePharmacie} />
          <AppText variant="small" color={theme.colors.textSecondary}>
            {t('commande.rateDelivery')}
          </AppText>
          <StarRating value={noteLivraison} onChange={setNoteLivraison} />
          <Input
            label={t('commande.comment')}
            value={commentaire}
            onChangeText={setCommentaire}
            multiline
          />
          <Button
            label={t('commande.submitRating')}
            loading={evaluer.isPending}
            onPress={onEvaluer}
          />
        </Card>
      ) : null}

      {dejaEvaluee ? (
        <Card style={styles.section}>
          <AppText weight="semibold">{t('commande.yourRating')}</AppText>
          {data.note_pharmacie != null ? (
            <View style={styles.ratingRow}>
              <AppText color={theme.colors.textSecondary}>
                {t('commande.ratePharmacy')}
              </AppText>
              <StarRating value={data.note_pharmacie} size={20} />
            </View>
          ) : null}
          {data.note_livraison != null ? (
            <View style={styles.ratingRow}>
              <AppText color={theme.colors.textSecondary}>
                {t('commande.rateDelivery')}
              </AppText>
              <StarRating value={data.note_livraison} size={20} />
            </View>
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  header: { gap: 6, marginBottom: 16 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  section: { gap: 10, marginBottom: 16 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1 },
  divider: { height: 1, marginVertical: 4 },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
