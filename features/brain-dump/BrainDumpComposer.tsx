import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AiLimitReachedNotice } from '../../components/ai/AiLimitReachedNotice';
import { Button, Input, Sheet } from '../../components/ui';
import { useSession } from '../../lib/supabase/useSession';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { AiLimitReachedError, requestBrainDump, type BrainDumpItemResult } from '../ai/aiClient';
import { useRemainingAiActions } from '../ai/useAiUsage';
import { useCategories } from '../categories/useCategories';
import { useCreateTask } from '../tasks/useTasks';

interface PreviewItem extends BrainDumpItemResult {
  selected: boolean;
}

type Status = 'idle' | 'loading' | 'preview' | 'creating' | 'limit_reached' | 'error';

export function BrainDumpComposer() {
  const router = useRouter();
  const { colors, spacing, typography, radius } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;

  const { data: categories = [] } = useCategories(userId);
  const createTask = useCreateTask(userId);
  const { remaining, isLoading: isUsageLoading } = useRemainingAiActions(userId);

  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [limitInfo, setLimitInfo] = useState<{ limit: number; used: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  const isBusy = status === 'loading' || status === 'creating';

  async function handleOrganize() {
    if (!text.trim()) return;
    setStatus('loading');
    setErrorMessage(null);

    try {
      const response = await requestBrainDump(text.trim());
      setItems(response.items.map((item) => ({ ...item, selected: true })));
      setStatus('preview');
    } catch (err) {
      if (err instanceof AiLimitReachedError) {
        setLimitInfo({ limit: err.limit, used: err.used });
        setStatus('limit_reached');
      } else {
        console.error('Brain dump failed', err);
        setErrorMessage("We couldn't process that. Check your connection and try again.");
        setStatus('error');
      }
    }
  }

  function toggleItem(index: number) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item)));
  }

  async function handleConfirm() {
    if (!userId) return;
    setStatus('creating');

    for (const item of items) {
      if (!item.selected) continue;
      await createTask.mutateAsync({
        userId,
        title: item.title,
        categoryId: categoryIdByName.get(item.category.toLowerCase()) ?? null,
        dueDate: item.dueDate,
      });
    }

    router.back();
  }

  return (
    <Sheet>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[typography.title, { color: colors.textPrimary }]}>Brain Dump</Text>
          {!isUsageLoading && (status === 'idle' || status === 'error') ? (
            <Text style={[typography.caption, { color: colors.textTertiary }]}>{remaining} left this month</Text>
          ) : null}
        </View>

        {status === 'idle' || status === 'loading' || status === 'error' ? (
          <>
            <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md }]}>
              Write down everything on your mind. Don't organize it — just write.
            </Text>
            <Input
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder="I need to finish my thesis, buy groceries, pay the electricity bill Monday..."
              value={text}
              onChangeText={setText}
              editable={status !== 'loading'}
              style={{ minHeight: 140 }}
            />
            {errorMessage ? (
              <Text style={[typography.subhead, { color: colors.danger, marginTop: spacing.sm }]}>{errorMessage}</Text>
            ) : null}
            <View style={{ marginTop: spacing.lg }}>
              <Button
                label={status === 'loading' ? 'Organizing…' : 'Organize this'}
                onPress={handleOrganize}
                disabled={!text.trim() || isBusy}
                loading={status === 'loading'}
              />
            </View>
          </>
        ) : null}

        {status === 'limit_reached' && limitInfo ? (
          <View style={{ marginTop: spacing.md }}>
            <AiLimitReachedNotice limit={limitInfo.limit} onDismiss={() => router.back()} />
          </View>
        ) : null}

        {(status === 'preview' || status === 'creating') && items.length > 0 ? (
          <View style={{ marginTop: spacing.md }}>
            <Text style={[typography.subhead, { color: colors.textSecondary, marginBottom: spacing.md }]}>
              I found {items.length} {items.length === 1 ? 'thing' : 'things'}.
            </Text>

            {groupedByCategory.map(([category, categoryItems]) => (
              <View key={category} style={{ marginBottom: spacing.md }}>
                <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
                  {category.toUpperCase()}
                </Text>
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
              </View>
            ))}

            <Button
              label={status === 'creating' ? 'Adding…' : `Add ${selectedCount} ${selectedCount === 1 ? 'task' : 'tasks'}`}
              onPress={handleConfirm}
              disabled={selectedCount === 0 || status === 'creating'}
              loading={status === 'creating'}
            />
          </View>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}
