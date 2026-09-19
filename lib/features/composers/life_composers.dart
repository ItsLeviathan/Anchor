import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/data/repository.dart' as repo;
import '../../core/models/models.dart';
import '../../core/providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/tokens.dart';
import '../../core/utils/dates.dart';
import '../../core/widgets/ui.dart';
import 'form_fields.dart';

/// Shared state helper for the simple "text + few choices" composers.
mixin _Saving<T extends ConsumerStatefulWidget> on ConsumerState<T> {
  bool saving = false;

  Future<void> run(Future<void> Function() action) => submitAndPop(context, () async {
        setState(() => saving = true);
        try {
          await action();
        } finally {
          if (mounted) setState(() => saving = false);
        }
      });
}

// ============================================================================
// Expense
// ============================================================================

class ExpenseComposer extends ConsumerStatefulWidget {
  const ExpenseComposer({super.key});
  @override
  ConsumerState<ExpenseComposer> createState() => _ExpenseComposerState();
}

class _ExpenseComposerState extends ConsumerState<ExpenseComposer> with _Saving {
  final _amount = TextEditingController();
  final _notes = TextEditingController();
  String _type = 'expense';
  String _category = 'Food';
  DateTime _date = DateTime.now();

  double? get _parsedAmount => double.tryParse(_amount.text.replaceAll(',', ''));

  @override
  void initState() {
    super.initState();
    _amount.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _amount.dispose();
    _notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final a = _parsedAmount;
    return ComposerScaffold(
      title: 'New ${_type == 'income' ? 'income' : 'expense'}',
      saving: saving,
      canSave: a != null && a > 0,
      onSave: () => run(() => repo.createExpense(
            userId: requireUserId(ref),
            type: _type,
            amount: a!,
            category: _category,
            date: toDateKey(_date),
            notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
          )),
      children: [
        SingleChips<String>(
          options: const [('expense', 'Expense'), ('income', 'Income')],
          value: _type,
          onChanged: (v) => setState(() => _type = v ?? 'expense'),
        ),
        const SizedBox(height: AppSpacing.lg),
        AppInput(controller: _amount, label: 'Amount', hint: '0.00', prefix: 'PHP ', keyboardType: const TextInputType.numberWithOptions(decimal: true), autofocus: true),
        const SizedBox(height: AppSpacing.lg),
        FormSection(label: 'Category', child: SingleChips<String>(options: [for (final m in moneyCategories) (m, m)], value: _category, onChanged: (v) => setState(() => _category = v ?? 'Other'))),
        FormSection(label: 'Date', child: DateTimeField(value: _date, clearable: false, onChanged: (d) => setState(() => _date = d ?? _date))),
        AppInput(controller: _notes, label: 'Notes', hint: 'Optional'),
      ],
    );
  }
}

// ============================================================================
// Bill
// ============================================================================

class BillComposer extends ConsumerStatefulWidget {
  const BillComposer({super.key});
  @override
  ConsumerState<BillComposer> createState() => _BillComposerState();
}

class _BillComposerState extends ConsumerState<BillComposer> with _Saving {
  final _name = TextEditingController();
  final _amount = TextEditingController();
  String _category = 'Bills';
  DateTime _due = DateTime.now().add(const Duration(days: 7));
  String _repeat = 'none';

  double? get _parsedAmount => double.tryParse(_amount.text.replaceAll(',', ''));

