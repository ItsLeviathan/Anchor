// Renders the Today screen with sample data to PNGs for design review.
//
// Run:  flutter test tool/today_preview_test.dart
// Output: F:/tmp/today_light.png and F:/tmp/today_dark.png
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:anchor/core/models/models.dart';
import 'package:anchor/core/providers.dart';
import 'package:anchor/core/theme/app_theme.dart';
import 'package:anchor/core/utils/dates.dart';
import 'package:anchor/features/today/today_screen.dart';

const _out = 'F:/tmp';

Task _task(String id, String title, String priority, {String? due, String? time, int? mins, String status = 'pending', String? completedAt, String? cat}) => Task(
      id: id,
      userId: 'u',
      categoryId: cat,
      title: title,
      priority: priority,
      status: status,
      dueDate: due,
      dueTime: time,
      estimatedDurationMinutes: mins,
      completedAt: completedAt,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    );

void main() {
  for (final dark in [false, true]) {
    testWidgets('today ${dark ? 'dark' : 'light'}', (tester) async {
      await tester.runAsync(() async {
        final font = FontLoader('Inter')..addFont(rootBundle.load('assets/fonts/Inter.ttf'));
        await font.load();
        final icons = FontLoader('MaterialIcons')..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'));
        await icons.load();
      });

      // Tall viewport so the whole scrolling page is captured, not just the fold.
      tester.view.physicalSize = const Size(1080, 4300);
      tester.view.devicePixelRatio = 2.625;
      addTearDown(tester.view.reset);

      final now = DateTime.now();
      final today = toDateKey(now);
      final soon = toDateKey(now.add(const Duration(days: 2)));
      final tasks = [
        _task('1', 'Send the quarterly invoice', 'high', due: today, time: '17:00', mins: 45, cat: 'c1'),
        _task('2', 'Book dentist appointment', 'medium', due: today, mins: 15, cat: 'c2'),
        _task('3', 'Pick up groceries', 'low', due: today, cat: 'c3'),
        _task('4', 'Reply to landlord', 'medium', due: today, mins: 10),
        _task('5', 'Morning review', 'medium', due: today, status: 'completed', completedAt: now.toUtc().toIso8601String()),
        _task('6', 'Renew passport', 'high', due: today, status: 'completed', completedAt: now.toUtc().toIso8601String()),
      ];
      final events = [
        CalendarEvent(
          id: 'e1',
          userId: 'u',
          calendarId: 'cal',
          title: 'Design review',
          startAt: DateTime(now.year, now.month, now.day, 14),
          endAt: DateTime(now.year, now.month, now.day, 15),
          allDay: false,
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        ),
      ];
      final bills = [
        Bill(
          id: 'b1',
          userId: 'u',
          name: 'Rent',
          amount: 1240,
          currency: 'USD',
          category: 'Housing',
          dueDate: soon,
          status: 'unpaid',
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        ),
      ];
      Habit habit(String id, String name, List<String> dates) => Habit(
            id: id,
            userId: 'u',
            name: name,
            frequency: 'daily',
            completedDates: dates,
            archived: false,
            createdAt: '2026-09-01T00:00:00Z',
            updatedAt: '2026-09-01T00:00:00Z',
          );
      String daysAgo(int n) => toDateKey(now.subtract(Duration(days: n)));
      final habits = [
        habit('h1', 'Read 20 pages', [today, daysAgo(1), daysAgo(2), daysAgo(3)]),
        habit('h2', 'Morning run', [daysAgo(1), daysAgo(2)]),
        habit('h3', 'Meditate', []),
      ];
      final cats = [
        Category(id: 'c1', userId: 'u', name: 'Work', color: '#3B82F6', isDefault: true, sortOrder: 0),
        Category(id: 'c2', userId: 'u', name: 'Health', color: '#E17568', isDefault: true, sortOrder: 1),
        Category(id: 'c3', userId: 'u', name: 'Home', color: '#3D8361', isDefault: true, sortOrder: 2),
      ];
      final guest = Session(
        accessToken: 'x',
        tokenType: 'bearer',
        user: const User(id: 'u', appMetadata: {}, userMetadata: {}, aud: 'a', createdAt: '2026-09-01T00:00:00Z', isAnonymous: true),
      );

      final key = GlobalKey();
      await tester.pumpWidget(ProviderScope(
        overrides: [
          tasksProvider.overrideWith((ref) => Stream.value(tasks)),
          eventsProvider.overrideWith((ref) => Stream.value(events)),
          billsProvider.overrideWith((ref) => Stream.value(bills)),
          habitsProvider.overrideWith((ref) => Stream.value(habits)),
          categoriesProvider.overrideWith((ref) => Stream.value(cats)),
          sessionProvider.overrideWith((ref) => Stream.value(guest)),
          personalizedSuggestionsProvider.overrideWith((ref) async => true),
        ],
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: lightTheme,
          darkTheme: darkTheme,
          themeMode: dark ? ThemeMode.dark : ThemeMode.light,
          home: RepaintBoundary(key: key, child: const Scaffold(body: TodayScreen())),
        ),
      ));
      // First frame: the session stream is still loading, so GuestUpsellCard
      // reaches for the real Supabase client, which the app initialises before
      // runApp but this harness doesn't. Harmless here; later frames are clean.
      tester.takeException();
      for (var i = 0; i < 20; i++) {
        await tester.pump(const Duration(milliseconds: 100));
      }

      await tester.runAsync(() async {
        final boundary = key.currentContext!.findRenderObject() as RenderRepaintBoundary;
        final image = await boundary.toImage(pixelRatio: 1);
        final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
        File('$_out/today_${dark ? 'dark' : 'light'}.png').writeAsBytesSync(bytes!.buffer.asUint8List());
      });
    });
  }
}
