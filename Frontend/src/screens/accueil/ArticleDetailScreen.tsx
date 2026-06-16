import React from 'react';
import { ScrollView, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AppText, Badge, Screen, ErrorState } from '@/components';
import { useTheme } from '@/theme';
import { formatDate } from '@/lib/format';
import { resolveImageUrl } from '@/lib/media';
import { useArticle } from '@/features/article/hooks';
import { AccueilStackParamList } from '@/navigation/types';

export function ArticleDetailScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<AccueilStackParamList, 'ArticleDetail'>>();
  const { data, isLoading, isError, refetch } = useArticle(route.params.id);

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      </Screen>
    );
  }
  if (isError || !data) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const uri = resolveImageUrl(data.image_url);

  return (
    <Screen edges={['bottom']} padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {uri ? <Image source={{ uri }} style={styles.cover} resizeMode="cover" /> : null}
        <Badge label={data.categorie.replace('_', ' ')} tone="info" />
        <AppText variant="h2">{data.titre}</AppText>
        <AppText variant="small" color={theme.colors.textSecondary}>
          {data.auteur ? `${data.auteur.prenom} ${data.auteur.nom} · ` : ''}
          {formatDate(data.date_publication ?? data.date_creation)}
        </AppText>
        <AppText style={styles.body} color={theme.colors.foreground}>
          {data.contenu}
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },
  cover: { width: '100%', height: 180, borderRadius: 12, marginBottom: 4 },
  body: { marginTop: 8, lineHeight: 24 },
});
