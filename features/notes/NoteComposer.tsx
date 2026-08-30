import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, Input, Sheet } from '../../components/ui';
import { useSession } from '../../lib/supabase/useSession';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { useCreateNote } from './useNotes';

export function NoteComposer() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;

  const createNote = useCreateNote(userId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsText, setTagsText] = useState('');

  const canSave = Boolean(userId) && content.trim().length > 0 && !createNote.isPending;

  async function handleSave() {
    if (!userId || !canSave) return;

    const tags = tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    await createNote.mutateAsync({
      userId,
      title: title.trim() || null,
      content: content.trim(),
      tags,
    });

    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Sheet>
        <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>New note</Text>

        <Input placeholder="Title (optional)" value={title} onChangeText={setTitle} />

        <View style={{ marginTop: spacing.md }}>
          <Input
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholder="Write your note…"
            value={content}
            onChangeText={setContent}
            style={{ minHeight: 140 }}
          />
        </View>

        <View style={{ marginTop: spacing.md }}>
          <Input placeholder="Tags, comma separated (optional)" value={tagsText} onChangeText={setTagsText} />
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button label="Save note" onPress={handleSave} disabled={!canSave} loading={createNote.isPending} />
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}
