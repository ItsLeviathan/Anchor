import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';

/// Height reserved at the bottom of scroll views so content clears the
/// floating tab bar.
const double tabBarClearance = 108;

const double _barHeight = 68;

class _Tab {
  const _Tab(this.label, this.icon, this.activeIcon);
  final String label;
  final IconData icon, activeIcon;
}

// iOS distinguishes the selected tab with a filled glyph: outline at rest,
// filled counterpart on focus.
const _tabs = [
  _Tab('Today', Icons.wb_sunny_outlined, Icons.wb_sunny),
  _Tab('Calendar', Icons.calendar_today_outlined, Icons.calendar_today),
  _Tab('Life', Icons.eco_outlined, Icons.eco),
  _Tab('Profile', Icons.person_outline, Icons.person),
];

/// Four real tabs (each an indexed branch that keeps its own state) plus a
/// fake "Add" slot exactly in the middle (2 + Add + 2): it never becomes a branch - tapping it opens
/// the add sheet instead of switching tabs.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.shell});
  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: shell,
      bottomNavigationBar: _FloatingTabBar(
        currentIndex: shell.currentIndex,
        onSelect: (branch) {
          HapticFeedback.selectionClick();
          shell.goBranch(branch, initialLocation: branch == shell.currentIndex);
        },
        onAdd: () {
          HapticFeedback.lightImpact();
          showAddSheet(context);
        },
      ),
    );
  }
}

class _FloatingTabBar extends StatelessWidget {
  const _FloatingTabBar({required this.currentIndex, required this.onSelect, required this.onAdd});
  final int currentIndex;
  final ValueChanged<int> onSelect;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Widget item(int branch) {
      final t = _tabs[branch];
      final selected = branch == currentIndex;
      return Expanded(
        child: Semantics(
          button: true,
          selected: selected,
          label: t.label,
          child: InkResponse(
            onTap: () => onSelect(branch),
            child: SizedBox(
              height: _barHeight,
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                // Tinted pill behind the selected icon makes the active tab
                // obvious at a glance, not just a colour change.
                AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 52,
                  height: 30,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: selected ? c.accentMuted : Colors.transparent,
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                  child: Icon(selected ? t.activeIcon : t.icon, size: 22, color: selected ? c.accent : c.textSecondary),
                ),
                const SizedBox(height: 2),
                Text(
                  t.label,
                  maxLines: 1,
                  overflow: TextOverflow.clip,
                  style: AppTypography.caption(selected ? c.accent : c.textSecondary).copyWith(
                    fontSize: 11,
                    height: 14 / 11,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
              ]),
            ),
          ),
        ),
      );
    }

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, 0, AppSpacing.md, AppSpacing.sm),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.full),
          // A translucent, blurred bar (not an opaque fill) is the biggest
          // tell for native iOS chrome vs. a flat Material surface.
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
            child: Container(
              height: _barHeight,
              decoration: BoxDecoration(
                color: (isDark ? c.surface : Colors.white).withValues(alpha: 0.94),
                borderRadius: BorderRadius.circular(AppRadius.full),
                border: Border.all(color: c.border, width: 0.8),
              ),
              child: Row(children: [
                item(0),
                item(1),
                Expanded(
                  child: Semantics(
                    button: true,
                    label: 'Add',
                    child: InkResponse(
                      onTap: onAdd,
                      child: Center(
                        child: Container(
                          width: 48,
                          height: 48,
                          // No shadow: inside the clipped bar it rendered as a
                          // grey smudge under the button.
                          decoration: BoxDecoration(shape: BoxShape.circle, color: c.accent),
                          child: Icon(Icons.add, size: 28, color: Theme.of(context).colorScheme.onPrimary),
                        ),
                      ),
                    ),
                  ),
                ),
                item(2),
                item(3),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// Add sheet
// ============================================================================

class _AddOption {
  const _AddOption(this.label, this.icon, this.route, {this.money = false});
  final String label, route;
  final IconData icon;
  final bool money;
}

const _addOptions = [
  _AddOption('Task', Icons.check_box_outlined, '/task-new'),
  _AddOption('Event', Icons.calendar_today_outlined, '/event-new'),
  _AddOption('Reminder', Icons.alarm, '/task-new'),
  _AddOption('Note', Icons.description_outlined, '/note-new'),
  _AddOption('Expense', Icons.payments_outlined, '/expense-new', money: true),
  _AddOption('Bill', Icons.receipt_long_outlined, '/bill-new', money: true),
  _AddOption('Habit', Icons.repeat, '/habit-new'),
  _AddOption('Shopping item', Icons.shopping_cart_outlined, '/shopping-item-new'),
  _AddOption('Document', Icons.folder_outlined, '/document-new'),
  _AddOption('Brain Dump', Icons.bolt_outlined, '/brain-dump'),
];

Future<void> showAddSheet(BuildContext context) {
  final router = GoRouter.of(context);
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) {
      final c = ctx.colors;
      return SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(AppSpacing.md, 0, AppSpacing.md, AppSpacing.lg),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Add', style: AppTypography.title(c.textPrimary)),
            const SizedBox(height: AppSpacing.md),
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: AppSpacing.sm,
              crossAxisSpacing: AppSpacing.sm,
              childAspectRatio: 1.05,
              children: [
                for (final o in _addOptions)
                  InkWell(
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      router.push(o.route);
                    },
                    child: Container(
                      decoration: BoxDecoration(color: c.background, borderRadius: BorderRadius.circular(AppRadius.lg)),
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        IconBadge(o.icon, color: o.money ? c.success : c.accent, size: 44),
                        const SizedBox(height: AppSpacing.sm),
                        Text(o.label, textAlign: TextAlign.center, style: AppTypography.subhead(c.textPrimary)),
                      ]),
                    ),
                  ),
              ],
            ),
          ]),
        ),
      );
    },
  );
}
