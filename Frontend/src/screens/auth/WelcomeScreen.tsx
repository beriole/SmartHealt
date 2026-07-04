import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShieldCheck, HeartPulse, Stethoscope, Pill } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  AppText,
  AuthBackdrop,
  BrandLogo,
  Button,
  FadeInView,
  Screen,
} from '@/components';
import { useTheme } from '@/theme';
import { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  return (
    <Screen scroll>
      <AuthBackdrop />

      {/* Marque */}
      <FadeInView delay={0}>
        <View style={styles.brand}>
          <BrandLogo size={76} />
          <AppText variant="h1" center color={theme.colors.primary} style={styles.word}>
            {t('common.appName')}
          </AppText>
          <AppText variant="bodyLg" center color={theme.colors.textSecondary}>
            Une santé numérique rassurante pour chaque citoyen au Cameroun.
          </AppText>
        </View>
      </FadeInView>

      {/* Collage illustratif */}
      <FadeInView delay={90}>
        <View style={styles.collage}>
          <View
            style={[styles.collageMain, { backgroundColor: theme.colors.primaryContainer }]}
          >
            <Stethoscope size={56} color={theme.colors.primary} />
            <View style={[styles.chip, { backgroundColor: theme.colors.surface }, theme.elevation.level1]}>
              <ShieldCheck size={14} color={theme.colors.secondary} />
              <AppText variant="label" color={theme.colors.foreground}>
                Sécurisé & Confidentiel
              </AppText>
            </View>
          </View>
          <View style={styles.collageColumn}>
            <View style={[styles.collageSmall, { backgroundColor: theme.colors.secondary }]}>
              <HeartPulse size={32} color={theme.colors.primaryOn} />
            </View>
            <View
              style={[styles.collageSmall, { backgroundColor: theme.colors.surfaceContainerHigh }]}
            >
              <Pill size={32} color={theme.colors.primary} />
            </View>
          </View>
        </View>
      </FadeInView>

      {/* Actions */}
      <FadeInView delay={170}>
        <View style={styles.actions}>
          <Button label="Créer un compte" onPress={() => navigation.navigate('RoleSelect')} />
          <Button
            label="Se connecter"
            variant="secondary"
            onPress={() => navigation.navigate('Login')}
          />
        </View>

        <AppText variant="caption" center color={theme.colors.outline} style={styles.terms}>
          En continuant, vous acceptez les Conditions d'utilisation et la Politique
          de confidentialité de SmartHealth.
        </AppText>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: 8, marginTop: 24 },
  word: { marginTop: 12 },
  collage: { flexDirection: 'row', gap: 12, marginTop: 28, height: 200 },
  collageMain: {
    flex: 2,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  collageColumn: { flex: 1, gap: 12 },
  collageSmall: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  actions: { gap: 12, marginTop: 28 },
  terms: { marginTop: 24, marginBottom: 12, paddingHorizontal: 12 },
});
