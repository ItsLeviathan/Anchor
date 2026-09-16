import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { getDocumentSignedUrl } from '../../features/documents/api';
import { formatExpirationLabel, getExpirationStatus } from '../../lib/documents/expiration';
import { useTheme } from '../../lib/theme/ThemeProvider';
import type { AnchorDocument, DocumentCategory } from '../../types';
import { Card, IconBadge } from '../ui';

interface DocumentListItemProps {
  document: AnchorDocument;
  onDelete: (document: AnchorDocument) => void;
}

const CATEGORY_ICONS: Record<DocumentCategory, keyof typeof Ionicons.glyphMap> = {
  ID: 'card-outline',
  School: 'school-outline',
  Certificate: 'ribbon-outline',
  Contract: 'document-text-outline',
  Other: 'folder-open-outline',
};

export const DocumentListItem = React.memo(function DocumentListItem({ document, onDelete }: DocumentListItemProps) {
  const { colors, spacing, typography } = useTheme();
  const [isOpening, setIsOpening] = useState(false);

  const status = getExpirationStatus(document.expirationDate);
  const label = formatExpirationLabel(document.expirationDate);
  const badgeColor = status === 'expired' ? colors.danger : status === 'soon' ? '#D98A3D' : colors.accent;
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
      accessibilityRole="button"
      accessibilityLabel={`Open ${document.name}`}
      accessibilityHint="Opens this document in your browser or viewer"
      accessibilityState={{ busy: isOpening }}
      onPress={handleOpen}
      disabled={isOpening}
    >
      <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconBadge name={CATEGORY_ICONS[document.category] ?? 'folder-open-outline'} color={badgeColor} size="sm" />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[typography.body, { color: colors.textPrimary }]} numberOfLines={1}>
            {document.name}
          </Text>
          <Text style={[typography.caption, { color: captionColor, marginTop: 2 }]} numberOfLines={1}>
            {document.category}
            {label ? ` · ${label}` : ''}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete document"
          accessibilityHint="Permanently removes this document"
          onPress={() => onDelete(document)}
          hitSlop={13}
        >
          <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
        </Pressable>
      </Card>
    </Pressable>
  );
});
