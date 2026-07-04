import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { UploadCloud, CheckCircle2, Eye, Trash2, FileText } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface DocumentUploadProps {
  title: string;
  description: string;
  /** Nom du fichier « téléversé » (état visuel). */
  fileName?: string;
  uploaded?: boolean;
  onPick: () => void;
  onRemove?: () => void;
}

export function DocumentUpload({
  title,
  description,
  fileName,
  uploaded,
  onPick,
  onRemove,
}: DocumentUploadProps) {
  const theme = useTheme();

  if (uploaded) {
    return (
      <View
        style={[
          styles.doneCard,
          {
            backgroundColor: theme.colors.secondaryContainer + '55',
            borderColor: theme.colors.secondary,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View style={styles.doneHeader}>
          <FileText size={20} color={theme.colors.secondary} />
          <AppText weight="bold" color={theme.colors.secondary} style={styles.flex}>
            {title}
          </AppText>
          <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.secondary }]}>
            <CheckCircle2 size={12} color={theme.colors.primaryOn} />
            <AppText variant="label" color={theme.colors.primaryOn}>
              VÉRIFIÉ
            </AppText>
          </View>
        </View>
        <AppText variant="small" color={theme.colors.textSecondary}>
          {fileName ?? 'document téléversé avec succès.'}
        </AppText>
        <View style={styles.doneActions}>
          <Pressable
            style={styles.doneBtn}
            onPress={onPick}
            accessibilityRole="button"
            accessibilityLabel={`Voir ${title}`}
          >
            <Eye size={16} color={theme.colors.foreground} />
            <AppText variant="small" weight="semibold">
              Voir
            </AppText>
          </Pressable>
          <Pressable
            style={styles.doneBtn}
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Retirer ${title}`}
          >
            <Trash2 size={16} color={theme.colors.destructive} />
            <AppText variant="small" weight="semibold" color={theme.colors.destructive}>
              Retirer
            </AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPick}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      style={[
        styles.card,
        { borderColor: theme.colors.border, borderRadius: theme.radius.lg },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
        <UploadCloud size={24} color={theme.colors.primary} />
      </View>
      <AppText weight="bold" center>
        {title}
      </AppText>
      <AppText variant="small" center color={theme.colors.textSecondary}>
        {description}
      </AppText>
      <View style={[styles.pickBtn, { backgroundColor: theme.colors.primary }]}>
        <UploadCloud size={18} color={theme.colors.primaryOn} />
        <AppText weight="semibold" color={theme.colors.primaryOn}>
          Sélectionner les fichiers
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  flex: { flex: 1 },
  doneCard: { borderWidth: 1.5, padding: 16, gap: 8 },
  doneHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  doneActions: { flexDirection: 'row', gap: 16, marginTop: 4 },
  doneBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
