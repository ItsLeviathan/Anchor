import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddTabButton } from '../../components/navigation/AddTabButton';
import { TAB_BAR_BOTTOM_MARGIN, TAB_BAR_HEIGHT, TAB_BAR_SIDE_MARGIN } from '../../components/navigation/tabBarMetrics';
import { useTheme } from '../../lib/theme/ThemeProvider';

type IconName = keyof typeof Ionicons.glyphMap;

/** iOS's tab bar distinguishes the selected tab with a filled glyph, not a
 *  background pill or color-only change — the outline icon is the resting
 *  state, and its filled counterpart swaps in on focus. */
function tabIcon(outline: IconName, filled: IconName) {
  return ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={focused ? filled : outline} size={size} color={color as string} />
  );
}

export default function TabsLayout() {
  const { colors, radius, scheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        // A translucent, blurred bar (rather than an opaque fill) is the
        // single biggest tell for native iOS chrome vs. a flat Material
        // surface — tabBarBackground renders behind the icons/labels while
        // tabBarStyle itself stays transparent.
        tabBarBackground: () => (
          <BlurView
            intensity={72}
            tint={scheme === 'dark' ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.full, overflow: 'hidden' }]}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          left: TAB_BAR_SIDE_MARGIN,
          right: TAB_BAR_SIDE_MARGIN,
          bottom: insets.bottom + TAB_BAR_BOTTOM_MARGIN,
          height: TAB_BAR_HEIGHT,
          borderRadius: radius.full,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          elevation: 0,
          shadowColor: '#000',
          shadowOpacity: scheme === 'dark' ? 0.3 : 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
        },
      }}
    >
      <Tabs.Screen
        name="today/index"
        options={{ title: 'Today', tabBarIcon: tabIcon('sunny-outline', 'sunny') }}
      />
      <Tabs.Screen
        name="calendar/index"
        options={{ title: 'Calendar', tabBarIcon: tabIcon('calendar-outline', 'calendar') }}
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
        options={{ title: 'Life', tabBarIcon: tabIcon('leaf-outline', 'leaf') }}
      />
      <Tabs.Screen
        name="insights/index"
        options={{ title: 'Insights', tabBarIcon: tabIcon('bar-chart-outline', 'bar-chart') }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{ title: 'Profile', tabBarIcon: tabIcon('person-outline', 'person') }}
      />
    </Tabs>
  );
}
