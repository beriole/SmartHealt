import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pill, Check, Plus, X } from 'lucide-react-native';
import {
  AppText,
  Button,
  Card,
  Input,
  Screen,
  SearchBar,
} from '@/components';
import { useTheme } from '@/theme';
import { useSearchMedicaments, useCreateStock } from '@/features/pharmacien/hooks';
import { Medicament } from '@/types';
import { InventaireStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<InventaireStackParamList>;

export function AjouterStockScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selected, setSelected] = useState<Medicament | null>(null);
  const [quantite, setQuantite] = useState('');
  const [prix, setPrix] = useState('');
  const [seuil, setSeuil] = useState('10');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 350);
    return () => clearTimeout(id);
  }, [term]);

  const { data: results, isFetching } = useSearchMedicaments(debounced);
  const create = useCreateStock();

  const onSubmit = () => {
    if (!selected) return;
    const q = Number(quantite);
    const p = Number(prix);
    const s = Number(seuil);
    if (Number.isNaN(q) || q < 0 || Number.isNaN(p) || p <= 0) {
      Alert.alert('Ajouter au stock', 'Renseignez une quantité et un prix valides.');
      return;
    }
    create.mutate(
      {
        id_medicament: selected.id_medicament,
        quantite_disponible: q,
        prix_vente_fcfa: p,
        seuil_alerte: Number.isNaN(s) ? undefined : s,
      },
      {
        onSuccess: () => {
          Alert.alert('Inventaire', `${selected.nom_commercial} ajouté au stock.`);
          navigation.goBack();
        },
        onError: e => Alert.alert('Ajouter au stock', e.message),
      },
    );
  };

  if (selected) {
    return (
      <Screen edges={['bottom']} padded={false}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card style={styles.selectedCard}>
            <View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
              <Pill size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText weight="semibold" numberOfLines={2}>
                {selected.nom_commercial}
              </AppText>
              <AppText variant="small" color={theme.colors.textSecondary}>
                {selected.dci} · {selected.dosage}
              </AppText>
            </View>
            <Pressable onPress={() => setSelected(null)} hitSlop={8}>
              <X size={22} color={theme.colors.outline} />
            </Pressable>
          </Card>

          <Input
            label="Quantité"
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
          <Button
            label="Ajouter au stock"
            loading={create.isPending}
            onPress={onSubmit}
            icon={<Plus size={20} color={theme.colors.primaryOn} />}
            style={styles.submit}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']} padded={false}>
      <View style={styles.search}>
        <SearchBar
          value={term}
          onChangeText={setTerm}
          placeholder="Rechercher un médicament au catalogue…"
        />
      </View>
      {isFetching && !results ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={results ?? []}
          keyExtractor={(m: Medicament) => m.id_medicament}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setSelected(item);
                setPrix(item.prix_indicatif_fcfa ? String(item.prix_indicatif_fcfa) : '');
              }}
              android_ripple={{ color: theme.colors.muted }}
            >
              <Card style={styles.resultCard}>
                <View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Pill size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText weight="semibold" numberOfLines={1}>
                    {item.nom_commercial}
                  </AppText>
                  <AppText variant="small" color={theme.colors.textSecondary} numberOfLines={1}>
                    {item.dci} · {item.dosage}
                  </AppText>
                </View>
                <Check size={18} color={theme.colors.outline} />
              </Card>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <AppText color={theme.colors.textSecondary} center>
                {debounced.trim().length >= 2
                  ? 'Aucun médicament trouvé.'
                  : 'Saisissez au moins 2 lettres pour rechercher.'}
              </AppText>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  loader: { marginTop: 32 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  resultCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  empty: { marginTop: 40, paddingHorizontal: 24 },
  scroll: { padding: 16, gap: 16 },
  selectedCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  submit: { marginTop: 8 },
  flex: { flex: 1 },
});
