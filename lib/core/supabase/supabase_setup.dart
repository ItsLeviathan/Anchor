import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// NEVER reference a service-role key here. This client only holds the public
// anon key and is safe to ship in the app; privileged operations happen in
// Supabase Edge Functions.

const _secure = FlutterSecureStorage();

SupabaseClient get supabase => Supabase.instance.client;

/// Persists the Supabase session in the platform keystore (Android
/// EncryptedSharedPreferences / iOS Keychain) instead of plain prefs.
class SecureSessionStorage extends LocalStorage {
  const SecureSessionStorage();
  static const _key = 'anchor_supabase_session';

  @override
  Future<void> initialize() async {}

  @override
  Future<bool> hasAccessToken() async => (await _secure.read(key: _key)) != null;

  @override
  Future<String?> accessToken() => _secure.read(key: _key);

  @override
  Future<void> removePersistedSession() => _secure.delete(key: _key);

  @override
  Future<void> persistSession(String persistSessionString) =>
      _secure.write(key: _key, value: persistSessionString);
}

class MissingConfigException implements Exception {
  const MissingConfigException();
  @override
  String toString() =>
      'Missing Supabase configuration. Copy .env.example to .env and fill in your '
      'project URL and anon key from Supabase -> Settings -> API.';
}

/// Loads `.env` and initializes Supabase. Throws [MissingConfigException] if
/// the two required variables aren't set.
Future<void> initSupabase() async {
  await dotenv.load(fileName: '.env');
  final url = dotenv.maybeGet('SUPABASE_URL');
  final key = dotenv.maybeGet('SUPABASE_ANON_KEY');
  if (url == null || url.isEmpty || key == null || key.isEmpty) {
    throw const MissingConfigException();
  }
  await Supabase.initialize(
    url: url,
    publishableKey: key,
    authOptions: const FlutterAuthClientOptions(
      localStorage: SecureSessionStorage(),
      autoRefreshToken: true,
    ),
  );
}
