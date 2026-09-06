import { NextResponse } from "next/server";
import * as z from "zod";
import { requireRuolo, RUOLI_TITOLARI } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";

const inviteSchema = z.object({
  email: z.email(),
  nome: z.string().min(1),
  cognome: z.string().min(1),
  ruolo: z.enum(["proprietario", "co_proprietario", "segretario", "insegnante"]),
});

// Solo un titolare (webmaster/proprietario/co-proprietario) puo' invitare
// personale: crea l'utente via service-role key (mai esposta al client) e
// imposta il ruolo con un update separato, perche' il trigger di creazione
// profilo forza sempre il ruolo 'allievo'.
export async function POST(request: Request) {
  await requireRuolo(RUOLI_TITOLARI);

  const body = await request.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, nome, cognome, ruolo } = parsed.data;
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nome, cognome },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/invito/benvenuto`,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? "Invito non riuscito." }, { status: 400 });
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ ruolo, nome, cognome })
    .eq("id", data.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
