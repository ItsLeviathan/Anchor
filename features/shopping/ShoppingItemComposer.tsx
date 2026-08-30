import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, Input, Sheet } from '../../components/ui';
import { useSession } from '../../lib/supabase/useSession';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { useAddShoppingItem, useShoppingList } from './useShoppingList';

export function ShoppingItemComposer() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;

  const { data: list, isLoading } = useShoppingList(userId);
  const addItem = useAddShoppingItem(userId);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');

  const canSave = Boolean(list) && name.trim().length > 0 && !addItem.isPending;

  async function handleSave() {
    if (!list || !canSave) return;
    await addItem.mutateAsync({ list, name, quantity: quantity.trim() || null });
    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Sheet>
        <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>
          Add to shopping list
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <>
            <Input autoFocus placeholder="Item (e.g. Milk)" value={name} onChangeText={setName} />
            <View style={{ marginTop: spacing.md }}>
              <Input placeholder="Quantity (optional)" value={quantity} onChangeText={setQuantity} />
            </View>
            <View style={{ marginTop: spacing.xl }}>
              <Button label="Add item" onPress={handleSave} disabled={!canSave} loading={addItem.isPending} />
            </View>
          </>
        )}
      </Sheet>
    </KeyboardAvoidingView>
  );
}
