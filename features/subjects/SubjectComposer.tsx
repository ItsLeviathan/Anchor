import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, Input, Sheet } from '../../components/ui';
import { useSession } from '../../lib/supabase/useSession';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { useCreateSubject } from './useSubjects';

export function SubjectComposer() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;

  const createSubject = useCreateSubject(userId);

  const [name, setName] = useState('');
  const [instructor, setInstructor] = useState('');

  const canSave = Boolean(userId) && name.trim().length > 0 && !createSubject.isPending;

  async function handleSave() {
    if (!userId || !canSave) return;
    await createSubject.mutateAsync({ userId, name, instructor: instructor.trim() || null });
    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Sheet>
        <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>New subject</Text>

        <Input autoFocus placeholder="Subject name (e.g. Database Systems)" value={name} onChangeText={setName} />

        <View style={{ marginTop: spacing.md }}>
          <Input placeholder="Instructor (optional)" value={instructor} onChangeText={setInstructor} />
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button label="Add subject" onPress={handleSave} disabled={!canSave} loading={createSubject.isPending} />
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}
