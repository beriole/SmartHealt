import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '@/theme';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 32 }: StarRatingProps) {
  const theme = useTheme();
  const readonly = !onChange;

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map(n => {
        const filled = n <= value;
        return (
          <Pressable
            key={n}
            disabled={readonly}
            onPress={() => onChange?.(n)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`${n} étoile${n > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              color={theme.colors.warning}
              fill={filled ? theme.colors.warning : 'transparent'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
});
