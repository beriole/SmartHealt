import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { AppText, Button, Card, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useGenererPin } from '@/features/b2b/hooks';

export function PartageDossierScreen() {
  const theme = useTheme();
  const genererPin = useGenererPin();
  const pin = genererPin.data;

  return (
    <Screen edges={['bottom']}>
      <View style={styles.container}>
        <ShieldCheck size={48} color={theme.colors.primary} />
        <AppText variant="h3" center>
          Partager mon dossier médical
        </AppText>
        <AppText color={theme.colors.textSecondary} center>
          Générez un code temporaire à communiquer à une structure de santé partenaire pour
          autoriser l'accès à votre dossier. Le code expire au bout de 2 heures.
        </AppText>

        {pin ? (
          <Card style={styles.pinCard}>
            <AppText variant="small" color={theme.colors.textSecondary}>
              Votre code de consentement
            </AppText>
            <AppText variant="h1" color={theme.colors.primary} style={styles.pin}>
              {pin.code_pin}
            </AppText>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              Valable jusqu'à{' '}
              {new Date(pin.date_expiration).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </AppText>
          </Card>
        ) : null}

        <Button
          label={pin ? 'Générer un nouveau code' : 'Générer un code de partage'}
          loading={genererPin.isPending}
          onPress={() => genererPin.mutate()}
          style={styles.btn}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 8 },
  pinCard: { alignItems: 'center', gap: 4, alignSelf: 'stretch' },
  pin: { letterSpacing: 8 },
  btn: { alignSelf: 'stretch' },
});
