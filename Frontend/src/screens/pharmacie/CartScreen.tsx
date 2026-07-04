import React from 'react';
import { View, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { Minus, Plus, Trash2, Pill, ShoppingCart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, EmptyState, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useCartStore, selectCartTotal, CartLine } from '@/store/cartStore';
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
    <Card style={styles.line} padding="sm">
      <View style={[styles.thumb, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Pill size={24} color={theme.colors.primary} />
      </View>

      <View style={styles.lineInfo}>
        <AppText weight="bold" numberOfLines={1}>
          {item.nom}
        </AppText>
        <AppText color={theme.colors.primary} weight="bold" variant="bodyLg">
          {formatFCFA(item.prix * item.quantite)}
        </AppText>
      </View>

      <View style={styles.stepper}>
        <Stepper
          onPress={() => setQty(item.id_stock, item.quantite - 1)}
          icon={<Minus size={16} color={theme.colors.primary} />}
          disabled={item.quantite <= 1}
        />
        <AppText weight="bold" style={styles.qty}>
          {item.quantite}
        </AppText>
        <Stepper
          onPress={() => setQty(item.id_stock, item.quantite + 1)}
          icon={<Plus size={16} color={theme.colors.primary} />}
          disabled={item.quantite >= item.quantite_max}
        />
        <Pressable
          onPress={() => remove(item.id_stock)}
          hitSlop={8}
          accessibilityLabel={t('pharmacie.removeItem')}
          style={styles.trash}
        >
          <Trash2 size={18} color={theme.colors.destructive} />
        </Pressable>
      </View>
    </Card>
  );

  return (
    <Screen padded={false}>
      <View style={styles.listHeader}>
        <AppText variant="h3" weight="semibold">
          Articles ({items.length})
        </AppText>
        <Pressable
          onPress={() =>
            Alert.alert(t('pharmacie.clearCart'), t('pharmacie.clearCartConfirm'), [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('pharmacie.clearCart'), style: 'destructive', onPress: clear },
            ])
          }
        >
          <AppText variant="small" weight="semibold" color={theme.colors.primary}>
            Tout vider
          </AppText>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id_stock}
        contentContainerStyle={styles.list}
        renderItem={renderLine}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <Card style={styles.summary} elevated={false}>
            {nomPharmacie ? (
              <View style={styles.sumRow}>
                <AppText color={theme.colors.textSecondary}>Pharmacie</AppText>
                <AppText weight="semibold" numberOfLines={1} style={styles.sumValue}>
                  {nomPharmacie}
                </AppText>
              </View>
            ) : null}
            <View style={styles.sumRow}>
              <AppText color={theme.colors.textSecondary}>Sous-total</AppText>
              <AppText weight="semibold">{formatFCFA(total)}</AppText>
            </View>
            <AppText variant="caption" color={theme.colors.outline}>
              Livraison et taxes calculées à l'étape suivante.
            </AppText>
          </Card>
        }
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
          icon={<ShoppingCart size={20} color={theme.colors.primaryOn} />}
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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={[
        styles.stepBtn,
        {
          backgroundColor: theme.colors.surfaceContainerHigh,
          borderRadius: theme.radius.sm,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  list: { padding: 16, gap: 12 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineInfo: { flex: 1, gap: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qty: { minWidth: 18, textAlign: 'center' },
  stepBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trash: { marginLeft: 4, padding: 4 },
  summary: { gap: 8, marginTop: 4 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumValue: { flex: 1, textAlign: 'right', marginLeft: 12 },
  footer: { padding: 16, gap: 12, borderTopWidth: 1 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
