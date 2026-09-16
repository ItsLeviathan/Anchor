import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { ShoppingItem } from '../../types';
import { IconBadge } from '../ui';

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (item: ShoppingItem) => void;
  onRemove: (item: ShoppingItem) => void;
}

export const ShoppingItemRow = React.memo(function ShoppingItemRow({ item, onToggle, onRemove }: ShoppingItemRowProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm + 3,
        paddingHorizontal: spacing.md,
      }}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.isCompleted }}
        accessibilityLabel={item.isCompleted ? 'Remove from cart' : 'Add to cart'}
        accessibilityHint={item.isCompleted ? 'Marks this item as not yet collected' : 'Marks this item as collected'}
        onPress={() => onToggle(item)}
        hitSlop={12}
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
      <View style={{ opacity: item.isCompleted ? 0.5 : 1, marginRight: spacing.sm }}>
        <IconBadge name="cart-outline" color={item.isCompleted ? colors.textTertiary : colors.accent} size="sm" />
      </View>
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Remove item"
        accessibilityHint="Removes this item from the shopping list"
        onPress={() => onRemove(item)}
        hitSlop={14}
      >
        <Ionicons name="close" size={16} color={colors.textTertiary} />
      </Pressable>
    </View>
  );
});
