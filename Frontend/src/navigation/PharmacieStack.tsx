import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { CartButton } from '@/components';
import { useTheme } from '@/theme';
import { PharmacieStackParamList } from './types';
import { PharmacieHomeScreen } from '@/screens/pharmacie/PharmacieHomeScreen';
import { MedicamentDetailScreen } from '@/screens/pharmacie/MedicamentDetailScreen';
import { PharmacieListScreen } from '@/screens/pharmacie/PharmacieListScreen';
import { PharmacieDetailScreen } from '@/screens/pharmacie/PharmacieDetailScreen';
import { CartScreen } from '@/screens/pharmacie/CartScreen';
import { CheckoutScreen } from '@/screens/commande/CheckoutScreen';
import { PaymentScreen } from '@/screens/commande/PaymentScreen';

const Stack = createNativeStackNavigator<PharmacieStackParamList>();

function HeaderCartButton() {
  const navigation =
    useNavigation<NativeStackNavigationProp<PharmacieStackParamList>>();
  return <CartButton onPress={() => navigation.navigate('Cart')} />;
}

const renderHeaderCart = () => <HeaderCartButton />;

export function PharmacieStack() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerRight: renderHeaderCart,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.foreground,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="PharmacieHome"
        component={PharmacieHomeScreen}
        options={{ title: t('tabs.pharmacie') }}
      />
      <Stack.Screen
        name="MedicamentDetail"
        component={MedicamentDetailScreen}
        options={{ title: t('pharmacie.medicamentTitle') }}
      />
      <Stack.Screen
        name="PharmacieList"
        component={PharmacieListScreen}
        options={{ title: t('pharmacie.pharmaciesTitle') }}
      />
      <Stack.Screen
        name="PharmacieDetail"
        component={PharmacieDetailScreen}
        options={({ route }) => ({ title: route.params.nom ?? t('tabs.pharmacie') })}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: t('pharmacie.cartTitle'), headerRight: undefined }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: t('commande.checkoutTitle'), headerRight: undefined }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          title: t('commande.paymentTitle'),
          headerRight: undefined,
          headerBackVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}