  @override
  void initState() {
    super.initState();
    _name.addListener(() => setState(() {}));
    _amount.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _name.dispose();
    _amount.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final a = _parsedAmount;
    return ComposerScaffold(
      title: 'New bill',
      saving: saving,
      canSave: _name.text.trim().isNotEmpty && a != null && a > 0,
      onSave: () => run(() => repo.createBill(
            userId: requireUserId(ref),
            name: _name.text,
            amount: a!,
            category: _category,
            dueDate: toDateKey(_due),
            recurrenceRule: _repeat == 'none' ? null : RecurrenceRule(freq: _repeat),
          )),
      children: [
        AppInput(controller: _name, label: 'Name', hint: 'e.g. Electricity', autofocus: true),
        const SizedBox(height: AppSpacing.md),
        AppInput(controller: _amount, label: 'Amount', hint: '0.00', prefix: 'PHP ', keyboardType: const TextInputType.numberWithOptions(decimal: true)),
        const SizedBox(height: AppSpacing.lg),
        FormSection(label: 'Due', child: DateTimeField(value: _due, clearable: false, onChanged: (d) => setState(() => _due = d ?? _due))),
        FormSection(
          label: 'Repeat',
          child: SingleChips<String>(
            options: const [('none', 'Never'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('yearly', 'Yearly')],
            value: _repeat,
            onChanged: (v) => setState(() => _repeat = v ?? 'none'),
          ),
        ),
        FormSection(label: 'Category', child: SingleChips<String>(options: [for (final m in moneyCategories) (m, m)], value: _category, onChanged: (v) => setState(() => _category = v ?? 'Bills'))),
      ],
    );
  }
}

// ============================================================================
// Note
// ============================================================================

class NoteComposer extends ConsumerStatefulWidget {
  const NoteComposer({super.key});
  @override
  ConsumerState<NoteComposer> createState() => _NoteComposerState();
}

class _NoteComposerState extends ConsumerState<NoteComposer> with _Saving {
  final _title = TextEditingController();
  final _content = TextEditingController();
  final _tags = TextEditingController();
  String? _categoryId;

  @override
  void initState() {
    super.initState();
    _content.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _title.dispose();
    _content.dispose();
    _tags.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ComposerScaffold(
        title: 'New note',
        saving: saving,
        canSave: _content.text.trim().isNotEmpty,
        onSave: () => run(() => repo.createNote(
              userId: requireUserId(ref),
              title: _title.text,
              content: _content.text,
              categoryId: _categoryId,
              tags: _tags.text
                  .split(RegExp(r'[,\s]+'))
                  .map((t) => t.replaceFirst('#', '').trim())
                  .where((t) => t.isNotEmpty)
                  .toList(),
            )),
        children: [
          AppInput(controller: _title, hint: 'Title (optional)'),
          const SizedBox(height: AppSpacing.md),
          AppInput(controller: _content, hint: 'Write something…', maxLines: 8, autofocus: true),
          const SizedBox(height: AppSpacing.md),
          AppInput(controller: _tags, label: 'Tags', hint: 'work, ideas'),
          const SizedBox(height: AppSpacing.lg),
          FormSection(label: 'Category', child: CategoryChipList(selectedId: _categoryId, onSelect: (id) => setState(() => _categoryId = id))),
        ],
      );
}

// ============================================================================
// Habit
// ============================================================================

class HabitComposer extends ConsumerStatefulWidget {
  const HabitComposer({super.key});
  @override
  ConsumerState<HabitComposer> createState() => _HabitComposerState();
}

class _HabitComposerState extends ConsumerState<HabitComposer> with _Saving {
  final _name = TextEditingController();
  String _frequency = 'daily';
  final Set<int> _days = {};

  @override
  void initState() {
    super.initState();
    _name.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ComposerScaffold(
        title: 'New habit',
        saving: saving,
        canSave: _name.text.trim().isNotEmpty,
        onSave: () => run(() => repo.createHabit(
              userId: requireUserId(ref),
              name: _name.text,
              frequency: _frequency,
              daysOfWeek: _frequency == 'weekly' && _days.isNotEmpty ? (_days.toList()..sort()) : null,
            )),
        children: [
          AppInput(controller: _name, hint: 'e.g. Read 20 minutes', autofocus: true),
          const SizedBox(height: AppSpacing.lg),
          FormSection(
            label: 'Frequency',
            child: SingleChips<String>(
              options: const [('daily', 'Daily'), ('weekly', 'Weekly')],
              value: _frequency,
              onChanged: (v) => setState(() => _frequency = v ?? 'daily'),
            ),
          ),
          if (_frequency == 'weekly')
            FormSection(
              label: 'Days (leave empty for any day)',
              child: ChipSelector<int>(
                options: weekdayLabels,
                selected: _days,
                onToggle: (d) => setState(() => _days.contains(d) ? _days.remove(d) : _days.add(d)),
              ),
            ),
        ],
      );
}

// ============================================================================
// Shopping item
// ============================================================================

class ShoppingItemComposer extends ConsumerStatefulWidget {
  const ShoppingItemComposer({super.key});
  @override
  ConsumerState<ShoppingItemComposer> createState() => _ShoppingItemComposerState();
}

class _ShoppingItemComposerState extends ConsumerState<ShoppingItemComposer> with _Saving {
  final _name = TextEditingController();
  final _qty = TextEditingController();

