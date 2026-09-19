import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { getLocalWidgetSnapshot } from '../../lib/widgets/getLocalWidgetSnapshot';
import { getLocalSetting } from '../../lib/database/db';
import { AndroidTodayWidget } from './TodayWidget';

const CURRENT_USER_ID_KEY = 'current_user_id';

const EMPTY_WIDGET_DATA = { importantTaskTitle: null, nextEventLabel: null, countdownLabel: null };

/**
 * Invoked directly by the OS/react-native-android-widget outside the normal
 * app lifecycle (e.g. widget pinned, resized, or on its periodic update
 * tick) - there's no surrounding try/catch like refreshWidgets() gets when
 * the app itself triggers a refresh. A DB read failure here (e.g. SQLite
 * not yet initialized in this background context) must not become an
 * unhandled rejection; fall back to rendering an empty widget instead.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  if (props.widgetInfo.widgetName !== 'TodayWidget') return;

  try {
    const userId = await getLocalSetting(CURRENT_USER_ID_KEY);
    if (!userId) {
      props.renderWidget(React.createElement(AndroidTodayWidget, EMPTY_WIDGET_DATA));
      return;
    }

    const data = await getLocalWidgetSnapshot(userId);
    props.renderWidget(React.createElement(AndroidTodayWidget, data));
  } catch (err) {
    console.error('Widget task handler failed', err);
    props.renderWidget(React.createElement(AndroidTodayWidget, EMPTY_WIDGET_DATA));
  }
}
