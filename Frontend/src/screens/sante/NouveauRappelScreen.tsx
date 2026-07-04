import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, Alert } from 'react-native';
import { X, Plus, Pill } from 'lucide-react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Button, Input, Card, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useCreateRappel } from '@/features/rappel/hooks';
import { SanteStackParamList } from '@/navigation/types';

function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const HEURE_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function NouveauRappelScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<SanteStackParamList, 'NouveauRappel'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<SanteStackParamList>>();
  const create = useCreateRappel();

  const { id_ordonnance, id_medicament, nom_medicament } = route.params;
  const [heures, setHeures] = useState<string[]>(['08:00']);
  const [saisieHeure, setSaisieHeure] = useState('');
  const [dateDebut, setDateDebut] = useState(isoDate(0));
  const [dateFin, setDateFin] = useState(isoDate(7));

  const ajouterHeure = () => {
    const v = saisieHeure.trim();
    if (!HEURE_RE.test(v)) {
      Alert.alert('Heure invalide', 'Utilisez le format HH:MM (ex. 08:00).');
      return;
    }
    if (!heures.includes(v)) {
      setHeures([...heures, v].sort());
    }
    setSaisieHeure('');
  };

  const valider = () => {
    if (heures.length === 0) {
      Alert.alert('Rappel', 'Ajoutez au moins une heure de prise.');
      return;
    }
    if (!DATE_RE.test(dateDebut) || !DATE_RE.test(dateFin)) {
      Alert.alert('Rappel', 'Dates invalides (format AAAA-MM-JJ).');
      return;
    }
    if (dateDebut >= dateFin) {
      Alert.alert('Rappel', 'La date de fin doit être après la date de début.');
      return;
    }
    create.mutate(
      {
        id_ordonnance,
        id_medicament,
        frequence: { type: 'quotidienne', fois_par_jour: heures.length },
        heure_prise: heures,
        date_debut: dateDebut,
        date_fin: dateFin,
        canal_notification: 'push',
      },
      {
        onSuccess: () => {
          Alert.alert('Rappel', 'Rappel programmé avec succès.');
          navigation.navigate('Rappels');
        },
        onError: err => Alert.alert('Rappel', err.message),
      },
    );
  };

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {nom_medicament ? (
          <Card accent style={styles.med}>
            <View style={[styles.medIcon, { backgroundColor: theme.colors.primaryContainer }]}>
              <Pill size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="label" color={theme.colors.primary}>
                MÉDICAMENT
              </AppText>
              <AppText weight="bold">{nom_medicament}</AppText>
            </View>
          </Card>
        ) : null}

        <View style={styles.addRow}>
          <View style={styles.flex}>
            <Input
              label="Heure de prise"
              placeholder="HH:MM"
              value={saisieHeure}
              onChangeText={setSaisieHeure}
              onSubmitEditing={ajouterHeure}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <Pressable
            onPress={ajouterHeure}
            style={[
              styles.addBtn,
              { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md },
            ]}
          >
            <Plus size={22} color={theme.colors.primaryOn} />
          </Pressable>
        </View>

        <View style={styles.chips}>
          {heures.map(h => (
            <Pressable
              key={h}
              onPress={() => setHeures(heures.filter(x => x !== h))}
              accessibilityLabel={`Retirer ${h}`}
              style={[styles.chip, { backgroundColor: theme.colors.muted, borderRadius: theme.radius.pill }]}
            >
              <AppText variant="small">{h}</AppText>
              <X size={14} color={theme.colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        <View style={styles.field}>
          <Input label="Date de début" placeholder="AAAA-MM-JJ" value={dateDebut} onChangeText={setDateDebut} />
        </View>
        <View style={styles.field}>
          <Input label="Date de fin" placeholder="AAAA-MM-JJ" value={dateFin} onChangeText={setDateFin} />
        </View>

        <Button
          label="Programmer le rappel"
          loading={create.isPending}
          onPress={valider}
          style={styles.submit}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: 16, paddingBottom: 40 },
  med: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  medIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  flex: { flex: 1 },
  addBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  field: { marginTop: 16 },
  submit: { marginTop: 24 },
});
