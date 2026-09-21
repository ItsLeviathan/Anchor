import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;
import 'package:flutter/material.dart';

import 'tokens.dart';

ThemeData _build(AppColors c, Brightness b) {
  final scheme = ColorScheme.fromSeed(
    seedColor: c.accent,
    brightness: b,
  ).copyWith(
    primary: c.accent,
    onPrimary: b == Brightness.light ? Colors.white : const Color(0xFF0B1A15),
    surface: c.surface,
    onSurface: c.textPrimary,
    error: c.danger,
    outline: c.border,
  );

  final inputBorder = OutlineInputBorder(
    borderRadius: BorderRadius.circular(AppRadius.md),
    borderSide: BorderSide(color: c.border),
  );

  return ThemeData(
    useMaterial3: true,
    fontFamily: 'Inter',
    brightness: b,
    colorScheme: scheme,
    scaffoldBackgroundColor: c.background,
    canvasColor: c.background,
    dividerColor: c.border,
    splashFactory: InkRipple.splashFactory,
    // Smooth slide + edge-swipe-back on Android too.
    pageTransitionsTheme: const PageTransitionsTheme(builders: {
      TargetPlatform.android: CupertinoPageTransitionsBuilder(),
      TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
    }),
    extensions: [c],
    textTheme: Typography.material2021().black.apply(
          fontFamily: 'Inter',
          bodyColor: c.textPrimary,
          displayColor: c.textPrimary,
        ),
    appBarTheme: AppBarTheme(
      backgroundColor: c.background,
      foregroundColor: c.textPrimary,
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: TextStyle(fontFamily: 'Inter', fontSize: 18, fontWeight: FontWeight.w700, color: c.textPrimary),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: c.surface,
      hintStyle: TextStyle(color: c.textTertiary),
      contentPadding:
          const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 14),
      border: inputBorder,
      enabledBorder: inputBorder,
      focusedBorder: inputBorder.copyWith(
        borderSide: BorderSide(color: c.accent, width: 2),
      ),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.all(Colors.white),
      trackColor: WidgetStateProperty.resolveWith(
        (s) => s.contains(WidgetState.selected) ? c.accent : c.border,
      ),
      trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: c.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: c.textPrimary,
      contentTextStyle: TextStyle(color: c.background),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
    ),
  );
}

final ThemeData lightTheme = _build(AppColors.light, Brightness.light);
final ThemeData darkTheme = _build(AppColors.dark, Brightness.dark);

/// Appends alpha to a color for a soft tinted background (icon badge,
/// selected chip using a category's own color at low opacity).
Color tint(Color c, double opacity) => c.withValues(alpha: opacity);

/// Parses a `#RRGGBB` category/subject color; falls back to [fallback].
Color parseHex(String? hex, Color fallback) {
  if (hex == null || !RegExp(r'^#[0-9a-fA-F]{6}$').hasMatch(hex)) return fallback;
  return Color(int.parse('FF${hex.substring(1)}', radix: 16));
}

/// Mixes [c] toward a target color by [amount] (0-1).
Color mix(Color c, Color target, double amount) =>
    Color.lerp(c, target, amount) ?? c;
