import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { X, Bot, Plus, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Input, OptionGroup, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useDiagnostic } from '@/features/ia/hooks';
import { DiagnosticResultView } from './components/DiagnosticResultView';

type Intensite = 'faible' | 'moderee' | 'forte';

const SUGGESTIONS = [
  'Fièvre',
  'Toux',
  'Douleur',
  'Fatigue',
  'Maux de tête',
  'Nausée',
];

export function TriageScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const diagnostic = useDiagnostic();

  const [symptomes, setSymptomes] = useState<string[]>([]);
  const [saisie, setSaisie] = useState('');
  const [duree, setDuree] = useState('');
  const [intensite, setIntensite] = useState<Intensite>();

  const ajouter = (v: string) => {
    const val = v.trim();
    if (val && !symptomes.includes(val)) {
      setSymptomes([...symptomes, val]);
    }
  };
  const ajouterSaisie = () => {
    ajouter(saisie);
    setSaisie('');
  };

  const retirerSymptome = (s: string) =>
    setSymptomes(symptomes.filter(x => x !== s));

  const progress =
    ((symptomes.length > 0 ? 1 : 0) + (duree ? 1 : 0) + (intensite ? 1 : 0)) / 3;

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
    <Screen edges={['bottom']} padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête session */}
        <View style={styles.head}>
          <View style={styles.headTop}>
            <AppText variant="label" color={theme.colors.outline}>
              SESSION EN COURS
            </AppText>
            <AppText variant="small" weight="semibold" color={theme.colors.primary}>
              {Math.round(progress * 100)}% complété
            </AppText>
          </View>
          <AppText variant="h3" weight="bold">
            Triage Intelligent
          </AppText>
          <View style={[styles.track, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
            <View
              style={[
                styles.fill,
                { width: `${Math.max(progress * 100, 4)}%`, backgroundColor: theme.colors.primary },
              ]}
            />
          </View>
        </View>

        {/* Bulle du bot */}
        <View style={styles.botRow}>
          <View style={[styles.botAvatar, { backgroundColor: theme.colors.primary }]}>
            <Bot size={20} color={theme.colors.primaryOn} />
          </View>
          <View
            style={[
              styles.bubble,
              { backgroundColor: theme.colors.surfaceContainerHigh },
            ]}
          >
            <AppText>
              Bonjour ! Je suis SmartBot. Décrivez vos symptômes pour que je vous
              oriente vers le bon soin. Comment vous sentez-vous aujourd'hui ?
            </AppText>
          </View>
        </View>

        {/* Suggestions rapides */}
        <View style={styles.suggestions}>
          {SUGGESTIONS.map(s => {
            const active = symptomes.includes(s);
            return (
              <Pressable
                key={s}
                onPress={() => (active ? retirerSymptome(s) : ajouter(s))}
                style={[
                  styles.suggestion,
                  theme.elevation.level1,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <AppText
                  weight="semibold"
                  color={active ? theme.colors.primaryOn : theme.colors.foreground}
                >
                  {s}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.body}>
          {/* Saisie libre */}
          <View style={styles.addRow}>
            <View style={styles.flex}>
              <Input
                label="Autre symptôme"
                placeholder="Décrivez vos symptômes…"
                value={saisie}
                onChangeText={setSaisie}
                onSubmitEditing={ajouterSaisie}
                returnKeyType="done"
              />
            </View>
            <Pressable
              onPress={ajouterSaisie}
              style={[
                styles.addBtn,
                { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md },
              ]}
            >
              <Plus size={22} color={theme.colors.primaryOn} />
            </Pressable>
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
                    { backgroundColor: theme.colors.primaryContainer, borderRadius: theme.radius.pill },
                  ]}
                >
                  <AppText variant="small" weight="semibold" color={theme.colors.primary}>
                    {s}
                  </AppText>
                  <X size={14} color={theme.colors.primary} />
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
            icon={<Sparkles size={20} color={theme.colors.primaryOn} />}
            style={styles.submit}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  head: { paddingHorizontal: 20, paddingTop: 12, gap: 6 },
  headTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  fill: { height: 6, borderRadius: 3 },

  botRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 20 },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },

  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  suggestion: { paddingHorizontal: 18, paddingVertical: 12 },

  body: { paddingHorizontal: 20, marginTop: 20 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  flex: { flex: 1 },
  addBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
