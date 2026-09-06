import { Platform } from 'react-native';

import { getLocalSetting } from '../database/db';
import { getLocalWidgetSnapshot } from './getLocalWidgetSnapshot';

const CURRENT_USER_ID_KEY = 'current_user_id';

export async function refreshWidgets(): Promise<void> {
  try {
    const userId = await getLocalSetting(CURRENT_USER_ID_KEY);
    if (!userId) return;

    const data = await getLocalWidgetSnapshot(userId);

    if (Platform.OS === 'ios') {
      const { TodayWidget } = await import('../../widgets/ios/TodayWidget');
      await TodayWidget.updateSnapshot(data);
    } else if (Platform.OS === 'android') {
      const { requestWidgetUpdate } = await import('react-native-android-widget');
      const { AndroidTodayWidget } = await import('../../widgets/android/TodayWidget');
      const React = await import('react');
      await requestWidgetUpdate({
        widgetName: 'TodayWidget',
        renderWidget: () => React.createElement(AndroidTodayWidget, data),
      });
    }
  } catch (err) {
    // Widgets sit on top of the app, not underneath it - a refresh failure
    // here should never surface to the user or interrupt sync.
    console.error('Failed to refresh widgets', err);
  }
}
