import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

/** Service-role client — server-only, bypasses RLS. */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local from Supabase Dashboard → Settings → API.",
    );
  }

  return createClient<Database>(getSupabaseUrl(), serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
