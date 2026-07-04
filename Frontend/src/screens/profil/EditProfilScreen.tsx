import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { User, Phone } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Button, Input, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfil } from '@/features/profil/hooks';

export function EditProfilScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const user = useAuthStore(s => s.user);
  const update = useUpdateProfil();

  const [prenom, setPrenom] = useState(user?.prenom ?? '');
  const [nom, setNom] = useState(user?.nom ?? '');
  const [telephone, setTelephone] = useState(user?.telephone ?? '');

  const enregistrer = () => {
    if (!user) {
      return;
    }
    if (!prenom.trim() || !nom.trim()) {
      Alert.alert(t('tabs.profil'), 'Le nom et le prénom sont requis.');
      return;
    }
    update.mutate(
      {
        id: user.id_utilisateur,
        data: { prenom: prenom.trim(), nom: nom.trim(), telephone: telephone.trim() },
      },
      {
        onSuccess: () => {
          Alert.alert(t('tabs.profil'), 'Profil mis à jour.');
          navigation.goBack();
        },
        onError: err => Alert.alert(t('tabs.profil'), err.message),
      },
    );
  };

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Input
          label={t('auth.firstName')}
          leftIcon={<User size={20} color={theme.colors.outline} />}
          value={prenom}
          onChangeText={setPrenom}
        />
        <Input
          label={t('auth.lastName')}
          leftIcon={<User size={20} color={theme.colors.outline} />}
          value={nom}
          onChangeText={setNom}
        />
        <Input
          label={t('auth.phone')}
          leftIcon={<Phone size={20} color={theme.colors.outline} />}
          value={telephone}
          onChangeText={setTelephone}
          keyboardType="phone-pad"
        />
        <Button
          label={t('common.save')}
          loading={update.isPending}
          onPress={enregistrer}
          style={styles.submit}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: 16, gap: 16 },
  submit: { marginTop: 8 },
});
