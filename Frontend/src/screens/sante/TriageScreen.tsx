import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Input, OptionGroup, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useDiagnostic } from '@/features/ia/hooks';
import { DiagnosticResultView } from './components/DiagnosticResultView';

type Intensite = 'faible' | 'moderee' | 'forte';

export function TriageScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const diagnostic = useDiagnostic();

  const [symptomes, setSymptomes] = useState<string[]>([]);
  const [saisie, setSaisie] = useState('');
  const [duree, setDuree] = useState('');
  const [intensite, setIntensite] = useState<Intensite>();

  const ajouterSymptome = () => {
    const v = saisie.trim();
    if (v && !symptomes.includes(v)) {
      setSymptomes([...symptomes, v]);
    }
    setSaisie('');
  };

  const retirerSymptome = (s: string) =>
    setSymptomes(symptomes.filter(x => x !== s));

  const analyser = () => {
    if (symptomes.length === 0) {
      Alert.alert(t('sante.triage'), 'Ajoutez au moins un symptôme.');
      return;
    }
    diagnostic.mutate({
      symptomes,
      duree: duree.trim() || undefined,
      intensite,
      langue: i18n.language,
    });
  };

  const reset = () => {
    diagnostic.reset();
    setSymptomes([]);
    setDuree('');
    setIntensite(undefined);
  };

  if (diagnostic.data) {
    return (
      <Screen edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <DiagnosticResultView result={diagnostic.data} />
          <Button
            label="Nouvelle analyse"
            variant="secondary"
            onPress={reset}
            style={styles.resetBtn}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AppText color={theme.colors.textSecondary} style={styles.intro}>
          Décrivez vos symptômes. L'analyse est une aide à l'orientation, pas un diagnostic médical.
        </AppText>

        <View style={styles.addRow}>
          <View style={styles.flex}>
            <Input
              label="Symptôme"
              placeholder="ex. fièvre, maux de tête…"
              value={saisie}
              onChangeText={setSaisie}
              onSubmitEditing={ajouterSymptome}
              returnKeyType="done"
            />
          </View>
          <Button label="+" onPress={ajouterSymptome} fullWidth={false} style={styles.addBtn} />
        </View>

        {symptomes.length > 0 ? (
          <View style={styles.chips}>
            {symptomes.map(s => (
              <Pressable
                key={s}
                onPress={() => retirerSymptome(s)}
                accessibilityLabel={`Retirer ${s}`}
                style={[
                  styles.chip,
                  { backgroundColor: theme.colors.muted, borderRadius: theme.radius.pill },
                ]}
              >
                <AppText variant="small">{s}</AppText>
                <X size={14} color={theme.colors.textSecondary} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.field}>
          <Input
            label="Depuis combien de temps ?"
            placeholder="ex. 3 jours"
            value={duree}
            onChangeText={setDuree}
          />
        </View>

        <View style={styles.field}>
          <OptionGroup<Intensite>
            label="Intensité"
            value={intensite}
            onChange={setIntensite}
            options={[
              { value: 'faible', label: 'Faible' },
              { value: 'moderee', label: 'Modérée' },
              { value: 'forte', label: 'Forte' },
            ]}
          />
        </View>

        <Button
          label="Analyser mes symptômes"
          loading={diagnostic.isPending}
          onPress={analyser}
          style={styles.submit}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: 16, paddingBottom: 40 },
  intro: { marginBottom: 16 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  flex: { flex: 1 },
  addBtn: { minWidth: 56, paddingHorizontal: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  field: { marginTop: 16 },
  submit: { marginTop: 24 },
  resetBtn: { marginTop: 24 },
});
