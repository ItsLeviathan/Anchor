import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { getLocalWidgetSnapshot } from '../../lib/widgets/getLocalWidgetSnapshot';
import { getLocalSetting } from '../../lib/database/db';
import { AndroidTodayWidget } from './TodayWidget';

const CURRENT_USER_ID_KEY = 'current_user_id';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  if (props.widgetInfo.widgetName !== 'TodayWidget') return;

  const userId = await getLocalSetting(CURRENT_USER_ID_KEY);
  if (!userId) {
    props.renderWidget(React.createElement(AndroidTodayWidget, { importantTaskTitle: null, nextEventLabel: null, countdownLabel: null }));
    return;
  }

  const data = await getLocalWidgetSnapshot(userId);
  props.renderWidget(React.createElement(AndroidTodayWidget, data));
}
