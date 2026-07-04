import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { User, Stethoscope, Store, Bike } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, AuthBackdrop, BrandLogo, Button, FadeInView, Screen } from '@/components';
import { useTheme } from '@/theme';
import { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'RoleSelect'>;
type Role = 'patient' | 'pro' | 'pharmacie' | 'livreur';

const ROLES: {
  key: Role;
  title: string;
  description: string;
  Icon: typeof User;
  tone: 'primary' | 'secondary' | 'tertiary';
}[] = [
  {
    key: 'patient',
    title: 'Patient',
    description:
      'Gérez votre carnet de santé, commandez vos médicaments et suivez vos traitements.',
    Icon: User,
    tone: 'primary',
  },
  {
    key: 'pro',
    title: 'Professionnel de santé',
    description:
      'Accédez aux dossiers patients, coordonnez les soins et émettez des ordonnances numériques.',
    Icon: Stethoscope,
    tone: 'secondary',
  },
  {
    key: 'pharmacie',
    title: 'Pharmacie',
    description:
      'Gérez votre stock, vos médicaments et traitez les commandes en ligne.',
    Icon: Store,
    tone: 'tertiary',
  },
  {
    key: 'livreur',
    title: 'Livreur',
    description:
      'Acceptez des courses, livrez les commandes et suivez vos gains.',
    Icon: Bike,
    tone: 'primary',
  },
];

export function RoleSelectScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [role, setRole] = useState<Role>();

  const toneColor = (tone: string) =>
    tone === 'secondary'
      ? theme.colors.secondary
      : tone === 'tertiary'
      ? theme.colors.tertiary
      : theme.colors.primary;

  const onContinue = () => {
    if (!role) return;
    if (role === 'patient') {
      navigation.navigate('Register');
    } else if (role === 'pro') {
      navigation.navigate('RegisterPro');
    } else if (role === 'pharmacie') {
      navigation.navigate('RegisterPharmacie');
    } else {
      navigation.navigate('RegisterLivreur');
    }
  };

  return (
    <Screen scroll>
      <AuthBackdrop />

      <FadeInView delay={0}>
        <View style={styles.brand}>
          <BrandLogo size={28} withWordmark wordmarkSize={20} />
        </View>

        <View style={styles.hero}>
          <AppText variant="h1" center>
            Qui êtes-vous ?
          </AppText>
          <AppText center color={theme.colors.textSecondary}>
            Sélectionnez votre rôle pour personnaliser votre expérience.
          </AppText>
        </View>
      </FadeInView>

      <View style={styles.list}>
        {ROLES.map(({ key, title, description, Icon, tone }, i) => {
          const selected = role === key;
          const color = toneColor(tone);
          return (
            <FadeInView key={key} delay={60 + i * 60}>
              <Pressable
                onPress={() => setRole(key)}
                android_ripple={{ color: theme.colors.muted }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.card,
                  selected ? theme.elevation.level2 : theme.elevation.level1,
                  {
                    backgroundColor: selected ? color + '12' : theme.colors.surface,
                    borderColor: selected ? color : theme.colors.border,
                    borderWidth: selected ? 2 : 1,
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: color + '1A' }]}>
                  <Icon size={26} color={color} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="h3" weight="semibold">
                    {title}
                  </AppText>
                  <AppText variant="small" color={theme.colors.textSecondary}>
                    {description}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.radio,
                    { borderColor: selected ? color : theme.colors.outline },
                  ]}
                >
                  {selected ? <View style={[styles.radioDot, { backgroundColor: color }]} /> : null}
                </View>
              </Pressable>
            </FadeInView>
          );
        })}
      </View>

      <Button
        label="Continuer"
        disabled={!role}
        onPress={onContinue}
        style={styles.continue}
      />

      <AppText center color={theme.colors.textSecondary} style={styles.footer}>
        Déjà un compte ?{' '}
        <AppText
          weight="bold"
          color={theme.colors.primary}
          onPress={() => navigation.navigate('Login')}
        >
          Se connecter
        </AppText>
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginTop: 8 },
  hero: { alignItems: 'center', gap: 6, marginTop: 24, marginBottom: 8 },
  list: { gap: 14, marginTop: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  continue: { marginTop: 28 },
  footer: { marginTop: 20, marginBottom: 12 },
});
