import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { AppText, Button, Input, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useValiderLivraison } from '@/features/livreur/hooks';
import { LivraisonsStackParamList } from '@/navigation/types';

export function ValiderLivraisonScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<LivraisonsStackParamList, 'ValiderLivraison'>>();
  const navigation = useNavigation();
  const valider = useValiderLivraison();
  const [code, setCode] = useState('');

  const onValider = () => {
    if (code.trim().length < 4) {
      Alert.alert('Validation', 'Saisissez le code à 4 chiffres communiqué au client.');
      return;
    }
    valider.mutate(
      { id: route.params.id, code: code.trim() },
      {
        onSuccess: () => {
          Alert.alert('Validation', 'Livraison validée. Merci !');
          navigation.goBack();
        },
        onError: err => Alert.alert('Validation', err.message),
      },
    );
  };

  return (
    <Screen edges={['bottom']}>
      <View style={styles.container}>
        <AppText color={theme.colors.textSecondary}>
          Demandez au client le code de validation reçu par email, puis saisissez-le ci-dessous.
        </AppText>
        <Input
          label="Code de validation"
          placeholder="• • • •"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Button
          label="Valider la livraison"
          loading={valider.isPending}
          onPress={onValider}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, paddingTop: 24 },
});
