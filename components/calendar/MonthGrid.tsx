import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isSameDay, type CalendarCell } from '../../lib/calendar/monthGrid';
import { useTheme } from '../../lib/theme/ThemeProvider';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface MonthGridProps {
  cells: CalendarCell[];
  selectedDate: Date;
  today: Date;
  hasItems: (date: Date) => boolean;
  onSelectDate: (date: Date) => void;
}

export function MonthGrid({ cells, selectedDate, today, hasItems, onSelectDate }: MonthGridProps) {
  const { colors, radius, typography } = useTheme();

  return (
    <View>
      <View style={styles.row}>
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={`${label}-${index}`} style={styles.cell}>
            <Text style={[typography.caption, { color: colors.textTertiary }]}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.row}>
        {cells.map((cell) => {
          const selected = isSameDay(cell.date, selectedDate);
          const isToday = isSameDay(cell.date, today);
          const showDot = hasItems(cell.date);

          return (
            <Pressable
              key={cell.date.toISOString()}
              onPress={() => onSelectDate(cell.date)}
              style={styles.cell}
              accessibilityRole="button"
              accessibilityLabel={cell.date.toLocaleDateString()}
            >
              <View
                style={[
                  styles.dayCircle,
                  {
                    borderRadius: radius.full,
                    backgroundColor: selected ? colors.accent : 'transparent',
                    borderWidth: isToday && !selected ? 1.5 : 0,
                    borderColor: colors.accent,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.body,
                    { color: selected ? '#FFFFFF' : cell.isCurrentMonth ? colors.textPrimary : colors.textTertiary },
                  ]}
                >
                  {cell.date.getDate()}
                </Text>
              </View>
              <View style={[styles.dot, { backgroundColor: showDot ? colors.accent : 'transparent' }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 6 },
  dayCircle: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
