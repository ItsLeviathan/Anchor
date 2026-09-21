import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/data/repository.dart' as repo;
import '../../core/logic/logic.dart';
import '../../core/models/models.dart';
import '../../core/providers.dart';
import '../../core/theme/tokens.dart';
import '../../core/utils/dates.dart';
import '../../core/utils/toast.dart';
import '../../core/widgets/ui.dart';
import '../shared/items.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});
  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  late DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  DateTime _selected = dateOnly(DateTime.now());

  void _shift(int delta) => setState(() => _month = DateTime(_month.year, _month.month + delta));

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final tasks = ref.watch(tasksProvider).value ?? const <Task>[];
    final events = ref.watch(eventsProvider).value ?? const <CalendarEvent>[];
    final cells = buildMonthGrid(_month.year, _month.month);
    final agenda = buildAgenda(tasks, events, _selected);

    bool hasItems(DateTime d) =>
        tasksForDate(tasks, d).isNotEmpty || eventsForDate(events, d).isNotEmpty;

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 120),
        children: [
          const LargeTitle('Calendar'),
          AppCard(
            child: Column(children: [
              Row(children: [
                IconButton(tooltip: 'Previous month', icon: const Icon(Icons.chevron_left), onPressed: () => _shift(-1)),
                Expanded(
                  child: Text(DateFormat('MMMM y').format(_month), textAlign: TextAlign.center, style: AppTypography.headline(c.textPrimary)),
                ),
                IconButton(tooltip: 'Next month', icon: const Icon(Icons.chevron_right), onPressed: () => _shift(1)),
              ]),
              Row(children: [
                for (final d in const ['S', 'M', 'T', 'W', 'T', 'F', 'S'])
                  Expanded(child: Center(child: Text(d, style: AppTypography.caption(c.textTertiary)))),
              ]),
              const SizedBox(height: 4),
              GridView.count(
                crossAxisCount: 7,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  for (final cell in cells)
                    _DayCell(
                      cell: cell,
                      selected: isSameDay(cell.date, _selected),
                      today: isSameDay(cell.date, DateTime.now()),
                      hasItems: hasItems(cell.date),
                      onTap: () => setState(() {
                        _selected = cell.date;
                        if (!cell.isCurrentMonth) _month = DateTime(cell.date.year, cell.date.month);
                      }),
                    ),
                ],
              ),
            ]),
          ),
          SectionHeader(formatLongDate(_selected), actionLabel: '+ Event', onAction: () => context.push('/event-new')),
          if (agenda.isEmpty)
            const EmptyState(icon: Icons.event_available_outlined, title: 'Nothing scheduled', message: 'A free day.')
          else
            for (final item in agenda)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: item.event != null
                    ? EventRow(
                        event: item.event!,
                        onDelete: (e) async {
                          if (await confirmDelete(context, 'event')) await repo.deleteEvent(e.id).catchError(toastError);
                        },
                      )
                    : TaskRow(
                        task: item.task!,
                        onToggle: (t) => (t.isCompleted ? repo.reopenTask(t.id) : repo.completeTask(t)).catchError(toastError),
                        onDelete: (t) async {
                          if (await confirmDelete(context, 'task')) await repo.deleteTask(t.id).catchError(toastError);
                        },
                      ),
              ),
        ],
      ),
    );
  }
}

class _DayCell extends StatelessWidget {
  const _DayCell({required this.cell, required this.selected, required this.today, required this.hasItems, required this.onTap});
  final CalendarCell cell;
  final bool selected, today, hasItems;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final fg = selected
        ? Theme.of(context).colorScheme.onPrimary
        : !cell.isCurrentMonth
            ? c.textTertiary
            : today
                ? c.accent
                : c.textPrimary;
    return Semantics(
      button: true,
      selected: selected,
      label: formatLongDate(cell.date),
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Center(
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: selected ? c.accent : (today ? c.accentMuted : Colors.transparent),
              // Today keeps a ring even when another day is selected.
              border: today && !selected ? Border.all(color: c.accent, width: 1.5) : null,
              boxShadow: selected ? [BoxShadow(color: c.accent.withValues(alpha: 0.35), blurRadius: 10, offset: const Offset(0, 3))] : null,
            ),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text('${cell.date.day}', style: AppTypography.subhead(fg).copyWith(fontWeight: today || selected ? FontWeight.w800 : FontWeight.w500)),
              if (hasItems)
                Container(width: 4, height: 4, margin: const EdgeInsets.only(top: 1), decoration: BoxDecoration(shape: BoxShape.circle, color: selected ? fg : c.accent)),
            ]),
          ),
        ),
      ),
    );
  }
}
