import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  User,
  Mail,
  Phone,
  Lock,
  Bike,
  Hash,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AppText,
  AuthBackdrop,
  BrandLogo,
  Button,
  Card,
  FadeInView,
  Input,
  OptionGroup,
  Screen,
} from '@/components';
import { useTheme } from '@/theme';
import { useRegister } from '@/features/auth/hooks';
import { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'RegisterLivreur'>;

const SEXE_OPTIONS = [
  { value: 'F' as const, label: 'Femme' },
  { value: 'M' as const, label: 'Homme' },
  { value: 'AUTRE' as const, label: 'Autre' },
];

const VEHICULES = [
  { value: 'moto', label: 'Moto' },
  { value: 'voiture', label: 'Voiture' },
  { value: 'velo', label: 'Vélo' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterLivreurScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const register = useRegister();

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [sexe, setSexe] = useState<'M' | 'F' | 'AUTRE'>();
  const [vehicule, setVehicule] = useState('moto');
  const [plaque, setPlaque] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const soumettre = () => {
    if (!prenom.trim() || !nom.trim()) {
      Alert.alert('Inscription', 'Indiquez votre nom et prénom.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      Alert.alert('Inscription', 'Adresse e-mail invalide.');
      return;
    }
    if (telephone.trim().length < 8) {
      Alert.alert('Inscription', 'Numéro de téléphone invalide.');
      return;
    }
    if (!sexe) {
      Alert.alert('Inscription', 'Sélectionnez votre sexe.');
      return;
    }
    if (motDePasse.length < 8) {
      Alert.alert('Inscription', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (motDePasse !== confirmation) {
      Alert.alert('Inscription', 'Les mots de passe ne correspondent pas.');
      return;
    }
    register.mutate(
      {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim(),
        telephone: telephone.trim(),
        sexe,
        mot_de_passe: motDePasse,
        type_utilisateur: 'LIVREUR',
        vehicule_type: vehicule,
        plaque_immatriculation: plaque.trim() || undefined,
      },
      {
        onSuccess: () =>
          navigation.navigate('VerifyEmailNotice', { email: email.trim() }),
        onError: err => Alert.alert('Inscription', err.message),
      },
    );
  };


  return (
    <Screen scroll>
      <AuthBackdrop />

      <FadeInView delay={0}>
        <View style={styles.brand}>
          <BrandLogo size={28} withWordmark wordmarkSize={20} />
        </View>
        <View style={styles.hero}>
          <BrandLogo size={64} />
          <AppText variant="h1" center style={styles.title}>
            Devenir livreur
          </AppText>
          <AppText center color={theme.colors.textSecondary}>
            Livrez des médicaments et suivez vos gains en temps réel.
          </AppText>
        </View>
      </FadeInView>

      <FadeInView delay={90}>
        <Card padding="lg" style={styles.form}>
          <Input
            label={t('auth.firstName')}
            required
            leftIcon={<User size={20} color={theme.colors.outline} />}
            value={prenom}
            onChangeText={setPrenom}
          />
          <Input
            label={t('auth.lastName')}
            required
            leftIcon={<User size={20} color={theme.colors.outline} />}
            value={nom}
            onChangeText={setNom}
          />
          <Input
            label={t('auth.email')}
            required
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="nom@exemple.com"
            leftIcon={<Mail size={20} color={theme.colors.outline} />}
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label={t('auth.phone')}
            required
            keyboardType="phone-pad"
            placeholder="+237…"
            leftIcon={<Phone size={20} color={theme.colors.outline} />}
            value={telephone}
            onChangeText={setTelephone}
          />
          <OptionGroup
            label={t('auth.sex')}
            required
            options={SEXE_OPTIONS}
            value={sexe}
            onChange={setSexe}
          />
          <OptionGroup<string>
            label="Type de véhicule"
            options={VEHICULES}
            value={vehicule}
            onChange={setVehicule}
          />
          <Input
            label="Plaque d'immatriculation"
            placeholder="ex. LT 1234 AB"
            autoCapitalize="characters"
            leftIcon={<Hash size={20} color={theme.colors.outline} />}
            value={plaque}
            onChangeText={setPlaque}
          />
          <Input
            label={t('auth.password')}
            required
            isPassword
            helper={t('auth.passwordHelper')}
            leftIcon={<Lock size={20} color={theme.colors.outline} />}
            value={motDePasse}
            onChangeText={setMotDePasse}
          />
          <Input
            label={t('auth.confirmPassword')}
            required
            isPassword
            leftIcon={<Lock size={20} color={theme.colors.outline} />}
            value={confirmation}
            onChangeText={setConfirmation}
          />

          <Button
            label="Créer mon compte livreur"
            loading={register.isPending}
            onPress={soumettre}
            icon={<Bike size={20} color={theme.colors.primaryOn} />}
          />
        </Card>
      </FadeInView>

      <View style={styles.footer}>
        <AppText center color={theme.colors.textSecondary}>
          Déjà inscrit ?{' '}
          <AppText
            weight="bold"
            color={theme.colors.primary}
            onPress={() => navigation.navigate('Login')}
          >
            Se connecter
          </AppText>
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginTop: 8 },
  hero: { alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 16 },
  title: { marginTop: 8 },
  form: { gap: 18 },
  footer: { marginTop: 20, marginBottom: 12, alignItems: 'center' },
});
