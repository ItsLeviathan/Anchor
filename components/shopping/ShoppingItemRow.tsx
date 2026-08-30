import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { ShoppingItem } from '../../types';

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (item: ShoppingItem) => void;
  onRemove: (item: ShoppingItem) => void;
}

export function ShoppingItemRow({ item, onToggle, onRemove }: ShoppingItemRowProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.isCompleted }}
        onPress={() => onToggle(item)}
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: item.isCompleted ? colors.accent : colors.border,
          backgroundColor: item.isCompleted ? colors.accent : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.sm,
        }}
      >
        {item.isCompleted ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
      </Pressable>
      <Text
        style={[
          typography.body,
          {
            flex: 1,
            color: item.isCompleted ? colors.textTertiary : colors.textPrimary,
            textDecorationLine: item.isCompleted ? 'line-through' : 'none',
          },
        ]}
        numberOfLines={1}
      >
        {item.name}
        {item.quantity ? ` · ${item.quantity}` : ''}
      </Text>
      <Pressable accessibilityLabel="Remove item" onPress={() => onRemove(item)} hitSlop={8}>
        <Ionicons name="close" size={16} color={colors.textTertiary} />
      </Pressable>
    </View>
  );
}
