import React, { useEffect } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '../../lib/a11y/useReducedMotion';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export function FadeInView({ children, delay = 0, duration = 220, style }: FadeInViewProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 1;
      return;
    }
    if (delay > 0) {
      const timer = setTimeout(() => {
        opacity.value = withTiming(1, { duration });
      }, delay);
      return () => clearTimeout(timer);
    }
    opacity.value = withTiming(1, { duration });
  }, [reducedMotion, delay, duration, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}
