import React from 'react';
import { ScrollView, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stethoscope, FilePlus2, Droplet, AlertTriangle } from 'lucide-react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Button, Card, Section, Screen, ErrorState } from '@/components';
import { useTheme } from '@/theme';
import { formatDate } from '@/lib/format';
import { useScanCarnet } from '@/features/medical/hooks';
import { DossierStackParamList } from '@/navigation/types';

function formatGroupe(g?: string | null): string {
  return g ? g.replace('_PLUS', '+').replace('_MOINS', '−') : '—';
}

export function DossierPatientScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<DossierStackParamList, 'DossierPatient'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<DossierStackParamList>>();
  const { data: carnet, isLoading, isError, refetch } = useScanCarnet(route.params.token);

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
        <ErrorState
          message="Carnet introuvable ou code invalide."
          onRetry={refetch}
        />
      </Screen>
    );
  }

  const u = carnet.patient?.utilisateur;

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
            <AppText variant="h3" weight="bold" color={theme.colors.primary}>
              {`${u?.prenom?.[0] ?? ''}${u?.nom?.[0] ?? ''}`.toUpperCase() || 'P'}
            </AppText>
          </View>
          <AppText variant="h3" numberOfLines={1}>
            {u ? `${u.prenom} ${u.nom}` : 'Patient'}
          </AppText>
          <View style={styles.infoRow}>
            <Droplet size={15} color={theme.colors.destructive} />
            <AppText variant="small" color={theme.colors.textSecondary}>
              Groupe sanguin : {formatGroupe(carnet.patient?.groupe_sanguin)}
            </AppText>
          </View>
          <View style={styles.infoRow}>
            <AlertTriangle size={15} color={theme.colors.warning} />
            <AppText variant="small" color={theme.colors.textSecondary} style={styles.flex}>
              Allergies : {carnet.patient?.allergies_connues || 'Aucune connue'}
            </AppText>
          </View>
        </Card>

        <Button
          label="Nouvelle consultation"
          onPress={() =>
            navigation.navigate('NouvelleConsultation', {
              id_patient: carnet.id_patient,
              id_carnet: carnet.id_carnet,
            })
          }
          icon={<FilePlus2 size={20} color={theme.colors.primaryOn} />}
          style={styles.cta}
        />

        {carnet.consultations?.length ? (
          <Section title="Historique des consultations">
            {carnet.consultations.map(c => (
              <Card key={c.id_consultation} style={styles.consult}>
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
                  {c.diagnostic ? (
                    <AppText variant="small" color={theme.colors.textSecondary}>
                      {c.diagnostic}
                    </AppText>
                  ) : null}
                </View>
              </Card>
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { paddingVertical: 16, paddingBottom: 40 },
  identity: { gap: 6 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  cta: { marginTop: 16 },
  consult: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  consultIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
