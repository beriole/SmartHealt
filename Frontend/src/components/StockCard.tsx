import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Plus, Check } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { StockItem } from '@/types';
import { formatFCFA } from '@/lib/format';
import { AppText } from './AppText';

interface StockCardProps {
  stock: StockItem;
  onPress?: () => void;
  onAdd?: () => void;
  inCart?: boolean;
  /** Affiche le nom de la pharmacie (recherche globale). */
  showPharmacie?: boolean;
}

export function StockCard({
  stock,
  onPress,
  onAdd,
  inCart,
  showPharmacie = true,
}: StockCardProps) {
  const theme = useTheme();
  const rupture = stock.quantite_disponible <= 0;
  const addOpacity = rupture ? 0.4 : 1;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.info}>
        <AppText weight="semibold" numberOfLines={1}>
          {stock.medicament.nom_commercial}
        </AppText>
        <AppText variant="small" color={theme.colors.textSecondary} numberOfLines={1}>
          {stock.medicament.dosage} · {stock.medicament.forme_galenique}
        </AppText>
        {showPharmacie && stock.pharmacie ? (
          <AppText variant="caption" color={theme.colors.textSecondary} numberOfLines={1}>
            {stock.pharmacie.nom_pharmacie}
          </AppText>
        ) : null}
        <AppText weight="bold" color={theme.colors.primary}>
          {formatFCFA(stock.prix_vente_fcfa)}
        </AppText>
      </View>

      {onAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter au panier"
          disabled={rupture}
          onPress={onAdd}
          hitSlop={8}
          style={[
            styles.addBtn,
            {
              backgroundColor: inCart ? theme.colors.success : theme.colors.primary,
              borderRadius: theme.radius.md,
              opacity: addOpacity,
            },
          ]}
        >
          {inCart ? (
            <Check size={20} color={theme.colors.primaryOn} />
          ) : (
            <Plus size={20} color={theme.colors.primaryOn} />
          )}
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  info: { flex: 1, gap: 2 },
  addBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
