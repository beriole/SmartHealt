import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { QrCode } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Button, Input, Screen } from '@/components';
import { useTheme } from '@/theme';
import { DossierStackParamList } from '@/navigation/types';

export function ScanCarnetScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<DossierStackParamList>>();
  const [token, setToken] = useState('');

  return (
    <Screen edges={['top']}>
      <View style={styles.container}>
        <QrCode size={56} color={theme.colors.primary} />
        <AppText variant="h3" center>
          Accéder à un dossier patient
        </AppText>
        <AppText color={theme.colors.textSecondary} center>
          Saisissez le code du carnet présenté par le patient. Le scan par caméra sera
          ajouté avec la version native.
        </AppText>
        <Input
          label="Code du carnet (QR)"
          placeholder="QR-…"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
        />
        <Button
          label="Ouvrir le dossier"
          onPress={() => navigation.navigate('DossierPatient', { token: token.trim() })}
          disabled={token.trim().length === 0}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: 16, paddingBottom: 40 },
});
