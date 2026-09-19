import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/data/repository.dart' as repo;
import '../../core/logic/logic.dart';
import '../../core/models/models.dart';
import '../../core/providers.dart';
import '../../core/theme/tokens.dart';
import '../../core/utils/dates.dart';
import '../../core/utils/toast.dart';
import '../../core/widgets/ui.dart';
import '../shared/items.dart';

class LifeScreen extends ConsumerWidget {
  const LifeScreen({super.key});

  Future<void> _guard(Future<void> f) => f.catchError(toastError);

  Future<void> _openDocument(AnchorDocument d) async {
    try {
      final url = await repo.documentSignedUrl(d.storagePath);
      if (!await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication)) {
        showToast('Could not open the document.', ToastType.error);
      }
    } catch (err) {
      toastError(err);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.colors;
    final expenses = ref.watch(expensesProvider).value ?? const <Expense>[];
    final bills = ref.watch(billsProvider).value ?? const <Bill>[];
    final habits = ref.watch(habitsProvider).value ?? const <Habit>[];
    final notes = ref.watch(notesProvider).value ?? const <Note>[];
    final shopping = ref.watch(defaultShoppingListProvider);
    final documents = ref.watch(documentsProvider);
    final studentMode = ref.watch(studentModeProvider).value ?? false;
    final subjects = ref.watch(subjectsProvider).value ?? const <Subject>[];
    final assignments = ref.watch(assignmentsProvider).value ?? const <Assignment>[];

    final summary = computeMonthlySummary(expenses);
    final unpaid = bills.where((b) => b.isUnpaid).toList();
    final recent = expenses.take(5).toList();
    final currency = expenses.firstOrNull?.currency ?? bills.firstOrNull?.currency ?? 'PHP';

    Widget gap(Widget w) => Padding(padding: const EdgeInsets.only(bottom: AppSpacing.sm), child: w);
    Widget empty(IconData icon, String title, String msg) => EmptyState(icon: icon, title: title, message: msg);

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 120),
        children: [
          const LargeTitle('Life'),

          // ---- Money ----
          Row(children: [
            Expanded(child: Text('Money', style: AppTypography.headline(c.textPrimary))),
            TextButton(onPressed: () => context.push('/bill-new'), child: const Text('+ Bill')),
            TextButton(onPressed: () => context.push('/expense-new'), child: const Text('+ Expense')),
          ]),
          AppCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Eyebrow('This month'),
              const SizedBox(height: AppSpacing.sm),
              Row(children: [
                _Figure('Income', formatMoney(summary.income, currency), c.success),
                _Figure('Expenses', formatMoney(summary.expenses, currency), c.textPrimary),
                _Figure('Remaining', formatMoney(summary.remaining, currency), summary.remaining < 0 ? c.danger : c.textPrimary),
              ]),
            ]),
          ),
          if (unpaid.isNotEmpty) ...[
            const SectionHeader('Bills'),
            for (final b in unpaid)
              gap(BillListItem(
                bill: b,
                onTogglePaid: (x) => _guard(x.isUnpaid ? repo.markBillPaid(x) : repo.markBillUnpaid(x)),
                onDelete: (x) async {
                  if (await confirmDelete(context, 'bill')) await _guard(repo.deleteBill(x.id));
                },
              )),
          ],
          if (recent.isNotEmpty) ...[
            const SectionHeader('Recent'),
            for (final e in recent)
              gap(ExpenseListItem(
                expense: e,
                onDelete: (x) async {
                  if (await confirmDelete(context, 'entry')) await _guard(repo.deleteExpense(x.id));
                },
              )),
          ],

          // ---- Habits ----
          SectionHeader('Habits', actionLabel: '+ Habit', onAction: () => context.push('/habit-new')),
          if (habits.isEmpty)
            empty(Icons.local_fire_department_outlined, 'No habits yet', 'Small, repeatable things add up.')
          else
            for (final h in habits)
              gap(HabitListItem(
                habit: h,
                onToggle: (x) => _guard(repo.toggleHabitToday(x)),
                onDelete: (x) async {
                  if (await confirmDelete(context, 'habit')) await _guard(repo.deleteHabit(x.id));
                },
              )),

          // ---- Shopping ----
          SectionHeader('Shopping', actionLabel: '+ Item', onAction: () => context.push('/shopping-item-new')),
          if (shopping == null || shopping.items.isEmpty)
            empty(Icons.shopping_cart_outlined, 'Your list is empty', 'Add things as you think of them.')
          else ...[
            ListSection(children: [
              for (final item in shopping.items)
                ShoppingItemRow(
                  item: item,
                  onToggle: () => _guard(repo.toggleShoppingItem(shopping, item.id)),
                  onRemove: () => _guard(repo.removeShoppingItem(shopping, item.id)),
                ),
            ]),
            if (shopping.items.any((i) => i.isCompleted))
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(onPressed: () => _guard(repo.clearCompletedShoppingItems(shopping)), child: const Text('Clear completed')),
              ),
          ],

          // ---- Notes ----
          SectionHeader('Notes', actionLabel: '+ Note', onAction: () => context.push('/note-new')),
          if (notes.isEmpty)
            empty(Icons.notes, 'No notes yet', 'Capture a thought before it slips away.')
          else
            for (final n in notes.take(8))
              gap(NoteListItem(
                note: n,
                onPin: (x) => _guard(repo.toggleNotePinned(x)),
                onDelete: (x) async {
                  if (await confirmDelete(context, 'note')) await _guard(repo.deleteNote(x.id));
                },
              )),

          // ---- Documents ----
          SectionHeader('Documents', actionLabel: '+ Document', onAction: () => context.push('/document-new')),
          documents.when(
            loading: () => const Padding(padding: EdgeInsets.all(AppSpacing.lg), child: Center(child: CircularProgressIndicator())),
            error: (_, _) => AppCard(
              onTap: () => ref.invalidate(documentsProvider),
              child: Text('Couldn\'t load documents (they need a connection). Tap to retry.', style: AppTypography.subhead(c.textSecondary)),
            ),
            data: (docs) => docs.isEmpty
                ? empty(Icons.folder_outlined, 'No documents', 'Keep IDs and certificates safe, with expiry reminders.')
                : Column(children: [
                    for (final d in docs)
                      gap(DocumentListItem(
                        document: d,
                        onOpen: _openDocument,
                        onDelete: (x) async {
                          if (!await confirmDelete(context, 'document')) return;
                          await _guard(repo.deleteDocument(x));
                          ref.invalidate(documentsProvider);
                        },
                      )),
                  ]),
          ),

          // ---- Student ----
          if (studentMode) ...[
            SectionHeader('Student', actionLabel: '+ Subject', onAction: () => context.push('/subject-new')),
            if (subjects.isEmpty)
              empty(Icons.school_outlined, 'No subjects yet', 'Add a subject, then track its assignments and exams.')
            else
              for (final s in subjects)
                gap(SubjectCard(
                  subject: s,
                  assignments: assignments.where((a) => a.subjectId == s.id).toList(),
                  onToggle: (a) => _guard(repo.toggleAssignment(a)),
                  onDeleteAssignment: (a) async {
                    if (await confirmDelete(context, a.kind)) await _guard(repo.deleteAssignment(a.id));
                  },
                  onDeleteSubject: () async {
                    if (await confirmDelete(context, 'subject')) await _guard(repo.deleteSubject(s.id));
                  },
                  onAddAssignment: () => context.push('/assignment-new', extra: s.id),
                )),
          ],
        ],
      ),
    );
  }
}

class _Figure extends StatelessWidget {
  const _Figure(this.label, this.value, this.color);
  final String label, value;
  final Color color;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: AppTypography.caption(context.colors.textTertiary)),
          const SizedBox(height: 2),
          FittedBox(fit: BoxFit.scaleDown, child: Text(value, style: AppTypography.subhead(color).copyWith(fontWeight: FontWeight.w600))),
        ]),
      );
}
