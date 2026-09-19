import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/data/repository.dart' as repo;
import '../../core/logic/logic.dart';
import '../../core/models/models.dart';
import '../../core/providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/tokens.dart';
import '../../core/utils/dates.dart';
import '../../core/widgets/ui.dart';
import 'form_fields.dart';

// ============================================================================
// Task
// ============================================================================

class TaskComposer extends ConsumerStatefulWidget {
  const TaskComposer({super.key});
  @override
  ConsumerState<TaskComposer> createState() => _TaskComposerState();
}

class _TaskComposerState extends ConsumerState<TaskComposer> {
  final _title = TextEditingController();
  bool _showMore = false, _saving = false;
  DateTime? _due;
  bool _hasTime = false;
  String _priority = 'medium';
  String? _categoryId;
  String _repeat = 'none';
  int? _minutes;

  @override
  void initState() {
    super.initState();
    _title.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _title.dispose();
    super.dispose();
  }

  QuickAddResult? get _parsed => _title.text.trim().length > 2 ? parseQuickAdd(_title.text) : null;

  void _applyDetected(QuickAddResult p) {
    final d = parseDateKey(p.dueDate!);
    DateTime date = d;
    if (p.dueTime != null) {
      final t = p.dueTime!.split(':').map(int.parse).toList();
      date = DateTime(d.year, d.month, d.day, t[0], t[1]);
    }
    setState(() {
      _due = date;
      _hasTime = p.dueTime != null;
      _title.text = p.title;
      _showMore = true;
    });
  }

  Future<void> _save() => submitAndPop(context, () async {
        setState(() => _saving = true);
        try {
          await repo.createTask(
            userId: requireUserId(ref),
            title: _title.text,
            categoryId: _categoryId,
            dueDate: _due == null ? null : toDateKey(_due!),
            dueTime: _due != null && _hasTime ? '${pad2(_due!.hour)}:${pad2(_due!.minute)}' : null,
            priority: _priority,
            // A recurrence rule without a due date has nothing to repeat from.
            recurrenceRule: _due != null && _repeat != 'none' ? RecurrenceRule(freq: _repeat) : null,
            estimatedDurationMinutes: _minutes,
          );
        } finally {
          if (mounted) setState(() => _saving = false);
        }
      });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final parsed = _parsed;
    final showDetection = parsed?.dueDate != null && _due == null;

    return ComposerScaffold(
      title: 'New task',
      saveLabel: 'Save task',
      saving: _saving,
      canSave: _title.text.trim().isNotEmpty,
      onSave: _save,
      children: [
        AppInput(controller: _title, hint: 'What do you need to do?', autofocus: true, textInputAction: TextInputAction.done),
        if (showDetection)
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.sm),
            child: Align(
              alignment: Alignment.centerLeft,
              child: ActionChip(
                avatar: Icon(Icons.auto_awesome, size: 16, color: c.accent),
                label: Text('Set to ${_detectedLabel(parsed!)}'),
                onPressed: () => _applyDetected(parsed),
              ),
            ),
          ),
        TextButton(
          onPressed: () => setState(() => _showMore = !_showMore),
          child: Align(alignment: Alignment.centerLeft, child: Text(_showMore ? 'Fewer options' : 'More options', style: AppTypography.subhead(c.accent))),
        ),
        if (_showMore) ...[
          FormSection(
            label: 'Due',
            child: DateTimeField(
              value: _due,
              withTime: true,
              onChanged: (d) => setState(() {
                _due = d;
                _hasTime = d != null;
                if (d == null) _repeat = 'none';
              }),
            ),
          ),
          if (_due != null)
            FormSection(
              label: 'Repeat',
              child: SingleChips<String>(
                options: const [('none', 'Never'), ('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('yearly', 'Yearly')],
                value: _repeat,
                onChanged: (v) => setState(() => _repeat = v ?? 'none'),
              ),
            ),
          FormSection(
            label: 'Priority',
            child: SingleChips<String>(
              options: [for (final p in taskPriorities) (p, p[0].toUpperCase() + p.substring(1))],
              value: _priority,
              onChanged: (v) => setState(() => _priority = v ?? 'medium'),
              colorFor: (p) => switch (p) { 'urgent' => c.danger, 'high' => const Color(0xFFD98A2B), 'low' => c.textTertiary, _ => c.accent },
            ),
          ),
          FormSection(
            label: 'Estimated time',
            child: SingleChips<int>(
              options: const [(0, 'None'), (15, '15m'), (30, '30m'), (60, '1h'), (120, '2h')],
              value: _minutes ?? 0,
              onChanged: (v) => setState(() => _minutes = (v == null || v == 0) ? null : v),
            ),
          ),
          FormSection(label: 'Category', child: CategoryChipList(selectedId: _categoryId, onSelect: (id) => setState(() => _categoryId = id))),
        ],
      ],
    );
  }

  String _detectedLabel(QuickAddResult p) {
    final d = parseDateKey(p.dueDate!);
    if (p.dueTime == null) return formatShortDate(d);
    final t = p.dueTime!.split(':').map(int.parse).toList();
    return '${formatShortDate(d)} · ${formatTime(DateTime(d.year, d.month, d.day, t[0], t[1]))}';
  }
}

