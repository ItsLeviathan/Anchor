import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { DocumentCategorySelector } from '../../components/documents/DocumentCategorySelector';
import { DueDatePicker } from '../../components/tasks/DueDatePicker';
import { Button, Input, Sheet } from '../../components/ui';
import { useSession } from '../../lib/supabase/useSession';
import { useTheme } from '../../lib/theme/ThemeProvider';
import type { DocumentCategory } from '../../types';
import type { PickedFile } from './api';
import { useCreateDocument } from './useDocuments';

function toDatePart(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DocumentComposer() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;

  const createDocument = useCreateDocument(userId);

  const [file, setFile] = useState<PickedFile | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('ID');
  const [issueDate, setIssueDate] = useState<Date | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [pickError, setPickError] = useState<string | null>(null);

  const canSave = Boolean(userId) && Boolean(file) && name.trim().length > 0 && !createDocument.isPending;

  async function handlePickFile() {
    setPickError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? null, size: asset.size ?? null });
      if (!name.trim()) setName(asset.name.replace(/\.[^/.]+$/, ''));
    } catch (err) {
      console.error('Document pick failed', err);
      setPickError("Couldn't open the file picker. Try again.");
    }
  }

  async function handleSave() {
    if (!userId || !file || !canSave) return;

    await createDocument.mutateAsync({
      userId,
      name,
      category,
      file,
      issueDate: issueDate ? toDatePart(issueDate) : null,
      expirationDate: expirationDate ? toDatePart(expirationDate) : null,
      notes: notes.trim() || null,
    });

    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Sheet>
        <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>
          Add document
        </Text>

        <Button
          label={file ? `Selected: ${file.name}` : 'Choose a file'}
          variant="secondary"
          onPress={handlePickFile}
        />
        {pickError ? (
          <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>{pickError}</Text>
        ) : null}

        <View style={{ marginTop: spacing.md }}>
          <Input placeholder="Name (e.g. Passport)" value={name} onChangeText={setName} />
        </View>

        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.md, marginBottom: spacing.xs }]}>
          CATEGORY
        </Text>
        <DocumentCategorySelector value={category} onChange={setCategory} />

        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.md, marginBottom: spacing.xs }]}>
          ISSUE DATE (OPTIONAL)
        </Text>
        <DueDatePicker dueDate={issueDate} onChange={setIssueDate} mode="date" label="Set issue date" />

        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.md, marginBottom: spacing.xs }]}>
          EXPIRATION DATE (OPTIONAL)
        </Text>
        <DueDatePicker dueDate={expirationDate} onChange={setExpirationDate} mode="date" label="Set expiration date" />

        <View style={{ marginTop: spacing.md }}>
          <Input placeholder="Notes (optional)" value={notes} onChangeText={setNotes} />
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button label="Save document" onPress={handleSave} disabled={!canSave} loading={createDocument.isPending} />
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}
