import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, AccessibilityInfo, ViewStyle } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  /** Décalage d'apparition (ms) pour effet d'escalier. */
  delay?: number;
  /** Distance de translation verticale au départ (px). */
  offset?: number;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Apparition douce (opacité + translation) à l'apparition du composant.
 * Respecte « Réduire les animations » (Accessibilité) : rendu immédiat.
 */
export function FadeInView({ children, delay = 0, offset = 14, style }: FadeInViewProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (!mounted) return;
      if (enabled) {
        progress.setValue(1);
        setReduceMotion(true);
      } else {
        Animated.timing(progress, {
          toValue: 1,
          duration: 320,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
    });
    return () => {
      mounted = false;
    };
  }, [progress, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: reduceMotion
            ? undefined
            : [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [offset, 0],
                  }),
                },
              ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
