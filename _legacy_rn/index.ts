import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './widgets/android/widgetTaskHandler';

registerWidgetTaskHandler(widgetTaskHandler);

// A require() here (not a static import) is deliberate: static imports are
// hoisted and would run before registerWidgetTaskHandler above regardless
// of where they're written, which would defeat the point. require() runs
// inline, guaranteeing this boots the app only after registration.
require('expo-router/entry');
