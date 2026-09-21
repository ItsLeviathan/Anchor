import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/db/database.dart';
import '../../core/providers.dart';
import '../../core/supabase/supabase_setup.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/ui.dart';

const _snoozeKey = 'guest_upsell_snoozed_until';
const _snoozeFor = Duration(days: 3);

final _snoozedUntilProvider = FutureProvider<DateTime?>((ref) async {
  final raw = await getLocalSetting(_snoozeKey);
  return raw == null ? null : DateTime.tryParse(raw);
});

/// Nudges a guest toward creating an account. Guests keep full local use, so
/// this sells what an account adds (backup, other devices) rather than
/// blocking anything, and steps aside for a few days when dismissed.
///
/// Deliberately slim and light so it never outweighs the screen it sits on.
class GuestUpsellCard extends ConsumerWidget {
  const GuestUpsellCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider).value ?? supabase.auth.currentSession;
    final isGuest = session != null && ref.watch(isAnonymousProvider);
    final snoozedUntil = ref.watch(_snoozedUntilProvider).value;
    final snoozed = snoozedUntil != null && snoozedUntil.isAfter(DateTime.now());
    if (!isGuest || snoozed) return const SizedBox.shrink();

    final c = context.colors;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Container(
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.xs, AppSpacing.md),
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: c.accent.withValues(alpha: 0.28)),
          boxShadow: c.softShadow,
        ),
        child: Row(children: [
          const IconBadge(Icons.cloud_upload_outlined, size: 40),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Keep everything safe',
                  style: AppTypography.subhead(c.textPrimary).copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 2),
              Text('Free account: back up and sync across devices.',
                  style: AppTypography.caption(c.textSecondary).copyWith(fontWeight: FontWeight.w400)),
            ]),
          ),
          const SizedBox(width: AppSpacing.sm),
          FilledButton(
            onPressed: () => context.push('/sign-up'),
            style: FilledButton.styleFrom(
              backgroundColor: c.accent,
              minimumSize: const Size(0, 38),
              padding: const EdgeInsets.symmetric(horizontal: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            ),
            child: const Text('Sign up', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
          IconButton(
            tooltip: 'Not now',
            icon: Icon(Icons.close_rounded, size: 18, color: c.textTertiary),
            onPressed: () async {
              await setLocalSetting(_snoozeKey, DateTime.now().add(_snoozeFor).toIso8601String());
              ref.invalidate(_snoozedUntilProvider);
            },
          ),
        ]),
      ),
    );
  }
}
