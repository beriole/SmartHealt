import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  ShieldCheck,
  Info,
  TriangleAlert,
  Siren,
  LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { NiveauUrgence } from '@/types';
import { AppText } from './AppText';

interface UrgencyBadgeProps {
  niveau: NiveauUrgence;
}

export function UrgencyBadge({ niveau }: UrgencyBadgeProps) {
  const theme = useTheme();

  const config: Record<
    NiveauUrgence,
    { color: string; icon: LucideIcon; label: string }
  > = {
    faible: { color: theme.colors.success, icon: ShieldCheck, label: 'Risque faible' },
    modere: { color: theme.colors.warning, icon: Info, label: 'À surveiller' },
    urgent: { color: theme.colors.destructive, icon: TriangleAlert, label: 'Urgent' },
    tres_urgent: { color: theme.colors.destructive, icon: Siren, label: 'Très urgent' },
  };

  const { color, icon: Icon, label } = config[niveau];

  return (
    <View
      style={[styles.badge, { backgroundColor: color, borderRadius: theme.radius.pill }]}
      accessibilityLabel={`Niveau d'urgence : ${label}`}
    >
      <Icon size={16} color="#FFFFFF" />
      <AppText variant="small" weight="semibold" color="#FFFFFF">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
