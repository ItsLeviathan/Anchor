import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/logic/logic.dart';
import '../../core/models/models.dart';
import '../../core/theme/tokens.dart';

// ============================================================================
// Hero
// ============================================================================

class HeroStat {
  const HeroStat(this.icon, this.value, this.label);
  final IconData icon;
  final int value;
  final String label;
}

/// The top-of-Today brand card: greeting, one-line summary, a live progress
/// ring for the day, three glanceable counts and the single most important task.
class TodayHero extends StatelessWidget {
  const TodayHero({
    super.key,
    required this.date,
    required this.greeting,
    required this.summary,
    required this.done,
    required this.total,
    required this.stats,
    this.focusTitle,
    this.onFocusTap,
  });

  final String date, greeting, summary;
  final int done, total;
  final List<HeroStat> stats;
  final String? focusTitle;
  final VoidCallback? onFocusTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.xl),
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [c.brandMid, c.brandDeep]),
        boxShadow: c.mediumShadow,
      ),
      child: Stack(children: [
        Positioned(
          top: -90,
          right: -70,
          child: IgnorePointer(
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [c.brandGlow.withValues(alpha: 0.32), c.brandGlow.withValues(alpha: 0)]),
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(date.toUpperCase(),
                      style: AppTypography.caption(c.onBrand.withValues(alpha: 0.65)).copyWith(letterSpacing: 1.0, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Text(greeting,
                      style: AppTypography.largeTitle(c.onBrand).copyWith(fontSize: 30, fontWeight: FontWeight.w800, letterSpacing: -0.9)),
                  const SizedBox(height: 6),
                  Text(summary,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.subhead(c.onBrand.withValues(alpha: 0.78))),
                ]),
              ),
              const SizedBox(width: AppSpacing.md),
              ProgressRing(done: done, total: total),
            ]),
            const SizedBox(height: AppSpacing.lg),
            Row(children: [
              for (var i = 0; i < stats.length; i++) ...[
                if (i > 0) const SizedBox(width: AppSpacing.sm),
                Expanded(child: _StatPill(stat: stats[i])),
              ],
            ]),
            if (focusTitle != null) ...[
              const SizedBox(height: AppSpacing.sm),
              _FocusStrip(title: focusTitle!, onTap: onFocusTap),
            ],
          ]),
        ),
      ]),
    );
  }
}

class _StatPill extends StatelessWidget {
  const _StatPill({required this.stat});
  final HeroStat stat;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Semantics(
      label: '${stat.value} ${stat.label}',
      child: ExcludeSemantics(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: c.onBrand.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: c.onBrand.withValues(alpha: 0.12)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(stat.icon, size: 16, color: c.brandGlow),
            const SizedBox(height: 6),
            Text('${stat.value}', style: AppTypography.title(c.onBrand).copyWith(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
            Text(stat.label, style: AppTypography.caption(c.onBrand.withValues(alpha: 0.65))),
          ]),
        ),
      ),
    );
  }
}

class _FocusStrip extends StatelessWidget {
  const _FocusStrip({required this.title, this.onTap});
  final String title;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Material(
      color: c.onBrand.withValues(alpha: 0.14),
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.md),
        onTap: onTap == null
            ? null
            : () {
                HapticFeedback.selectionClick();
                onTap!();
              },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Row(children: [
            Icon(Icons.bolt_rounded, size: 20, color: c.brandGlow),
            const SizedBox(width: 10),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('MOST IMPORTANT',
                    style: AppTypography.caption(c.onBrand.withValues(alpha: 0.6)).copyWith(letterSpacing: 0.9, fontSize: 10.5)),
                const SizedBox(height: 1),
                Text(title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.body(c.onBrand).copyWith(fontWeight: FontWeight.w600)),
              ]),
            ),
            if (onTap != null) Icon(Icons.chevron_right_rounded, color: c.onBrand.withValues(alpha: 0.6)),
          ]),
        ),
      ),
    );
  }
}

// ============================================================================
// Progress ring
// ============================================================================

class ProgressRing extends StatelessWidget {
  const ProgressRing({super.key, required this.done, required this.total, this.size = 96});
  final int done, total, size;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final target = total == 0 ? 0.0 : (done / total).clamp(0.0, 1.0);
    final complete = total > 0 && done >= total;
    final reduce = MediaQuery.of(context).disableAnimations;

