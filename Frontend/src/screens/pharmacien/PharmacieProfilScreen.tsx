import React from 'react';
import { ScrollView, View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import {
  MapPin,
  Phone,
  BadgeCheck,
  Truck,
  Star,
  Store,
  FileBadge,
} from 'lucide-react-native';
import {
  AppText,
  Badge,
  Card,
  Screen,
  ScreenHeader,
  ErrorState,
} from '@/components';
import { useTheme } from '@/theme';
import { resolveImageUrl } from '@/lib/media';
import { useMyPharmacie } from '@/features/pharmacien/hooks';

export function PharmacieProfilScreen() {
  const theme = useTheme();
  const { data, isLoading, isError, refetch } = useMyPharmacie();

  if (isLoading) {
    return (
      <Screen edges={['top']}>
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      </Screen>
    );
  }
  if (isError || !data) {
    return (
      <Screen edges={['top']}>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const uri = resolveImageUrl(data.image_url);
  const ouvert = data.statut === 'active';
  const verifie = data.statut_verification === 'verifie';

  const rows: { icon: typeof MapPin; label: string; value: string }[] = [
    { icon: MapPin, label: 'Adresse', value: data.adresse },
    { icon: Phone, label: 'Téléphone', value: data.telephone },
    {
      icon: FileBadge,
      label: 'N° autorisation',
      value: data.numero_autorisation ?? '—',
    },
    {
      icon: Truck,
      label: 'Livraison',
      value: data.livraison_disponible
        ? `Disponible${data.rayon_livraison_km ? ` · ${data.rayon_livraison_km} km` : ''}`
        : 'Non disponible',
    },
    { icon: Star, label: 'Note moyenne', value: `${data.note_moyenne} / 5` },
  ];

  return (
    <Screen edges={['top']} padded={false}>
      <ScreenHeader title="Mon établissement" subtitle="Informations de votre officine." />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.hero}>
          {uri ? (
            <Image source={{ uri }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, { backgroundColor: theme.colors.primaryContainer }]}>
              <Store size={28} color={theme.colors.primary} />
            </View>
          )}
          <View style={styles.flex}>
            <AppText variant="h3" numberOfLines={2}>
              {data.nom_pharmacie}
            </AppText>
            <View style={styles.badges}>
              <Badge label={ouvert ? 'Ouverte' : 'Fermée'} tone={ouvert ? 'success' : 'danger'} />
              {verifie ? <Badge label="Vérifiée" tone="info" /> : null}
            </View>
          </View>
        </Card>

        {!verifie ? (
          <Card style={styles.verifCard} padding="sm">
            <BadgeCheck size={18} color={theme.colors.warning} />
            <AppText variant="small" color={theme.colors.textSecondary} style={styles.flex}>
              Votre établissement est en cours de vérification par nos équipes.
            </AppText>
          </Card>
        ) : null}

        <Card style={styles.infoCard}>
          {rows.map((r, idx) => {
            const Icon = r.icon;
            return (
              <View
                key={r.label}
                style={[styles.row, idx > 0 && styles.rowBorder, { borderTopColor: theme.colors.border }]}
              >
                <View style={[styles.rowIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Icon size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="small" color={theme.colors.textSecondary}>
                    {r.label}
                  </AppText>
                  <AppText weight="semibold">{r.value}</AppText>
                </View>
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', gap: 8, marginTop: 6 },
  verifCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoCard: { gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth },
  rowIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
});
