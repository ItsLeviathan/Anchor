import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, FormSection, Input, Sheet } from '../../components/ui';
import { parseBrainDumpText, type BrainDumpParsedItem } from '../../lib/braindump/parse';
import { useSession } from '../../lib/supabase/useSession';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { useCategories } from '../categories/useCategories';
import { useCreateTask } from '../tasks/useTasks';

interface PreviewItem extends BrainDumpParsedItem {
  selected: boolean;
}

type Status = 'idle' | 'preview' | 'creating';

export function BrainDumpComposer() {
  const router = useRouter();
  const { colors, spacing, typography, radius } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;

  const { data: categories = [] } = useCategories(userId);
  const createTask = useCreateTask(userId);

  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [items, setItems] = useState<PreviewItem[]>([]);

  const categoryIdByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) map.set(category.name.toLowerCase(), category.id);
    return map;
  }, [categories]);

  const groupedByCategory = useMemo(() => {
    const groups = new Map<string, PreviewItem[]>();
    for (const item of items) {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    }
    return Array.from(groups.entries());
  }, [items]);

  const selectedCount = items.filter((item) => item.selected).length;

  function handleOrganize() {
    if (!text.trim()) return;
    const result = parseBrainDumpText(text, categories);
    setItems(result.items.map((item) => ({ ...item, selected: true })));
    setStatus('preview');
  }

  function toggleItem(index: number) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item)));
  }

  async function handleConfirm() {
    if (!userId) return;
    setStatus('creating');

    // Items already created before a failure stay created - only the
    // remaining ones need to be retried, so failed items are removed from
    // the list rather than resetting the whole batch.
    const remaining: PreviewItem[] = [];
    let failedCount = 0;

    for (const item of items) {
      if (!item.selected) {
        remaining.push(item);
        continue;
      }
      try {
        await createTask.mutateAsync({
          userId,
          title: item.title,
          categoryId: categoryIdByName.get(item.category.toLowerCase()) ?? null,
          dueDate: item.dueDate,
        });
      } catch (err) {
        console.error('Failed to create task from brain dump', err);
        failedCount += 1;
        remaining.push(item);
      }
    }

    if (failedCount > 0) {
      // The global mutation error handler (lib/query/queryClient.ts) already
      // toasts per failed item; just return to the preview with only the
      // failed items left, so the user can retry them instead of staying
      // stuck on a spinner or losing the ones that already succeeded.
      setItems(remaining);
      setStatus('preview');
      return;
    }

    router.back();
  }

  return (
    <Sheet>
      <Text style={[typography.title, { color: colors.textPrimary }]}>Brain Dump</Text>

      {status === 'idle' ? (
        <>
          <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md }]}>
            Write one thing per line. We'll group them by category.
          </Text>
          <Input
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholder={'Finish thesis\nBuy groceries\nPay the electricity bill'}
            value={text}
            onChangeText={setText}
            style={{ minHeight: 140 }}
          />
          <View style={{ marginTop: spacing.lg }}>
            <Button label="Organize this" onPress={handleOrganize} disabled={!text.trim()} />
          </View>
        </>
      ) : null}

      {(status === 'preview' || status === 'creating') && items.length > 0 ? (
        <View style={{ marginTop: spacing.md }}>
          <Text style={[typography.subhead, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            I found {items.length} {items.length === 1 ? 'thing' : 'things'}.
          </Text>

          {groupedByCategory.map(([category, categoryItems]) => (
            <FormSection key={category} label={category} icon="pricetag-outline" style={{ marginBottom: spacing.md }}>
              {categoryItems.map((item) => {
                const globalIndex = items.indexOf(item);
                return (
                  <Pressable
                    key={`${item.title}-${globalIndex}`}
                    onPress={() => toggleItem(globalIndex)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: radius.sm,
                        borderWidth: 2,
                        borderColor: item.selected ? colors.accent : colors.border,
                        backgroundColor: item.selected ? colors.accent : 'transparent',
                        marginRight: spacing.sm,
                      }}
                    />
                    <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.dueDate ? (
                      <Text style={[typography.caption, { color: colors.textTertiary }]}>{item.dueDate}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </FormSection>
          ))}

          <Button
            label={status === 'creating' ? 'Adding…' : `Add ${selectedCount} ${selectedCount === 1 ? 'task' : 'tasks'}`}
            onPress={handleConfirm}
            disabled={selectedCount === 0 || status === 'creating'}
            loading={status === 'creating'}
          />
        </View>
      ) : null}
    </Sheet>
  );
}
