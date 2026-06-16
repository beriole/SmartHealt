import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  Input,
  OptionGroup,
  Screen,
} from '@/components';
import { useTheme } from '@/theme';
import { useCartStore, selectCartTotal } from '@/store/cartStore';
import { useCreateCommande } from '@/features/commande/hooks';
import { TypeLivraison } from '@/types';
import { formatFCFA } from '@/lib/format';
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

  const [typeLivraison, setTypeLivraison] =
    useState<TypeLivraison>('retrait_en_pharmacie');
  const [adresse, setAdresse] = useState('');
  const create = useCreateCommande();

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
        value={typeLivraison}
        onChange={setTypeLivraison}
        options={[
          { value: 'retrait_en_pharmacie', label: t('commande.pickup') },
          { value: 'livraison_domicile', label: t('commande.homeDelivery') },
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
});
