import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme/ThemeProvider';

interface ListSectionProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * iOS's "grouped/inset list" pattern (Settings, Reminders, Mail): one
 * rounded container per section holding all its rows, separated by thin
 * inset dividers, rather than each row being its own shadowed card with a
 * gap around it. That per-row-card-with-gaps look is the Material Design
 * list pattern — this is the single biggest visual tell distinguishing the
 * two, so this is the drop-in replacement for "map rows into a gapped
 * View" throughout the app's static lists. Row components using this
 * expect to be bare (their own padding, no self-rounding/shadow/margin).
 */
export function ListSection({ children, style }: ListSectionProps) {
  const { colors, radius, spacing, shadow, scheme } = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);

  if (items.length === 0) return null;

  return (
    <View
      style={[
        {
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          overflow: 'hidden',
          borderWidth: scheme === 'dark' ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.border,
        },
        shadow.sm,
        style,
      ]}
    >
      {items.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < items.length - 1 ? (
            <View
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: colors.border,
                marginLeft: spacing.md,
              }}
            />
          ) : null}
        </React.Fragment>
      ))}
    </View>
  );
}
