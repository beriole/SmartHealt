import React from 'react';
import { ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
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
          <AppText variant="h3">{u ? `${u.prenom} ${u.nom}` : 'Patient'}</AppText>
          <AppText variant="small" color={theme.colors.textSecondary}>
            Groupe sanguin : {formatGroupe(carnet.patient?.groupe_sanguin)}
          </AppText>
          <AppText variant="small" color={theme.colors.textSecondary}>
            Allergies : {carnet.patient?.allergies_connues || 'Aucune connue'}
          </AppText>
        </Card>

        <Button
          label="Nouvelle consultation"
          onPress={() =>
            navigation.navigate('NouvelleConsultation', {
              id_patient: carnet.id_patient,
              id_carnet: carnet.id_carnet,
            })
          }
          style={styles.cta}
        />

        {carnet.consultations?.length ? (
          <Section title="Historique des consultations">
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

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { paddingVertical: 16, paddingBottom: 40 },
  identity: { gap: 4 },
  cta: { marginTop: 16 },
  consult: { gap: 2 },
});
