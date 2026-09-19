import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'ui.dart';

/// Shown while the one-time startup sequence runs, and as the recovery screen
/// when the (critical) local database init fails.
class BootstrapScreen extends StatelessWidget {
  const BootstrapScreen({super.key, this.error, this.onRetry});
  final Object? error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const BrandMark(size: 80),
            const SizedBox(height: AppSpacing.lg),
            if (error == null) ...[
              Text('Anchor', style: AppTypography.title(c.textPrimary)),
              const SizedBox(height: AppSpacing.md),
              SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: c.accent)),
            ] else ...[
              Text('Something went wrong starting Anchor', textAlign: TextAlign.center, style: AppTypography.headline(c.textPrimary)),
              const SizedBox(height: AppSpacing.sm),
              Text('$error', textAlign: TextAlign.center, style: AppTypography.subhead(c.textSecondary)),
              const SizedBox(height: AppSpacing.lg),
              if (onRetry != null) AppButton(label: 'Try again', expand: false, onPressed: onRetry),
            ],
          ]),
        ),
      ),
    );
  }
}

/// Full-screen lock shown over the whole app while app lock is engaged.
class LockScreen extends StatelessWidget {
  const LockScreen({super.key, required this.onUnlock, required this.isAuthenticating, this.error});
  final VoidCallback onUnlock;
  final bool isAuthenticating;
  final String? error;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const BrandMark(size: 80),
            const SizedBox(height: AppSpacing.lg),
            Text('Anchor is locked', style: AppTypography.title(c.textPrimary)),
            const SizedBox(height: AppSpacing.xs),
            Text('Authenticate to continue.', style: AppTypography.subhead(c.textSecondary)),
            if (error != null) ...[
              const SizedBox(height: AppSpacing.md),
              Text(error!, style: AppTypography.subhead(c.danger)),
            ],
            const SizedBox(height: AppSpacing.xl),
            AppButton(label: 'Unlock', icon: Icons.fingerprint, expand: false, loading: isAuthenticating, onPressed: onUnlock),
          ]),
        ),
      ),
    );
  }
}
