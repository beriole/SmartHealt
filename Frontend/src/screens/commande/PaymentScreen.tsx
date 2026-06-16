import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { CheckCircle2, XCircle, Smartphone } from 'lucide-react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Input, OptionGroup, Screen } from '@/components';
import { useTheme } from '@/theme';
import { usePayer, usePaymentStatus } from '@/features/commande/hooks';
import { PaymentMedium } from '@/features/commande/commande.api';
import { formatFCFA } from '@/lib/format';
import { PharmacieStackParamList } from '@/navigation/types';

type PaymentRoute = RouteProp<
  { Payment: { id_commande: string; montant: number } },
  'Payment'
>;

export function PaymentScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<PharmacieStackParamList>>();
  const route = useRoute<PaymentRoute>();
  const qc = useQueryClient();
  const { id_commande, montant } = route.params;

  const [phone, setPhone] = useState('');
  const [medium, setMedium] = useState<PaymentMedium>('mobile money');
  const [initiated, setInitiated] = useState(false);

  const payer = usePayer(id_commande);
  const statusQuery = usePaymentStatus(id_commande, initiated);
  const statut = statusQuery.data?.statut_paiement;

  useEffect(() => {
    if (statut === 'paye') {
      qc.invalidateQueries({ queryKey: ['commandes'] });
      qc.invalidateQueries({ queryKey: ['commande', id_commande] });
    }
  }, [statut, qc, id_commande]);

  const onPay = () => {
    if (phone.trim().length < 9) {
      Alert.alert(t('commande.paymentTitle'), t('commande.phoneInvalid'));
      return;
    }
    payer.mutate(
      { phone: phone.trim(), medium },
      {
        onSuccess: () => setInitiated(true),
        onError: err => Alert.alert(t('commande.paymentTitle'), err.message),
      },
    );
  };

  // --- Paiement réussi ---
  if (statut === 'paye') {
    return (
      <Screen>
        <View style={styles.center}>
          <CheckCircle2 size={64} color={theme.colors.success} />
          <AppText variant="h2" center>
            {t('commande.paymentSuccess')}
          </AppText>
          <Button label={t('common.done')} onPress={() => navigation.popToTop()} />
        </View>
      </Screen>
    );
  }

  // --- Paiement échoué ---
  if (statut === 'echoue') {
    return (
      <Screen>
        <View style={styles.center}>
          <XCircle size={64} color={theme.colors.destructive} />
          <AppText variant="h2" center>
            {t('commande.paymentFailed')}
          </AppText>
          <Button
            label={t('common.retry')}
            onPress={() => setInitiated(false)}
          />
        </View>
      </Screen>
    );
  }

  // --- En attente de validation sur le téléphone ---
  if (initiated) {
    return (
      <Screen>
        <View style={styles.center}>
          <Smartphone size={64} color={theme.colors.primary} />
          <ActivityIndicator color={theme.colors.primary} />
          <AppText variant="h3" center>
            {t('commande.paymentPending')}
          </AppText>
          <AppText center color={theme.colors.textSecondary}>
            {t('commande.paymentPendingHint')}
          </AppText>
        </View>
      </Screen>
    );
  }

  // --- Formulaire de paiement ---
  return (
    <Screen scroll>
      <View style={styles.amount}>
        <AppText color={theme.colors.textSecondary}>
          {t('commande.amountToPay')}
        </AppText>
        <AppText variant="h1" color={theme.colors.primary}>
          {formatFCFA(montant)}
        </AppText>
      </View>

      <View style={styles.form}>
        <OptionGroup<PaymentMedium>
          label={t('commande.paymentMethod')}
          value={medium}
          onChange={setMedium}
          options={[
            { value: 'mobile money', label: t('commande.mtnMomo') },
            { value: 'orange money', label: t('commande.orangeMoney') },
          ]}
        />
        <Input
          label={t('commande.momoNumber')}
          required
          keyboardType="phone-pad"
          placeholder="6XXXXXXXX"
          value={phone}
          onChangeText={setPhone}
        />
        <Button
          label={t('commande.payNow')}
          loading={payer.isPending}
          onPress={onPay}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  amount: { alignItems: 'center', gap: 4, marginVertical: 24 },
  form: { gap: 16 },
});
