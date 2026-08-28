import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Switch, Text, View } from 'react-native';

import { DueDatePicker } from '../../components/tasks/DueDatePicker';
import { Button, Input, Sheet } from '../../components/ui';
import { findOverlappingEvents } from '../../lib/calendar/conflicts';
import { useSession } from '../../lib/supabase/useSession';
import { useTheme } from '../../lib/theme/ThemeProvider';
import { useCalendars } from '../calendars/useCalendars';
import { useCreateEvent, useEvents } from './useEvents';

function addHours(date: Date, hours: number): Date {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  const day = startOfDay(date);
  day.setDate(day.getDate() + 1);
  day.setMilliseconds(-1);
  return day;
}

export function EventComposer() {
  const router = useRouter();
  const { colors, spacing, typography, radius } = useTheme();
  const { session } = useSession();
  const userId = session?.user.id;

  // Calendar selection UI (multiple calendars is an Anchor Pro perk) lands
  // once calendar-creation exists; for now every event goes on the user's
  // one auto-seeded default calendar, which `calendar_id` already supports
  // swapping out later without a schema change.
  const { data: calendars = [] } = useCalendars(userId);
  const { data: events = [] } = useEvents(userId);
  const createEvent = useCreateEvent(userId);

  const defaultCalendar = calendars.find((calendar) => calendar.isDefault) ?? calendars[0];

  const [title, setTitle] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState<Date>(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return addHours(now, 1);
  });
  const [end, setEnd] = useState<Date>(() => addHours(start, 1));

  const effectiveStart = allDay ? startOfDay(start) : start;
  const effectiveEnd = allDay ? endOfDay(start) : end;
  const hasValidRange = effectiveEnd.getTime() > effectiveStart.getTime();

  const conflicts = useMemo(() => {
    if (!hasValidRange) return [];
    return findOverlappingEvents(
      { start: effectiveStart, end: effectiveEnd },
      events.map((event) => ({
        id: event.id,
        start: new Date(event.startAt),
        end: new Date(event.endAt),
        title: event.title,
      }))
    );
  }, [events, effectiveStart, effectiveEnd, hasValidRange]);

  const canSave = title.trim().length > 0 && Boolean(userId) && Boolean(defaultCalendar) && hasValidRange && !createEvent.isPending;

  function handleStartChange(date: Date | null) {
    if (!date) return;
    setStart(date);
    // Keep end after start automatically rather than letting it silently
    // become invalid.
    if (date.getTime() >= end.getTime()) {
      setEnd(addHours(date, 1));
    }
  }

  async function handleSave() {
    if (!canSave || !userId || !defaultCalendar) return;

    await createEvent.mutateAsync({
      userId,
      calendarId: defaultCalendar.id,
      title,
      startAt: effectiveStart.toISOString(),
      endAt: effectiveEnd.toISOString(),
      allDay,
    });

    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Sheet>
        <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>New event</Text>

        <Input autoFocus placeholder="Event title" value={title} onChangeText={setTitle} returnKeyType="done" />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.lg,
          }}
        >
          <Text style={[typography.body, { color: colors.textPrimary }]}>All day</Text>
          <Switch value={allDay} onValueChange={setAllDay} trackColor={{ true: colors.accent, false: colors.border }} />
        </View>

        <View style={{ marginTop: spacing.md }}>
          <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.xs }]}>STARTS</Text>
          <DueDatePicker
            dueDate={start}
            onChange={handleStartChange}
            mode={allDay ? 'date' : 'datetime'}
            label="Set start"
          />
        </View>

        {!allDay ? (
          <View style={{ marginTop: spacing.md }}>
            <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.xs }]}>ENDS</Text>
            <DueDatePicker
              dueDate={end}
              onChange={(date) => date && setEnd(date)}
              mode="datetime"
              label="Set end"
            />
          </View>
        ) : null}

        {conflicts.length > 0 ? (
          <View
            style={{
              marginTop: spacing.md,
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.accentMuted,
            }}
          >
            <Text style={[typography.subhead, { color: colors.textPrimary }]}>
              This overlaps with {conflicts.map((conflict) => conflict.title).join(', ')}. You can still save it, or
              adjust the time above.
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: spacing.xl }}>
          <Button label="Save event" onPress={handleSave} disabled={!canSave} loading={createEvent.isPending} />
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}
