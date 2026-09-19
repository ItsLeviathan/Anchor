import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/db/database.dart';
import '../../core/notifications/notification_service.dart';
import '../../core/providers.dart';
import '../../core/security/app_lock.dart';
import '../../core/supabase/supabase_setup.dart';
import '../../core/theme/tokens.dart';
import '../../core/utils/toast.dart';
import '../../core/widgets/ui.dart';
import '../today/today_screen.dart';

final remindersEnabledProvider = FutureProvider<bool>((ref) => areRemindersEnabled());
final biometricAvailableProvider = FutureProvider<bool>((ref) => isBiometricAvailable());

/// One row of a Settings-style grouped list: regular-weight title, muted
/// description, trailing accessory (Switch, or nothing for a plain action).
class _SettingsRow extends StatelessWidget {
  const _SettingsRow({required this.icon, required this.label, required this.description, this.accessory, this.onTap, this.color});
  final IconData icon;
  final String label, description;
  final Widget? accessory;
  final VoidCallback? onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(children: [
          IconBadge(icon, color: color ?? c.accent),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label, style: AppTypography.body(color ?? c.textPrimary)),
              Text(description, style: AppTypography.caption(c.textSecondary)),
            ]),
          ),
          ?accessory,
        ]),
      ),
    );
  }
}

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _deleting = false;

  @override
  void initState() {
    super.initState();
    // Write-then-read against the local database to prove the local-first
    // pattern end to end: this works identically offline.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = supabase.auth.currentUser;
      if (user != null) cacheProfile(id: user.id, isAnonymous: user.isAnonymous);
    });
  }

  Future<void> _toggleLock(bool value) async {
    final lock = ref.read(appLockProvider.notifier);
    // Require a successful authentication before turning the lock ON, so the
    // user can't lock themselves out with a biometric that doesn't work.
    if (value && !await authenticateWithBiometric()) {
      showToast('Authentication failed - app lock not enabled.', ToastType.error);
      return;
    }
    lock.setLockEnabled(value);
    try {
      await persistAppLockEnabled(value);
    } catch (err) {
      lock.setLockEnabled(!value);
      toastError(err);
    }
  }

  Future<void> _deleteAccount() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete account'),
        content: const Text('This permanently deletes your account and all your data. This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text('Delete', style: TextStyle(color: ctx.colors.danger))),
        ],
      ),
    );
    if (ok != true) return;

    setState(() => _deleting = true);
    try {
      await supabase.functions.invoke('delete-account');
      await supabase.auth.signOut();
      if (mounted) context.go('/welcome');
    } catch (err) {
      toastError(err);
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final session = ref.watch(sessionProvider).value ?? supabase.auth.currentSession;
    final isAnonymous = ref.watch(isAnonymousProvider);
    final reminders = ref.watch(remindersEnabledProvider).value ?? true;
    final personalized = ref.watch(personalizedSuggestionsProvider).value ?? true;
    final studentMode = ref.watch(studentModeProvider).value ?? false;
    final lock = ref.watch(appLockProvider);
    final biometric = ref.watch(biometricAvailableProvider).value ?? false;
    final email = session?.user.email;

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 120),
        children: [
          const LargeTitle('Profile'),
          AppCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const IconBadge(Icons.person_outline),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(isAnonymous ? 'Guest' : (email ?? 'Signed in'), style: AppTypography.headline(c.textPrimary)),
                    if (session != null)
                      Text('User ID: ${session.user.id.substring(0, 8)}…', style: AppTypography.caption(c.textTertiary)),
                    const SizedBox(height: 4),
                    const SyncStatusBadge(),
                  ]),
                ),
              ]),
              if (isAnonymous) ...[
                const SizedBox(height: AppSpacing.md),
                Row(children: [
                  Expanded(child: AppButton(label: 'Create account', onPressed: () => context.push('/sign-up'))),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(child: AppButton(label: 'Sign in', variant: ButtonVariant.secondary, onPressed: () => context.push('/sign-in'))),
                ]),
              ],
            ]),
          ),
          const SizedBox(height: AppSpacing.lg),
          ListSection(header: 'Preferences', children: [
            _SettingsRow(
              icon: Icons.notifications_outlined,
              label: 'Task & event reminders',
              description: 'Notify me when something is due or about to start',
              accessory: Switch(
                value: reminders,
                onChanged: (v) async {
                  await setRemindersEnabled(v);
                  ref.invalidate(remindersEnabledProvider);
                },
              ),
            ),
            _SettingsRow(
              icon: Icons.auto_awesome_outlined,
              label: 'Personalized suggestions',
              description: 'Free-time suggestions based on your schedule and task estimates',
              accessory: Switch(value: personalized, onChanged: (v) => setPersonalizedSuggestions(ref, v)),
            ),
            _SettingsRow(
              icon: Icons.school_outlined,
              label: 'Student Mode',
              description: 'Track subjects, assignments, and exams on the Life tab',
              accessory: Switch(
                value: studentMode,
                onChanged: (v) => setStudentMode(ref, v).catchError(toastError),
              ),
            ),
          ]),
          if (biometric || lock.lockEnabled) ...[
            const SizedBox(height: AppSpacing.lg),
            ListSection(header: 'Security', children: [
              _SettingsRow(
                icon: Icons.lock_outline,
                label: 'App lock',
                description: 'Require biometric or passcode to open Anchor',
                accessory: Switch(value: lock.lockEnabled, onChanged: _toggleLock),
              ),
            ]),
          ],
          const SizedBox(height: AppSpacing.lg),
          ListSection(header: 'Account', children: [
            _SettingsRow(
              icon: Icons.delete_outline,
              color: c.danger,
              label: _deleting ? 'Deleting…' : 'Delete account',
              description: 'Permanently deletes your account and all data',
              onTap: _deleting ? null : _deleteAccount,
            ),
          ]),
        ],
      ),
    );
  }
}
