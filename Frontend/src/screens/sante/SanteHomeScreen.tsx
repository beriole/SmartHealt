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
  ChevronRight,
  LucideIcon,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Card, ScreenHeader, Screen } from '@/components';
import { useTheme } from '@/theme';
import { SanteStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<SanteStackParamList>;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'danger';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: Tone;
  onPress?: () => void;
}

export function SanteHomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();

  const toneColor = (tone: Tone) =>
    tone === 'secondary'
      ? theme.colors.secondary
      : tone === 'tertiary'
      ? theme.colors.tertiary
      : tone === 'danger'
      ? theme.colors.destructive
      : theme.colors.primary;

  // Accès rapides mis en avant (grille 2 colonnes, colorés)
  const quick: Feature[] = [
    { icon: Activity, title: 'Triage IA', description: 'Analyse de vos symptômes', tone: 'primary', onPress: () => navigation.navigate('Triage') },
    { icon: BookText, title: 'Carnet de santé', description: 'QR code & consultations', tone: 'secondary', onPress: () => navigation.navigate('Carnet') },
  ];

  // Reste des outils (liste)
  const features: Feature[] = [
    { icon: FileText, title: 'Ordonnances', description: 'Vos prescriptions médicales', tone: 'primary', onPress: () => navigation.navigate('Ordonnances') },
    { icon: Bell, title: 'Rappels de traitement', description: 'Suivi de vos prises', tone: 'tertiary', onPress: () => navigation.navigate('Rappels') },
    { icon: ShieldCheck, title: 'Compatibilité médicament', description: 'Vérifier un traitement', tone: 'secondary', onPress: () => navigation.navigate('Compatibilite') },
    { icon: Leaf, title: 'Médecine traditionnelle', description: 'Remèdes naturels adaptés', tone: 'secondary', onPress: () => navigation.navigate('MedecineTraditionnelle') },
    { icon: Clock, title: 'Historique des analyses', description: 'Retrouver vos analyses IA', tone: 'primary', onPress: () => navigation.navigate('HistoriqueIa') },
  ];

  return (
    <Screen edges={['top']} padded={false}>
      <ScreenHeader title="Ma Santé" subtitle="Vos outils de suivi et de prévention." />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Accès rapides colorés */}
        <View style={styles.quickRow}>
          {quick.map(f => {
            const Icon = f.icon;
            const color = toneColor(f.tone);
            return (
              <Pressable
                key={f.title}
                onPress={f.onPress}
                android_ripple={{ color: theme.colors.muted }}
                style={({ pressed }) => [
                  styles.quickTile,
                  theme.elevation.level1,
                  {
                    backgroundColor: color,
                    borderRadius: theme.radius.lg,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <Icon size={30} color={theme.colors.primaryOn} />
                <AppText weight="bold" color={theme.colors.primaryOn} style={styles.quickTitle}>
                  {f.title}
                </AppText>
                <AppText variant="small" color={theme.colors.primaryOn} style={styles.quickSub}>
                  {f.description}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText variant="h3" weight="semibold" style={styles.sectionTitle}>
          Tous les outils
        </AppText>

        <View style={styles.list}>
          {features.map(f => {
            const Icon = f.icon;
            const color = toneColor(f.tone);
            return (
              <Pressable
                key={f.title}
                onPress={f.onPress}
                android_ripple={{ color: theme.colors.muted }}
              >
                <Card style={styles.card}>
                  <View style={[styles.iconWrap, { backgroundColor: color + '1A', borderRadius: theme.radius.md }]}>
                    <Icon size={24} color={color} />
                  </View>
                  <View style={styles.flex}>
                    <AppText weight="semibold">{f.title}</AppText>
                    <AppText variant="small" color={theme.colors.textSecondary}>
                      {f.description}
                    </AppText>
                  </View>
                  <ChevronRight size={20} color={theme.colors.outline} />
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickTile: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 2,
  },
  quickTitle: { marginTop: 8 },
  quickSub: { opacity: 0.9 },
  sectionTitle: { marginTop: 24, marginBottom: 12 },
  list: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
});