    return Semantics(
      label: total == 0 ? 'Nothing planned today' : '$done of $total done today',
      child: ExcludeSemantics(
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: target),
          duration: reduce ? Duration.zero : const Duration(milliseconds: 900),
          curve: Curves.easeOutCubic,
          builder: (context, value, _) => SizedBox(
            width: size.toDouble(),
            height: size.toDouble(),
            child: CustomPaint(
              painter: _RingPainter(progress: value, track: c.onBrand.withValues(alpha: 0.16), color: c.brandGlow, highlight: c.onBrand),
              child: Center(
                child: total == 0
                    ? Icon(Icons.wb_sunny_rounded, color: c.onBrand.withValues(alpha: 0.85), size: 30)
                    : complete
                        ? Icon(Icons.check_rounded, color: c.onBrand, size: 40)
                        : Column(mainAxisSize: MainAxisSize.min, children: [
                            Text('$done/$total',
                                style: AppTypography.title(c.onBrand).copyWith(fontWeight: FontWeight.w800, letterSpacing: -0.5, fontSize: 22)),
                            Text('done', style: AppTypography.caption(c.onBrand.withValues(alpha: 0.65))),
                          ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({required this.progress, required this.track, required this.color, required this.highlight});
  final double progress;
  final Color track, color, highlight;

  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 10.0;
    final rect = Offset.zero & size;
    final arcRect = rect.deflate(stroke / 2);

    canvas.drawArc(
        arcRect,
        0,
        2 * math.pi,
        false,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = stroke
          ..color = track);
    if (progress <= 0) return;

    final sweep = 2 * math.pi * progress;
    canvas.save();
    canvas.translate(size.width / 2, size.height / 2);
    canvas.rotate(-math.pi / 2);
    canvas.translate(-size.width / 2, -size.height / 2);
    canvas.drawArc(
        arcRect,
        0,
        sweep,
        false,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeCap = StrokeCap.round
          ..strokeWidth = stroke
          ..shader = SweepGradient(
            startAngle: 0,
            endAngle: math.max(sweep, 0.01),
            colors: [color.withValues(alpha: 0.6), color, highlight],
          ).createShader(rect));
    canvas.restore();
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.progress != progress || old.color != color || old.track != track;
}

// ============================================================================
// Suggestion
// ============================================================================

/// One quiet tinted card for the daily plan and free-time suggestion, so they
/// read as advice rather than two more data cards.
class SuggestionCard extends StatelessWidget {
  const SuggestionCard({super.key, required this.plan, this.freeTime, this.onTap});
  final String plan;
  final String? freeTime;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Material(
      color: c.accentMuted,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(color: c.surface, shape: BoxShape.circle, boxShadow: c.softShadow),
              child: Icon(Icons.auto_awesome_rounded, size: 18, color: c.accent),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('SUGGESTION',
                    style: AppTypography.caption(c.accent).copyWith(letterSpacing: 0.9, fontSize: 10.5, fontWeight: FontWeight.w700)),
                const SizedBox(height: 3),
                Text(plan, style: AppTypography.body(c.textPrimary).copyWith(fontWeight: FontWeight.w500)),
                if (freeTime != null) ...[
                  const SizedBox(height: 6),
                  Text(freeTime!, style: AppTypography.subhead(c.textSecondary)),
                ],
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}

// ============================================================================
// Habits
// ============================================================================

class HabitStrip extends StatelessWidget {
  const HabitStrip({super.key, required this.habits, required this.onToggle, required this.onDelete});
  final List<Habit> habits;
  final ValueChanged<Habit> onToggle, onDelete;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 112,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        itemCount: habits.length,
        separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
        itemBuilder: (_, i) => _HabitTile(habit: habits[i], onToggle: onToggle, onDelete: onDelete),
      ),
    );
  }
}

class _HabitTile extends StatelessWidget {
  const _HabitTile({required this.habit, required this.onToggle, required this.onDelete});
  final Habit habit;
  final ValueChanged<Habit> onToggle, onDelete;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final done = isCompletedToday(habit);
    final streak = computeStreak(habit);
    final unit = habit.frequency == 'daily' ? 'd' : 'w';
    final unitWord = habit.frequency == 'daily' ? 'day' : 'week';

    return Semantics(
      button: true,
      label: '${habit.name}, ${done ? 'done today' : 'not done yet'}, $streak $unitWord streak',
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        width: 148,
        decoration: BoxDecoration(
          color: done ? c.accentMuted : c.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: done ? c.accent.withValues(alpha: 0.45) : Colors.transparent, width: 1.5),
          boxShadow: done ? const [] : c.softShadow,
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(AppRadius.lg),
            onTap: () {
              HapticFeedback.mediumImpact();
              onToggle(habit);
            },
            onLongPress: () => onDelete(habit),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      done ? Icons.check_circle_rounded : Icons.local_fire_department_rounded,
                      key: ValueKey(done),
                      color: done ? c.success : c.accent,
                      size: 26,
                    ),
                  ),
                  const Spacer(),
                  if (streak > 0)
                    Text('$streak$unit', style: AppTypography.caption(done ? c.accent : c.textSecondary).copyWith(fontWeight: FontWeight.w700)),
                ]),
                const Spacer(),
                Text(habit.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.subhead(c.textPrimary).copyWith(fontWeight: FontWeight.w600, height: 1.2)),
                const SizedBox(height: 2),
                Text(done ? 'Done today' : (streak > 0 ? 'Keep it going' : 'Start a streak'),
                    style: AppTypography.caption(c.textTertiary)),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// Evening review
// ============================================================================

class EveningReviewCard extends StatelessWidget {
  const EveningReviewCard({super.key, required this.review});
  final EveningReview review;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final stats = [
      (review.tasksCompletedToday + review.habitsCompletedToday, 'Done'),
      (review.stillPendingCount, 'Pending'),
      (review.tomorrowCount, 'Tomorrow'),
    ];
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.xl),
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [c.brandMid, c.brandDeep]),
        boxShadow: c.mediumShadow,
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.nightlight_round, size: 16, color: c.brandGlow),
          const SizedBox(width: 8),
          Text('EVENING REVIEW',
              style: AppTypography.caption(c.onBrand.withValues(alpha: 0.7)).copyWith(letterSpacing: 1.0, fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: AppSpacing.md),
        Row(children: [
          for (var i = 0; i < stats.length; i++) ...[
            if (i > 0) Container(width: 1, height: 44, color: c.onBrand.withValues(alpha: 0.14)),
            Expanded(
              child: Column(children: [
                Text('${stats[i].$1}',
                    style: AppTypography.largeTitle(c.onBrand).copyWith(fontWeight: FontWeight.w800, letterSpacing: -1)),
                Text(stats[i].$2, style: AppTypography.caption(c.onBrand.withValues(alpha: 0.65))),
              ]),
            ),
          ],
        ]),
      ]),
    );
  }
}
