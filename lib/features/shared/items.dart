import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/logic/logic.dart';
import '../../core/models/models.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/tokens.dart';
import '../../core/utils/dates.dart';
import '../../core/widgets/ui.dart';

Color priorityColor(BuildContext context, String priority) {
  final c = context.colors;
  return switch (priority) {
    'urgent' => c.danger,
    'high' => const Color(0xFFD98A2B),
    'medium' => c.accent,
    _ => c.textTertiary,
  };
}

Future<bool> confirmDelete(BuildContext context, String what) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text('Delete $what?'),
      content: const Text('This cannot be undone.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
        TextButton(
          onPressed: () => Navigator.pop(ctx, true),
          child: Text('Delete', style: TextStyle(color: Theme.of(ctx).extension<AppColors>()!.danger)),
        ),
      ],
    ),
  );
  return ok ?? false;
}

/// Swipe right to complete/toggle, swipe left to delete.
class SwipeRow extends StatelessWidget {
  const SwipeRow({super.key, required this.id, required this.child, this.onComplete, this.onDelete, this.completeIcon = Icons.check});
  final String id;
  final Widget child;
  final VoidCallback? onComplete, onDelete;
  final IconData completeIcon;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    Widget bg(Color color, IconData icon, Alignment a) => Container(
          alignment: a,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(AppRadius.lg)),
          child: Icon(icon, color: Colors.white),
        );

    return Dismissible(
      key: ValueKey('swipe-$id'),
      direction: onComplete != null && onDelete != null
          ? DismissDirection.horizontal
          : onDelete != null
              ? DismissDirection.endToStart
              : onComplete != null
                  ? DismissDirection.startToEnd
                  : DismissDirection.none,
      background: bg(c.success, completeIcon, Alignment.centerLeft),
      secondaryBackground: bg(c.danger, Icons.delete_outline, Alignment.centerRight),
      confirmDismiss: (dir) async {
        HapticFeedback.mediumImpact();
        if (dir == DismissDirection.startToEnd) {
          onComplete?.call();
        } else {
          onDelete?.call();
        }
        return false; // The list re-renders from the data stream instead.
      },
      child: child,
    );
  }
}

class TaskRow extends StatelessWidget {
  const TaskRow({super.key, required this.task, this.categoryColor, this.highlighted = false, required this.onToggle, required this.onDelete});
  final Task task;
  final Color? categoryColor;
  final bool highlighted;
  final ValueChanged<Task> onToggle;
  final ValueChanged<Task> onDelete;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final done = task.isCompleted;
    final pColor = priorityColor(context, task.priority);
    final overdue = isOverdue(task.dueDate, task.dueTime, task.status);

    return SwipeRow(
      id: task.id,
      onComplete: () => onToggle(task),
      onDelete: () => onDelete(task),
      completeIcon: done ? Icons.undo : Icons.check,
      child: AppCard(
        onTap: () => onToggle(task),
        child: Row(children: [
          // Priority stripe: urgent/high tasks are recognisable before reading.
          if (!done && (task.priority == 'urgent' || task.priority == 'high')) ...[
            Container(width: 4, height: 34, decoration: BoxDecoration(color: pColor, borderRadius: BorderRadius.circular(2))),
            const SizedBox(width: AppSpacing.sm),
          ],
          Semantics(
            label: done ? 'Mark ${task.title} as pending' : 'Complete ${task.title}',
            button: true,
            child: GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                onToggle(task);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: pColor, width: 2.2),
                  color: done ? pColor : Colors.transparent,
                ),
                child: done ? const Icon(Icons.check_rounded, size: 18, color: Colors.white) : null,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                task.title,
                style: AppTypography.body(done ? c.textTertiary : c.textPrimary).copyWith(
                  fontWeight: highlighted ? FontWeight.w700 : FontWeight.w600,
                  decoration: done ? TextDecoration.lineThrough : null,
                ),
              ),
              if (task.dueDate != null)
                Text(formatDueLabel(task.dueDate!, task.dueTime, task.status),
                    style: AppTypography.caption(overdue ? c.danger : c.textSecondary)),
            ]),
          ),
          if (task.recurrenceRule != null) Icon(Icons.repeat, size: 16, color: c.textTertiary),
          if (categoryColor != null) ...[
            const SizedBox(width: AppSpacing.sm),
            Container(width: 8, height: 8, decoration: BoxDecoration(color: categoryColor, shape: BoxShape.circle)),
          ],
        ]),
      ),
    );
  }
}

