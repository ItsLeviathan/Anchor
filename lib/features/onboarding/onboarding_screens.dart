import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/supabase/social_auth.dart';
import '../../core/supabase/supabase_setup.dart';
import '../../core/theme/tokens.dart';
import '../../core/utils/toast.dart';
import '../../core/widgets/ui.dart';
import 'onboarding_state.dart';
import 'welcome_hero.dart';

// ============================================================================
// Welcome
// ============================================================================

String _guestFailureMessage(Object err) {
  if (err is AuthException && err.code == 'anonymous_provider_disabled') {
    return 'Guest mode is unavailable right now. Create an account to continue.';
  }
  return 'Couldn’t start. Check your connection and try again.';
}

class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});
  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  bool _starting = false;

  Future<void> _getStarted() async {
    setState(() => _starting = true);
    try {
      // "Get started" never requires an account: make sure there is an
      // (anonymous) session, e.g. after deleting an account signed us out.
      if (supabase.auth.currentSession == null) {
        await supabase.auth.signInAnonymously().timeout(const Duration(seconds: 15));
      }
    } catch (err) {
      // Without a session every read and write is scoped to no user, so
      // entering the app would show a silently broken Today. Stay here and
      // offer the account route instead.
      debugPrint('Anonymous sign-in failed: $err');
      if (!mounted) return;
      setState(() => _starting = false);
      showToast(_guestFailureMessage(err), ToastType.error);
      return;
    }
    await setOnboardingComplete();
    ref.read(onboardingCompleteProvider.notifier).markComplete();
    if (mounted) context.go('/today');
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: c.brandDeep,
        body: WelcomeBackdrop(
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.lg),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                FadeInView(
                  child: Row(children: [
                    const BrandMark(size: 40),
                    const SizedBox(width: 10),
                    Text('Anchor', style: AppTypography.headline(c.onBrand).copyWith(fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: -0.3)),
                  ]),
                ),
                Expanded(
                  child: FadeInView(
                    delay: const Duration(milliseconds: 120),
                    child: const Center(
                      child: FittedBox(fit: BoxFit.scaleDown, child: PreviewCollage()),
                    ),
                  ),
                ),
                FadeInView(
                  delay: const Duration(milliseconds: 240),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Your whole life,\nin one calm place.', style: AppTypography.display(c.onBrand)),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      'Tasks, calendar, bills, notes and habits — private, fast, and always yours.',
                      style: AppTypography.body(c.onBrand.withValues(alpha: 0.72)),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    AppButton(label: 'Get started', variant: ButtonVariant.brand, loading: _starting, onPressed: _getStarted),
                    const SizedBox(height: AppSpacing.sm),
                    Center(
                      child: TextButton(
                        onPressed: () => context.push('/sign-in'),
                        style: TextButton.styleFrom(foregroundColor: c.onBrand, minimumSize: const Size(0, 44)),
                        child: Text.rich(TextSpan(
                          text: 'Already have an account? ',
                          style: AppTypography.subhead(c.onBrand.withValues(alpha: 0.72)),
                          children: [TextSpan(text: 'Sign in', style: TextStyle(color: c.onBrand, fontWeight: FontWeight.w600))],
                        )),
                      ),
                    ),
                  ]),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// Sign in
