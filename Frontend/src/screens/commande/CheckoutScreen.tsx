import React, { useState } from 'react';
import { View, StyleSheet, Alert, Pressable } from 'react-native';
import { Home, Store, FileText, ChevronRight, AlertTriangle, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  OptionGroup,
  Screen,
} from '@/components';
import { useTheme } from '@/theme';
import {
  useCartStore,
  selectCartTotal,
  selectCartNeedsPrescription,
} from '@/store/cartStore';
import { useCreateCommande } from '@/features/commande/hooks';
import { useMonCarnet } from '@/features/carnet/hooks';
import { useOrdonnances } from '@/features/ordonnance/hooks';
import { TypeLivraison, Ordonnance } from '@/types';
import { formatFCFA, formatDate } from '@/lib/format';
import { PharmacieStackParamList } from '@/navigation/types';

const FRAIS_LIVRAISON = 1500;
type Nav = NativeStackNavigationProp<PharmacieStackParamList, 'Checkout'>;

export function CheckoutScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const items = useCartStore(s => s.items);
  const idPharmacie = useCartStore(s => s.id_pharmacie);
  const nomPharmacie = useCartStore(s => s.nom_pharmacie);
  const clear = useCartStore(s => s.clear);
  const sousTotal = useCartStore(selectCartTotal);
  const needsPrescription = useCartStore(selectCartNeedsPrescription);

  const [typeLivraison, setTypeLivraison] =
    useState<TypeLivraison>('retrait_en_pharmacie');
  const [adresse, setAdresse] = useState('');
  const [idOrdonnance, setIdOrdonnance] = useState<string>();
  const create = useCreateCommande();

  // Ordonnances numériques actives du patient (pour les médicaments sur ordonnance)
  const carnet = useMonCarnet();
  const ordonnances = useOrdonnances(needsPrescription ? carnet.data?.id_patient : undefined);
  const ordonnancesActives = (ordonnances.data?.data ?? []).filter(
    (o: Ordonnance) => o.statut === 'active' || o.statut === 'partiellement_servie',
  );

  if (items.length === 0 || !idPharmacie) {
    return (
      <Screen>
        <EmptyState title={t('pharmacie.cartEmptyTitle')} />
      </Screen>
    );
  }

  const frais = typeLivraison === 'livraison_domicile' ? FRAIS_LIVRAISON : 0;
  const total = sousTotal + frais;

  const onConfirm = () => {
    if (typeLivraison === 'livraison_domicile' && !adresse.trim()) {
      Alert.alert(t('commande.checkoutTitle'), t('commande.addressRequired'));
      return;
    }
    if (needsPrescription && !idOrdonnance) {
      Alert.alert(
        t('commande.checkoutTitle'),
        'Ce panier contient des médicaments sur ordonnance. Veuillez joindre une de vos ordonnances.',
      );
      return;
    }
    create.mutate(
      {
        id_pharmacie: idPharmacie,
        type_livraison: typeLivraison,
        lignes: items.map(l => ({
          id_stock: l.id_stock,
          quantite_commandee: l.quantite,
        })),
        adresse_livraison:
          typeLivraison === 'livraison_domicile' ? adresse.trim() : undefined,
        id_ordonnance: needsPrescription ? idOrdonnance : undefined,
      },
      {
        onSuccess: commande => {
          clear();
          navigation.replace('Payment', {
            id_commande: commande.id_commande,
            montant: Number(commande.montant_total_fcfa),
          });
        },
        onError: err => Alert.alert(t('commande.checkoutTitle'), err.message),
      },
    );
  };

  return (
    <Screen scroll>
      {nomPharmacie ? (
        <AppText color={theme.colors.textSecondary} style={styles.pharma}>
          {t('pharmacie.orderFrom', { name: nomPharmacie })}
        </AppText>
      ) : null}

      <OptionGroup<TypeLivraison>
        label={t('commande.deliveryMode')}
        variant="card"
        value={typeLivraison}
        onChange={setTypeLivraison}
        options={[
          {
            value: 'livraison_domicile',
            label: t('commande.homeDelivery'),
            description: `+${formatFCFA(FRAIS_LIVRAISON)}`,
            icon: <Home size={24} color={theme.colors.primary} />,
          },
          {
            value: 'retrait_en_pharmacie',
            label: t('commande.pickup'),
            description: t('commande.free'),
            icon: <Store size={24} color={theme.colors.primary} />,
          },
        ]}
      />

      {typeLivraison === 'livraison_domicile' ? (
        <Input
          label={t('commande.address')}
          required
          value={adresse}
          onChangeText={setAdresse}
          placeholder={t('commande.addressPlaceholder')}
          multiline
        />
      ) : null}

      {needsPrescription ? (
        <View style={styles.rxSection}>
          <View style={styles.rxHead}>
            <FileText size={18} color={theme.colors.primary} />
            <AppText weight="bold" style={styles.flex}>
              Ordonnance requise
            </AppText>
            <Badge label="Sur ordonnance" tone="warning" />
          </View>
          <AppText variant="small" color={theme.colors.textSecondary} style={styles.rxHint}>
            Ce panier contient des médicaments sur ordonnance. Sélectionnez l'ordonnance
            numérique correspondante.
          </AppText>

          {ordonnances.isLoading ? (
            <AppText variant="small" color={theme.colors.textSecondary}>
              Chargement de vos ordonnances…
            </AppText>
          ) : ordonnancesActives.length === 0 ? (
            <View
              style={[
                styles.rxEmpty,
                { backgroundColor: theme.colors.warning + '1A', borderRadius: theme.radius.md },
              ]}
            >
              <AlertTriangle size={18} color={theme.colors.warning} />
              <AppText variant="small" color={theme.colors.warning} style={styles.flex}>
                Aucune ordonnance active. Demandez à votre médecin une ordonnance
                numérique pour ces médicaments.
              </AppText>
            </View>
          ) : (
            ordonnancesActives.map((o: Ordonnance) => {
              const selected = idOrdonnance === o.id_ordonnance;
              return (
                <Pressable
                  key={o.id_ordonnance}
                  onPress={() => setIdOrdonnance(o.id_ordonnance)}
                  style={[
                    styles.rxItem,
                    theme.elevation.level1,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                      borderWidth: selected ? 2 : 1,
                      borderRadius: theme.radius.md,
                    },
                  ]}
                >
                  <View
                    style={[styles.rxIcon, { backgroundColor: theme.colors.surfaceVariant }]}
                  >
                    <FileText size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.flex}>
                    <AppText weight="semibold">
                      Ordonnance du {formatDate(o.date_emission)}
                    </AppText>
                    <AppText variant="small" color={theme.colors.textSecondary}>
                      {o.lignes?.length ?? 0} médicament(s)
                    </AppText>
                  </View>
                  {selected ? (
                    <Check size={20} color={theme.colors.primary} />
                  ) : (
                    <ChevronRight size={20} color={theme.colors.outline} />
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}

      <Card style={styles.recap}>
        <Row label={t('commande.subtotal')} value={formatFCFA(sousTotal)} />
        <Row
          label={t('commande.deliveryFee')}
          value={frais ? formatFCFA(frais) : t('commande.free')}
        />
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Row label={t('pharmacie.total')} value={formatFCFA(total)} strong />
      </Card>

      <Button
        label={t('commande.confirmOrder')}
        loading={create.isPending}
        onPress={onConfirm}
      />
    </Screen>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <AppText color={strong ? theme.colors.foreground : theme.colors.textSecondary}>
        {label}
      </AppText>
      <AppText
        weight={strong ? 'bold' : 'medium'}
        color={strong ? theme.colors.primary : theme.colors.foreground}
      >
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pharma: { marginBottom: 16 },
  recap: { gap: 10, marginVertical: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  divider: { height: 1, marginVertical: 4 },
  flex: { flex: 1 },
  rxSection: { marginTop: 20, gap: 10 },
  rxHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rxHint: {},
  rxEmpty: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  rxItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  rxIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
