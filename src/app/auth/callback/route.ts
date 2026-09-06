import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Scambia il "code" PKCE inviato via email (reset password, invito, magic link)
// con una sessione, poi prosegue verso la pagina richiesta.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
