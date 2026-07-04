import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  User,
  Mail,
  Phone,
  Lock,
  Store,
  BadgeCheck,
  MapPin,
  ShieldCheck,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AppText,
  AuthBackdrop,
  Badge,
  BrandLogo,
  Button,
  Card,
  DocumentUpload,
  Input,
  OptionGroup,
  Screen,
  StepProgress,
} from '@/components';
import { useTheme } from '@/theme';
import { useRegister } from '@/features/auth/hooks';
import { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'RegisterPharmacie'>;

const SEXE_OPTIONS = [
  { value: 'F' as const, label: 'Femme' },
  { value: 'M' as const, label: 'Homme' },
  { value: 'AUTRE' as const, label: 'Autre' },
];

const STEPS = ['Établissement', 'Compte', 'Vérification'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPharmacieScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const register = useRegister();

  const [step, setStep] = useState(0);

  // Étape 1 — Établissement (collecté pour validation par un agent)
  const [nomPharmacie, setNomPharmacie] = useState('');
  const [licence, setLicence] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telPharmacie, setTelPharmacie] = useState('');

  // Étape 2 — Compte du responsable
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [sexe, setSexe] = useState<'M' | 'F' | 'AUTRE'>();
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');

  // Étape 3 — Documents (visuel)
  const [licenceDoc, setLicenceDoc] = useState(false);
  const [cni, setCni] = useState(false);

  const validerEtape1 = () => {
    if (!nomPharmacie.trim()) {
      Alert.alert('Inscription', 'Indiquez le nom de la pharmacie.');
      return false;
    }
    if (!licence.trim()) {
      Alert.alert('Inscription', "Le numéro de licence est requis.");
      return false;
    }
    if (!adresse.trim()) {
      Alert.alert('Inscription', "Indiquez l'adresse de l'établissement.");
      return false;
    }
    return true;
  };

  const validerEtape2 = () => {
    if (!prenom.trim() || !nom.trim()) {
      Alert.alert('Inscription', 'Indiquez le nom du responsable.');
      return false;
    }
    if (!EMAIL_RE.test(email.trim())) {
      Alert.alert('Inscription', 'Adresse e-mail invalide.');
      return false;
    }
    if (telephone.trim().length < 8) {
      Alert.alert('Inscription', 'Numéro de téléphone invalide.');
      return false;
    }
    if (!sexe) {
      Alert.alert('Inscription', 'Sélectionnez le sexe du responsable.');
      return false;
    }
    if (motDePasse.length < 8) {
      Alert.alert('Inscription', 'Le mot de passe doit contenir au moins 8 caractères.');
      return false;
    }
    if (motDePasse !== confirmation) {
      Alert.alert('Inscription', 'Les mots de passe ne correspondent pas.');
      return false;
    }
    return true;
  };

  const suivant = () => {
    if (step === 0 && !validerEtape1()) return;
    if (step === 1 && !validerEtape2()) return;
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const precedent = () => setStep(s => Math.max(s - 1, 0));

  const soumettre = () => {
    // Le compte responsable (PHARMACIEN) ET l'officine sont créés ; la licence
    // est vérifiée par un agent SmartHealth avant activation de l'établissement.
    register.mutate(
      {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim(),
        telephone: telephone.trim(),
        sexe: sexe as string,
        mot_de_passe: motDePasse,
        type_utilisateur: 'PHARMACIEN',
        nom_pharmacie: nomPharmacie.trim(),
        numero_autorisation: licence.trim(),
        adresse_pharmacie: adresse.trim(),
        telephone_pharmacie: telPharmacie.trim() || telephone.trim(),
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Candidature envoyée',
            "Votre compte et votre officine sont créés. L'établissement sera activé après vérification de la licence par nos équipes.",
          );
          navigation.navigate('VerifyEmailNotice', { email: email.trim() });
        },
        onError: err => Alert.alert('Inscription', err.message),
      },
    );
  };

  return (
    <Screen scroll>
      <AuthBackdrop />
      <View style={styles.hero}>
        <View style={styles.brand}>
          <BrandLogo size={26} withWordmark wordmarkSize={19} />
        </View>
        <AppText variant="h1" center style={styles.title}>
          Inscription pharmacie
        </AppText>
        <AppText center color={theme.colors.textSecondary}>
          Référencez votre officine et gérez vos commandes en ligne.
        </AppText>
      </View>

      <View style={styles.stepper}>
        <StepProgress steps={STEPS} current={step} />
      </View>

      {step === 0 ? (
        <Card padding="lg" style={styles.form}>
          <Input
            label="Nom de la pharmacie"
            required
            leftIcon={<Store size={20} color={theme.colors.outline} />}
            value={nomPharmacie}
            onChangeText={setNomPharmacie}
          />
          <Input
            label="Numéro de licence"
            required
            placeholder="ex. PH-CM-2024-001"
            autoCapitalize="characters"
            leftIcon={<BadgeCheck size={20} color={theme.colors.outline} />}
            value={licence}
            onChangeText={setLicence}
          />
          <Input
            label="Adresse de l'établissement"
            required
            placeholder="Quartier, ville…"
            leftIcon={<MapPin size={20} color={theme.colors.outline} />}
            value={adresse}
            onChangeText={setAdresse}
          />
          <Input
            label="Téléphone de la pharmacie"
            keyboardType="phone-pad"
            placeholder="+237…"
            leftIcon={<Phone size={20} color={theme.colors.outline} />}
            value={telPharmacie}
            onChangeText={setTelPharmacie}
          />
        </Card>
      ) : null}

      {step === 1 ? (
        <Card padding="lg" style={styles.form}>
          <AppText variant="label" color={theme.colors.textSecondary}>
            RESPONSABLE / PHARMACIEN TITULAIRE
          </AppText>
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
        </Card>
      ) : null}

      {step === 2 ? (
        <View style={styles.form}>
          <View
            style={[
              styles.trustCard,
              { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg },
            ]}
          >
            <View style={styles.trustHeader}>
              <ShieldCheck size={18} color={theme.colors.primaryOn} />
              <AppText variant="label" color={theme.colors.primaryOn}>
                CENTRE DE CONFIANCE · CHIFFRÉ AES-256
              </AppText>
            </View>
            <AppText variant="small" color={theme.colors.primaryOn} style={styles.trustText}>
              La licence d'exploitation est vérifiée par nos équipes avant activation de
              l'officine.
            </AppText>
          </View>

          <DocumentUpload
            title="Licence d'exploitation"
            description="PDF, JPG ou PNG · 10 Mo max."
            uploaded={licenceDoc}
            fileName="licence_officine.pdf"
            onPick={() => setLicenceDoc(true)}
            onRemove={() => setLicenceDoc(false)}
          />
          <DocumentUpload
            title="Pièce d'identité du responsable"
            description="Assurez-vous que les 4 coins sont visibles."
            uploaded={cni}
            fileName="cni_responsable.jpg"
            onPick={() => setCni(true)}
            onRemove={() => setCni(false)}
          />

          <View style={styles.compliance}>
            <Badge label="HIPAA" tone="info" />
            <Badge label="RGPD" tone="info" />
            <Badge label="SSL" tone="success" />
          </View>
        </View>
      ) : null}

      <View style={styles.nav}>
        {step > 0 ? (
          <Button
            label="Retour"
            variant="secondary"
            onPress={precedent}
            fullWidth={false}
            style={styles.navBtn}
          />
        ) : null}
        {step < STEPS.length - 1 ? (
          <Button label="Continuer" onPress={suivant} style={styles.flex} />
        ) : (
          <Button
            label="Soumettre la candidature"
            loading={register.isPending}
            onPress={soumettre}
            style={styles.flex}
          />
        )}
      </View>

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
  hero: { alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 16 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { marginTop: 4 },
  stepper: { marginBottom: 20, paddingHorizontal: 8 },
  form: { gap: 18 },
  trustCard: { padding: 16, gap: 8 },
  trustHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trustText: { opacity: 0.9 },
  compliance: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  nav: { flexDirection: 'row', gap: 12, marginTop: 24 },
  navBtn: { minWidth: 110 },
  flex: { flex: 1 },
  footer: { marginTop: 20, marginBottom: 12, alignItems: 'center' },
});
