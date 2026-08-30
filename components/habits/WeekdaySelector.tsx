import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

const LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface WeekdaySelectorProps {
  value: number[];
  onChange: (days: number[]) => void;
}

export function WeekdaySelector({ value, onChange }: WeekdaySelectorProps) {
  const { colors, radius, typography } = useTheme();

  function toggle(day: number) {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day].sort());
    }
  }

  return (
    <View style={styles.row}>
      {LABELS.map((label, day) => {
        const selected = value.includes(day);
        return (
          <Pressable
            key={day}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => toggle(day)}
            style={[
              styles.circle,
              {
                borderRadius: radius.full,
                backgroundColor: selected ? colors.accent : colors.surface,
                borderColor: selected ? colors.accent : colors.border,
              },
            ]}
          >
            <Text style={[typography.subhead, { color: selected ? '#FFFFFF' : colors.textSecondary }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  circle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
