import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/theme/tokens.dart';

/// Deep-green brand gradient with two soft light pools. Pure gradients (no
/// blur filters) so it stays smooth on low-end devices and emulators.
class WelcomeBackdrop extends StatelessWidget {
  const WelcomeBackdrop({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return DecoratedBox(
      decoration: BoxDecoration(gradient: c.brandGradient),
      child: Stack(children: [
        Positioned(top: -120, right: -140, child: _Glow(size: 420, color: c.brandGlow, opacity: 0.34)),
        Positioned(bottom: 120, left: -180, child: _Glow(size: 420, color: c.accent, opacity: 0.22)),
        child,
      ]),
    );
  }
}

class _Glow extends StatelessWidget {
  const _Glow({required this.size, required this.color, required this.opacity});
  final double size, opacity;
  final Color color;

  @override
  Widget build(BuildContext context) => IgnorePointer(
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: [color.withValues(alpha: opacity), color.withValues(alpha: 0)]),
          ),
        ),
      );
}

/// Three overlapping product cards that drift gently, so the first screen
/// shows what Anchor holds instead of describing it. Decorative only.
class PreviewCollage extends StatefulWidget {
  const PreviewCollage({super.key});
  static const double width = 330, height = 372;

  @override
  State<PreviewCollage> createState() => _PreviewCollageState();
}

class _PreviewCollageState extends State<PreviewCollage> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl =
      AnimationController(vsync: this, duration: const Duration(seconds: 7));
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (!MediaQuery.of(context).disableAnimations) _ctrl.repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Widget _float(double phase, double angle, Widget card) => AnimatedBuilder(
        animation: _ctrl,
        child: card,
        builder: (context, child) => Transform.translate(
          offset: Offset(0, math.sin((_ctrl.value + phase) * 2 * math.pi) * 6),
          child: Transform.rotate(angle: angle, child: child),
        ),
      );

  @override
  Widget build(BuildContext context) {
    return ExcludeSemantics(
      child: SizedBox(
        width: PreviewCollage.width,
        height: PreviewCollage.height,
        child: Stack(clipBehavior: Clip.none, children: [
          Positioned(left: 0, top: 6, child: _float(0, -0.09, const _TasksCard())),
          Positioned(right: 0, top: 172, child: _float(0.33, 0.07, const _BillCard())),
          Positioned(left: 14, bottom: 0, child: _float(0.66, -0.05, const _HabitCard())),
        ]),
      ),
    );
  }
}

/// Cards are always light, whatever the app theme, to pop against the hero.
const _card = AppColors.light;

BoxDecoration _cardDecoration() => BoxDecoration(
      color: _card.surface,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      boxShadow: const [
        BoxShadow(color: Color(0x40000000), blurRadius: 30, offset: Offset(0, 14)),
      ],
    );

class _TasksCard extends StatelessWidget {
  const _TasksCard();

  @override
  Widget build(BuildContext context) {
    const rows = [
      ('Send the invoice', true),
      ('Call the dentist', false),
      ('Pick up groceries', false),
    ];
    return Container(
      width: 232,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: _cardDecoration(),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('TODAY', style: AppTypography.caption(_card.textTertiary).copyWith(letterSpacing: 1.2, fontWeight: FontWeight.w700)),
        const SizedBox(height: AppSpacing.sm),
        for (final (label, done) in rows)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(children: [
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: done ? _card.accent : Colors.transparent,
                  border: done ? null : Border.all(color: _card.border, width: 1.6),
                ),
                child: done ? const Icon(Icons.check_rounded, size: 14, color: Colors.white) : null,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  style: AppTypography.subhead(done ? _card.textTertiary : _card.textPrimary).copyWith(
                    fontWeight: FontWeight.w500,
                    decoration: done ? TextDecoration.lineThrough : null,
                  ),
                ),
              ),
            ]),
          ),
      ]),
    );
  }
}

class _BillCard extends StatelessWidget {
  const _BillCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 196,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: _cardDecoration(),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(color: _card.accentMuted, borderRadius: BorderRadius.circular(10)),
            child: Icon(Icons.home_rounded, size: 18, color: _card.accent),
          ),
          const SizedBox(width: 10),
          Text('Rent', style: AppTypography.headline(_card.textPrimary).copyWith(fontSize: 16)),
        ]),
        const SizedBox(height: AppSpacing.md),
        Text('\$1,240', style: AppTypography.title(_card.textPrimary).copyWith(letterSpacing: -0.6, fontWeight: FontWeight.w800)),
        const SizedBox(height: 2),
        Text('Due Friday', style: AppTypography.caption(_card.textSecondary)),
      ]),
    );
  }
}

class _HabitCard extends StatelessWidget {
  const _HabitCard();

  @override
  Widget build(BuildContext context) {
    const week = [true, true, true, true, true, true, false];
    return Container(
      width: 184,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: _cardDecoration(),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.local_fire_department_rounded, size: 20, color: Color(0xFFE8833A)),
          const SizedBox(width: 6),
          Text('12-day streak', style: AppTypography.subhead(_card.textPrimary).copyWith(fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 10),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          for (final on in week)
            Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(5),
                color: on ? _card.accent : _card.accentMuted,
              ),
            ),
        ]),
      ]),
    );
  }
}
