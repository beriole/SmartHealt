import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useCartStore, selectCartCount } from '@/store/cartStore';
import { AppText } from './AppText';

interface CartButtonProps {
  onPress: () => void;
}

export function CartButton({ onPress }: CartButtonProps) {
  const theme = useTheme();
  const count = useCartStore(selectCartCount);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Panier, ${count} article(s)`}
      style={styles.container}
    >
      <ShoppingCart size={24} color={theme.colors.foreground} />
      {count > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.colors.destructive }]}>
          <AppText variant="caption" weight="bold" color={theme.colors.destructiveOn}>
            {count > 9 ? '9+' : String(count)}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
