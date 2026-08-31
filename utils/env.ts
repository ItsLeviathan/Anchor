const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env and fill in your ' +
      'project URL and anon key from Supabase → Settings → API.'
  );
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
};


