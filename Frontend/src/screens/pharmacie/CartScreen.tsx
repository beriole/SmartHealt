import React from 'react';
import { View, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, EmptyState, Screen } from '@/components';
import { useTheme } from '@/theme';
import {
  useCartStore,
  selectCartTotal,
  CartLine,
} from '@/store/cartStore';
import { formatFCFA } from '@/lib/format';
import { PharmacieStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<PharmacieStackParamList, 'Cart'>;

export function CartScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const items = useCartStore(s => s.items);
  const nomPharmacie = useCartStore(s => s.nom_pharmacie);
  const setQty = useCartStore(s => s.setQty);
  const remove = useCartStore(s => s.remove);
  const clear = useCartStore(s => s.clear);
  const total = useCartStore(selectCartTotal);

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState
          title={t('pharmacie.cartEmptyTitle')}
          description={t('pharmacie.cartEmptyBody')}
        />
      </Screen>
    );
  }

  const renderLine = ({ item }: { item: CartLine }) => (
    <Card style={styles.line}>
      <View style={styles.lineInfo}>
        <AppText weight="semibold" numberOfLines={1}>
          {item.nom}
        </AppText>
        <AppText color={theme.colors.primary} weight="bold">
          {formatFCFA(item.prix * item.quantite)}
        </AppText>
      </View>

      <View style={styles.stepper}>
        <Stepper
          onPress={() => setQty(item.id_stock, item.quantite - 1)}
          icon={<Minus size={18} color={theme.colors.foreground} />}
          disabled={item.quantite <= 1}
        />
        <AppText weight="semibold">{item.quantite}</AppText>
        <Stepper
          onPress={() => setQty(item.id_stock, item.quantite + 1)}
          icon={<Plus size={18} color={theme.colors.foreground} />}
          disabled={item.quantite >= item.quantite_max}
        />
        <Pressable
          onPress={() => remove(item.id_stock)}
          hitSlop={8}
          accessibilityLabel={t('pharmacie.removeItem')}
          style={styles.trash}
        >
          <Trash2 size={20} color={theme.colors.destructive} />
        </Pressable>
      </View>
    </Card>
  );

  return (
    <Screen padded={false}>
      {nomPharmacie ? (
        <AppText variant="small" color={theme.colors.textSecondary} style={styles.pharma}>
          {t('pharmacie.orderFrom', { name: nomPharmacie })}
        </AppText>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={item => item.id_stock}
        contentContainerStyle={styles.list}
        renderItem={renderLine}
      />

      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <View style={styles.totalRow}>
          <AppText variant="body" weight="semibold">
            {t('pharmacie.total')}
          </AppText>
          <AppText variant="h3" color={theme.colors.primary}>
            {formatFCFA(total)}
          </AppText>
        </View>
        <Button
          label={t('pharmacie.checkout')}
          onPress={() => navigation.navigate('Checkout')}
        />
        <Button
          label={t('pharmacie.clearCart')}
          variant="ghost"
          onPress={() =>
            Alert.alert(t('pharmacie.clearCart'), t('pharmacie.clearCartConfirm'), [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('pharmacie.clearCart'), style: 'destructive', onPress: clear },
            ])
          }
        />
      </View>
    </Screen>
  );
}

function Stepper({
  onPress,
  icon,
  disabled,
}: {
  onPress: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const opacity = disabled ? 0.4 : 1;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={[
        styles.stepBtn,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          opacity,
        },
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pharma: { paddingHorizontal: 16, paddingTop: 12 },
  list: { padding: 16, gap: 12 },
  line: { gap: 12 },
  lineInfo: { gap: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trash: { marginLeft: 'auto', padding: 4 },
  footer: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
