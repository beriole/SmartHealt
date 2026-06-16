import React from 'react';
import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import {
  Activity,
  Leaf,
  ShieldCheck,
  Clock,
  BookText,
  FileText,
  Bell,
  LucideIcon,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Card, Badge, Screen } from '@/components';
import { useTheme } from '@/theme';
import { SanteStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<SanteStackParamList>;

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  onPress?: () => void;
  soon?: boolean;
}

export function SanteHomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  const features: Feature[] = [
    { icon: Activity, title: 'Triage des symptômes', description: 'Analyse IA de vos symptômes', onPress: () => navigation.navigate('Triage') },
    { icon: Leaf, title: 'Médecine traditionnelle', description: 'Remèdes naturels adaptés', onPress: () => navigation.navigate('MedecineTraditionnelle') },
    { icon: ShieldCheck, title: 'Compatibilité médicament', description: 'Vérifier un traitement avec votre dossier', onPress: () => navigation.navigate('Compatibilite') },
    { icon: Clock, title: 'Historique des analyses', description: 'Retrouver vos analyses IA', onPress: () => navigation.navigate('HistoriqueIa') },
    { icon: BookText, title: 'Carnet de santé', description: 'Votre QR code et vos consultations', onPress: () => navigation.navigate('Carnet') },
    { icon: FileText, title: 'Ordonnances', description: 'Vos prescriptions médicales', onPress: () => navigation.navigate('Ordonnances') },
    { icon: Bell, title: 'Rappels de traitement', description: 'Suivi de vos prises', onPress: () => navigation.navigate('Rappels') },
  ];

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {features.map(f => {
          const Icon = f.icon;
          const disabled = f.soon || !f.onPress;
          return (
            <Pressable
              key={f.title}
              disabled={disabled}
              onPress={f.onPress}
              accessibilityRole="button"
              accessibilityState={{ disabled }}
            >
              <Card style={[styles.card, disabled && styles.disabled]}>
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: theme.colors.muted, borderRadius: theme.radius.md },
                  ]}
                >
                  <Icon size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText weight="semibold">{f.title}</AppText>
                  <AppText variant="small" color={theme.colors.textSecondary}>
                    {f.description}
                  </AppText>
                </View>
                {f.soon ? <Badge label="Bientôt" tone="neutral" /> : null}
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: 16, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  disabled: { opacity: 0.55 },
  iconWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
});
