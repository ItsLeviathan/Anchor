// Renders the Anchor app icon and launch artwork at every size the platforms need.
//
// Run:  flutter test tool/icon_generator_test.dart
//
// The artwork itself lives in lib/core/brand/anchor_logo.dart (the same code the
// app draws its logo with), so the icon, splash and in-app logo stay identical.
// This is a "test" only because that gives us a headless Flutter engine.
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:anchor/core/brand/anchor_logo.dart';

const double _u = logoUnits;

Future<Uint8List> _render(int px, void Function(Canvas) paint, {double corner = 0}) async {
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder, Rect.fromLTWH(0, 0, px.toDouble(), px.toDouble()));
  canvas.scale(px / _u);
  if (corner > 0) {
    canvas.clipRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(0, 0, _u, _u), Radius.circular(_u * corner)));
  }
  paint(canvas);
  final image = await recorder.endRecording().toImage(px, px);
  final data = await image.toByteData(format: ui.ImageByteFormat.png);
  return data!.buffer.asUint8List();
}

void _write(String path, Uint8List bytes) {
  final f = File(path);
  f.parent.createSync(recursive: true);
  f.writeAsBytesSync(bytes);
}

void _full(Canvas c) {
  paintAnchorLogoBackground(c);
  paintAnchorLogoForeground(c);
}

/// Mark only, centred and scaled to sit comfortably on a splash background.
void _splashMark(Canvas c) {
  c.save();
  c.translate(_u / 2, _u / 2);
  c.scale(1.18);
  c.translate(-_u / 2, -_u / 2);
  paintAnchorLogoForeground(c);
  c.restore();
}

void main() {
  testWidgets('generate app icons and launch artwork', (tester) async {
    await tester.runAsync(() async {
      const res = 'android/app/src/main/res';

      // Android adaptive layers (108dp -> 432px at xxxhdpi).
      _write('$res/drawable-nodpi/ic_launcher_background.png', await _render(432, paintAnchorLogoBackground));
      _write('$res/drawable-nodpi/ic_launcher_foreground.png',
          await _render(432, (c) => paintAnchorLogoForeground(c)));
      _write('$res/drawable-nodpi/ic_launcher_monochrome.png',
          await _render(432, (c) => paintAnchorLogoForeground(c, mono: true)));

      _write(
          '$res/mipmap-anydpi-v26/ic_launcher.xml',
          Uint8List.fromList('''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
    <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>
</adaptive-icon>
'''
              .codeUnits));

      // Legacy launcher icons (Android 7.x): rounded square.
      const legacy = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192};
      for (final e in legacy.entries) {
        _write('$res/mipmap-${e.key}/ic_launcher.png', await _render(e.value, _full, corner: 0.22));
      }

      // Android launch screen mark: the logo on the brand background.
      _write('$res/drawable-nodpi/launch_logo.png', await _render(576, _full, corner: 0.22));

      // iOS: opaque square icons, the OS applies its own mask.
      const ios = 'ios/Runner/Assets.xcassets/AppIcon.appiconset';
      final re = RegExp(r'Icon-App-([\d.]+)x[\d.]+@(\d)x\.png');
      for (final f in Directory(ios).listSync().whereType<File>()) {
        final m = re.firstMatch(f.uri.pathSegments.last);
        if (m == null) continue;
        final px = (double.parse(m.group(1)!) * int.parse(m.group(2)!)).round();
        f.writeAsBytesSync(await _render(px, _full));
      }

      // iOS launch image: logo tile, shown centred on the storyboard background.
      const launch = 'ios/Runner/Assets.xcassets/LaunchImage.imageset';
      _write('$launch/LaunchImage.png', await _render(192, _full, corner: 0.22));
      _write('$launch/LaunchImage@2x.png', await _render(384, _full, corner: 0.22));
      _write('$launch/LaunchImage@3x.png', await _render(576, _full, corner: 0.22));

      // Reference exports.
      _write('assets/icon.png', await _render(1024, _full));
      _write('assets/android-icon-background.png', await _render(1024, paintAnchorLogoBackground));
      _write('assets/android-icon-foreground.png', await _render(1024, (c) => paintAnchorLogoForeground(c)));
      _write('assets/android-icon-monochrome.png',
          await _render(1024, (c) => paintAnchorLogoForeground(c, mono: true)));
      _write('assets/splash-icon.png', await _render(1024, _splashMark));
      _write('assets/icon-preview.png', await _render(512, _full, corner: 0.22));
    });
  });
}
