import React from 'react';
import { ScrollView, View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AppText, Button, Card, Section, Screen, ErrorState } from '@/components';
import { useTheme } from '@/theme';
import { formatDate } from '@/lib/format';
import { useMonCarnet, useRegenerateQr } from '@/features/carnet/hooks';

function formatGroupe(g?: string | null): string {
  if (!g) {
    return '—';
  }
  return g.replace('_PLUS', '+').replace('_MOINS', '−');
}

function age(dateNaissance?: string | null): string {
  if (!dateNaissance) {
    return '';
  }
  const ans = Math.floor(
    (Date.now() - new Date(dateNaissance).getTime()) / (365.25 * 24 * 3600 * 1000),
  );
  return Number.isNaN(ans) ? '' : ` · ${ans} ans`;
}

export function CarnetScreen() {
  const theme = useTheme();
  const { data: carnet, isLoading, isError, refetch } = useMonCarnet();
  const regen = useRegenerateQr();

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      </Screen>
    );
  }
  if (isError || !carnet) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const u = carnet.patient?.utilisateur;
  const confirmRegen = () =>
    Alert.alert(
      'Régénérer le QR code',
      "L'ancien QR code ne sera plus valide. Continuer ?",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Régénérer', style: 'destructive', onPress: () => regen.mutate() },
      ],
    );

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.identity}>
          <AppText variant="h3">
            {u ? `${u.prenom} ${u.nom}` : 'Patient'}
          </AppText>
          <AppText variant="small" color={theme.colors.textSecondary}>
            {carnet.patient?.numero_carnet ?? ''}
            {age(u?.date_naissance)}
          </AppText>
        </Card>

        <Card style={styles.qrCard}>
          <QRCode value={carnet.qr_code_token} size={196} />
          <AppText variant="caption" color={theme.colors.textSecondary} center>
            Présentez ce code à un professionnel de santé pour partager votre carnet.
          </AppText>
          <Button
            label="Régénérer le QR code"
            variant="ghost"
            loading={regen.isPending}
            onPress={confirmRegen}
          />
        </Card>

        <Section title="Informations médicales">
          <Card style={styles.info}>
            <Row label="Groupe sanguin" value={formatGroupe(carnet.patient?.groupe_sanguin)} />
            <Row label="Allergies" value={carnet.patient?.allergies_connues || 'Aucune connue'} />
          </Card>
        </Section>

        {carnet.consultations?.length ? (
          <Section title="Dernières consultations">
            {carnet.consultations.map(c => (
              <Card key={c.id_consultation} style={styles.consult}>
                <AppText weight="semibold">{c.motif}</AppText>
                <AppText variant="small" color={theme.colors.textSecondary}>
                  {formatDate(c.date_consultation)}
                  {c.professionnel?.utilisateur
                    ? ` · Dr ${c.professionnel.utilisateur.nom}`
                    : ''}
                </AppText>
                {c.diagnostic ? (
                  <AppText variant="small" color={theme.colors.textSecondary}>
                    {c.diagnostic}
                  </AppText>
                ) : null}
              </Card>
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <AppText variant="small" color={theme.colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="small" weight="medium" style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { paddingVertical: 16, paddingBottom: 40 },
  identity: { gap: 2 },
  qrCard: { marginTop: 16, alignItems: 'center', gap: 12 },
  info: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowValue: { flex: 1, textAlign: 'right' },
  consult: { gap: 2 },
});
