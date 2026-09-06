import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Client con service-role key: bypassa la RLS. Usare solo in Route Handler /
 * Server Action che gestiscono operazioni privilegiate (es. invito staff).
 * Non importare mai da un componente o da codice che finisce nel bundle client.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
