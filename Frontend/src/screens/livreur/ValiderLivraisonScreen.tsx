import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { PackageCheck, CheckCircle2 } from 'lucide-react-native';
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
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
            <PackageCheck size={32} color={theme.colors.primary} />
          </View>
          <AppText variant="h2" center>
            Valider la livraison
          </AppText>
          <AppText center color={theme.colors.textSecondary}>
            Demandez au client le code de validation reçu par email, puis saisissez-le ci-dessous.
          </AppText>
        </View>
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
          icon={<CheckCircle2 size={20} color={theme.colors.primaryOn} />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, paddingTop: 24 },
  hero: { alignItems: 'center', gap: 8, marginBottom: 8 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
