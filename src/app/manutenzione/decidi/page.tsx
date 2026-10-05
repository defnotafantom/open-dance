import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { firmaValida } from "@/lib/accessi/firma";
import { OdGlyphMark } from "@/components/brand/od-glyph-mark";
import { DecisioneButtons } from "./decisione-buttons";

export const metadata: Metadata = { title: "Richiesta di accesso", robots: { index: false } };

export default async function DecidiPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; firma?: string }>;
}) {
  const { id = "", firma = "" } = await searchParams;
  const valido = /^[0-9a-f-]{36}$/.test(id) && firmaValida(id, firma);
  const { data: r } = valido
    ? await createAdminClient()
        .from("accessi_sito")
        .select("nome, ip, user_agent, stato, created_at")
        .eq("id", id)
        .maybeSingle()
    : { data: null };

  return (
    <main className="dark flex min-h-dvh flex-1 flex-col items-center justify-center gap-8 bg-background px-6 text-center text-foreground">
      <OdGlyphMark estruso className="w-[110px]" />
      {!r ? (
        <p className="text-muted-foreground">Link non valido o scaduto.</p>
      ) : (
        <div className="panel-3d flex w-full max-w-sm flex-col gap-4 rounded-xl p-6">
          <p className="font-display text-xs tracking-[0.25em] text-muted-foreground uppercase">
            Richiesta di accesso
          </p>
          <p className="font-display text-3xl uppercase">{r.nome}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(r.created_at).toLocaleString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
            {r.ip && ` · IP ${r.ip}`}
          </p>
          {r.user_agent && <p className="text-xs break-words text-muted-foreground">{r.user_agent}</p>}
          {r.stato === "in_attesa" ? (
            <DecisioneButtons id={id} firma={firma} />
          ) : (
            <p className="font-display uppercase">
              {r.stato === "approvato" ? "Già approvata" : r.stato === "negato" ? "Già negata" : "Revocata"}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
