import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

interface PickerEvent {
  type: string;
}

interface DueDatePickerProps {
  dueDate: Date | null;
  onChange: (date: Date | null) => void;
}

/**
 * Android's community picker is recommended to be driven imperatively (it
 * opens as a system dialog, not an inline component); iOS renders it inline.
 * This wrapper hides that split behind one prop-compatible component so
 * screens don't need platform branches of their own.
 */
export function DueDatePicker({ dueDate, onChange }: DueDatePickerProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const [iosStep, setIosStep] = useState<'date' | 'time' | null>(null);

  function openAndroidPickers() {
    DateTimePickerAndroid.open({
      value: dueDate ?? new Date(),
      mode: 'date',
      onChange: (event: PickerEvent, selectedDate?: Date) => {
        if (event.type !== 'set' || !selectedDate) return;

        DateTimePickerAndroid.open({
          value: dueDate ?? selectedDate,
          mode: 'time',
          onChange: (timeEvent: PickerEvent, selectedTime?: Date) => {
            if (timeEvent.type !== 'set' || !selectedTime) {
              onChange(selectedDate);
              return;
            }
            const combined = new Date(selectedDate);
            combined.setHours(selectedTime.getHours(), selectedTime.getMinutes());
            onChange(combined);
          },
        });
      },
    });
  }

  function handlePress() {
    if (Platform.OS === 'android') {
      openAndroidPickers();
    } else {
      setIosStep('date');
    }
  }

  function handleIosChange(event: PickerEvent, selected?: Date) {
    if (event.type === 'dismissed' || !selected) {
      setIosStep(null);
      return;
    }
    onChange(selected);
    setIosStep(iosStep === 'date' ? 'time' : null);
  }

  const label = dueDate
    ? dueDate.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Add due date';

  return (
    <View>
      <View style={[styles.row, { gap: spacing.xs }]}>
        <Pressable
          onPress={handlePress}
          style={[
            styles.field,
            { borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm + 4 },
          ]}
        >
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={[typography.body, { color: colors.textPrimary, marginLeft: spacing.xs }]}>{label}</Text>
        </Pressable>

        {dueDate ? (
          <Pressable
            accessibilityLabel="Clear due date"
            onPress={() => onChange(null)}
            style={[styles.clearButton, { borderColor: colors.border, borderRadius: radius.md }]}
          >
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {Platform.OS === 'ios' && iosStep ? (
        <DateTimePicker
          value={dueDate ?? new Date()}
          mode={iosStep}
          display="spinner"
          onChange={handleIosChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderWidth: StyleSheet.hairlineWidth },
  clearButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
});
