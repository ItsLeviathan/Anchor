import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/models.dart';
import '../../core/providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/tokens.dart';
import '../../core/utils/dates.dart';
import '../../core/utils/toast.dart';
import '../../core/widgets/ui.dart';

/// Tappable field that opens the platform date (and optionally time) picker.
class DateTimeField extends StatelessWidget {
  const DateTimeField({super.key, required this.value, required this.onChanged, this.withTime = false, this.placeholder = 'Add date', this.clearable = true, this.firstDate, this.lastDate});
  final DateTime? value;
  final ValueChanged<DateTime?> onChanged;
  final bool withTime, clearable;
  final String placeholder;
  final DateTime? firstDate, lastDate;

  Future<void> _pick(BuildContext context) async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: value ?? now,
      firstDate: firstDate ?? DateTime(now.year - 5),
      lastDate: lastDate ?? DateTime(now.year + 10),
    );
    if (date == null || !context.mounted) return;
    if (!withTime) return onChanged(DateTime(date.year, date.month, date.day));
    final time = await showTimePicker(
      context: context,
      initialTime: value != null ? TimeOfDay.fromDateTime(value!) : const TimeOfDay(hour: 9, minute: 0),
    );
    onChanged(DateTime(date.year, date.month, date.day, time?.hour ?? 0, time?.minute ?? 0));
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final text = value == null
        ? placeholder
        : withTime
            ? '${formatShortDate(value!)} · ${formatTime(value!)}'
            : formatShortDate(value!);
    return InkWell(
      borderRadius: BorderRadius.circular(AppRadius.md),
      onTap: () => _pick(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 14),
        decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(AppRadius.md), border: Border.all(color: c.border)),
        child: Row(children: [
          Icon(withTime ? Icons.schedule : Icons.calendar_today_outlined, size: 18, color: c.textSecondary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(child: Text(text, style: AppTypography.body(value == null ? c.textTertiary : c.textPrimary))),
          if (value != null && clearable)
            GestureDetector(onTap: () => onChanged(null), child: Icon(Icons.close, size: 18, color: c.textTertiary)),
        ]),
      ),
    );
  }
}

/// Category chips (optionally deselectable), tinted with each category's color.
class CategoryChipList extends ConsumerWidget {
  const CategoryChipList({super.key, required this.selectedId, required this.onSelect});
  final String? selectedId;
  final ValueChanged<String?> onSelect;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(categoriesProvider).value ?? const <Category>[];
    if (categories.isEmpty) return const SizedBox.shrink();
    final c = context.colors;
    return SingleChips<String>(
      options: [for (final cat in categories) (cat.id, cat.name)],
      value: selectedId,
      allowClear: true,
      onChanged: onSelect,
      colorFor: (id) => parseHex(categories.firstWhere((x) => x.id == id).color, c.accent),
    );
  }
}

/// Runs [action], toasts on failure (keeping the sheet open so input isn't
/// lost), and pops on success.
Future<void> submitAndPop(BuildContext context, Future<void> Function() action) async {
  try {
    await action();
    if (context.mounted) context.pop();
  } catch (err) {
    toastError(err);
  }
}

/// Small typed helper: read the current user id or throw a friendly error.
String requireUserId(WidgetRef ref) {
  final id = ref.read(userIdProvider);
  if (id == null) throw StateError('Still starting up - please try again in a moment.');
  return id;
}

const weekdayLabels = [(0, 'S'), (1, 'M'), (2, 'T'), (3, 'W'), (4, 'T'), (5, 'F'), (6, 'S')];
