import React from 'react';
import { ScrollView, View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {
  AlertTriangle,
  Stethoscope,
  ChevronRight,
  Lock,
  RefreshCw,
} from 'lucide-react-native';
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

function initials(prenom?: string, nom?: string): string {
  return `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() || '?';
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
  const allergies = carnet.patient?.allergies_connues?.trim();
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
    <Screen edges={['bottom']} padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Identité */}
        <Card style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
            <AppText variant="h3" weight="bold" color={theme.colors.primary}>
              {initials(u?.prenom, u?.nom)}
            </AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="h3" numberOfLines={1}>
              {u ? `${u.prenom} ${u.nom}` : 'Patient'}
            </AppText>
            <AppText variant="small" color={theme.colors.textSecondary}>
              {carnet.patient?.numero_carnet ?? ''}
              {age(u?.date_naissance)}
            </AppText>
          </View>
        </Card>

        {/* QR Santé */}
        <View style={[styles.qrCard, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.qrText}>
            <AppText variant="h3" weight="bold" color={theme.colors.primaryOn}>
              Mon QR Santé
            </AppText>
            <AppText color={theme.colors.primaryOn} style={styles.qrSub}>
              Partage instantané de votre dossier avec un professionnel de santé.
            </AppText>
          </View>
          <View style={styles.qrBox}>
            <QRCode value={carnet.qr_code_token} size={120} />
          </View>
        </View>
        <Button
          label="Régénérer le QR code"
          variant="secondary"
          loading={regen.isPending}
          onPress={confirmRegen}
          icon={<RefreshCw size={18} color={theme.colors.primary} />}
          style={styles.regenBtn}
        />

        {/* Allergies */}
        <View
          style={[
            styles.accentCard,
            theme.elevation.level1,
            {
              backgroundColor: theme.colors.surface,
              borderLeftColor: theme.colors.destructive,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <View style={styles.accentHeader}>
            <AlertTriangle size={20} color={theme.colors.destructive} />
            <AppText variant="h3" weight="semibold" style={styles.flex}>
              Allergies
            </AppText>
          </View>
          <AppText color={allergies ? theme.colors.foreground : theme.colors.textSecondary}>
            {allergies || 'Aucune allergie connue.'}
          </AppText>
        </View>

        {/* Informations médicales */}
        <Section title="Informations médicales">
          <Card style={styles.info}>
            <Row label="Groupe sanguin" value={formatGroupe(carnet.patient?.groupe_sanguin)} />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <Row label="Sexe" value={u?.sexe || '—'} />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <Row
              label="Numéro de carnet"
              value={carnet.patient?.numero_carnet || '—'}
            />
          </Card>
        </Section>

        {/* Consultations */}
        {carnet.consultations?.length ? (
          <Section title="Dernières consultations">
            {carnet.consultations.map(c => (
              <Card key={c.id_consultation} style={styles.consult} padding="sm">
                <View style={[styles.consultIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Stethoscope size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText weight="semibold">{c.motif}</AppText>
                  <AppText variant="small" color={theme.colors.textSecondary}>
                    {formatDate(c.date_consultation)}
                    {c.professionnel?.utilisateur
                      ? ` · Dr ${c.professionnel.utilisateur.nom}`
                      : ''}
                  </AppText>
                </View>
                <ChevronRight size={20} color={theme.colors.outline} />
              </Card>
            ))}
          </Section>
        ) : null}

        {/* Pied chiffré */}
        <View style={styles.encrypted}>
          <Lock size={14} color={theme.colors.outline} />
          <AppText variant="label" color={theme.colors.outline}>
            DOSSIER CHIFFRÉ DE BOUT EN BOUT
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <AppText color={theme.colors.textSecondary}>{label}</AppText>
      <AppText weight="semibold" style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { padding: 16, paddingBottom: 40 },
  flex: { flex: 1 },

  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  qrCard: {
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  qrText: { flex: 1 },
  qrSub: { opacity: 0.9, marginTop: 4 },
  qrBox: { backgroundColor: '#FFFFFF', padding: 8, borderRadius: 12 },
  regenBtn: { marginTop: 12 },

  accentCard: { marginTop: 16, padding: 16, borderLeftWidth: 4, gap: 8 },
  accentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  info: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowValue: { flex: 1, textAlign: 'right' },
  divider: { height: 1 },

  consult: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  consultIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  encrypted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
  },
});