// ============================================================================

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});
  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  String? _socialLoading;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await setOnboardingComplete();
    ref.read(onboardingCompleteProvider.notifier).markComplete();
    if (mounted) context.go('/today');
  }

  Future<void> _password_() async {
    if (_email.text.trim().isEmpty || _password.text.isEmpty) {
      return showToast('Please enter your email and password.', ToastType.error);
    }
    setState(() => _loading = true);
    try {
      await supabase.auth.signInWithPassword(email: _email.text.trim(), password: _password.text);
      await _finish();
    } on AuthException catch (e) {
      showToast(e.message, ToastType.error);
    } catch (e) {
      toastError(e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _social(String key, Future<void> Function() fn) async {
    setState(() => _socialLoading = key);
    try {
      await fn();
      if (supabase.auth.currentSession != null && supabase.auth.currentUser?.isAnonymous == false) await _finish();
    } on AuthException catch (e) {
      showToast(e.message, ToastType.error);
    } catch (e) {
      toastError(e);
    } finally {
      if (mounted) setState(() => _socialLoading = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.all(AppSpacing.lg), children: [
          Text('Welcome back', style: AppTypography.largeTitle(c.textPrimary)),
          const SizedBox(height: AppSpacing.xs),
          Text('Sign in to sync your data across devices.', style: AppTypography.subhead(c.textSecondary)),
          const SizedBox(height: AppSpacing.xl),
          AppInput(controller: _email, label: 'Email', hint: 'you@example.com', keyboardType: TextInputType.emailAddress, autofillHints: const [AutofillHints.email], textInputAction: TextInputAction.next),
          const SizedBox(height: AppSpacing.md),
          AppInput(controller: _password, label: 'Password', hint: '••••••••', obscure: true, autofillHints: const [AutofillHints.password], onSubmitted: (_) => _password_()),
          const SizedBox(height: AppSpacing.lg),
          AppButton(label: 'Sign in', loading: _loading, onPressed: _password_),
          const SizedBox(height: AppSpacing.lg),
          if (isAppleSignInAvailable) ...[
            AppButton(label: 'Sign in with Apple', icon: Icons.apple, variant: ButtonVariant.secondary, loading: _socialLoading == 'apple', onPressed: () => _social('apple', signInWithApple)),
            const SizedBox(height: AppSpacing.sm),
          ],
          AppButton(label: 'Sign in with Google', icon: Icons.g_mobiledata, variant: ButtonVariant.secondary, loading: _socialLoading == 'google', onPressed: () => _social('google', signInWithGoogle)),
          const SizedBox(height: AppSpacing.lg),
          Center(
            child: TextButton(
              onPressed: () => context.pushReplacement('/sign-up'),
              child: Text.rich(TextSpan(text: 'New here? ', style: AppTypography.subhead(c.textSecondary), children: [TextSpan(text: 'Create an account', style: TextStyle(color: c.accent))])),
            ),
          ),
        ]),
      ),
    );
  }
}

// ============================================================================
// Sign up (upgrades the anonymous user in place, keeping their data)
// ============================================================================

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});
  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false, _done = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_email.text.trim().isEmpty) return showToast('Please enter your email address.', ToastType.error);
    if (_password.text.length < 8) return showToast('Password must be at least 8 characters.', ToastType.error);

    setState(() => _loading = true);
    try {
      final isAnonymous = supabase.auth.currentUser?.isAnonymous ?? false;
      if (isAnonymous) {
        // Upgrade the same user id in place: nothing they've created is lost.
        await supabase.auth.updateUser(UserAttributes(email: _email.text.trim(), password: _password.text));
      } else {
        await supabase.auth.signUp(email: _email.text.trim(), password: _password.text);
      }
      setState(() => _done = true);
    } on AuthException catch (e) {
      showToast(e.message, ToastType.error);
    } catch (e) {
      toastError(e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    if (_done) {
      return Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              const IconBadge(Icons.mark_email_read_outlined, size: 64),
              const SizedBox(height: AppSpacing.lg),
              Text('Check your email', style: AppTypography.title(c.textPrimary)),
              const SizedBox(height: AppSpacing.sm),
              Text('We sent a confirmation link to ${_email.text.trim()}. Open it to finish creating your account.',
                  textAlign: TextAlign.center, style: AppTypography.subhead(c.textSecondary)),
              const SizedBox(height: AppSpacing.xl),
              AppButton(label: 'Go to sign in', onPressed: () => context.pushReplacement('/sign-in')),
              const SizedBox(height: AppSpacing.sm),
              AppButton(label: 'Continue to Anchor', variant: ButtonVariant.secondary, onPressed: () => context.go('/today')),
            ]),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.all(AppSpacing.lg), children: [
          Text('Create your account', style: AppTypography.largeTitle(c.textPrimary)),
          const SizedBox(height: AppSpacing.xs),
          Text('Keep your data safe and synced. Everything you\'ve added so far comes with you.', style: AppTypography.subhead(c.textSecondary)),
          const SizedBox(height: AppSpacing.xl),
          AppInput(controller: _email, label: 'Email', hint: 'you@example.com', keyboardType: TextInputType.emailAddress, autofillHints: const [AutofillHints.email], textInputAction: TextInputAction.next),
          const SizedBox(height: AppSpacing.md),
          AppInput(controller: _password, label: 'Password', hint: 'At least 8 characters', obscure: true, autofillHints: const [AutofillHints.newPassword], onSubmitted: (_) => _submit()),
          const SizedBox(height: AppSpacing.lg),
          AppButton(label: 'Create account', loading: _loading, onPressed: _submit),
          const SizedBox(height: AppSpacing.lg),
          Center(
            child: TextButton(
              onPressed: () => context.pushReplacement('/sign-in'),
              child: Text.rich(TextSpan(text: 'Already have an account? ', style: AppTypography.subhead(c.textSecondary), children: [TextSpan(text: 'Sign in', style: TextStyle(color: c.accent))])),
            ),
          ),
        ]),
      ),
    );
  }
}