  @override
  void initState() {
    super.initState();
    _name.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _name.dispose();
    _qty.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final list = ref.watch(defaultShoppingListProvider);
    return ComposerScaffold(
      title: 'Shopping item',
      saving: saving,
      // Waits for the auto-seeded list to arrive from the first sync.
      canSave: _name.text.trim().isNotEmpty && list != null,
      onSave: () => run(() => repo.addShoppingItem(list!, _name.text, quantity: _qty.text)),
      children: [
        AppInput(controller: _name, hint: 'Item name', autofocus: true),
        const SizedBox(height: AppSpacing.md),
        AppInput(controller: _qty, hint: 'Quantity (optional)'),
        if (list == null)
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.md),
            child: Text('Your shopping list is still syncing for the first time.', style: AppTypography.caption(context.colors.textTertiary)),
          ),
      ],
    );
  }
}

// ============================================================================
// Subject & assignment (Student Mode)
// ============================================================================

const _subjectColors = ['#2F6F5E', '#3B6FB6', '#8A5CC2', '#C1473C', '#D98A2B', '#2E8B9A', '#B5487D'];

class SubjectComposer extends ConsumerStatefulWidget {
  const SubjectComposer({super.key});
  @override
  ConsumerState<SubjectComposer> createState() => _SubjectComposerState();
}

class _SubjectComposerState extends ConsumerState<SubjectComposer> with _Saving {
  final _name = TextEditingController();
  final _instructor = TextEditingController();
  final _term = TextEditingController();
  String _color = _subjectColors.first;

  @override
  void initState() {
    super.initState();
    _name.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _name.dispose();
    _instructor.dispose();
    _term.dispose();
    super.dispose();
  }

  String? _opt(TextEditingController c) => c.text.trim().isEmpty ? null : c.text.trim();

  @override
  Widget build(BuildContext context) => ComposerScaffold(
        title: 'New subject',
        saving: saving,
        canSave: _name.text.trim().isNotEmpty,
        onSave: () => run(() => repo.createSubject(
              userId: requireUserId(ref),
              name: _name.text,
              color: _color,
              instructor: _opt(_instructor),
              term: _opt(_term),
            )),
        children: [
          AppInput(controller: _name, hint: 'Subject name', autofocus: true),
          const SizedBox(height: AppSpacing.md),
          AppInput(controller: _instructor, hint: 'Instructor (optional)'),
          const SizedBox(height: AppSpacing.md),
          AppInput(controller: _term, hint: 'Term (optional)'),
          const SizedBox(height: AppSpacing.lg),
          FormSection(
            label: 'Color',
            child: Wrap(spacing: AppSpacing.md, children: [
              for (final hex in _subjectColors)
                GestureDetector(
                  onTap: () => setState(() => _color = hex),
                  child: Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: parseHex(hex, Colors.grey),
                      shape: BoxShape.circle,
                      border: Border.all(color: _color == hex ? context.colors.textPrimary : Colors.transparent, width: 2.5),
                    ),
                  ),
                ),
            ]),
          ),
        ],
      );
}

class AssignmentComposer extends ConsumerStatefulWidget {
  const AssignmentComposer({super.key, this.subjectId});
  final String? subjectId;
  @override
  ConsumerState<AssignmentComposer> createState() => _AssignmentComposerState();
}

class _AssignmentComposerState extends ConsumerState<AssignmentComposer> with _Saving {
  final _title = TextEditingController();
  final _notes = TextEditingController();
  String? _subjectId;
  String _kind = 'assignment';
  DateTime? _due;

