import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { AppText, Button, Input, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useUpdateStatutIntervention } from '@/features/intervention/hooks';
import { InterventionsProStackParamList } from '@/navigation/types';

export function TerminerInterventionScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<InterventionsProStackParamList, 'TerminerIntervention'>>();
  const navigation = useNavigation();
  const update = useUpdateStatutIntervention();
  const [compteRendu, setCompteRendu] = useState('');

  const terminer = () => {
    update.mutate(
      { id: route.params.id, statut: 'terminee', compte_rendu: compteRendu.trim() || undefined },
      {
        onSuccess: () => {
          Alert.alert('Intervention', 'Intervention clôturée.');
          navigation.goBack();
        },
        onError: err => Alert.alert('Intervention', err.message),
      },
    );
  };

  return (
    <Screen edges={['bottom']}>
      <View style={styles.container}>
        <AppText color={theme.colors.textSecondary}>
          Rédigez le compte rendu de l'intervention avant de la clôturer.
        </AppText>
        <Input
          label="Compte rendu"
          placeholder="Soins réalisés, observations…"
          value={compteRendu}
          onChangeText={setCompteRendu}
          multiline
        />
        <Button
          label="Clôturer l'intervention"
          loading={update.isPending}
          onPress={terminer}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, paddingTop: 16 },
});
