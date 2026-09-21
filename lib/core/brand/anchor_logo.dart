import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// The Anchor logo, drawn as vector art on a 1024 x 1024 canvas.
///
/// This is the single source of truth: the in-app [AnchorLogo] widget, the
/// splash screens and the launcher icons (via `tool/icon_generator_test.dart`)
/// all render these same functions, so the brand never drifts between them.
///
/// Concept: Anchor is the one place a whole life is held. A fanned stack of the
/// things it holds (notes, a bill, a calendar, a to-do list) sits inside a glass
/// dial ringed by five colours, one per area of life, with a habit-streak flame
/// on the corner and a small anchor charm clipped to the ring.
///
/// Logo artwork uses fixed brand colours on purpose (a logo must not change
/// with the app theme), so they live here rather than in [AppColors].
const double logoUnits = 1024;
const Offset _c = Offset(512, 512);

const _mint = Color(0xFF7EE0BE);
const _sky = Color(0xFF7FB8FF);
const _lilac = Color(0xFFB9A2FF);
const _amber = Color(0xFFFFC26B);
const _coral = Color(0xFFFF8A7A);
const _ringColors = [_mint, _sky, _lilac, _amber, _coral];

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
void paintAnchorLogoBackground(Canvas canvas) {
  const rect = Rect.fromLTWH(0, 0, logoUnits, logoUnits);

  canvas.drawRect(
    rect,
    Paint()
      ..shader = ui.Gradient.linear(const Offset(0, 0), const Offset(logoUnits, logoUnits), const [
        Color(0xFF34866F),
        Color(0xFF1A5646),
        Color(0xFF0A251D),
        Color(0xFF04120D),
      ], const [0, 0.35, 0.75, 1]),
  );

  // Light rays fanning from the top-left corner.
  final rays = <Color>[];
  for (var i = 0; i < 14; i++) {
    rays.add(i.isEven ? const Color(0x1AFFFFFF) : const Color(0x00FFFFFF));
  }
  canvas.drawRect(
    rect,
    Paint()
      ..shader = ui.Gradient.sweep(const Offset(60, 40), rays,
          List.generate(rays.length, (i) => i / (rays.length - 1)), TileMode.clamp, 0, math.pi / 2),
  );

  // Light pool top-left, cool pool bottom-right.
  canvas.drawRect(
      rect,
      Paint()
        ..shader = ui.Gradient.radial(
            const Offset(260, 200), 720, [const Color(0x44FFFFFF), const Color(0x00FFFFFF)]));
  canvas.drawRect(
      rect,
      Paint()
        ..shader = ui.Gradient.radial(
            const Offset(860, 900), 560, [const Color(0x334B8FE0), const Color(0x004B8FE0)]));

  // Orbit rings.
  for (var i = 0; i < 4; i++) {
    canvas.drawCircle(
      _c,
      400.0 + i * 74,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..color = Colors.white.withValues(alpha: 0.085 - i * 0.017),
    );
  }

  // Planner-paper dot grid, fading toward the edges.
  for (var gy = 0; gy < 17; gy++) {
    for (var gx = 0; gx < 17; gx++) {
      final o = Offset(gx * 64.0, gy * 64.0);
      final d = (o - _c).distance / 720;
      canvas.drawCircle(
          o, 2.6, Paint()..color = Colors.white.withValues(alpha: (0.14 * (1 - d)).clamp(0.0, 0.14)));
    }
  }

  // Vignette.
  canvas.drawRect(
    rect,
    Paint()
      ..shader = ui.Gradient.radial(_c, 760, const [Color(0x00000000), Color(0x66000000)], const [0.55, 1]),
  );
}

