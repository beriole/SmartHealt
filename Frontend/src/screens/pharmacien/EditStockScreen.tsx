import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Save, Trash2, Pill } from 'lucide-react-native';
import {
  AppText,
  Button,
  Card,
  Input,
  Screen,
  EmptyState,
} from '@/components';
import { useTheme } from '@/theme';
import { formatFCFA } from '@/lib/format';
import { useMyStocks, useUpdateStock, useDeleteStock } from '@/features/pharmacien/hooks';
import { InventaireStackParamList } from '@/navigation/types';

type Rt = RouteProp<InventaireStackParamList, 'EditStock'>;
type Nav = NativeStackNavigationProp<InventaireStackParamList>;

export function EditStockScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { data: stocks } = useMyStocks();
  const stock = stocks?.find(s => s.id_stock === params.id_stock);

  const update = useUpdateStock();
  const remove = useDeleteStock();

  const [quantite, setQuantite] = useState(String(stock?.quantite_disponible ?? ''));
  const [prix, setPrix] = useState(String(stock?.prix_vente_fcfa ?? ''));
  const [seuil, setSeuil] = useState(String(stock?.seuil_alerte ?? 10));

  if (!stock) {
    return (
      <Screen edges={['bottom']}>
        <EmptyState title="Stock introuvable" description="Cet article n'est plus disponible." />
      </Screen>
    );
  }

  const onError = (e: { message: string }) => Alert.alert('Inventaire', e.message);

  const onSave = () => {
    const q = Number(quantite);
    const p = Number(prix);
    const s = Number(seuil);
    if (Number.isNaN(q) || q < 0 || Number.isNaN(p) || p < 0) {
      Alert.alert('Inventaire', 'Veuillez saisir une quantité et un prix valides.');
      return;
    }
    update.mutate(
      {
        id: stock.id_stock,
        payload: {
          quantite_disponible: q,
          prix_vente_fcfa: p,
          seuil_alerte: Number.isNaN(s) ? undefined : s,
        },
      },
      {
        onSuccess: () => {
          Alert.alert('Inventaire', 'Stock mis à jour.');
          navigation.goBack();
        },
        onError,
      },
    );
  };

  const onDelete = () =>
    Alert.alert('Retirer du stock', `Retirer « ${stock.medicament.nom_commercial} » du catalogue ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: () =>
          remove.mutate(stock.id_stock, {
            onSuccess: () => {
              Alert.alert('Inventaire', 'Médicament retiré du stock.');
              navigation.goBack();
            },
            onError,
          }),
      },
    ]);

  return (
    <Screen edges={['bottom']} padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.head}>
          <View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
            <Pill size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.flex}>
            <AppText variant="h3" numberOfLines={2}>
              {stock.medicament.nom_commercial}
            </AppText>
            <AppText variant="small" color={theme.colors.textSecondary}>
              {stock.medicament.dci} · {stock.medicament.dosage}
            </AppText>
            <AppText variant="small" color={theme.colors.textSecondary}>
              Prix actuel : {formatFCFA(stock.prix_vente_fcfa)}
            </AppText>
          </View>
        </Card>

        <Input
          label="Quantité en stock"
          value={quantite}
          onChangeText={setQuantite}
          keyboardType="number-pad"
          placeholder="0"
        />
        <Input
          label="Prix de vente (FCFA)"
          value={prix}
          onChangeText={setPrix}
          keyboardType="number-pad"
          placeholder="0"
        />
        <Input
          label="Seuil d'alerte"
          value={seuil}
          onChangeText={setSeuil}
          keyboardType="number-pad"
          placeholder="10"
        />

        <View style={styles.actions}>
          <Button
            label="Enregistrer"
            loading={update.isPending}
            onPress={onSave}
            icon={<Save size={20} color={theme.colors.primaryOn} />}
          />
          <Button
            label="Retirer du stock"
            variant="secondary"
            loading={remove.isPending}
            onPress={onDelete}
            icon={<Trash2 size={20} color={theme.colors.destructive} />}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  actions: { gap: 12, marginTop: 8 },
  flex: { flex: 1 },
});
