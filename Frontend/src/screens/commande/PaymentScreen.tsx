import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { CheckCircle2, XCircle, Smartphone } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, Input, OptionGroup, Screen } from '@/components';
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['commandes'] });
      qc.invalidateQueries({ queryKey: ['commande', id_commande] });
    } else if (statut === 'echoue') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      <Screen scroll>
        <View style={styles.success}>
          <View
            style={[
              styles.successCircle,
              { backgroundColor: theme.colors.secondaryContainer },
            ]}
          >
            <CheckCircle2 size={48} color={theme.colors.secondary} />
          </View>
          <AppText variant="h2" center color={theme.colors.primary}>
            {t('commande.paymentSuccess')}
          </AppText>
          <AppText center color={theme.colors.textSecondary}>
            Merci pour votre confiance, votre commande est en cours de traitement.
          </AppText>
        </View>

        <Card style={styles.successCard}>
          <View style={styles.successRow}>
            <AppText variant="label" color={theme.colors.outline}>
              NUMÉRO DE COMMANDE
            </AppText>
            <AppText weight="bold">#{id_commande.slice(0, 8).toUpperCase()}</AppText>
          </View>
          <View style={[styles.successDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.successRow}>
            <AppText color={theme.colors.textSecondary}>Montant réglé</AppText>
            <AppText weight="bold" color={theme.colors.primary} variant="bodyLg">
              {formatFCFA(montant)}
            </AppText>
          </View>
        </Card>

        <View style={styles.successActions}>
          <Button
            label={t('commande.trackOrder')}
            onPress={() => navigation.popToTop()}
          />
          <Button
            label={t('commande.backHome')}
            variant="secondary"
            onPress={() => navigation.popToTop()}
          />
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
          variant="card"
          value={medium}
          onChange={setMedium}
          options={[
            {
              value: 'mobile money',
              label: t('commande.mtnMomo'),
              description: t('commande.instantPayment'),
              icon: <OperatorBadge code="MTN" color="#FFCC00" textColor="#1A1A1A" />,
            },
            {
              value: 'orange money',
              label: t('commande.orangeMoney'),
              description: t('commande.instantPayment'),
              icon: <OperatorBadge code="OM" color="#FF6600" textColor="#FFFFFF" />,
            },
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

function OperatorBadge({
  code,
  color,
  textColor,
}: {
  code: string;
  color: string;
  textColor: string;
}) {
  return (
    <View style={[styles.operator, { backgroundColor: color }]}>
      <AppText variant="label" weight="bold" color={textColor}>
        {code}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  amount: { alignItems: 'center', gap: 4, marginVertical: 24 },
  form: { gap: 16 },
  success: { alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 24 },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successCard: { gap: 12 },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successDivider: { height: 1 },
  successActions: { gap: 12, marginTop: 24 },
  operator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
