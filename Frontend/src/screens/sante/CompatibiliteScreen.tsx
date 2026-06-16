import React, { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { AppText, Button, Card, SearchBar, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useStockSearch } from '@/features/pharmacie/hooks';
import { useCompatibilite } from '@/features/ia/hooks';
import { CompatibiliteResultView } from './components/CompatibiliteResultView';

export function CompatibiliteScreen() {
  const theme = useTheme();
  const [term, setTerm] = useState('');
  const search = useStockSearch(term);
  const compat = useCompatibilite();

  // Médicaments uniques issus des stocks trouvés.
  const medicaments = useMemo(() => {
    const map = new Map<string, { id: string; nom: string; dosage: string }>();
    (search.data ?? []).forEach(s => {
      if (!map.has(s.id_medicament)) {
        map.set(s.id_medicament, {
          id: s.id_medicament,
          nom: s.medicament.nom_commercial,
          dosage: s.medicament.dosage,
        });
      }
    });
    return [...map.values()];
  }, [search.data]);

  if (compat.data) {
    return (
      <Screen edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <AppText variant="h3" style={styles.title}>
            {compat.data.medicament}
          </AppText>
          <CompatibiliteResultView result={compat.data} />
          <Button
            label="Analyser un autre médicament"
            variant="secondary"
            onPress={() => {
              compat.reset();
              setTerm('');
            }}
            style={styles.reset}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AppText color={theme.colors.textSecondary} style={styles.intro}>
          Vérifiez si un médicament est compatible avec vos allergies, antécédents et traitements en cours.
        </AppText>
        <SearchBar
          value={term}
          onChangeText={setTerm}
          placeholder="Rechercher un médicament…"
        />

        {compat.isPending ? (
          <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
        ) : null}

        <View style={styles.list}>
          {medicaments.map(m => (
            <Pressable key={m.id} onPress={() => compat.mutate(m.id)} disabled={compat.isPending}>
              <Card style={styles.item}>
                <AppText weight="semibold">{m.nom}</AppText>
                <AppText variant="small" color={theme.colors.textSecondary}>
                  {m.dosage}
                </AppText>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: 16, paddingBottom: 40 },
  intro: { marginBottom: 16 },
  title: { marginBottom: 8 },
  loader: { marginTop: 24 },
  list: { gap: 10, marginTop: 16 },
  item: { gap: 2 },
  reset: { marginTop: 24 },
});
