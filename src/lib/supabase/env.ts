const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabaseUrl(): string {
  if (!SUPABASE_URL) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Copy .env.local.example to .env.local and set your Supabase project URL.",
    );
  }
  return SUPABASE_URL;
}

export function getSupabaseAnonKey(): string {
  if (!SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and set your Supabase anon key.",
    );
  }
  return SUPABASE_ANON_KEY;
}
