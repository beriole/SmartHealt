import React, { useState } from 'react';
import { ScrollView, View, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppText, Button, Card, Input, Screen, EmptyState } from '@/components';
import { useTheme } from '@/theme';
import { formatFCFA } from '@/lib/format';
import { useInfirmiers, useCreateIntervention } from '@/features/intervention/hooks';
import { TypeActe } from '@/types';
import { ACTE_LABEL } from './InterventionsScreen';

const ACTES: TypeActe[] = ['injection', 'pansement', 'prise_sang', 'perfusion', 'autre'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEURE_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

function isoDate(offset = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function NouvelleInterventionScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const infirmiers = useInfirmiers();
  const create = useCreateIntervention();

  const [idInfirmier, setIdInfirmier] = useState<string>();
  const [acte, setActe] = useState<TypeActe>('injection');
  const [date, setDate] = useState(isoDate(1));
  const [heure, setHeure] = useState('09:00');
  const [adresse, setAdresse] = useState('');

  const valider = () => {
    if (!idInfirmier) {
      Alert.alert('Intervention', 'Choisissez un infirmier.');
      return;
    }
    if (!DATE_RE.test(date) || !HEURE_RE.test(heure)) {
      Alert.alert('Intervention', 'Date (AAAA-MM-JJ) ou heure (HH:MM) invalide.');
      return;
    }
    if (!adresse.trim()) {
      Alert.alert('Intervention', "Saisissez l'adresse d'intervention.");
      return;
    }
    const choisi = infirmiers.data?.find(i => i.id_professionnel === idInfirmier);
    const cout = choisi?.tarif_consultation ? Number(choisi.tarif_consultation) : 0;

    create.mutate(
      {
        id_infirmier: idInfirmier,
        type_acte: acte,
        date_planifiee: `${date}T${heure}:00`,
        adresse_intervention: adresse.trim(),
        cout_fcfa: cout,
      },
      {
        onSuccess: () => {
          Alert.alert('Intervention', 'Intervention planifiée.');
          navigation.goBack();
        },
        onError: err => Alert.alert('Intervention', err.message),
      },
    );
  };

  if (infirmiers.isLoading) {
    return (
      <Screen>
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      </Screen>
    );
  }

  if (!infirmiers.data || infirmiers.data.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="Aucun infirmier disponible"
          description="Aucun infirmier vérifié n'est disponible à domicile pour le moment."
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AppText variant="small" weight="bold">INFIRMIER</AppText>
        {infirmiers.data.map(i => {
          const selected = i.id_professionnel === idInfirmier;
          return (
            <Pressable key={i.id_professionnel} onPress={() => setIdInfirmier(i.id_professionnel)}>
              <Card
                style={[
                  styles.infCard,
                  selected ? styles.infCardOn : styles.infCardOff,
                  { borderColor: selected ? theme.colors.primary : theme.colors.border },
                ]}
              >
                <AppText weight="semibold">
                  {i.utilisateur?.prenom} {i.utilisateur?.nom}
                </AppText>
                <AppText variant="small" color={theme.colors.textSecondary}>
                  {i.specialite} · {formatFCFA(i.tarif_consultation)}
                </AppText>
              </Card>
            </Pressable>
          );
        })}

        <AppText variant="small" weight="bold" style={styles.label}>TYPE D'ACTE</AppText>
        <View style={styles.chips}>
          {ACTES.map(a => {
            const selected = a === acte;
            return (
              <Pressable
                key={a}
                onPress={() => setActe(a)}
                style={[
                  styles.chip,
                  {
                    borderRadius: theme.radius.pill,
                    backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <AppText
                  variant="small"
                  color={selected ? theme.colors.primaryOn : theme.colors.foreground}
                >
                  {ACTE_LABEL[a]}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.field}>
          <Input label="Date (AAAA-MM-JJ)" value={date} onChangeText={setDate} />
        </View>
        <View style={styles.field}>
          <Input label="Heure (HH:MM)" value={heure} onChangeText={setHeure} keyboardType="numbers-and-punctuation" />
        </View>
        <View style={styles.field}>
          <Input
            label="Adresse d'intervention"
            placeholder="Quartier, rue, point de repère…"
            value={adresse}
            onChangeText={setAdresse}
          />
        </View>

        <Button
          label="Planifier l'intervention"
          loading={create.isPending}
          onPress={valider}
          style={styles.submit}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { paddingVertical: 16, paddingBottom: 40, gap: 10 },
  infCard: { gap: 2 },
  infCardOn: { borderWidth: 2 },
  infCardOff: { borderWidth: 1 },
  label: { marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  field: { marginTop: 6 },
  submit: { marginTop: 20 },
});
