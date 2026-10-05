import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_ACCESSO, COOKIE_ATTIVITA } from "@/lib/manutenzione";

/** Fuori da tutti gli involucri: chiude login e permesso d'accesso. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  const risposta = NextResponse.redirect(new URL("/manutenzione", request.url));
  risposta.cookies.delete(COOKIE_ACCESSO);
  risposta.cookies.delete(COOKIE_ATTIVITA);
  return risposta;
}
