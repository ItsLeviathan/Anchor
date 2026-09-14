import React, { useEffect, useRef } from 'react';
import { Animated, type ViewStyle } from 'react-native';

import { useReducedMotion } from '../../lib/a11y/useReducedMotion';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export function FadeInView({ children, delay = 0, duration = 220, style }: FadeInViewProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }
    const anim = Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reducedMotion, delay, duration, opacity]);

  return <Animated.View style={[{ opacity }, style]}>{children}</Animated.View>;
}
