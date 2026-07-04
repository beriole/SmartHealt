import React, { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { ShieldCheck, Pill, ChevronRight } from 'lucide-react-native';
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
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
            <ShieldCheck size={28} color={theme.colors.primary} />
          </View>
          <AppText variant="h2">Compatibilité</AppText>
          <AppText color={theme.colors.textSecondary} style={styles.intro}>
            Vérifiez si un médicament est compatible avec vos allergies, antécédents et traitements en cours.
          </AppText>
        </View>
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
                <View style={[styles.itemIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Pill size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText weight="semibold">{m.nom}</AppText>
                  <AppText variant="small" color={theme.colors.textSecondary}>
                    {m.dosage}
                  </AppText>
                </View>
                <ChevronRight size={20} color={theme.colors.outline} />
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
  hero: { gap: 8, marginBottom: 16 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  intro: {},
  title: { marginBottom: 8 },
  loader: { marginTop: 24 },
  list: { gap: 10, marginTop: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  reset: { marginTop: 24 },
});