class EventRow extends StatelessWidget {
  const EventRow({super.key, required this.event, this.onDelete});
  final CalendarEvent event;
  final ValueChanged<CalendarEvent>? onDelete;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final time = event.allDay ? 'All day' : '${formatTime(event.startAt)} – ${formatTime(event.endAt)}';
    return SwipeRow(
      id: 'event-${event.id}',
      onDelete: onDelete == null ? null : () => onDelete!(event),
      child: AppCard(
        child: Row(children: [
          IconBadge(Icons.calendar_today_outlined, color: c.accent),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(event.title, style: AppTypography.body(c.textPrimary).copyWith(fontWeight: FontWeight.w600)),
              Text(time, style: AppTypography.caption(c.textSecondary)),
              if (event.location != null) Text(event.location!, style: AppTypography.caption(c.textTertiary)),
            ]),
          ),
        ]),
      ),
    );
  }
}

class BillListItem extends StatelessWidget {
  const BillListItem({super.key, required this.bill, required this.onTogglePaid, required this.onDelete});
  final Bill bill;
  final ValueChanged<Bill> onTogglePaid, onDelete;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final days = daysUntil(bill.dueDate);
    final paid = !bill.isUnpaid;
    final label = paid
        ? 'Paid'
        : days < 0
            ? 'Overdue by ${-days} ${-days == 1 ? 'day' : 'days'}'
            : days == 0
                ? 'Due today'
                : 'Due in $days ${days == 1 ? 'day' : 'days'}';
    final color = paid ? c.success : (days < 0 ? c.danger : c.textSecondary);

    return SwipeRow(
      id: 'bill-${bill.id}',
      onComplete: () => onTogglePaid(bill),
      onDelete: () => onDelete(bill),
      completeIcon: paid ? Icons.undo : Icons.check,
      child: AppCard(
        onTap: () => onTogglePaid(bill),
        child: Row(children: [
          IconBadge(Icons.receipt_long_outlined, color: paid ? c.success : c.accent),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(bill.name,
                  style: AppTypography.body(paid ? c.textTertiary : c.textPrimary)
                      .copyWith(fontWeight: FontWeight.w500, decoration: paid ? TextDecoration.lineThrough : null)),
              Text(label, style: AppTypography.caption(color)),
            ]),
          ),
          Text(formatMoney(bill.amount, bill.currency), style: AppTypography.subhead(c.textPrimary).copyWith(fontWeight: FontWeight.w600)),
        ]),
      ),
    );
  }
}

class ExpenseListItem extends StatelessWidget {
  const ExpenseListItem({super.key, required this.expense, required this.onDelete});
  final Expense expense;
  final ValueChanged<Expense> onDelete;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final income = expense.isIncome;
    return SwipeRow(
      id: 'expense-${expense.id}',
      onDelete: () => onDelete(expense),
      child: AppCard(
        child: Row(children: [
          IconBadge(income ? Icons.arrow_downward : Icons.arrow_upward, color: income ? c.success : c.accent),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(expense.category, style: AppTypography.body(c.textPrimary).copyWith(fontWeight: FontWeight.w500)),
              Text([formatShortDate(parseDateKey(expense.date)), if (expense.notes != null) expense.notes!].join(' · '),
                  maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTypography.caption(c.textSecondary)),
            ]),
          ),
          Text('${income ? '+' : '−'}${formatMoney(expense.amount, expense.currency)}',
              style: AppTypography.subhead(income ? c.success : c.textPrimary).copyWith(fontWeight: FontWeight.w600)),
        ]),
      ),
    );
  }
}

class HabitListItem extends StatelessWidget {
  const HabitListItem({super.key, required this.habit, required this.onToggle, required this.onDelete});
  final Habit habit;
  final ValueChanged<Habit> onToggle, onDelete;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final done = isCompletedToday(habit);
    final streak = computeStreak(habit);
    final unit = habit.frequency == 'daily' ? 'day' : 'week';

    return SwipeRow(
      id: 'habit-${habit.id}',
      onComplete: () => onToggle(habit),
      onDelete: () => onDelete(habit),
      child: AppCard(
        onTap: () => onToggle(habit),
        child: Row(children: [
          IconBadge(done ? Icons.check_circle : Icons.local_fire_department_outlined, color: done ? c.success : c.accent),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(habit.name, style: AppTypography.body(c.textPrimary).copyWith(fontWeight: FontWeight.w500)),
              Text(streak > 0 ? '$streak $unit${streak == 1 ? '' : 's'} streak' : 'Start your streak',
                  style: AppTypography.caption(c.textSecondary)),
            ]),
          ),
          Icon(done ? Icons.check_circle : Icons.circle_outlined, color: done ? c.success : c.textTertiary),
        ]),
      ),
    );
  }
}

