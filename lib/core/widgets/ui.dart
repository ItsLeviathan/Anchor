import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../brand/anchor_logo.dart';
import '../sync/sync_engine.dart';
import '../theme/app_theme.dart';
import '../theme/tokens.dart';

// ============================================================================
// Layout primitives
// ============================================================================

/// Soft-elevated surface: depth from layered shadow, not hard borders.
class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.padding = const EdgeInsets.all(AppSpacing.md), this.onTap, this.onLongPress});
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap, onLongPress;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final box = Ink(
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: c.border.withValues(alpha: 0.7), width: 0.6),
        boxShadow: c.softShadow,
      ),
      child: Padding(padding: padding, child: child),
    );
    return Material(
      color: Colors.transparent,
      child: (onTap == null && onLongPress == null)
          ? box
          : InkWell(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              onTap: onTap,
              onLongPress: onLongPress,
              child: box,
            ),
    );
  }
}

/// iOS-style large page title used at the top of each tab.
class LargeTitle extends StatelessWidget {
  const LargeTitle(this.text, {super.key, this.trailing});
  final String text;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.lg),
        child: Row(children: [
          Expanded(child: Text(text, style: AppTypography.largeTitle(context.colors.textPrimary))),
          ?trailing,
        ]),
      );
}

class SectionHeader extends StatelessWidget {
  const SectionHeader(this.title, {super.key, this.actionLabel, this.onAction});
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.lg, bottom: AppSpacing.sm),
      child: Row(children: [
        Expanded(child: Text(title, style: AppTypography.headline(c.textPrimary))),
        if (actionLabel != null)
          TextButton(
            onPressed: onAction,
            style: TextButton.styleFrom(foregroundColor: c.accent, padding: const EdgeInsets.symmetric(horizontal: 8), minimumSize: const Size(0, 32)),
            child: Text(actionLabel!, style: AppTypography.subhead(c.accent).copyWith(fontWeight: FontWeight.w600)),
          ),
      ]),
    );
  }
}

/// Caption-styled small-caps label ("THIS MONTH").
class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) =>
      Text(text.toUpperCase(), style: AppTypography.caption(context.colors.textTertiary).copyWith(letterSpacing: 0.6));
}

/// Groups children in one rounded card with hairline dividers between them.
class ListSection extends StatelessWidget {
  const ListSection({super.key, required this.children, this.header});
  final List<Widget> children;
  final String? header;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (header != null)
        Padding(padding: const EdgeInsets.only(left: AppSpacing.md, bottom: AppSpacing.xs), child: Eyebrow(header!)),
      Container(
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: c.border.withValues(alpha: 0.7), width: 0.6),
          boxShadow: c.softShadow,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) Divider(height: 1, thickness: 0.5, indent: AppSpacing.md, color: c.border),
            children[i],
          ],
        ]),
      ),
    ]);
  }
}

/// Small rounded-square icon on a tinted background.
class IconBadge extends StatelessWidget {
  const IconBadge(this.icon, {super.key, this.color, this.size = 36});
  final IconData icon;
  final Color? color;
  final double size;

  @override
  Widget build(BuildContext context) {
    final col = color ?? context.colors.accent;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: tint(col, 0.16), borderRadius: BorderRadius.circular(size * 0.36)),
      child: Icon(icon, size: size * 0.56, color: col),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.title, this.message, this.actionLabel, this.onAction});
  final IconData icon;
  final String title;
  final String? message, actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl, horizontal: AppSpacing.lg),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        // Icon sits in a soft ring so empty screens feel designed, not blank.
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(shape: BoxShape.circle, color: c.accentMuted.withValues(alpha: 0.55)),
          child: IconBadge(icon, size: 64),
        ),
        const SizedBox(height: AppSpacing.md),
        Text(title, textAlign: TextAlign.center, style: AppTypography.headline(c.textPrimary)),
        if (message != null) ...[
          const SizedBox(height: AppSpacing.xs),
          Text(message!, textAlign: TextAlign.center, style: AppTypography.subhead(c.textSecondary)),
        ],
        if (actionLabel != null) ...[
          const SizedBox(height: AppSpacing.md),
          AppButton(label: actionLabel!, onPressed: onAction, expand: false, variant: ButtonVariant.secondary),
        ],
      ]),
    );
  }
}

// ============================================================================
// Buttons & inputs
// ============================================================================

/// `brand` is the light-on-deep-green button for brand-colored hero screens.
enum ButtonVariant { primary, secondary, danger, brand }

