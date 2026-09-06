import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviaEmail } from "@/lib/email/send";
import { inviaPushAProfili } from "@/lib/push/send";
import { TIPO_LABEL } from "@/lib/pagamenti/schemas";

// Promemoria automatico: un pagamento riceve UN SOLO promemoria (email +
// push), la prima volta che il cron lo trova entro 3 giorni dalla scadenza
// (o gia' scaduto). promemoria_inviato_at viene marcato solo se almeno un
// canale ha effettivamente funzionato, cosi' se le chiavi non sono ancora
// configurate il pagamento resta candidato ai run successivi.
export async function GET(request: Request) {
  const secret = request.headers.get("authorization");
  if (process.env.CRON_SECRET && secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const admin = createAdminClient();
  const tra3Giorni = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const { data: pagamenti, error } = await admin
    .from("pagamenti")
    .select("id, studente_id, tipo, importo_dovuto, importo_pagato, data_scadenza, stato")
    .in("stato", ["da_pagare", "parziale", "scaduto"])
    .is("promemoria_inviato_at", null)
    .not("data_scadenza", "is", null)
    .lte("data_scadenza", tra3Giorni);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!pagamenti || pagamenti.length === 0) {
    return NextResponse.json({ ok: true, inviati: 0 });
  }

  const studenteIds = [...new Set(pagamenti.map((p) => p.studente_id))];
  const { data: studenti } = await admin
    .from("studenti")
    .select("id, nome, cognome, genitore_id, profilo_id")
    .in("id", studenteIds);
  const studenteById = new Map((studenti ?? []).map((s) => [s.id, s]));

  const referenteIds = [
    ...new Set(
      (studenti ?? []).map((s) => s.genitore_id ?? s.profilo_id).filter((id): id is string => !!id)
    ),
  ];
  const { data: referenti } =
    referenteIds.length > 0
      ? await admin.from("profiles").select("id, email").in("id", referenteIds)
      : { data: [] as { id: string; email: string }[] };
  const emailById = new Map((referenti ?? []).map((r) => [r.id, r.email]));

  let inviati = 0;

  for (const p of pagamenti) {
    const studente = studenteById.get(p.studente_id);
    const referenteId = studente?.genitore_id ?? studente?.profilo_id;
    if (!referenteId) continue;
    const email = emailById.get(referenteId);

    const residuo = (p.importo_dovuto - p.importo_pagato).toFixed(2);
    const nomeStudente = studente ? `${studente.nome} ${studente.cognome}` : "il tuo/la tua iscritto/a";
    const scadenzaTesto = p.data_scadenza
      ? new Date(p.data_scadenza).toLocaleDateString("it-IT")
      : "";
    const oggetto = `Promemoria pagamento — ${TIPO_LABEL[p.tipo]}`;
    const corpo = `Ciao,\n\nÈ in scadenza (${scadenzaTesto}) un pagamento di €${residuo} per ${nomeStudente} — ${TIPO_LABEL[p.tipo]}.\n\nPuoi verificare i dettagli nell'area pagamenti di Open Dance.\n\nGrazie,\nOpen Dance`;

    let almenoUnCanaleOk = false;

    if (email) {
      const risultato = await inviaEmail({
        to: email,
        subject: oggetto,
        html: corpo.replace(/\n/g, "<br />"),
      });
      if (risultato.inviata) almenoUnCanaleOk = true;
    }

    try {
      await inviaPushAProfili([referenteId], {
        title: oggetto,
        body: `€${residuo} per ${nomeStudente}, scadenza ${scadenzaTesto}.`,
        url: "/",
      });
      // inviaPushAProfili e' best-effort e silenziosa: se le chiavi VAPID
      // sono configurate consideriamo il tentativo un canale valido.
      if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        almenoUnCanaleOk = true;
      }
    } catch {
      // ignorato
    }

    if (almenoUnCanaleOk) {
      await admin
        .from("pagamenti")
        .update({ promemoria_inviato_at: new Date().toISOString() })
        .eq("id", p.id);
      inviati += 1;
    }
  }

  return NextResponse.json({ ok: true, inviati, candidati: pagamenti.length });
}
