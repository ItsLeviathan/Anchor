import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';
import type { Assignment, Subject } from '../../types';
import { Card } from '../ui';

const KIND_LABELS: Record<Assignment['kind'], string> = {
  assignment: 'Assignment',
  exam: 'Exam',
  project: 'Project',
};

function formatDue(dueDate: string | null): string {
  if (!dueDate) return '';
  const [year, month, day] = dueDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface SubjectCardProps {
  subject: Subject;
  items: Assignment[];
  onToggleItem: (item: Assignment) => void;
  onDeleteItem: (item: Assignment) => void;
  onDeleteSubject: (subject: Subject) => void;
}

export function SubjectCard({ subject, items, onToggleItem, onDeleteItem, onDeleteSubject }: SubjectCardProps) {
  const router = useRouter();
  const { colors, spacing, radius, typography } = useTheme();

  const pendingItems = items.filter((item) => item.status === 'pending');

  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: subject.color, marginRight: spacing.sm }}
          />
          <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
            {subject.name}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Pressable
            accessibilityLabel="Add assignment"
            onPress={() => router.push({ pathname: '/assignment-new', params: { subjectId: subject.id } })}
            hitSlop={8}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
          </Pressable>
          <Pressable accessibilityLabel="Delete subject" onPress={() => onDeleteSubject(subject)} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>
      </View>

      {pendingItems.length === 0 ? (
        <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing.sm }]}>Nothing due.</Text>
      ) : (
        <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
          {pendingItems.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                onPress={() => onToggleItem(item)}
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 2,
                    borderColor: colors.border,
                    marginRight: spacing.sm,
                  }}
                />
                <Text style={[typography.subhead, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>
                  {KIND_LABELS[item.kind]} · {item.title}
                </Text>
                {item.dueDate ? (
                  <Text style={[typography.caption, { color: colors.textTertiary, marginRight: spacing.sm }]}>
                    {formatDue(item.dueDate)}
                  </Text>
                ) : null}
              </Pressable>
              <Pressable accessibilityLabel="Delete item" onPress={() => onDeleteItem(item)} hitSlop={8}>
                <Ionicons name="close" size={16} color={colors.textTertiary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
