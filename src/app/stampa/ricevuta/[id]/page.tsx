import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRuolo, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { METODI, euro } from "@/lib/registri/costanti";
import { StampaButton } from "./stampa-button";

export const metadata = { title: "Ricevuta · Open Dance" };

/**
 * Ricevuta non fiscale da stampare o salvare in PDF. Fuori dall'area staff
 * per stampare senza menu, ma accessibile solo allo staff.
 */
export default async function RicevutaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRuolo(RUOLI_STAFF);
  const { id } = await params;
  const supabase = await createClient();

  const { data: r } = await supabase
    .from("versamenti")
    .select(
      "id, anno, numero, importo, data, metodo, pagatore_nome, pagatore_codice_fiscale, causale, note, annullato, motivo_annullamento, pagamento_id"
    )
    .eq("id", id)
    .maybeSingle();
  if (!r) notFound();

  const { data: pagamento } = await supabase
    .from("pagamenti")
    .select("studente_id")
    .eq("id", r.pagamento_id)
    .maybeSingle();
  const [{ data: socio }, { data: asd }] = await Promise.all([
    pagamento
      ? supabase
          .from("studenti")
          .select("nome, cognome, numero_tessera, data_nascita")
          .eq("id", pagamento.studente_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("impostazioni_scuola")
      .select("nome_scuola, denominazione_asd, codice_fiscale_asd, sede_legale, numero_registro, indirizzo")
      .maybeSingle(),
  ]);

  const mancaIntestazione = !asd?.denominazione_asd || !asd?.codice_fiscale_asd;
  const metodo = METODI.find((m) => m.value === r.metodo)?.label ?? r.metodo;

  return (
    <main className="min-h-screen bg-neutral-200 py-8 text-neutral-900 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 print:hidden">
        <Link href="/admin/registri/ricevute" className="text-sm underline">
          &larr; Torna alle ricevute
        </Link>
        <StampaButton />
      </div>
      {mancaIntestazione && (
        <p className="mx-auto mb-4 max-w-[210mm] rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-900 print:hidden">
          Mancano denominazione e/o codice fiscale dell&apos;ASD: inseriscili in{" "}
          <Link href="/admin/impostazioni" className="underline">
            Impostazioni
          </Link>{" "}
          prima di consegnare la ricevuta.
        </p>
      )}

      <article className="relative mx-auto flex max-w-[210mm] flex-col gap-8 bg-white p-[18mm] font-sans shadow-lg print:shadow-none">
        {r.annullato && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 border-4 border-red-600 px-6 py-2 font-display text-6xl tracking-widest text-red-600/70 uppercase">
              Annullata
            </span>
          </div>
        )}

        <header className="flex items-start justify-between gap-6 border-b border-neutral-300 pb-6">
          <div className="flex flex-col gap-0.5 text-sm">
            <p className="font-display text-xl uppercase">{asd?.denominazione_asd || asd?.nome_scuola || "Open Dance"}</p>
            {asd?.codice_fiscale_asd && <p>Codice fiscale {asd.codice_fiscale_asd}</p>}
            {(asd?.sede_legale || asd?.indirizzo) && <p>{asd?.sede_legale || asd?.indirizzo}</p>}
            {asd?.numero_registro && <p>Registro attività sportive dilettantistiche n. {asd.numero_registro}</p>}
          </div>
          <div className="text-right">
            <p className="font-display text-xs tracking-[0.2em] text-neutral-500 uppercase">Ricevuta non fiscale</p>
            <p className="font-display text-3xl">
              N. {r.numero}/{r.anno}
            </p>
            <p className="text-sm">{new Date(r.data).toLocaleDateString("it-IT")}</p>
          </div>
        </header>

        <section className="flex flex-col gap-3 text-[15px] leading-relaxed">
          <p>
            Ricevuto da <strong>{r.pagatore_nome}</strong>
            {r.pagatore_codice_fiscale && <> (C.F. {r.pagatore_codice_fiscale})</>}
          </p>
          <p>
            la somma di <strong className="font-display text-2xl">{euro(Number(r.importo))}</strong>
          </p>
          <p>
            a titolo di: <strong>{r.causale}</strong>
          </p>
          {socio && (
            <p>
              per il socio <strong>{socio.nome} {socio.cognome}</strong>
              {socio.numero_tessera && <>, tessera n. {socio.numero_tessera}</>}, nato/a il{" "}
              {new Date(socio.data_nascita).toLocaleDateString("it-IT")}
            </p>
          )}
          <p>Metodo di pagamento: {metodo}</p>
          {r.note && <p className="text-sm text-neutral-600">Note: {r.note}</p>}
          {r.annullato && r.motivo_annullamento && (
            <p className="text-sm text-red-700">Ricevuta annullata: {r.motivo_annullamento}</p>
          )}
        </section>

        <footer className="mt-10 flex justify-end">
          <div className="w-64 border-t border-neutral-400 pt-2 text-center text-xs text-neutral-500">
            Timbro e firma per quietanza
          </div>
        </footer>
      </article>
    </main>
  );
}
