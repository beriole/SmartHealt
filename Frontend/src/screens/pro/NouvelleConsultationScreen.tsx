import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input, OptionGroup, Screen } from '@/components';
import { useCreateConsultation } from '@/features/medical/hooks';
import { TypeConsultation } from '@/types';
import { DossierStackParamList } from '@/navigation/types';

export function NouvelleConsultationScreen() {
  const route = useRoute<RouteProp<DossierStackParamList, 'NouvelleConsultation'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<DossierStackParamList>>();
  const { id_patient, id_carnet } = route.params;
  const create = useCreateConsultation();

  const [motif, setMotif] = useState('');
  const [type, setType] = useState<TypeConsultation>('presentiel');
  const [diagnostic, setDiagnostic] = useState('');
  const [observations, setObservations] = useState('');

  const valider = () => {
    if (!motif.trim()) {
      Alert.alert('Consultation', 'Le motif est requis.');
      return;
    }
    create.mutate(
      {
        id_patient,
        id_carnet,
        date_consultation: new Date().toISOString(),
        motif: motif.trim(),
        type_consultation: type,
        diagnostic: diagnostic.trim() || undefined,
        observations: observations.trim() || undefined,
      },
      {
        onSuccess: consultation => {
          Alert.alert(
            'Consultation enregistrée',
            'Souhaitez-vous émettre une ordonnance ?',
            [
              { text: 'Plus tard', style: 'cancel', onPress: () => navigation.goBack() },
              {
                text: 'Émettre',
                onPress: () =>
                  navigation.replace('NouvelleOrdonnance', {
                    id_consultation: consultation.id_consultation,
                    id_patient,
                  }),
              },
            ],
          );
        },
        onError: err => Alert.alert('Consultation', err.message),
      },
    );
  };

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Input label="Motif" placeholder="Motif de consultation" value={motif} onChangeText={setMotif} />
        <View style={styles.field}>
          <OptionGroup<TypeConsultation>
            label="Type"
            value={type}
            onChange={setType}
            options={[
              { value: 'presentiel', label: 'Présentiel' },
              { value: 'teleconsultation', label: 'Téléconsult.' },
              { value: 'domicile', label: 'Domicile' },
            ]}
          />
        </View>
        <View style={styles.field}>
          <Input
            label="Diagnostic"
            placeholder="Diagnostic (facultatif)"
            value={diagnostic}
            onChangeText={setDiagnostic}
            multiline
          />
        </View>
        <View style={styles.field}>
          <Input
            label="Observations"
            placeholder="Observations (facultatif)"
            value={observations}
            onChangeText={setObservations}
            multiline
          />
        </View>
        <Button
          label="Enregistrer la consultation"
          loading={create.isPending}
          onPress={valider}
          style={styles.submit}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: 16 },
  field: { marginTop: 16 },
  submit: { marginTop: 24 },
});
