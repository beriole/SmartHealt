import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '@/store/cartStore';
import { StockItem } from '@/types';

/**
 * Ajoute un article au panier. Si l'article provient d'une autre pharmacie,
 * propose de remplacer le panier (une commande = une seule pharmacie).
 */
export function useAddToCart() {
  const add = useCartStore(s => s.add);
  const { t } = useTranslation();

  return (stock: StockItem) => {
    const result = add(stock);
    if (result.conflict) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        t('pharmacie.cartConflictTitle'),
        t('pharmacie.cartConflictBody'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('pharmacie.replaceCart'),
            style: 'destructive',
            onPress: () => add(stock, true),
          },
        ],
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };
}
