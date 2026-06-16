import React from 'react';
import { ScrollView, View, Image, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, Card, Badge, Screen } from '@/components';
import { useTheme } from '@/theme';
import { resolveImageUrl } from '@/lib/media';
import { useAuthStore } from '@/store/authStore';
import { usePrisesDuJour } from '@/features/rappel/hooks';
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
  const articles = useArticles({ limit: 10 });

  const prochaine = prises.data?.find(p => p.statut_prise === 'en_attente');

  return (
    <Screen edges={['top']} padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <AppText variant="small" color={theme.colors.textSecondary}>
            {t('tabs.accueil')}
          </AppText>
          <AppText variant="h2">
            {user ? `Bonjour, ${user.prenom}` : t('common.appName')}
          </AppText>
        </View>

        <Card style={styles.next}>
          <AppText weight="semibold">Prochaine prise</AppText>
          {prochaine ? (
            <AppText color={theme.colors.textSecondary}>
              {prochaine.rappel?.medicament?.nom_commercial ?? 'Médicament'} ·{' '}
              {new Date(prochaine.date_heure_prevue).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </AppText>
          ) : (
            <AppText color={theme.colors.textSecondary}>
              Aucune prise prévue pour le moment.
            </AppText>
          )}
        </Card>

        <AppText variant="small" weight="bold" style={styles.sectionTitle}>
          CONSEILS SANTÉ
        </AppText>

        {articles.data?.data.map((a: Article) => {
          const uri = resolveImageUrl(a.image_url);
          return (
            <Pressable
              key={a.id_article}
              onPress={() => navigation.navigate('ArticleDetail', { id: a.id_article })}
            >
              <Card style={styles.articleCard}>
                {uri ? (
                  <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                ) : null}
                <View style={styles.flex}>
                  <Badge label={a.categorie.replace('_', ' ')} tone="info" />
                  <AppText weight="semibold" style={styles.articleTitle}>
                    {a.titre}
                  </AppText>
                </View>
              </Card>
            </Pressable>
          );
        })}

        {articles.data && articles.data.data.length === 0 ? (
          <AppText color={theme.colors.textSecondary} style={styles.empty}>
            Aucun article pour le moment.
          </AppText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  header: { gap: 4, marginBottom: 8 },
  next: { gap: 4 },
  sectionTitle: { marginTop: 12 },
  articleCard: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  flex: { flex: 1, gap: 6 },
  articleTitle: {},
  empty: { marginTop: 8 },
});
