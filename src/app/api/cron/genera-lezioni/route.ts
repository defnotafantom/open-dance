import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assicuraLezioni } from "@/lib/lezioni/actions";

// Chiamata da Vercel Cron (vedi vercel.json). La generazione avviene anche
// "al volo" quando un insegnante apre la pagina Presenze, quindi questo cron
// e' un rinforzo per tenere la finestra aggiornata anche senza visite, non
// l'unico meccanismo.
export async function GET(request: Request) {
  const secret = request.headers.get("authorization");
  if (process.env.CRON_SECRET && secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: classi, error } = await admin
    .from("classi")
    .select("id")
    .eq("attiva", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await assicuraLezioni((classi ?? []).map((c) => c.id));

  return NextResponse.json({ ok: true, classi: classi?.length ?? 0 });
}
