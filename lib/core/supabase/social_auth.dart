import 'dart:convert';
import 'dart:io' show Platform;
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'supabase_setup.dart';

/// True on iOS, where the native Apple sheet is available.
bool get isAppleSignInAvailable => Platform.isIOS;

String _randomNonce([int length = 32]) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
  final rnd = Random.secure();
  return List.generate(length, (_) => chars[rnd.nextInt(chars.length)]).join();
}

/// Apple Sign-In (iOS): a random nonce is generated per attempt and its
/// SHA-256 hash sent to Apple, which embeds it in the signed identity token.
/// The *raw* nonce goes to Supabase, which hashes it independently and checks
/// it against the token's `nonce` claim - binding the token to this specific
/// sign-in attempt so a captured token can't be replayed.
Future<void> signInWithApple() async {
  final rawNonce = _randomNonce();
  final hashed = sha256.convert(utf8.encode(rawNonce)).toString();

  final credential = await SignInWithApple.getAppleIDCredential(
    scopes: [AppleIDAuthorizationScopes.email, AppleIDAuthorizationScopes.fullName],
    nonce: hashed,
  );
  final idToken = credential.identityToken;
  if (idToken == null) throw const AuthException('Apple did not return an identity token.');

  await supabase.auth.signInWithIdToken(
    provider: OAuthProvider.apple,
    idToken: idToken,
    nonce: rawNonce,
  );
}

bool _googleInitialized = false;

/// Google Sign-In uses the native account picker and exchanges the resulting
/// ID token with Supabase (no browser/deep-link round trip). Requires
/// GOOGLE_WEB_CLIENT_ID in .env and Google enabled in the Supabase project.
Future<void> signInWithGoogle() async {
  final serverClientId = dotenv.maybeGet('GOOGLE_WEB_CLIENT_ID');
  if (serverClientId == null || serverClientId.isEmpty) {
    throw const AuthException('Google Sign-In is not configured (GOOGLE_WEB_CLIENT_ID).');
  }

  final google = GoogleSignIn.instance;
  if (!_googleInitialized) {
    await google.initialize(serverClientId: serverClientId);
    _googleInitialized = true;
  }

  try {
    final account = await google.authenticate();
    final idToken = account.authentication.idToken;
    if (idToken == null) throw const AuthException('Google did not return an ID token.');
    await supabase.auth.signInWithIdToken(provider: OAuthProvider.google, idToken: idToken);
  } on GoogleSignInException catch (e) {
    // User cancelled: do nothing.
    if (e.code == GoogleSignInExceptionCode.canceled) return;
    rethrow;
  }
}