class NoteListItem extends StatelessWidget {
  const NoteListItem({super.key, required this.note, required this.onPin, required this.onDelete});
  final Note note;
  final ValueChanged<Note> onPin, onDelete;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return SwipeRow(
      id: 'note-${note.id}',
      onDelete: () => onDelete(note),
      child: AppCard(
        onTap: () => onPin(note),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(
              child: Text(note.title ?? note.content.split('\n').first,
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: AppTypography.body(c.textPrimary).copyWith(fontWeight: FontWeight.w600)),
            ),
            if (note.isPinned) Icon(Icons.push_pin, size: 16, color: c.accent),
          ]),
          if (note.title != null)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(note.content, maxLines: 2, overflow: TextOverflow.ellipsis, style: AppTypography.subhead(c.textSecondary)),
            ),
          if (note.tags.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(note.tags.map((t) => '#$t').join(' '), style: AppTypography.caption(c.accent)),
            ),
        ]),
      ),
    );
  }
}

class ShoppingItemRow extends StatelessWidget {
  const ShoppingItemRow({super.key, required this.item, required this.onToggle, required this.onRemove});
  final ShoppingItem item;
  final VoidCallback onToggle, onRemove;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return InkWell(
      onTap: onToggle,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 12),
        child: Row(children: [
          Icon(item.isCompleted ? Icons.check_circle : Icons.circle_outlined,
              color: item.isCompleted ? c.success : c.textTertiary),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              item.quantity != null ? '${item.name} · ${item.quantity}' : item.name,
              style: AppTypography.body(item.isCompleted ? c.textTertiary : c.textPrimary)
                  .copyWith(decoration: item.isCompleted ? TextDecoration.lineThrough : null),
            ),
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            tooltip: 'Remove ${item.name}',
            icon: Icon(Icons.close, size: 18, color: c.textTertiary),
            onPressed: onRemove,
          ),
        ]),
      ),
    );
  }
}

class DocumentListItem extends StatelessWidget {
  const DocumentListItem({super.key, required this.document, required this.onOpen, required this.onDelete});
  final AnchorDocument document;
  final ValueChanged<AnchorDocument> onOpen, onDelete;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final status = expirationStatus(document.expirationDate);
    final label = formatExpirationLabel(document.expirationDate);
    final statusColor = switch (status) { 'expired' => c.danger, 'soon' => const Color(0xFFD98A2B), _ => c.textSecondary };

    return SwipeRow(
      id: 'doc-${document.id}',
      onDelete: () => onDelete(document),
      child: AppCard(
        onTap: () => onOpen(document),
        child: Row(children: [
          const IconBadge(Icons.folder_outlined),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(document.name, style: AppTypography.body(c.textPrimary).copyWith(fontWeight: FontWeight.w500)),
              Text(document.category, style: AppTypography.caption(c.textSecondary)),
              if (label != null) Text(label, style: AppTypography.caption(statusColor)),
            ]),
          ),
        ]),
      ),
    );
  }
}

class SubjectCard extends StatelessWidget {
  const SubjectCard({super.key, required this.subject, required this.assignments, required this.onToggle, required this.onDeleteAssignment, required this.onDeleteSubject, required this.onAddAssignment});
  final Subject subject;
  final List<Assignment> assignments;
  final ValueChanged<Assignment> onToggle, onDeleteAssignment;
  final VoidCallback onDeleteSubject, onAddAssignment;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final color = parseHex(subject.color, c.accent);
    final pending = assignments.where((a) => !a.isCompleted).toList();

    return AppCard(
      onLongPress: onDeleteSubject,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: AppSpacing.sm),
          Expanded(child: Text(subject.name, style: AppTypography.headline(c.textPrimary))),
          IconButton(
            visualDensity: VisualDensity.compact,
            tooltip: 'Add assignment',
            icon: Icon(Icons.add, color: c.accent),
            onPressed: onAddAssignment,
          ),
        ]),
        if (subject.instructor != null || subject.term != null)
          Text([?subject.instructor, ?subject.term].join(' · '), style: AppTypography.caption(c.textSecondary)),
        if (pending.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.sm),
            child: Text('Nothing pending', style: AppTypography.subhead(c.textTertiary)),
          ),
        for (final a in assignments)
          InkWell(
            onTap: () => onToggle(a),
            onLongPress: () => onDeleteAssignment(a),
            child: Padding(
              padding: const EdgeInsets.only(top: AppSpacing.sm),
              child: Row(children: [
                Icon(a.isCompleted ? Icons.check_circle : Icons.circle_outlined, size: 20, color: a.isCompleted ? c.success : c.textTertiary),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(a.title,
                      style: AppTypography.subhead(a.isCompleted ? c.textTertiary : c.textPrimary)
                          .copyWith(decoration: a.isCompleted ? TextDecoration.lineThrough : null)),
                ),
                Text(a.kind, style: AppTypography.caption(c.textTertiary)),
                if (a.dueDate != null) ...[
                  const SizedBox(width: 8),
                  Text(formatShortDate(parseDateKey(a.dueDate!)), style: AppTypography.caption(c.textSecondary)),
                ],
              ]),
            ),
          ),
      ]),
    );
  }
}