class AppButton extends StatelessWidget {
  const AppButton({super.key, required this.label, this.onPressed, this.loading = false, this.variant = ButtonVariant.primary, this.expand = true, this.icon});
  final String label;
  final VoidCallback? onPressed;
  final bool loading, expand;
  final ButtonVariant variant;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final (bg, fg) = switch (variant) {
      ButtonVariant.primary => (c.accent, Theme.of(context).colorScheme.onPrimary),
      ButtonVariant.secondary => (c.accentMuted, c.accent),
      ButtonVariant.danger => (tint(c.danger, 0.12), c.danger),
      ButtonVariant.brand => (c.onBrand, c.brandDeep),
    };
    final disabled = onPressed == null || loading;

    return Semantics(
      button: true,
      label: label,
      child: Container(
        width: expand ? double.infinity : null,
        height: variant == ButtonVariant.brand ? 58 : 54,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.md),
          // Primary actions get a soft coloured glow so they read as the
          // one thing to press.
          boxShadow: (variant == ButtonVariant.primary && !disabled)
              ? [BoxShadow(color: c.accent.withValues(alpha: 0.32), blurRadius: 18, offset: const Offset(0, 6))]
              : null,
        ),
        child: FilledButton(
          onPressed: disabled ? null : () {
            HapticFeedback.selectionClick();
            onPressed!();
          },
          style: FilledButton.styleFrom(
            backgroundColor: bg,
            foregroundColor: fg,
            disabledBackgroundColor: bg.withValues(alpha: 0.5),
            disabledForegroundColor: fg.withValues(alpha: 0.7),
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            elevation: 0,
          ),
          child: loading
              ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: fg))
              : Row(mainAxisSize: MainAxisSize.min, children: [
                  if (icon != null) ...[Icon(icon, size: 20), const SizedBox(width: 8)],
                  Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: -0.1)),
                ]),
        ),
      ),
    );
  }
}

/// Labeled text field.
class AppInput extends StatelessWidget {
  const AppInput({
    super.key,
    required this.controller,
    this.label,
    this.hint,
    this.keyboardType,
    this.obscure = false,
    this.maxLines = 1,
    this.autofocus = false,
    this.textInputAction,
    this.onSubmitted,
    this.autofillHints,
    this.prefix,
  });
  final TextEditingController controller;
  final String? label, hint, prefix;
  final TextInputType? keyboardType;
  final bool obscure, autofocus;
  final int maxLines;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final Iterable<String>? autofillHints;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (label != null) ...[
        Text(label!, style: AppTypography.caption(c.textSecondary)),
        const SizedBox(height: 6),
      ],
      TextField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscure,
        maxLines: obscure ? 1 : maxLines,
        autofocus: autofocus,
        textInputAction: textInputAction,
        onSubmitted: onSubmitted,
        autofillHints: autofillHints,
        style: AppTypography.body(c.textPrimary),
        decoration: InputDecoration(hintText: hint, prefixText: prefix),
      ),
    ]);
  }
}

/// Labeled group of form controls.
class FormSection extends StatelessWidget {
  const FormSection({super.key, required this.label, required this.child});
  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.lg),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: AppTypography.caption(context.colors.textSecondary)),
          const SizedBox(height: AppSpacing.sm),
          child,
        ]),
      );
}

/// Single- or multi-select chip row used by every selector (priority, duration,
/// recurrence, category, weekday, money category, expense type, kinds).
class ChipSelector<T> extends StatelessWidget {
  const ChipSelector({super.key, required this.options, required this.selected, required this.onToggle, this.colorFor});
  final List<(T, String)> options;
  final Set<T> selected;
  final ValueChanged<T> onToggle;
  final Color? Function(T)? colorFor;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Wrap(spacing: AppSpacing.sm, runSpacing: AppSpacing.sm, children: [
      for (final (value, label) in options)
        Builder(builder: (_) {
          final isSel = selected.contains(value);
          final accent = colorFor?.call(value) ?? c.accent;
          // Selected chips are solid (not a faint tint) so the choice is
          // unmistakable; text flips to whichever of white/dark reads better.
          final onAccent = ThemeData.estimateBrightnessForColor(accent) == Brightness.dark ? Colors.white : const Color(0xFF0B1A15);
          return Semantics(
            selected: isSel,
            button: true,
            label: label,
            child: GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                onToggle(value);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 120),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: isSel ? accent : c.surface,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                  border: Border.all(color: isSel ? accent : c.border),
                ),
                child: Text(label,
                    style: AppTypography.subhead(isSel ? onAccent : c.textSecondary)
                        .copyWith(fontWeight: isSel ? FontWeight.w700 : FontWeight.w500)),
              ),
            ),
          );
        }),
    ]);
  }
}

