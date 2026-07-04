import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { Leaf } from 'lucide-react-native';
import { AppText, Button, Input, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useMedecineTraditionnelle } from '@/features/ia/hooks';
import { RemedesResultView } from './components/RemedesResultView';

export function MedecineTraditionnelleScreen() {
  const theme = useTheme();
  const remedes = useMedecineTraditionnelle();
  const [maladie, setMaladie] = useState('');

  const analyser = () => {
    const v = maladie.trim();
    if (!v) {
      Alert.alert('Médecine traditionnelle', 'Indiquez une maladie ou un symptôme.');
      return;
    }
    remedes.mutate({ maladie: v });
  };

  if (remedes.data) {
    return (
      <Screen edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <RemedesResultView result={remedes.data} />
          <Button
            label="Nouvelle recherche"
            variant="secondary"
            onPress={() => {
              remedes.reset();
              setMaladie('');
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
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Leaf size={28} color={theme.colors.secondary} />
          </View>
          <AppText variant="h2">Médecine traditionnelle</AppText>
          <AppText color={theme.colors.textSecondary} style={styles.intro}>
            Obtenez des remèdes naturels à base de plantes médicinales locales, adaptés à votre dossier.
          </AppText>
        </View>
        <Input
          label="Maladie ou symptôme"
          placeholder="ex. rhume, fatigue, maux de ventre…"
          value={maladie}
          onChangeText={setMaladie}
          onSubmitEditing={analyser}
        />
        <Button
          label="Proposer des remèdes"
          loading={remedes.isPending}
          onPress={analyser}
          style={styles.submit}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: 16, paddingBottom: 40 },
  hero: { gap: 8, marginBottom: 20 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  intro: {},
  submit: { marginTop: 24 },
  reset: { marginTop: 24 },
});
