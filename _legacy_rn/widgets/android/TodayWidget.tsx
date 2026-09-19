import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { TodayWidgetData } from '../../lib/widgets/widgetData';

/**
 * Read-only, tap-to-open-app for this first pass (clickAction="OPEN_APP" -
 * a built-in action from the library, no custom click handling attempted
 * here). True in-widget interactivity (e.g. tapping a habit to check it
 * off without opening the app) is a reasonable next step but needs the
 * WIDGET_CLICK branch of the task handler wired to real app actions,
 * which I didn't want to ship unverified alongside everything else here.
 */
export function AndroidTodayWidget(props: TodayWidgetData) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
      }}
    >
      <TextWidget text="TODAY" style={{ fontSize: 12, color: '#9A9A94' }} />
      <TextWidget
        text={props.importantTaskTitle ?? 'Nothing urgent'}
        style={{ fontSize: 15, fontWeight: 'bold', color: '#1C1C1A', marginTop: 4 }}
      />
      {props.nextEventLabel ? (
        <TextWidget text={props.nextEventLabel} style={{ fontSize: 12, color: '#6B6B66', marginTop: 4 }} />
      ) : null}
      {props.countdownLabel ? (
        <TextWidget text={props.countdownLabel} style={{ fontSize: 11, color: '#6B6B66', marginTop: 2 }} />
      ) : null}
    </FlexWidget>
  );
}