// ============================================================================
// Event
// ============================================================================

class EventComposer extends ConsumerStatefulWidget {
  const EventComposer({super.key});
  @override
  ConsumerState<EventComposer> createState() => _EventComposerState();
}

class _EventComposerState extends ConsumerState<EventComposer> {
  final _title = TextEditingController();
  final _location = TextEditingController();
  late DateTime _start = _nextHour();
  late DateTime _end = _start.add(const Duration(hours: 1));
  bool _allDay = false, _saving = false;
  String? _calendarId;

  static DateTime _nextHour() {
    final n = DateTime.now();
    return DateTime(n.year, n.month, n.day, n.hour + 1);
  }

  @override
  void initState() {
    super.initState();
    _title.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _title.dispose();
    _location.dispose();
    super.dispose();
  }

  Future<void> _save(String calendarId) => submitAndPop(context, () async {
        if (!_end.isAfter(_start) && !_allDay) throw StateError('The event must end after it starts.');
        setState(() => _saving = true);
        try {
          final start = _allDay ? dateOnly(_start) : _start;
          final end = _allDay ? dateOnly(_start).add(const Duration(days: 1)) : _end;
          await repo.createEvent(
            userId: requireUserId(ref),
            calendarId: calendarId,
            title: _title.text,
            startAt: start,
            endAt: end,
            allDay: _allDay,
            location: _location.text.trim().isEmpty ? null : _location.text.trim(),
          );
        } finally {
          if (mounted) setState(() => _saving = false);
        }
      });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final calendars = ref.watch(calendarsProvider).value ?? const <CalendarInfo>[];
    final events = ref.watch(eventsProvider).value ?? const <CalendarEvent>[];
    final calendarId = _calendarId ?? calendars.where((x) => x.isDefault).firstOrNull?.id ?? calendars.firstOrNull?.id;
    final conflicts = _allDay ? const <CalendarEvent>[] : findOverlappingEvents(_start, _end, events);

    return ComposerScaffold(
      title: 'New event',
      saveLabel: 'Save event',
      saving: _saving,
      canSave: _title.text.trim().isNotEmpty && calendarId != null,
      onSave: () => _save(calendarId!),
      children: [
        AppInput(controller: _title, hint: 'Event title', autofocus: true),
        const SizedBox(height: AppSpacing.md),
        AppInput(controller: _location, hint: 'Location (optional)'),
        const SizedBox(height: AppSpacing.md),
        SwitchListTile.adaptive(
          contentPadding: EdgeInsets.zero,
          title: Text('All day', style: AppTypography.body(c.textPrimary)),
          value: _allDay,
          onChanged: (v) => setState(() => _allDay = v),
        ),
        FormSection(
          label: _allDay ? 'Date' : 'Starts',
          child: DateTimeField(
            value: _start,
            withTime: !_allDay,
            clearable: false,
            onChanged: (d) => setState(() {
              if (d == null) return;
              final length = _end.difference(_start);
              _start = d;
              _end = d.add(length.isNegative || length == Duration.zero ? const Duration(hours: 1) : length);
            }),
          ),
        ),
        if (!_allDay)
          FormSection(
            label: 'Ends',
            child: DateTimeField(value: _end, withTime: true, clearable: false, onChanged: (d) => setState(() => _end = d ?? _end)),
          ),
        if (conflicts.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(bottom: AppSpacing.lg),
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(color: tint(c.danger, 0.1), borderRadius: BorderRadius.circular(AppRadius.md)),
            child: Text(
              'This overlaps with ${conflicts.map((e) => e.title).join(', ')}. You can still save it.',
              style: AppTypography.subhead(c.danger),
            ),
          ),
        if (calendars.length > 1)
          FormSection(
            label: 'Calendar',
            child: SingleChips<String>(
              options: [for (final cal in calendars) (cal.id, cal.name)],
              value: calendarId,
              onChanged: (v) => setState(() => _calendarId = v),
              colorFor: (id) => parseHex(calendars.firstWhere((x) => x.id == id).color, c.accent),
            ),
          ),
      ],
    );
  }
}