// ---------------------------------------------------------------------------
// Foreground (kept inside the central ~66% so adaptive masks never crop it)
// ---------------------------------------------------------------------------
void paintAnchorLogoForeground(Canvas canvas, {bool mono = false}) {
  // Mono draws white shapes and punches details out with BlendMode.clear, so
  // it needs its own layer.
  if (mono) canvas.saveLayer(const Rect.fromLTWH(0, 0, logoUnits, logoUnits), Paint());

  _dial(canvas, mono);
  _ring(canvas, mono);

  // Cards fill the dial so they stay legible at launcher size.
  canvas.save();
  canvas.translate(_c.dx, _c.dy);
  canvas.scale(1.05);
  canvas.translate(-_c.dx, -_c.dy);
  _noteCard(canvas, mono);
  _billCard(canvas, mono);
  _calendarCard(canvas, mono);
  _todoCard(canvas, mono);
  _flameBadge(canvas, mono);
  canvas.restore();
  _anchorCharm(canvas, mono);

  if (!mono) {
    _sparkle(canvas, const Offset(748, 250), 26);
    _sparkle(canvas, const Offset(280, 738), 18);
    _sparkle(canvas, const Offset(792, 330), 11);
  }

  if (mono) canvas.restore();
}

// -- dial + ring ----------------------------------------------------------------
const double _ringR = 304;
const double _ringGap = 0.12;

void _dial(Canvas canvas, bool mono) {
  if (mono) return;
  const r = _ringR - 16;

  // Glass disc behind the cards.
  canvas.drawCircle(
    _c,
    r,
    Paint()
      ..shader = ui.Gradient.radial(const Offset(470, 400), 380, const [
        Color(0x662F8F76),
        Color(0x40062017),
        Color(0x66020A07),
      ], const [0, 0.6, 1]),
  );
  canvas.drawCircle(
    _c,
    r,
    Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..shader = ui.Gradient.linear(const Offset(200, 200), const Offset(820, 820),
          [const Color(0xAAFFFFFF), const Color(0x00FFFFFF), const Color(0x55FFFFFF)], const [0, 0.55, 1]),
  );

  // Tick ring: 60 ticks, longer at every fifth.
  for (var i = 0; i < 60; i++) {
    final a = i / 60 * 2 * math.pi - math.pi / 2;
    final major = i % 5 == 0;
    final dir = Offset(math.cos(a), math.sin(a));
    canvas.drawLine(
      _c + dir * (r - 8),
      _c + dir * (r - (major ? 26 : 17)),
      Paint()
        ..strokeCap = StrokeCap.round
        ..strokeWidth = major ? 4.5 : 2.6
        ..color = Colors.white.withValues(alpha: major ? 0.5 : 0.24),
    );
  }
}

void _ring(Canvas canvas, bool mono) {
  final sweep = (2 * math.pi - _ringGap * 5) / 5;
  final rect = Rect.fromCircle(center: _c, radius: _ringR);

  if (!mono) {
    canvas.drawCircle(
        _c,
        _ringR,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 28
          ..color = Colors.white.withValues(alpha: 0.07));
  }
  for (var i = 0; i < 5; i++) {
    final start = -math.pi / 2 + _ringGap / 2 + i * (sweep + _ringGap);
    final color = mono ? Colors.white : _ringColors[i];
    if (!mono) {
      canvas.drawArc(
          rect,
          start,
          sweep,
          false,
          Paint()
            ..style = PaintingStyle.stroke
            ..strokeCap = StrokeCap.round
            ..strokeWidth = 28
            ..color = color.withValues(alpha: 0.55)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 18));
    }
    canvas.drawArc(
        rect,
        start,
        sweep,
        false,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeCap = StrokeCap.round
          ..strokeWidth = 26
          ..color = color);
    if (!mono) {
      // Inner sheen.
      canvas.drawArc(
          rect,
          start + 0.02,
          sweep - 0.04,
          false,
          Paint()
            ..style = PaintingStyle.stroke
            ..strokeCap = StrokeCap.round
            ..strokeWidth = 5
            ..color = Colors.white.withValues(alpha: 0.5));

      // Gem at the middle of each segment, on the inner edge.
      final mid = start + sweep / 2;
      final g = _c + Offset(math.cos(mid), math.sin(mid)) * (_ringR - 42);
      canvas.drawCircle(
          g,
          13,
          Paint()
            ..color = color.withValues(alpha: 0.6)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6));
      canvas.drawCircle(g, 7, Paint()..color = Colors.white.withValues(alpha: 0.95));
    }
  }
}