  @override
  void initState() {
    super.initState();
    _subjectId = widget.subjectId;
    _title.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _title.dispose();
    _notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final subjects = ref.watch(subjectsProvider).value ?? const <Subject>[];
    final subjectId = _subjectId ?? subjects.firstOrNull?.id;

    return ComposerScaffold(
      title: 'New $_kind',
      saving: saving,
      canSave: _title.text.trim().isNotEmpty && subjectId != null,
      onSave: () => run(() => repo.createAssignment(
            userId: requireUserId(ref),
            subjectId: subjectId!,
            kind: _kind,
            title: _title.text,
            dueDate: _due == null ? null : toDateKey(_due!),
            notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
          )),
      children: [
        if (subjects.isEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: Text('Add a subject first, then come back to add work to it.', style: AppTypography.subhead(context.colors.textSecondary)),
          ),
        SingleChips<String>(
          options: const [('assignment', 'Assignment'), ('exam', 'Exam'), ('project', 'Project')],
          value: _kind,
          onChanged: (v) => setState(() => _kind = v ?? 'assignment'),
        ),
        const SizedBox(height: AppSpacing.lg),
        AppInput(controller: _title, hint: 'Title', autofocus: true),
        const SizedBox(height: AppSpacing.lg),
        if (subjects.isNotEmpty)
          FormSection(
            label: 'Subject',
            child: SingleChips<String>(
              options: [for (final s in subjects) (s.id, s.name)],
              value: subjectId,
              onChanged: (v) => setState(() => _subjectId = v),
              colorFor: (id) => parseHex(subjects.firstWhere((s) => s.id == id).color, context.colors.accent),
            ),
          ),
        FormSection(label: 'Due', child: DateTimeField(value: _due, onChanged: (d) => setState(() => _due = d))),
        AppInput(controller: _notes, label: 'Notes', hint: 'Optional', maxLines: 3),
      ],
    );
  }
}

// ============================================================================
// Document (uploads to private Supabase Storage)
// ============================================================================

class DocumentComposer extends ConsumerStatefulWidget {
  const DocumentComposer({super.key});
  @override
  ConsumerState<DocumentComposer> createState() => _DocumentComposerState();
}

class _DocumentComposerState extends ConsumerState<DocumentComposer> with _Saving {
  final _name = TextEditingController();
  final _notes = TextEditingController();
  String _category = 'Other';
  DateTime? _issue, _expiry;
  PlatformFile? _file;

  @override
  void initState() {
    super.initState();
    _name.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _name.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _pick() async {
    final file = await FilePicker.pickFile();
    if (file == null) return;
    setState(() {
      _file = file;
      if (_name.text.trim().isEmpty) _name.text = file.name.replaceFirst(RegExp(r'\.[^.]+$'), '');
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return ComposerScaffold(
      title: 'New document',
      saving: saving,
      canSave: _name.text.trim().isNotEmpty && _file != null,
      onSave: () => run(() async {
        await repo.createDocument(
          userId: requireUserId(ref),
          name: _name.text,
          category: _category,
          file: _file!,
          issueDate: _issue == null ? null : toDateKey(_issue!),
          expirationDate: _expiry == null ? null : toDateKey(_expiry!),
          notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
        );
        ref.invalidate(documentsProvider);
      }),
      children: [
        AppButton(
          label: _file == null ? 'Choose file' : _file!.name,
          icon: Icons.attach_file,
          variant: ButtonVariant.secondary,
          onPressed: _pick,
        ),
        const SizedBox(height: AppSpacing.lg),
        AppInput(controller: _name, label: 'Name', hint: "e.g. Driver's license"),
        const SizedBox(height: AppSpacing.lg),
        FormSection(label: 'Category', child: SingleChips<String>(options: [for (final d in documentCategories) (d, d)], value: _category, onChanged: (v) => setState(() => _category = v ?? 'Other'))),
        FormSection(label: 'Issued', child: DateTimeField(value: _issue, onChanged: (d) => setState(() => _issue = d))),
        FormSection(label: 'Expires', child: DateTimeField(value: _expiry, onChanged: (d) => setState(() => _expiry = d))),
        Text('You\'ll get a reminder 14 days before it expires.', style: AppTypography.caption(c.textTertiary)),
        const SizedBox(height: AppSpacing.md),
        AppInput(controller: _notes, label: 'Notes', hint: 'Optional', maxLines: 3),
      ],
    );
  }
}
