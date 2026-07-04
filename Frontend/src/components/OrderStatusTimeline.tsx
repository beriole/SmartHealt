import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  ShoppingBag,
  CheckCircle2,
  Pill,
  Truck,
  PackageCheck,
  Check,
  XCircle,
  LucideIcon,
} from 'lucide-react-native';
import { AppText } from './AppText';
import { useTheme } from '@/theme';
import { formatDate } from '@/lib/format';
import { StatutCommande, TypeLivraison } from '@/types';

interface Props {
  statut: StatutCommande;
  typeLivraison?: TypeLivraison;
  dateCommande?: string | null;
  dateLivraisonEffective?: string | null;
}

interface Step {
  key: StatutCommande;
  label: string;
  icon: LucideIcon;
  date?: string | null;
}

/**
 * Frise verticale de suivi d'une commande : Commandée → Confirmée → Préparée →
 * En livraison → Livrée (adaptée au retrait en pharmacie). Gère l'état annulée.
 */
export function OrderStatusTimeline({
  statut,
  typeLivraison = 'livraison_domicile',
  dateCommande,
  dateLivraisonEffective,
}: Props) {
  const theme = useTheme();
  const livraison = typeLivraison === 'livraison_domicile';

  if (statut === 'annulee') {
    return (
      <View style={[styles.cancelled, { backgroundColor: theme.colors.destructive + '14' }]}>
        <XCircle size={22} color={theme.colors.destructive} />
        <View style={styles.flex}>
          <AppText weight="semibold" color={theme.colors.destructive}>
            Commande annulée
          </AppText>
          <AppText variant="small" color={theme.colors.textSecondary}>
            Cette commande a été annulée.
          </AppText>
        </View>
      </View>
    );
  }

  const steps: Step[] = [
    { key: 'en_attente', label: 'Commande passée', icon: ShoppingBag, date: dateCommande },
    { key: 'confirmee', label: 'Confirmée par la pharmacie', icon: CheckCircle2 },
    { key: 'preparee', label: 'En préparation', icon: Pill },
    ...(livraison
      ? [{ key: 'en_livraison' as StatutCommande, label: 'En cours de livraison', icon: Truck }]
      : []),
    {
      key: 'livree',
      label: livraison ? 'Livrée' : 'Retirée en pharmacie',
      icon: PackageCheck,
      date: dateLivraisonEffective,
    },
  ];

  const order: StatutCommande[] = ['en_attente', 'confirmee', 'preparee', 'en_livraison', 'livree'];
  const currentRank = order.indexOf(statut);

  return (
    <View>
      {steps.map((step, idx) => {
        const stepRank = order.indexOf(step.key);
        const done = stepRank < currentRank;
        const current = step.key === statut;
        const active = done || current;
        const Icon = done ? Check : step.icon;
        const isLast = idx === steps.length - 1;

        return (
          <View key={step.key} style={styles.row}>
            <View style={styles.railCol}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Icon size={16} color={active ? theme.colors.primaryOn : theme.colors.outline} />
              </View>
              {!isLast ? (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: done ? theme.colors.primary : theme.colors.border },
                  ]}
                />
              ) : null}
            </View>
            <View style={styles.content}>
              <AppText
                weight={current ? 'bold' : 'medium'}
                color={active ? theme.colors.foreground : theme.colors.textSecondary}
              >
                {step.label}
              </AppText>
              {step.date ? (
                <AppText variant="small" color={theme.colors.textSecondary}>
                  {formatDate(step.date)}
                </AppText>
              ) : current ? (
                <AppText variant="small" color={theme.colors.primary}>
                  En cours…
                </AppText>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cancelled: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14 },
  row: { flexDirection: 'row', gap: 12 },
  railCol: { alignItems: 'center', width: 32 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { width: 2, flex: 1, minHeight: 22, marginVertical: 2 },
  content: { flex: 1, paddingBottom: 18, paddingTop: 4 },
  flex: { flex: 1 },
});
