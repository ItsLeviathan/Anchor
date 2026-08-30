import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { getDocumentSignedUrl } from '../../features/documents/api';
import { formatExpirationLabel, getExpirationStatus } from '../../lib/documents/expiration';
import { useTheme } from '../../lib/theme/ThemeProvider';
import type { AnchorDocument } from '../../types';

interface DocumentListItemProps {
  document: AnchorDocument;
  onDelete: (document: AnchorDocument) => void;
}

export function DocumentListItem({ document, onDelete }: DocumentListItemProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const [isOpening, setIsOpening] = useState(false);

  const status = getExpirationStatus(document.expirationDate);
  const label = formatExpirationLabel(document.expirationDate);
  const captionColor = status === 'expired' ? colors.danger : status === 'soon' ? '#D98A3D' : colors.textTertiary;

  async function handleOpen() {
    setIsOpening(true);
    try {
      const url = await getDocumentSignedUrl(document.storagePath);
      await Linking.openURL(url);
    } catch (err) {
      console.error('Failed to open document', err);
      Alert.alert("Couldn't open document", 'Check your connection and try again.');
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <Pressable
      onPress={handleOpen}
      disabled={isOpening}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
      }}
    >
      <Ionicons name="document-text-outline" size={22} color={colors.accent} />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={[typography.body, { color: colors.textPrimary }]} numberOfLines={1}>
          {document.name}
        </Text>
        <Text style={[typography.caption, { color: captionColor, marginTop: 2 }]} numberOfLines={1}>
          {document.category}
          {label ? ` · ${label}` : ''}
        </Text>
      </View>
      <Pressable accessibilityLabel="Delete document" onPress={() => onDelete(document)} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
      </Pressable>
    </Pressable>
  );
}
