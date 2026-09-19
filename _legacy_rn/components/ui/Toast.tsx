import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore } from '../../lib/toast/toast';
import { useTheme } from '../../lib/theme/ThemeProvider';

export function ToastContainer() {
  const { colors, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <View
      style={[styles.container, { bottom: insets.bottom + spacing.lg, paddingHorizontal: spacing.lg }]}
      pointerEvents="box-none"
    >
      {toasts.map((t) => {
        const bg =
          t.type === 'error' ? colors.danger : t.type === 'success' ? colors.success : colors.surfaceElevated;
        const textColor = t.type === 'info' ? colors.textPrimary : '#FFFFFF';

        return (
          <Pressable
            key={t.id}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            onPress={() => dismiss(t.id)}
            style={[
              styles.toast,
              {
                backgroundColor: bg,
                borderRadius: radius.md,
                paddingVertical: spacing.sm + 2,
                paddingHorizontal: spacing.md,
                marginTop: spacing.xs,
              },
            ]}
          >
            <Text style={[typography.subhead, { color: textColor, flexShrink: 1 }]} numberOfLines={2}>
              {t.message}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
});