// -- cards ---------------------------------------------------------------------
void _card(Canvas canvas, Offset center, double w, double h, double angle, List<Color> fill, bool mono,
    void Function(Canvas c) content) {
  canvas.save();
  canvas.translate(center.dx, center.dy);
  canvas.rotate(angle);
  final rr = RRect.fromRectAndRadius(
      Rect.fromCenter(center: Offset.zero, width: w, height: h), const Radius.circular(40));

  if (!mono) {
    canvas.drawRRect(
        rr.shift(const Offset(0, 18)),
        Paint()
          ..color = const Color(0x66000000)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 20));
  }
  canvas.drawRRect(
      rr,
      mono
          ? (Paint()..color = Colors.white)
          : (Paint()..shader = ui.Gradient.linear(Offset(0, -h / 2), Offset(0, h / 2), fill)));
  if (!mono) {
    // Top edge light.
    canvas.drawRRect(
        rr.deflate(1.5),
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3
          ..shader = ui.Gradient.linear(Offset(0, -h / 2), Offset(0, -h / 2 + 90),
              [Colors.white.withValues(alpha: 0.9), Colors.white.withValues(alpha: 0)]));
  }
  content(canvas);
  canvas.restore();
}

Paint _ink(bool mono, Color c) => mono ? (Paint()..blendMode = BlendMode.clear) : (Paint()..color = c);

void _noteCard(Canvas canvas, bool mono) {
  _card(canvas, const Offset(392, 470), 230, 312, -0.42, const [Color(0xFFEDE6FF), Color(0xFFC9BCF2)], mono, (c) {
    for (var i = 0; i < 4; i++) {
      c.drawRRect(
          RRect.fromRectAndRadius(Rect.fromLTWH(-78, -108 + i * 30.0, i == 3 ? 70 : 150, 12), const Radius.circular(6)),
          _ink(mono, const Color(0x668068CC)));
    }
  });
}

void _billCard(Canvas canvas, bool mono) {
  _card(canvas, const Offset(434, 522), 246, 332, -0.2, const [Color(0xFFE2F5EC), Color(0xFFB4DCCB)], mono, (c) {
    c.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(-86, -124, 120, 16), const Radius.circular(8)),
        _ink(mono, const Color(0xFF2F6F5E)));
    c.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(-86, -94, 84, 12), const Radius.circular(6)),
        _ink(mono, const Color(0x662F6F5E)));
    // Amount pill.
    c.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(-86, 92, 110, 34), const Radius.circular(17)),
        _ink(mono, _amber));
  });
}

void _calendarCard(Canvas canvas, bool mono) {
  _card(canvas, const Offset(592, 502), 246, 332, 0.17, const [Color(0xFFEAF2FF), Color(0xFFBFD5F5)], mono, (c) {
    c.drawRRect(
        RRect.fromRectAndCorners(const Rect.fromLTWH(-123, -166, 246, 84),
            topLeft: const Radius.circular(40), topRight: const Radius.circular(40)),
        _ink(mono, const Color(0xFF4F86E8)));
    for (final x in [-52.0, 52.0]) {
      c.drawRRect(
          RRect.fromRectAndRadius(
              Rect.fromCenter(center: Offset(x, -164), width: 16, height: 44), const Radius.circular(8)),
          Paint()..color = Colors.white);
    }
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 5; col++) {
        final o = Offset(-80 + col * 40.0, -34 + row * 44.0);
        if (row == 1 && col == 3) {
          c.drawCircle(o, 19, _ink(mono, const Color(0xFF2F6F5E)));
        } else {
          c.drawCircle(o, 8, _ink(mono, const Color(0x664F6EA8)));
        }
      }
    }
  });
}

