import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Syringe,
  HeartPulse,
  Droplet,
  Droplets,
  Stethoscope,
  CalendarDays,
  MapPin,
  BadgeCheck,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { AppText, Button, Card, Input, Screen, EmptyState } from '@/components';
import { useTheme } from '@/theme';
import { formatFCFA } from '@/lib/format';
import { useInfirmiers, useCreateIntervention } from '@/features/intervention/hooks';
import { TypeActe } from '@/types';
import { ACTE_LABEL } from './InterventionsScreen';

const ACTES: { key: TypeActe; Icon: typeof Syringe }[] = [
  { key: 'injection', Icon: Syringe },
  { key: 'pansement', Icon: HeartPulse },
  { key: 'prise_sang', Icon: Droplet },
  { key: 'perfusion', Icon: Droplets },
  { key: 'autre', Icon: Stethoscope },
];

const TIME_SLOTS = ['08:00', '09:00', '11:30', '14:00', '16:00'];

function nextDays(count: number) {
  const fmt = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      iso: d.toISOString().slice(0, 10),
      day: d.getDate(),
      month: fmt.format(d).replace('.', '').toUpperCase(),
    };
  });
}

export function NouvelleInterventionScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const infirmiers = useInfirmiers();
  const create = useCreateIntervention();

  const days = nextDays(5);
  const [idInfirmier, setIdInfirmier] = useState<string>();
  const [acte, setActe] = useState<TypeActe>('injection');
  const [date, setDate] = useState(days[0].iso);
  const [heure, setHeure] = useState('09:00');
  const [adresse, setAdresse] = useState('');

  const valider = () => {
    if (!idInfirmier) {
      Alert.alert('Intervention', 'Choisissez un infirmier.');
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
    <Screen edges={['bottom']} padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <AppText variant="h2">Soins à domicile</AppText>
          <AppText color={theme.colors.textSecondary}>
            Soins infirmiers professionnels livrés chez vous.
          </AppText>
        </View>

        {/* Type de soin */}
        <AppText variant="h3" weight="semibold" style={styles.section}>
          Type de soin
        </AppText>
        <View style={styles.serviceGrid}>
          {ACTES.map(({ key, Icon }) => {
            const selected = key === acte;
            return (
              <Pressable
                key={key}
                onPress={() => setActe(key)}
                style={[
                  styles.serviceCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    borderWidth: selected ? 2 : 1,
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                <Icon size={26} color={theme.colors.primary} />
                <AppText weight="semibold" style={styles.serviceLabel}>
                  {ACTE_LABEL[key]}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Planification */}
        <View style={styles.sectionRow}>
          <CalendarDays size={20} color={theme.colors.primary} />
          <AppText variant="h3" weight="semibold">
            Planification
          </AppText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {days.map(d => {
            const selected = d.iso === date;
            return (
              <Pressable
                key={d.iso}
                onPress={() => setDate(d.iso)}
                style={[
                  styles.datePill,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.surfaceContainerHigh,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <AppText
                  variant="label"
                  color={selected ? theme.colors.primaryOn : theme.colors.textSecondary}
                >
                  {d.month}
                </AppText>
                <AppText
                  variant="h3"
                  weight="bold"
                  color={selected ? theme.colors.primaryOn : theme.colors.foreground}
                >
                  {d.day}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {TIME_SLOTS.map(slot => {
            const selected = slot === heure;
            return (
              <Pressable
                key={slot}
                onPress={() => setHeure(slot)}
                style={[
                  styles.timePill,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.surfaceContainerHigh,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText
                  weight="semibold"
                  color={selected ? theme.colors.primaryOn : theme.colors.textSecondary}
                >
                  {slot}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Adresse */}
        <View style={styles.block}>
          <Input
            label="Adresse d'intervention"
            leftIcon={<MapPin size={20} color={theme.colors.outline} />}
            placeholder="Quartier, rue, point de repère…"
            value={adresse}
            onChangeText={setAdresse}
          />
        </View>

        {/* Infirmiers */}
        <View style={styles.sectionRow}>
          <AppText variant="h3" weight="semibold" style={styles.flex}>
            Infirmiers disponibles
          </AppText>
          <AppText variant="small" color={theme.colors.textSecondary}>
            {infirmiers.data.length} proche{infirmiers.data.length > 1 ? 's' : ''}
          </AppText>
        </View>
        <View style={styles.nurseList}>
          {infirmiers.data.map(i => {
            const selected = i.id_professionnel === idInfirmier;
            return (
              <Pressable
                key={i.id_professionnel}
                onPress={() => setIdInfirmier(i.id_professionnel)}
              >
                <Card
                  style={styles.nurseCard}
                  padding="sm"
                >
                  <View
                    style={[
                      styles.nurseAvatar,
                      {
                        backgroundColor: selected
                          ? theme.colors.primary
                          : theme.colors.primaryContainer,
                      },
                    ]}
                  >
                    <AppText
                      weight="bold"
                      color={selected ? theme.colors.primaryOn : theme.colors.primary}
                    >
                      {(i.utilisateur?.prenom?.[0] ?? '') + (i.utilisateur?.nom?.[0] ?? '')}
                    </AppText>
                  </View>
                  <View style={styles.flex}>
                    <AppText weight="bold" numberOfLines={1}>
                      {i.utilisateur?.prenom} {i.utilisateur?.nom}
                    </AppText>
                    <AppText variant="small" color={theme.colors.textSecondary} numberOfLines={1}>
                      {i.specialite} · {formatFCFA(i.tarif_consultation)}
                    </AppText>
                    <View style={styles.verified}>
                      <BadgeCheck size={14} color={theme.colors.success} />
                      <AppText variant="label" color={theme.colors.success}>
                        Vérifié Pro
                      </AppText>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      { borderColor: selected ? theme.colors.primary : theme.colors.outline },
                    ]}
                  >
                    {selected ? (
                      <View
                        style={[styles.radioDot, { backgroundColor: theme.colors.primary }]}
                      />
                    ) : null}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>

        <Button
          label="Confirmer la demande"
          loading={create.isPending}
          onPress={valider}
          style={styles.submit}
        />
        <AppText variant="caption" center color={theme.colors.outline} style={styles.eta}>
          Heure d'arrivée estimée : 15–20 min
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { padding: 20, paddingBottom: 40 },
  flex: { flex: 1 },
  header: { gap: 4, marginBottom: 8 },
  section: { marginTop: 20, marginBottom: 12 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  serviceCard: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  serviceLabel: {},
  pillRow: { gap: 10, paddingBottom: 4 },
  datePill: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 2,
  },
  timePill: { paddingHorizontal: 18, paddingVertical: 10, marginTop: 12 },
  block: { marginTop: 24 },
  nurseList: { gap: 12 },
  nurseCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nurseAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  submit: { marginTop: 28 },
  eta: { marginTop: 12 },
});
