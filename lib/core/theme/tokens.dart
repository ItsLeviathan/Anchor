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
  static const double sm = 8;
  static const double md = 14;
  static const double lg = 20;
  static const double xl = 28;
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
    background: Color(0xFFFAFAF8),
    surface: Color(0xFFFFFFFF),
    surfaceElevated: Color(0xFFFFFFFF),
    border: Color(0xFFE7E5E0),
    textPrimary: Color(0xFF1C1C1A),
    textSecondary: Color(0xFF6B6B66),
    textTertiary: Color(0xFF9A9A94),
    accent: Color(0xFF2F6F5E),
    accentMuted: Color(0xFFE4EEEA),
    danger: Color(0xFFC1473C),
    success: Color(0xFF3D8361),
    shadow: Color(0xFF1C1C1A),
    shadowOpacity: 0.09,
  );

  static const dark = AppColors(
    background: Color(0xFF111110),
    surface: Color(0xFF1B1B19),
    surfaceElevated: Color(0xFF222220),
    border: Color(0xFF2E2E2B),
    textPrimary: Color(0xFFF2F2EF),
    textSecondary: Color(0xFFB4B4AE),
    textTertiary: Color(0xFF7C7C76),
    accent: Color(0xFF5FA98D),
    accentMuted: Color(0xFF1E2C27),
    danger: Color(0xFFE17568),
    success: Color(0xFF6BBF94),
    shadow: Color(0xFF000000),
    shadowOpacity: 0.35,
  );

  /// Soft elevated card shadow: depth from layered shadow, not hard borders.
  List<BoxShadow> get softShadow => [
        BoxShadow(
          color: shadow.withValues(alpha: shadowOpacity * 0.66),
          blurRadius: 12,
          offset: const Offset(0, 2),
        ),
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
      fontSize: 34,
      height: 41 / 34,
      fontWeight: FontWeight.w700,
      letterSpacing: -0.4,
      color: c);
  static TextStyle display(Color c) => TextStyle(
      fontSize: 40,
      height: 1.06,
      fontWeight: FontWeight.w800,
      letterSpacing: -1.4,
      color: c);
  static TextStyle title(Color c) =>
      TextStyle(fontSize: 24, height: 30 / 24, fontWeight: FontWeight.w700, color: c);
  static TextStyle headline(Color c) =>
      TextStyle(fontSize: 18, height: 24 / 18, fontWeight: FontWeight.w600, color: c);
  static TextStyle body(Color c) =>
      TextStyle(fontSize: 16, height: 22 / 16, fontWeight: FontWeight.w400, color: c);
  static TextStyle subhead(Color c) =>
      TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w400, color: c);
  static TextStyle caption(Color c) =>
      TextStyle(fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w500, color: c);
}

extension AppThemeContext on BuildContext {
  AppColors get colors => Theme.of(this).extension<AppColors>()!;
}
