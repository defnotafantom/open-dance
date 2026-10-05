import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { caricaQuote, perIncasso } from "@/lib/registri/dati";
import { ATTIVITA, METODI, euro } from "@/lib/registri/costanti";
import { GIORNI_SETTIMANA } from "@/lib/corsi/schemas";
import { giornoRoma } from "@/lib/date";
import { dataOraRoma } from "@/lib/registri/stato";
import { AvvisoChip } from "@/components/registri/avviso-chip";
import { IncassaDialog } from "@/components/registri/incassa-dialog";
import { StatoPagamentoBadge } from "@/components/pagamenti/stato-pagamento-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccessoFamiglia, EliminaIscritto, RitiraDalCorso } from "./azioni";

/** Scheda unica dell'iscritto: anagrafica, tessera, corsi, quote, ricevute, presenze. */
export default async function SchedaIscrittoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: s, error } = await supabase
    .from("studenti")
    .select("id, nome, cognome, data_nascita, codice_fiscale, is_adulto, genitore_id, profilo_id, numero_tessera, attivita, data_tesseramento, attivo")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Iscritto non caricato: ${error.message}`);
  if (!s) notFound();

  const sessantaGiorniFa = giorniFa(60);
  const [{ data: referente }, { data: iscrizioni }, quote, { data: presenze }, { data: storia }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nome, cognome, email, telefono, codice_accesso")
      .eq("id", (s.genitore_id ?? s.profilo_id)!)
      .maybeSingle(),
    supabase.from("iscrizioni").select("id, classe_id, stato, data_iscrizione").eq("studente_id", id).in("stato", ["attiva", "richiesta", "lista_attesa"]),
    caricaQuote({ studenteId: id }),
    supabase.from("presenze").select("stato, lezione_id").eq("studente_id", id),
    supabase
      .from("attivita_staff")
      .select("id, created_at, autore_nome, azione, dettaglio")
      .eq("studente_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const classeIds = (iscrizioni ?? []).map((i) => i.classe_id);
  const { data: classi } = classeIds.length
    ? await supabase.from("classi").select("id, corso_id, giorno_settimana, orario_inizio, sala").in("id", classeIds)
    : { data: [] as { id: string; corso_id: string; giorno_settimana: number; orario_inizio: string; sala: string | null }[] };
  const corsoIds = [...new Set((classi ?? []).map((c) => c.corso_id))];
  const { data: corsi } = corsoIds.length
    ? await supabase.from("corsi").select("id, nome").in("id", corsoIds)
    : { data: [] as { id: string; nome: string }[] };

  const pagamentoIds = quote.map((q) => q.id);
  const { data: ricevute } = pagamentoIds.length
    ? await supabase
        .from("versamenti")
        .select("id, numero, anno, data, importo, metodo, causale, annullato")
        .in("pagamento_id", pagamentoIds)
        .order("data", { ascending: false })
    : { data: [] as { id: string; numero: number; anno: number; data: string; importo: number; metodo: string; causale: string; annullato: boolean }[] };

  // Presenze negli ultimi 60 giorni
  const lezioneIds = (presenze ?? []).map((p) => p.lezione_id);
  const { data: lezioniRecenti } = lezioneIds.length
    ? await supabase.from("lezioni").select("id").in("id", lezioneIds).gte("data", sessantaGiorniFa)
    : { data: [] as { id: string }[] };
  const recenti = new Set((lezioniRecenti ?? []).map((l) => l.id));
  const presenzeRecenti = (presenze ?? []).filter((p) => recenti.has(p.lezione_id));
  const presenti = presenzeRecenti.filter((p) => p.stato === "presente").length;

  const avvisi = quote.flatMap((q) => q.avvisi.map((a) => ({ a, voce: q.descrizione, id: `${q.id}-${a.tipo}` })));
  const eta = etaAnni(s.data_nascita);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/iscritti" className="text-muted-foreground text-sm hover:text-foreground">
        &larr; Tutti gli iscritti
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Tessera {s.numero_tessera ?? "—"} · {ATTIVITA.find((a) => a.value === s.attivita)?.label}
          </p>
          <h2 className="font-display text-3xl uppercase">
            {s.nome} {s.cognome} {!s.attivo && <Badge variant="secondary">Non attivo</Badge>}
          </h2>
          {avvisi.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {avvisi.map(({ a, voce, id: k }) => (
                <AvvisoChip key={k} avviso={a} contesto={voce} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Riquadro titolo="Anagrafica">
          <Dato label="Nato/a il" valore={`${new Date(s.data_nascita).toLocaleDateString("it-IT")} (${eta} anni)`} />
          <Dato label="Codice fiscale" valore={s.codice_fiscale ?? "—"} />
          <Dato label="Tesserato dal" valore={new Date(s.data_tesseramento).toLocaleDateString("it-IT")} />
          <Dato label={s.is_adulto ? "Account" : "Referente"} valore={referente ? `${referente.nome} ${referente.cognome}` : "—"} />
          {referente?.email && <Dato label="Email" valore={<a className="hover:text-primary" href={`mailto:${referente.email}`}>{referente.email}</a>} />}
          {referente?.telefono && <Dato label="Telefono" valore={<a className="hover:text-primary" href={`tel:${referente.telefono}`}>{referente.telefono}</a>} />}
          {referente && (
            <AccessoFamiglia studenteId={s.id} codice={referente.codice_accesso} />
          )}
        </Riquadro>

        <Riquadro titolo={`Corsi (${(iscrizioni ?? []).length})`}>
          {(iscrizioni ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">Nessun corso.</p>
          ) : (
            (iscrizioni ?? []).map((i) => {
              const c = classi?.find((x) => x.id === i.classe_id);
              return (
                <div key={i.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {corsi?.find((x) => x.id === c?.corso_id)?.nome ?? "Corso"}
                    {c && <span className="text-muted-foreground"> · {GIORNI_SETTIMANA[c.giorno_settimana]} {c.orario_inizio.slice(0, 5)}</span>}
                  </span>
                  <span className="flex items-center gap-1">
                    {i.stato !== "attiva" && <Badge variant="outline">{i.stato === "richiesta" ? "Richiesta" : "In attesa"}</Badge>}
                    <RitiraDalCorso
                      iscrizioneId={i.id}
                      corso={corsi?.find((x) => x.id === c?.corso_id)?.nome ?? "questo corso"}
                    />
                  </span>
                </div>
              );
            })
          )}
          <Link
            href={`/admin/iscritti/nuovo${referente?.email ? `?email=${encodeURIComponent(referente.email)}` : ""}`}
            className="text-xs text-primary hover:underline"
          >
            Iscrivi ad altri corsi &rarr;
          </Link>
        </Riquadro>

        <Riquadro titolo="Presenze (60 giorni)">
          {presenzeRecenti.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nessun appello registrato.</p>
          ) : (
            <>
              <p className="font-display text-4xl leading-none">
                {Math.round((presenti / presenzeRecenti.length) * 100)}%
              </p>
              <p className="text-muted-foreground text-sm">
                {presenti} presenze su {presenzeRecenti.length} appelli
              </p>
            </>
          )}
        </Riquadro>
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-xl uppercase">Quote e voci</h3>
        {quote.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nessuna quota.</p>
        ) : (
          <div className="panel-3d overflow-hidden rounded-xl">
            <ul className="divide-y divide-border">
              {quote.map((q) => (
                <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{q.descrizione}</p>
                    <p className="text-muted-foreground text-xs">
                      {euro(q.importo_pagato)} / {euro(q.importo_dovuto)}
                      {q.data_scadenza && ` · scad. ${new Date(q.data_scadenza).toLocaleDateString("it-IT")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatoPagamentoBadge stato={q.stato} />
                    {q.residuo > 0 && <IncassaDialog quota={perIncasso(q)} trigger={<Button size="sm">Incassa</Button>} />}
                    {q.istanza_id && (
                      <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/admin/registri/istanze/${q.istanza_id}`}>Istanza</Link>} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-xl uppercase">Ricevute</h3>
        {(ricevute ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm">Nessuna ricevuta.</p>
        ) : (
          <div className="panel-3d overflow-hidden rounded-xl">
            <ul className="divide-y divide-border">
              {(ricevute ?? []).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span>
                    <span className="font-display">N. {r.numero}/{r.anno}</span> · {new Date(r.data).toLocaleDateString("it-IT")} ·{" "}
                    {METODI.find((m) => m.value === r.metodo)?.label} · {r.causale}
                    {r.annullato && <Badge variant="destructive" className="ml-2">Annullata</Badge>}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={`font-display ${r.annullato ? "line-through opacity-50" : ""}`}>{euro(Number(r.importo))}</span>
                    <a href={`/stampa/ricevuta/${r.id}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                      Stampa
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-xl uppercase">Storia</h3>
        <p className="text-muted-foreground text-xs">
          Ogni passaggio fatto dallo staff su questo iscritto, con chi, giorno e ora. Non si può modificare.
        </p>
        {(storia ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm">Nessun passaggio registrato.</p>
        ) : (
          <div className="panel-3d overflow-hidden rounded-xl">
            <ul className="divide-y divide-border">
              {(storia ?? []).map((a) => (
                <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 py-2.5 text-sm">
                  <span>
                    <span className="font-medium">{a.azione}</span>
                    {a.dettaglio && <span className="text-muted-foreground"> · {a.dettaglio}</span>}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {a.autore_nome} · {dataOraRoma(a.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <EliminaIscritto studenteId={s.id} nome={`${s.nome} ${s.cognome}`} />
      </div>
    </div>
  );
}

function giorniFa(n: number) {
  return giornoRoma(new Date(Date.now() - n * 86400000));
}

function etaAnni(dataNascita: string) {
  return Math.floor((Date.now() - new Date(dataNascita).getTime()) / (365.25 * 86400000));
}

function Riquadro({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <div className="panel-3d flex flex-col gap-2.5 rounded-xl p-5">
      <h3 className="font-display text-lg uppercase">{titolo}</h3>
      {children}
    </div>
  );
}

function Dato({ label, valore }: { label: string; valore: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{valore}</span>
    </div>
  );
}
