import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/data/repository.dart' as repo;
import '../../core/logic/logic.dart';
import '../../core/models/models.dart';
import '../../core/providers.dart';
import '../../core/theme/tokens.dart';
import '../../core/utils/toast.dart';
import '../../core/widgets/ui.dart';
import 'form_fields.dart';

/// Type a messy list, one thought per line; Anchor sorts it into tasks by
/// category (rule-based, fully offline) and lets you drop any before saving.
class BrainDumpComposer extends ConsumerStatefulWidget {
  const BrainDumpComposer({super.key});
  @override
  ConsumerState<BrainDumpComposer> createState() => _BrainDumpComposerState();
}

class _BrainDumpComposerState extends ConsumerState<BrainDumpComposer> {
  final _text = TextEditingController();
  List<BrainDumpItem>? _items;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _text.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  Future<void> _create(List<Category> categories) => submitAndPop(context, () async {
        final items = _items!;
        if (items.isEmpty) throw StateError('Nothing to create.');
        setState(() => _saving = true);
        try {
          final uid = requireUserId(ref);
          for (final item in items) {
            final cat = categories.where((c) => c.name == item.categoryName).firstOrNull;
            await repo.createTask(userId: uid, title: item.title, categoryId: cat?.id);
          }
          showToast('Created ${items.length} task${items.length == 1 ? '' : 's'}', ToastType.success);
        } finally {
          if (mounted) setState(() => _saving = false);
        }
      });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final categories = ref.watch(categoriesProvider).value ?? const <Category>[];
    final items = _items;

    if (items == null) {
      return ComposerScaffold(
        title: 'Brain Dump',
        saveLabel: 'Organize',
        canSave: _text.text.trim().isNotEmpty,
        onSave: () => setState(() => _items = parseBrainDumpText(_text.text, categories)),
        children: [
          Text('Get it all out of your head - one thought per line. Anchor will turn each into a task.',
              style: AppTypography.subhead(c.textSecondary)),
          const SizedBox(height: AppSpacing.md),
          AppInput(controller: _text, hint: 'Call the dentist\nPay rent\nBuy groceries…', maxLines: 10, autofocus: true),
        ],
      );
    }

    final grouped = <String, List<BrainDumpItem>>{};
    for (final i in items) {
      grouped.putIfAbsent(i.categoryName, () => []).add(i);
    }

    return ComposerScaffold(
      title: 'Review',
      saveLabel: 'Create ${items.length}',
      saving: _saving,
      canSave: items.isNotEmpty,
      onSave: () => _create(categories),
      children: [
        Text('Here\'s how it sorted. Tap × to drop anything you don\'t want.', style: AppTypography.subhead(c.textSecondary)),
        const SizedBox(height: AppSpacing.md),
        for (final entry in grouped.entries)
          FormSection(
            label: entry.key,
            child: Column(children: [
              for (final item in entry.value)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: AppCard(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 6),
                    child: Row(children: [
                      Expanded(child: Text(item.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTypography.body(c.textPrimary))),
                      IconButton(
                        tooltip: 'Remove',
                        icon: Icon(Icons.close, size: 18, color: c.textTertiary),
                        onPressed: () => setState(() => _items = [...items]..remove(item)),
                      ),
                    ]),
                  ),
                ),
            ]),
          ),
        TextButton(onPressed: () => setState(() => _items = null), child: const Text('Back to edit')),
      ],
    );
  }
}
