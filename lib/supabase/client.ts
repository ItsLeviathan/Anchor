import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

import { env } from '../../utils/env';
import { ExpoSecureStorageAdapter } from './secureStorage';

// NEVER import or reference a service-role key here. This client only ever
// holds the public anon key and is safe to ship inside the app bundle;
// privileged operations happen in Supabase Edge Functions.
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
