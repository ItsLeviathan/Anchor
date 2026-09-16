import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddTabButton } from '../../components/navigation/AddTabButton';
import { TAB_BAR_BOTTOM_MARGIN, TAB_BAR_HEIGHT, TAB_BAR_SIDE_MARGIN } from '../../components/navigation/tabBarMetrics';
import { useTheme } from '../../lib/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors, radius, shadow, scheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          left: TAB_BAR_SIDE_MARGIN,
          right: TAB_BAR_SIDE_MARGIN,
          bottom: insets.bottom + TAB_BAR_BOTTOM_MARGIN,
          height: TAB_BAR_HEIGHT,
          borderRadius: radius.full,
          backgroundColor: colors.surfaceElevated,
          borderTopWidth: 0,
          borderWidth: scheme === 'dark' ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.border,
          ...shadow.lg,
        },
      }}
    >
      <Tabs.Screen
        name="today/index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Ionicons name="sunny-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar/index"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarButton: () => <AddTabButton />,
        }}
        listeners={{
          tabPress: (e) => {
            // This isn't a real destination — pressing it opens the Add
            // modal (see AddTabButton) instead of switching tabs.
            e.preventDefault();
          },
        }}
      />
      <Tabs.Screen
        name="life/index"
        options={{
          title: 'Life',
          tabBarIcon: ({ color, size }) => <Ionicons name="leaf-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights/index"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
