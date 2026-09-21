import 'package:flutter/material.dart';

/// Anchor design tokens (1:1 port of the RN `lib/theme/tokens.ts`).
///
/// Minimal, premium, calm, human: generous whitespace, restrained color,
/// soft shadows, excellent dark mode. The brand accent is a grounded, muted
/// green.
class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

class AppRadius {
  static const double sm = 10;
  static const double md = 16;
  static const double lg = 22;
  static const double xl = 32;
  static const double full = 999;
}

@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.background,
    required this.surface,
    required this.surfaceElevated,
    required this.border,
    required this.textPrimary,
    required this.textSecondary,
    required this.textTertiary,
    required this.accent,
    required this.accentMuted,
    required this.danger,
    required this.success,
    required this.shadow,
    required this.shadowOpacity,
  });

  final Color background;
  final Color surface;
  final Color surfaceElevated;
  final Color border;
  final Color textPrimary;
  final Color textSecondary;
  final Color textTertiary;
  final Color accent;
  final Color accentMuted;
  final Color danger;
  final Color success;
  final Color shadow;
  final double shadowOpacity;

  static const light = AppColors(
    // Cool-tinted canvas so pure-white cards lift off it without heavy shadows.
    background: Color(0xFFF2F5F3),
    surface: Color(0xFFFFFFFF),
    surfaceElevated: Color(0xFFFFFFFF),
    border: Color(0xFFDFE6E2),
    textPrimary: Color(0xFF111614),
    textSecondary: Color(0xFF56635D),
    textTertiary: Color(0xFF87938D),
    // Vivid emerald; white text on it stays >= 4.5:1.
    accent: Color(0xFF0A7F5F),
    accentMuted: Color(0xFFDAF2E8),
    danger: Color(0xFFD5433A),
    success: Color(0xFF1B9A68),
    shadow: Color(0xFF0F2A21),
    shadowOpacity: 0.10,
  );

  static const dark = AppColors(
    background: Color(0xFF0B0F0E),
    surface: Color(0xFF151B19),
    surfaceElevated: Color(0xFF1C2421),
    border: Color(0xFF27302C),
    textPrimary: Color(0xFFF4F7F5),
    textSecondary: Color(0xFFB3BFB9),
    textTertiary: Color(0xFF7E8B85),
    accent: Color(0xFF3FD3A0),
    accentMuted: Color(0xFF15302A),
    danger: Color(0xFFF0796C),
    success: Color(0xFF52CF97),
    shadow: Color(0xFF000000),
    shadowOpacity: 0.35,
  );

  /// Soft elevated card shadow: depth from layered shadow, not hard borders.
  List<BoxShadow> get softShadow => [
        BoxShadow(color: shadow.withValues(alpha: shadowOpacity * 0.5), blurRadius: 2, offset: const Offset(0, 1)),
        BoxShadow(color: shadow.withValues(alpha: shadowOpacity * 0.7), blurRadius: 20, offset: const Offset(0, 8)),
      ];

  List<BoxShadow> get mediumShadow => [
        BoxShadow(
          color: shadow.withValues(alpha: shadowOpacity),
          blurRadius: 28,
          offset: const Offset(0, 6),
        ),
      ];

  /// Brand moments (welcome, paywall) are always deep green, in both themes.
  Color get brandDeep => Color.lerp(accent, const Color(0xFF000000), 0.72)!;
  Color get brandMid => Color.lerp(accent, const Color(0xFF000000), 0.5)!;
  Color get brandGlow => Color.lerp(accent, const Color(0xFFFFFFFF), 0.25)!;
  Color get onBrand => const Color(0xFFFFFFFF);

  LinearGradient get brandGradient => LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [brandMid, brandDeep, Color.lerp(brandDeep, const Color(0xFF000000), 0.35)!],
        stops: const [0, 0.55, 1],
      );

  /// Accent-tinted glow for hero buttons and floating brand elements.
  List<BoxShadow> get glowShadow => [
        BoxShadow(color: brandGlow.withValues(alpha: 0.35), blurRadius: 32, offset: const Offset(0, 10)),
      ];

  @override
  AppColors copyWith() => this;

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) =>
      other is AppColors ? (t < 0.5 ? this : other) : this;
}

/// iOS-metric type scale (nav-bar large title is 34/41 bold).
class AppTypography {
  static TextStyle largeTitle(Color c) => TextStyle(
      fontSize: 36,
      height: 42 / 36,
      fontWeight: FontWeight.w800,
      letterSpacing: -1.0,
      color: c);
  static TextStyle display(Color c) => TextStyle(
      fontSize: 40,
      height: 1.06,
      fontWeight: FontWeight.w800,
      letterSpacing: -1.4,
      color: c);
  static TextStyle title(Color c) =>
      TextStyle(fontSize: 26, height: 32 / 26, fontWeight: FontWeight.w800, letterSpacing: -0.5, color: c);
  static TextStyle headline(Color c) =>
      TextStyle(fontSize: 19, height: 25 / 19, fontWeight: FontWeight.w700, letterSpacing: -0.2, color: c);
  static TextStyle body(Color c) =>
      TextStyle(fontSize: 16, height: 22 / 16, fontWeight: FontWeight.w400, color: c);
  static TextStyle subhead(Color c) =>
      TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w400, color: c);
  static TextStyle caption(Color c) =>
      TextStyle(fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w600, color: c);
}

extension AppThemeContext on BuildContext {
  AppColors get colors => Theme.of(this).extension<AppColors>()!;
}
