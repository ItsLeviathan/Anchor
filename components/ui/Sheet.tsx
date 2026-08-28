import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

export function Sheet({ children }: { children: React.ReactNode }) {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />
      <View style={{ padding: spacing.lg, flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
});
