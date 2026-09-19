import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import { useSyncStatus, type SyncStatus } from '../../lib/sync/useSyncStatus';

const LABELS: Record<SyncStatus, string> = {
  synced: 'Synced',
  saving: 'Saving…',
  offline: 'Offline',
  waiting: 'Waiting to sync',
};

export function SyncStatusBadge() {
  const status = useSyncStatus();
  const { colors, spacing, typography } = useTheme();

  const dotColor = status === 'synced' ? colors.success : status === 'offline' ? colors.textTertiary : colors.accent;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor, marginRight: spacing.xs }} />
      <Text style={[typography.caption, { color: colors.textTertiary }]}>{LABELS[status]}</Text>
    </View>
  );
}
