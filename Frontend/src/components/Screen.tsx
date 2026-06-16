import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Padding horizontal standard (16). Désactivable pour les listes pleine largeur. */
  padded?: boolean;
  /** Active le défilement vertical + l'évitement du clavier (formulaires longs). */
  scroll?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
}

export function Screen({
  children,
  padded = true,
  scroll = false,
  edges = ['top', 'bottom'],
  style,
}: ScreenProps) {
  const theme = useTheme();

  const body = scroll ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          padded && styles.padded,
          style,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  ) : (
    <View style={[styles.content, padded && styles.padded, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingVertical: 16 },
  padded: { paddingHorizontal: 16 },
});
