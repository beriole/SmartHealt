import React from 'react';
import {
  ScrollView,
  View,
  Image,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Pill,
  Clock,
  HeartPulse,
  Activity,
  Bot,
  Stethoscope,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';
import { AppText, BrandLogo, Card, Badge, Screen } from '@/components';
import { useTheme } from '@/theme';
import { resolveImageUrl } from '@/lib/media';
import { useAuthStore } from '@/store/authStore';
import { usePrisesDuJour, useMarquerPrise } from '@/features/rappel/hooks';
import { useArticles } from '@/features/article/hooks';
import { Article } from '@/types';
import { AccueilStackParamList } from '@/navigation/types';

export function AccueilHomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<AccueilStackParamList>>();
  const user = useAuthStore(s => s.user);
  const prises = usePrisesDuJour();
  const marquer = useMarquerPrise();
  const articles = useArticles({ limit: 10 });

  const prochaine = prises.data?.find(p => p.statut_prise === 'en_attente');

  const goTab = (tab: string, screen: string) => {
    const parent = navigation.getParent();
    if (parent) {
      (parent as { navigate: (t: string, p: object) => void }).navigate(tab, {
        screen,
      });
    }
  };

  const confirmerPrise = () => {
    if (!prochaine) return;
    marquer.mutate(
      { id: prochaine.id_prise, statut: 'prise' },
      {
        onError: err => Alert.alert(t('common.appName'), err.message),
      },
    );
  };

  return (
    <Screen edges={['top']} padded={false}>
      {/* Barre supérieure */}
      <View style={[styles.topBar, { backgroundColor: theme.colors.surface }]}>
        <BrandLogo size={28} withWordmark wordmarkSize={20} />
        <Pressable hitSlop={8}>
          <Bell size={22} color={theme.colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Salutation */}
        <View style={styles.greeting}>
          <AppText variant="h2">
            Bonjour, {user?.prenom ?? ''}
          </AppText>
          <AppText color={theme.colors.textSecondary}>
            Prêt pour votre suivi quotidien ?
          </AppText>
        </View>

        {/* Carte hero — prochain traitement */}
        <Card accent padding="lg" style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.flex}>
              <AppText variant="label" color={theme.colors.primary}>
                PROCHAIN TRAITEMENT
              </AppText>
              {prochaine ? (
                <AppText variant="h3" style={styles.heroTitle}>
                  {prochaine.rappel?.medicament?.nom_commercial ?? 'Médicament'}
                </AppText>
              ) : (
                <AppText variant="h3" style={styles.heroTitle}>
                  Aucune prise prévue
                </AppText>
              )}
            </View>
            <View
              style={[
                styles.heroIcon,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Pill size={22} color={theme.colors.primary} />
            </View>
          </View>

          {prochaine ? (
            <>
              <View style={styles.heroMeta}>
                <Clock size={16} color={theme.colors.textSecondary} />
                <AppText color={theme.colors.textSecondary}>
                  Aujourd'hui à{' '}
                  {new Date(prochaine.date_heure_prevue).toLocaleTimeString(
                    'fr-FR',
                    { hour: '2-digit', minute: '2-digit' },
                  )}
                </AppText>
              </View>
              <Pressable
                onPress={confirmerPrise}
                disabled={marquer.isPending}
                style={({ pressed }) => [
                  styles.heroBtn,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity: marquer.isPending ? 0.6 : pressed ? 0.9 : 1,
                  },
                ]}
              >
                <AppText weight="bold" color={theme.colors.primaryOn}>
                  Confirmer la prise
                </AppText>
              </Pressable>
            </>
          ) : (
            <AppText color={theme.colors.textSecondary} style={styles.heroMeta}>
              Vos rappels de traitement apparaîtront ici.
            </AppText>
          )}
        </Card>

        {/* Constantes vitales */}
        <View style={styles.vitalRow}>
          <Card style={styles.vitalCard} padding="md">
            <View style={styles.vitalLeft}>
              <View
                style={[
                  styles.vitalIcon,
                  { backgroundColor: theme.colors.success + '1A' },
                ]}
              >
                <HeartPulse size={20} color={theme.colors.success} />
              </View>
              <View>
                <AppText variant="label" color={theme.colors.outline}>
                  RYTHME CARDIAQUE
                </AppText>
                <AppText weight="semibold" variant="bodyLg">
                  72 BPM
                </AppText>
              </View>
            </View>
            <View style={styles.vitalTrend}>
              <TrendingUp size={16} color={theme.colors.success} />
              <AppText variant="label" color={theme.colors.success}>
                Normal
              </AppText>
            </View>
          </Card>

          <Card style={styles.vitalCard} padding="md">
            <View style={styles.vitalLeft}>
              <View
                style={[
                  styles.vitalIcon,
                  { backgroundColor: theme.colors.tertiaryContainer },
                ]}
              >
                <Activity size={20} color={theme.colors.tertiary} />
              </View>
              <View>
                <AppText variant="label" color={theme.colors.outline}>
                  PRESSION ARTÉRIELLE
                </AppText>
                <AppText weight="semibold" variant="bodyLg">
                  12/8
                </AppText>
              </View>
            </View>
            <Badge label="Stable" tone="success" />
          </Card>
        </View>

        {/* Services rapides */}
        <AppText variant="h3" weight="semibold" style={styles.sectionTitle}>
          Services Rapides
        </AppText>
        <View style={styles.serviceRow}>
          <Pressable
            onPress={() => goTab('Sante', 'Triage')}
            style={({ pressed }) => [
              styles.serviceTile,
              {
                backgroundColor: theme.colors.primary,
                opacity: pressed ? 0.92 : 1,
              },
              theme.elevation.level1,
            ]}
          >
            <Bot size={36} color={theme.colors.primaryOn} />
            <AppText variant="label" color={theme.colors.primaryOn} style={styles.serviceLabel}>
              TRIAGE IA
            </AppText>
            <AppText variant="small" color={theme.colors.primaryOn} style={styles.serviceSub}>
              Auto-évaluation guidée
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => goTab('Profil', 'NouvelleIntervention')}
            style={({ pressed }) => [
              styles.serviceTile,
              {
                backgroundColor: theme.colors.surfaceContainerHigh,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Stethoscope size={36} color={theme.colors.primary} />
            <AppText variant="label" color={theme.colors.foreground} style={styles.serviceLabel}>
              INFIRMIER
            </AppText>
            <AppText variant="small" color={theme.colors.textSecondary} style={styles.serviceSub}>
              Demander un soin
            </AppText>
          </Pressable>
        </View>

        {/* Conseils santé */}
        {articles.data && articles.data.data.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <AppText variant="h3" weight="semibold">
                Conseils Santé
              </AppText>
            </View>
            <View style={styles.articleList}>
              {articles.data.data.map((a: Article) => {
                const uri = resolveImageUrl(a.image_url);
                return (
                  <Pressable
                    key={a.id_article}
                    onPress={() =>
                      navigation.navigate('ArticleDetail', { id: a.id_article })
                    }
                  >
                    <Card style={styles.articleCard} padding="sm">
                      {uri ? (
                        <Image
                          source={{ uri }}
                          style={styles.thumb}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.thumb,
                            { backgroundColor: theme.colors.surfaceVariant },
                          ]}
                        />
                      )}
                      <View style={styles.flex}>
                        <Badge label={a.categorie.replace('_', ' ')} tone="info" />
                        <AppText weight="semibold" style={styles.articleTitle}>
                          {a.titre}
                        </AppText>
                      </View>
                      <ChevronRight size={20} color={theme.colors.outline} />
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scroll: { padding: 20, paddingBottom: 40 },
  greeting: { gap: 4, marginBottom: 20 },
  flex: { flex: 1 },

  heroCard: { gap: 0 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTitle: { marginTop: 4 },
  heroIcon: { padding: 10, borderRadius: 12 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  heroBtn: {
    marginTop: 20,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vitalRow: { gap: 12, marginTop: 16 },
  vitalCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vitalLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vitalIcon: { padding: 10, borderRadius: 999 },
  vitalTrend: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  sectionTitle: { marginTop: 28, marginBottom: 12 },
  serviceRow: { flexDirection: 'row', gap: 16 },
  serviceTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 6,
  },
  serviceLabel: { marginTop: 8 },
  serviceSub: { textAlign: 'center' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 12,
  },
  articleList: { gap: 12 },
  articleCard: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  articleTitle: { marginTop: 4 },
});
