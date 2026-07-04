import React, { useState } from 'react';
import { ScrollView, View, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { AppText, Button, Card, Input, SearchBar, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useSearchMedicaments, useCreateOrdonnance } from '@/features/medical/hooks';
import { DossierStackParamList } from '@/navigation/types';

interface LigneForm {
  id_medicament: string;
  nom: string;
  posologie: string;
  quantite: string;
  duree: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function NouvelleOrdonnanceScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<DossierStackParamList, 'NouvelleOrdonnance'>>();
  const navigation = useNavigation();
  const { id_consultation, id_patient } = route.params;

  const [term, setTerm] = useState('');
  const search = useSearchMedicaments(term);
  const create = useCreateOrdonnance();
  const [lignes, setLignes] = useState<LigneForm[]>([]);
  const [expiration, setExpiration] = useState(isoDate(30));

  const ajouter = (id_medicament: string, nom: string) => {
    if (lignes.some(l => l.id_medicament === id_medicament)) {
      return;
    }
    setLignes([...lignes, { id_medicament, nom, posologie: '', quantite: '1', duree: '7' }]);
    setTerm('');
  };

  const setChamp = (index: number, champ: keyof LigneForm, valeur: string) => {
    setLignes(lignes.map((l, i) => (i === index ? { ...l, [champ]: valeur } : l)));
  };

  const emettre = () => {
    if (lignes.length === 0) {
      Alert.alert('Ordonnance', 'Ajoutez au moins un médicament.');
      return;
    }
    if (lignes.some(l => !l.posologie.trim() || Number(l.quantite) < 1 || Number(l.duree) < 1)) {
      Alert.alert('Ordonnance', 'Renseignez la posologie, la quantité et la durée de chaque ligne.');
      return;
    }
    if (!DATE_RE.test(expiration)) {
      Alert.alert('Ordonnance', "Date d'expiration invalide (AAAA-MM-JJ).");
      return;
    }
    create.mutate(
      {
        id_consultation,
        id_patient,
        date_expiration: expiration,
        lignes: lignes.map(l => ({
          id_medicament: l.id_medicament,
          quantite: Number(l.quantite),
          duree_traitement_jours: Number(l.duree),
          posologie: l.posologie.trim(),
        })),
      },
      {
        onSuccess: () => {
          Alert.alert('Ordonnance', 'Ordonnance émise avec succès.');
          navigation.goBack();
        },
        onError: err => Alert.alert('Ordonnance', err.message),
      },
    );
  };

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SearchBar value={term} onChangeText={setTerm} placeholder="Rechercher un médicament…" />

        {search.isFetching ? (
          <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
        ) : null}

        {term.length >= 2 && search.data ? (
          <View style={styles.results}>
            {search.data.map(m => (
              <Pressable key={m.id_medicament} onPress={() => ajouter(m.id_medicament, m.nom_commercial)}>
                <Card style={styles.resultItem}>
                  <AppText weight="medium">{m.nom_commercial}</AppText>
                  <AppText variant="small" color={theme.colors.textSecondary}>
                    {m.dosage}
                  </AppText>
                </Card>
              </Pressable>
            ))}
          </View>
        ) : null}

        {lignes.length > 0 ? (
          <AppText variant="label" color={theme.colors.textSecondary} style={styles.sectionTitle}>
            MÉDICAMENTS PRESCRITS
          </AppText>
        ) : null}

        {lignes.map((l, i) => (
          <Card key={l.id_medicament} style={styles.ligne}>
            <View style={styles.between}>
              <AppText weight="semibold" style={styles.flex}>
                {l.nom}
              </AppText>
              <Pressable
                onPress={() => setLignes(lignes.filter((_, idx) => idx !== i))}
                accessibilityLabel={`Retirer ${l.nom}`}
              >
                <X size={18} color={theme.colors.textSecondary} />
              </Pressable>
            </View>
            <Input
              label="Posologie"
              placeholder="ex. 1 comprimé matin et soir"
              value={l.posologie}
              onChangeText={v => setChamp(i, 'posologie', v)}
            />
            <View style={styles.duo}>
              <View style={styles.flex}>
                <Input
                  label="Quantité"
                  value={l.quantite}
                  onChangeText={v => setChamp(i, 'quantite', v)}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.flex}>
                <Input
                  label="Durée (jours)"
                  value={l.duree}
                  onChangeText={v => setChamp(i, 'duree', v)}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </Card>
        ))}

        <View style={styles.field}>
          <Input
            label="Date d'expiration (AAAA-MM-JJ)"
            value={expiration}
            onChangeText={setExpiration}
          />
        </View>

        <Button
          label="Émettre l'ordonnance"
          loading={create.isPending}
          onPress={emettre}
          style={styles.submit}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: 16, paddingBottom: 40, gap: 10 },
  loader: { marginTop: 12 },
  results: { gap: 8 },
  resultItem: { gap: 2 },
  sectionTitle: { marginTop: 8 },
  ligne: { gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  duo: { flexDirection: 'row', gap: 12 },
  field: { marginTop: 6 },
  submit: { marginTop: 16 },
});
