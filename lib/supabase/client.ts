import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Creates a Supabase client for use in Client Components.
 * Uses browser cookie-based session propagation via @supabase/ssr.
 *
 * IMPORTANT (Constitution §III): This uses the ANON key only.
 * The service-role key MUST NEVER appear in client-side code.
 */
export function createClient(): ReturnType<
  typeof createBrowserClient<Database>
> {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