void _todoCard(Canvas canvas, bool mono) {
  _card(canvas, const Offset(512, 556), 296, 372, -0.03, const [Color(0xFFFFFFFF), Color(0xFFE9F3EE)], mono,
      (c) {
    // Check badge.
    if (mono) {
      c.drawCircle(const Offset(0, -100), 58, Paint()..blendMode = BlendMode.clear);
    } else {
      c.drawCircle(
          const Offset(0, -100),
          66,
          Paint()
            ..color = _mint.withValues(alpha: 0.35)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 16));
      c.drawCircle(
          const Offset(0, -100),
          58,
          Paint()
            ..shader = ui.Gradient.linear(
                const Offset(-40, -150), const Offset(40, -50), const [Color(0xFF6FE0B6), Color(0xFF2A8A68)]));
      // Specular highlight.
      c.drawArc(
          Rect.fromCircle(center: const Offset(0, -100), radius: 48),
          3.5,
          1.3,
          false,
          Paint()
            ..style = PaintingStyle.stroke
            ..strokeCap = StrokeCap.round
            ..strokeWidth = 5
            ..color = Colors.white.withValues(alpha: 0.55));
    }
    final check = Path()
      ..moveTo(-26, -98)
      ..lineTo(-6, -76)
      ..lineTo(30, -122);
    c.drawPath(
        check,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round
          ..strokeWidth = 20
          ..color = Colors.white);

    // Task rows: (y, line width, done).
    const rows = [
      (40.0, 150.0, true),
      (92.0, 176.0, false),
      (144.0, 120.0, false),
    ];
    for (final (y, w, done) in rows) {
      final o = Offset(-88, y);
      if (done) {
        c.drawCircle(o, 15, _ink(mono, const Color(0xFF2F8F6E)));
        if (!mono) {
          c.drawPath(
              Path()
                ..moveTo(-95, y)
                ..lineTo(-90, y + 6)
                ..lineTo(-80, y - 6),
              Paint()
                ..style = PaintingStyle.stroke
                ..strokeCap = StrokeCap.round
                ..strokeWidth = 4
                ..color = Colors.white);
        }
      } else {
        c.drawCircle(
            o,
            14,
            Paint()
              ..style = PaintingStyle.stroke
              ..strokeWidth = mono ? 5 : 4.5
              ..color = const Color(0xFFB8C7C0)
              ..blendMode = mono ? BlendMode.clear : BlendMode.srcOver);
      }
      c.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(-56, y - 8, w, 16), const Radius.circular(8)),
          _ink(mono, done ? const Color(0xFFB8C7C0) : const Color(0xFF2B3A35)));
    }
  });
}

// -- flame badge -----------------------------------------------------------------
void _flameBadge(Canvas canvas, bool mono) {
  const center = Offset(654, 704);
  if (!mono) {
    canvas.drawCircle(
        center + const Offset(0, 12),
        56,
        Paint()
          ..color = const Color(0x66000000)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 14));
  }
  canvas.drawCircle(
      center,
      58,
      mono
          ? (Paint()..color = Colors.white)
          : (Paint()
            ..shader = ui.Gradient.linear(center - const Offset(40, 50), center + const Offset(40, 50),
                const [Color(0xFFFFB55E), Color(0xFFFF5E4A)])));
  if (!mono) {
    canvas.drawCircle(
        center,
        58,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 5
          ..color = Colors.white.withValues(alpha: 0.9));
  }

  final flame = Path()
    ..moveTo(0, -32)
    ..cubicTo(14, -16, 26, -4, 26, 12)
    ..cubicTo(26, 26, 14, 34, 0, 34)
    ..cubicTo(-14, 34, -26, 26, -26, 12)
    ..cubicTo(-26, -2, -16, -10, -12, -22)
    ..cubicTo(-8, -14, -4, -10, -2, -6)
    ..cubicTo(0, -14, -2, -24, 0, -32)
    ..close();
  canvas.save();
  canvas.translate(center.dx, center.dy + 2);
  canvas.drawPath(flame, mono ? (Paint()..blendMode = BlendMode.clear) : (Paint()..color = Colors.white));
  if (!mono) {
    canvas.save();
    canvas.translate(0, 14);
    canvas.scale(0.5);
    canvas.drawPath(flame, Paint()..color = const Color(0xFFFF7A50));
    canvas.restore();
  }
  canvas.restore();
}

