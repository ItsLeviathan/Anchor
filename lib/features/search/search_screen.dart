import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';

class _Hit {
  const _Hit(this.icon, this.title, this.subtitle);
  final IconData icon;
  final String title, subtitle;
}

bool _matches(String needle, [String? a, String? b]) =>
    (a?.toLowerCase().contains(needle) ?? false) || (b?.toLowerCase().contains(needle) ?? false);

/// Local-first search across tasks, notes, habits, expenses, subjects,
/// assignments and documents (documents are the only network-backed source).
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});
  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _query = TextEditingController();

  @override
  void initState() {
    super.initState();
    _query.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  List<_Hit> _search(String needle) {
    final hits = <_Hit>[];
    for (final t in ref.watch(tasksProvider).value ?? const []) {
      if (_matches(needle, t.title, t.description)) hits.add(_Hit(Icons.check_circle_outline, t.title, t.isCompleted ? 'Completed' : 'Task'));
    }
    for (final n in ref.watch(notesProvider).value ?? const []) {
      if (_matches(needle, n.title, n.content)) {
        hits.add(_Hit(Icons.notes, n.title ?? (n.content.length > 60 ? n.content.substring(0, 60) : n.content), 'Note'));
      }
    }
    for (final h in ref.watch(habitsProvider).value ?? const []) {
      if (_matches(needle, h.name)) hits.add(_Hit(Icons.repeat, h.name, h.frequency));
    }
    for (final e in ref.watch(expensesProvider).value ?? const []) {
      if (_matches(needle, e.notes, e.category)) hits.add(_Hit(Icons.payments_outlined, e.notes ?? e.category, '${e.currency} ${e.amount.toStringAsFixed(2)}'));
    }
    for (final s in ref.watch(subjectsProvider).value ?? const []) {
      if (_matches(needle, s.name, s.instructor)) hits.add(_Hit(Icons.school_outlined, s.name, s.term ?? 'Subject'));
    }
    for (final a in ref.watch(assignmentsProvider).value ?? const []) {
      if (_matches(needle, a.title, a.notes)) hits.add(_Hit(Icons.assignment_outlined, a.title, a.isCompleted ? 'Completed' : 'Assignment'));
    }
    for (final d in ref.watch(documentsProvider).value ?? const []) {
      if (_matches(needle, d.name, d.fileName)) hits.add(_Hit(Icons.folder_outlined, d.name, d.category));
    }
    return hits.take(30).toList();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final needle = _query.text.trim().toLowerCase();
    final hits = needle.isEmpty ? const <_Hit>[] : _search(needle);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: AppSpacing.md,
        title: TextField(
          controller: _query,
          autofocus: true,
          style: AppTypography.body(c.textPrimary),
          decoration: InputDecoration(
            hintText: 'Search tasks, notes, documents…',
            prefixIcon: Icon(Icons.search, color: c.textTertiary),
          ),
        ),
        actions: [TextButton(onPressed: () => context.pop(), child: Text('Cancel', style: TextStyle(color: c.accent)))],
      ),
      body: needle.isEmpty
          ? const EmptyState(icon: Icons.search, title: 'Search everything', message: 'Find tasks, notes, habits, expenses and documents.')
          : hits.isEmpty
              ? EmptyState(icon: Icons.search_off, title: 'No results', message: 'Nothing matches "${_query.text.trim()}".')
              : ListView(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  children: [
                    ListSection(children: [
                      for (final h in hits)
                        ListTile(
                          leading: IconBadge(h.icon),
                          title: Text(h.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                          subtitle: Text(h.subtitle),
                        ),
                    ]),
                  ],
                ),
    );
  }
}
