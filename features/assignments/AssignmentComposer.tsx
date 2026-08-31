import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { AssignmentKindSelector } from '../../components/subjects/AssignmentKindSelector';
import { DueDatePicker } from '../../components/tasks/DueDatePicker';
import { Button, Input, Sheet } from '../../components/ui';
import { useSession } from '../../lib/supabase/useSession';
import { useTheme } from '../../lib/theme/ThemeProvider';
import type { AssignmentKind } from '../../types';
import { useSubjects } from '../subjects/useSubjects';
import { useCreateAssignment } from './useAssignments';

function toDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function AssignmentComposer() {
  const router = useRouter();
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const { colors, spacing, typography } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;

  const { data: subjects = [] } = useSubjects(userId);
  const subject = subjects.find((s) => s.id === subjectId);
  const createAssignment = useCreateAssignment(userId);

  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<AssignmentKind>('assignment');
  const [dueDate, setDueDate] = useState<Date | null>(null);

  const canSave = Boolean(userId) && Boolean(subjectId) && title.trim().length > 0 && !createAssignment.isPending;

  async function handleSave() {
    if (!userId || !subjectId || !canSave) return;

    await createAssignment.mutateAsync({
      userId,
      subjectId,
      kind,
      title,
      dueDate: dueDate ? toDatePart(dueDate) : null,
    });

    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Sheet>
        <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.xs }]}>New item</Text>
        {subject ? (
          <Text style={[typography.subhead, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            {subject.name}
          </Text>
        ) : null}

        <AssignmentKindSelector value={kind} onChange={setKind} />

        <View style={{ marginTop: spacing.md }}>
          <Input autoFocus placeholder="Title" value={title} onChangeText={setTitle} />
        </View>

        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.md, marginBottom: spacing.xs }]}>
          DUE
        </Text>
        <DueDatePicker dueDate={dueDate} onChange={setDueDate} mode="date" label="Set due date" />

        <View style={{ marginTop: spacing.xl }}>
          <Button label="Save" onPress={handleSave} disabled={!canSave} loading={createAssignment.isPending} />
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}
