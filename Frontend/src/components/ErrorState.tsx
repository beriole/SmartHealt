import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <TriangleAlert size={48} color={theme.colors.destructive} />
      <AppText center color={theme.colors.textSecondary}>
        {message ?? t('common.errorGeneric')}
      </AppText>
      {onRetry ? (
        <Button label={t('common.retry')} onPress={onRetry} fullWidth={false} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
});
