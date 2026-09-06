import { Text, VStack } from '@expo/ui/swift-ui';
import { font, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

import type { TodayWidgetData } from '../../lib/widgets/widgetData';

/**
 * NOTE: this is the least-verified file in the whole project. expo-widgets
 * (stable since Expo SDK 56) is genuinely the current first-party way to
 * build iOS widgets without writing Swift, but I have no way to run
 * `expo prebuild` or an Xcode build here to confirm this compiles. The
 * overall shape (createWidget, the 'widget' directive, @expo/ui/swift-ui
 * components) is drawn directly from Expo's own docs; the exact modifier
 * function signatures (font/padding) are the part most likely to need a
 * small adjustment against whatever version actually resolves in your
 * install - check docs.expo.dev/versions/latest/sdk/widgets/ if this
 * doesn't build as-is.
 */
export const TodayWidget = createWidget('TodayWidget', (props: TodayWidgetData) => {
  'widget';

  return (
    <VStack modifiers={[padding({ all: 12 })]}>
      <Text modifiers={[font({ size: 12, weight: 'semibold' })]}>TODAY</Text>
      <Text modifiers={[font({ size: 15, weight: 'bold' })]}>{props.importantTaskTitle ?? 'Nothing urgent'}</Text>
      {props.nextEventLabel ? <Text modifiers={[font({ size: 12 })]}>{props.nextEventLabel}</Text> : null}
      {props.countdownLabel ? <Text modifiers={[font({ size: 11 })]}>{props.countdownLabel}</Text> : null}
    </VStack>
  );
});