// -- anchor charm ----------------------------------------------------------------
/// A small anchor medallion clipped to the ring at the top left: the brand's
/// name, kept as a detail rather than the whole idea.
void _anchorCharm(Canvas canvas, bool mono) {
  final center = _c + Offset(math.cos(-3 * math.pi / 4), math.sin(-3 * math.pi / 4)) * _ringR;
  const r = 38.0;

  if (!mono) {
    canvas.drawCircle(
        center + const Offset(0, 8),
        r,
        Paint()
          ..color = const Color(0x77000000)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10));
  }
  canvas.drawCircle(
      center,
      r,
      mono
          ? (Paint()..color = Colors.white)
          : (Paint()
            ..shader = ui.Gradient.linear(center - const Offset(0, r), center + const Offset(0, r),
                const [Color(0xFFFFFFFF), Color(0xFFBFE6D8)])));
  if (!mono) {
    canvas.drawCircle(
        center,
        r - 4,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2
          ..color = const Color(0x552F6F5E));
  }

  final ink = Paint()
    ..style = PaintingStyle.stroke
    ..strokeCap = StrokeCap.round
    ..strokeJoin = StrokeJoin.round
    ..strokeWidth = 5
    ..color = mono ? Colors.black : const Color(0xFF1F5A49)
    ..blendMode = mono ? BlendMode.clear : BlendMode.srcOver;
  final fill = Paint.from(ink)..style = PaintingStyle.fill;

  canvas.save();
  canvas.translate(center.dx, center.dy + 1);
  canvas.drawCircle(const Offset(0, -20), 4.5, ink..strokeWidth = 3.4);
  ink.strokeWidth = 5;
  canvas.drawLine(const Offset(0, -15), const Offset(0, 21), ink);
  canvas.drawLine(const Offset(-9, -8), const Offset(9, -8), ink);
  canvas.drawArc(Rect.fromCircle(center: const Offset(0, 6), radius: 15), 0.25, math.pi - 0.5, false, ink);
  for (final s in [-1.0, 1.0]) {
    canvas.drawPath(
        Path()
          ..moveTo(s * 13, 13)
          ..lineTo(s * 20, 7)
          ..lineTo(s * 19, 17)
          ..close(),
        fill);
  }
  canvas.restore();
}

void _sparkle(Canvas canvas, Offset o, double r) {
  final path = Path()
    ..moveTo(o.dx, o.dy - r)
    ..quadraticBezierTo(o.dx, o.dy, o.dx + r, o.dy)
    ..quadraticBezierTo(o.dx, o.dy, o.dx, o.dy + r)
    ..quadraticBezierTo(o.dx, o.dy, o.dx - r, o.dy)
    ..quadraticBezierTo(o.dx, o.dy, o.dx, o.dy - r)
    ..close();
  canvas.drawPath(path, Paint()..color = Colors.white.withValues(alpha: 0.9));
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

/// The full logo (background + mark) as a rounded tile. Rasterised once and
/// cached, so using it in lists and headers is cheap.
class AnchorLogo extends StatelessWidget {
  const AnchorLogo({super.key, this.size = 88, this.shadow = true});
  final double size;
  final bool shadow;

  static const double _corner = 0.22;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Semantics(
      label: 'Anchor',
      image: true,
      child: ExcludeSemantics(
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(size * _corner),
            boxShadow: shadow ? c.mediumShadow : null,
          ),
          child: RepaintBoundary(
            child: CustomPaint(size: Size.square(size), painter: const _LogoPainter()),
          ),
        ),
      ),
    );
  }
}

class _LogoPainter extends CustomPainter {
  const _LogoPainter();

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / logoUnits);
    canvas.clipRRect(RRect.fromRectAndRadius(
        const Rect.fromLTWH(0, 0, logoUnits, logoUnits), const Radius.circular(logoUnits * AnchorLogo._corner)));
    paintAnchorLogoBackground(canvas);
    paintAnchorLogoForeground(canvas);
  }

  @override
  bool shouldRepaint(_LogoPainter oldDelegate) => false;
}