/// Convenience wrapper for the common single-select case.
class SingleChips<T> extends StatelessWidget {
  const SingleChips({super.key, required this.options, required this.value, required this.onChanged, this.allowClear = false, this.colorFor});
  final List<(T, String)> options;
  final T? value;
  final ValueChanged<T?> onChanged;
  final bool allowClear;
  final Color? Function(T)? colorFor;

  @override
  Widget build(BuildContext context) => ChipSelector<T>(
        options: options,
        selected: value == null ? {} : {value as T},
        colorFor: colorFor,
        onToggle: (v) => onChanged(allowClear && v == value ? null : v),
      );
}

// ============================================================================
// Composer scaffold (full-screen modal with a pinned, always-reachable Save)
// ============================================================================

class ComposerScaffold extends StatelessWidget {
  const ComposerScaffold({super.key, required this.title, required this.onSave, required this.children, this.saving = false, this.saveLabel = 'Save', this.canSave = true});
  final String title, saveLabel;
  final VoidCallback onSave;
  final List<Widget> children;
  final bool saving, canSave;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        leadingWidth: 90,
        leading: TextButton(
          onPressed: () => Navigator.of(context).maybePop(),
          child: Text('Cancel', style: AppTypography.body(c.textSecondary)),
        ),
        centerTitle: true,
        title: Text(title, style: AppTypography.headline(c.textPrimary)),
        actions: [
          // Save is a filled pill so the primary action is obvious.
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.md),
            child: FilledButton(
              onPressed: (saving || !canSave) ? null : onSave,
              style: FilledButton.styleFrom(
                backgroundColor: c.accent,
                foregroundColor: Theme.of(context).colorScheme.onPrimary,
                disabledBackgroundColor: c.border,
                disabledForegroundColor: c.textTertiary,
                minimumSize: const Size(0, 38),
                padding: const EdgeInsets.symmetric(horizontal: 20),
                shape: const StadiumBorder(),
                elevation: 0,
              ),
              child: saving
                  ? SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Theme.of(context).colorScheme.onPrimary))
                  : Text(saveLabel, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, AppSpacing.xl + MediaQuery.of(context).viewInsets.bottom),
          children: children,
        ),
      ),
    );
  }
}

// ============================================================================
// Motion, brand & status
// ============================================================================

/// Fades + lifts its child in on first build. Honors the OS "reduce motion"
/// setting (MediaQuery.disableAnimations) by showing content immediately.
class FadeInView extends StatefulWidget {
  const FadeInView({super.key, required this.child, this.delay = Duration.zero});
  final Widget child;
  final Duration delay;

  @override
  State<FadeInView> createState() => _FadeInViewState();
}

class _FadeInViewState extends State<FadeInView> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 380));
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (MediaQuery.of(context).disableAnimations) {
      _ctrl.value = 1;
    } else {
      Future.delayed(widget.delay, () {
        if (mounted) _ctrl.forward();
      });
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final curved = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic);
    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween(begin: const Offset(0, 0.04), end: Offset.zero).animate(curved),
        child: widget.child,
      ),
    );
  }
}

/// The Anchor logo tile. Same artwork as the launcher icon and splash screen
/// (see `core/brand/anchor_logo.dart`), so the brand is identical everywhere.
class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 88});
  final double size;

  @override
  Widget build(BuildContext context) => AnchorLogo(size: size);
}

/// Small pill showing offline / syncing / pending / failed state; hidden
/// when everything is in sync and online.
class SyncStatusBadge extends StatelessWidget {
  const SyncStatusBadge({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return ValueListenableBuilder<SyncStatus>(
      valueListenable: syncStatus,
      builder: (context, s, _) {
        String? text;
        Color color = c.textSecondary;
        IconData icon = Icons.cloud_off_outlined;
        if (s.failed > 0) {
          text = '${s.failed} failed to sync';
          color = c.danger;
          icon = Icons.error_outline;
        } else if (!s.isOnline) {
          text = s.pending > 0 ? 'Offline · ${s.pending} waiting' : 'Offline';
        } else if (s.isSyncing) {
          text = 'Syncing…';
          icon = Icons.sync;
          color = c.accent;
        } else if (s.pending > 0) {
          text = '${s.pending} waiting to sync';
          icon = Icons.cloud_upload_outlined;
        }
        if (text == null) return const SizedBox.shrink();
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(color: tint(color, 0.12), borderRadius: BorderRadius.circular(AppRadius.full)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 5),
            Text(text, style: AppTypography.caption(color)),
          ]),
        );
      },
    );
  }
}
