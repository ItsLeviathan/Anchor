import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

// Comfortably above the 44x44 minimum recommended touch target size.
const BUTTON_SIZE = 52;

export function AddTabButton() {
  const router = useRouter();
  const { colors, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add something"
      accessibilityHint="Opens quick actions to add a task, event, expense, or other item"
      onPress={() => router.push('/add-sheet')}
      style={({ pressed }) => [
        {
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -18,
          backgroundColor: colors.accent,
          opacity: pressed ? 0.85 : 1,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        },
      ]}
    >
      <Ionicons name="add" size={28} color="#FFFFFF" />
    </Pressable>
  );
}
