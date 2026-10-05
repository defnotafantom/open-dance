import Link from "next/link";
import { requireRuolo, RUOLI_STAFF, RUOLI_TITOLARI } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLinkIcon } from "lucide-react";
import { ContenutiScuola, PosizioniAperte, Traguardi } from "./sito-manager";

export default async function SitoPubblicoPage() {
  const profile = await requireRuolo(RUOLI_STAFF);
  const titolare = RUOLI_TITOLARI.includes(profile.ruolo);
  const supabase = await createClient();

  const [{ data: contenuti }, { data: traguardi }, { data: posizioni }] = await Promise.all([
    supabase
      .from("scuola_contenuti")
      .select("id, sezione, titolo, descrizione, foto_path, ordine, pubblicato")
      .order("sezione")
      .order("ordine"),
    supabase
      .from("traguardi")
      .select("id, anno, categoria, titolo, contesto, risultato, foto_path, ordine, pubblicato")
      .order("anno", { ascending: false })
      .order("ordine"),
    titolare
      ? supabase
          .from("posizioni_aperte")
          .select("id, tipo, titolo, descrizione, attiva")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const urlFoto = (path: string | null) =>
    path ? supabase.storage.from("sito").getPublicUrl(path).data.publicUrl : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-tight">Sito pubblico</h1>
        <p className="text-muted-foreground max-w-xl text-sm">
          I contenuti delle pagine visibili a tutti, anche a chi non fa parte della scuola. I
          corsi si presentano da &quot;Corsi e classi&quot;, gli insegnanti dal proprio profilo.
        </p>
      </div>

      <Tabs defaultValue="scuola">
        <TabsList className="flex-wrap">
          <TabsTrigger value="scuola">La scuola</TabsTrigger>
          <TabsTrigger value="traguardi">Speciale 28 anni</TabsTrigger>
          {titolare && <TabsTrigger value="posizioni">Lavora con noi</TabsTrigger>}
        </TabsList>

        <TabsContent value="scuola" className="flex flex-col gap-4 pt-4">
          <LinkPagina href="/scuola" />
          <ContenutiScuola
            contenuti={(contenuti ?? []).map((c) => ({
              ...c,
              descrizione: c.descrizione ?? "",
              fotoUrl: urlFoto(c.foto_path),
            }))}
          />
        </TabsContent>

        <TabsContent value="traguardi" className="flex flex-col gap-4 pt-4">
          <LinkPagina href="/28-anni" />
          <Traguardi
            traguardi={(traguardi ?? []).map((t) => ({
              ...t,
              contesto: t.contesto ?? "",
              risultato: t.risultato ?? "",
              fotoUrl: urlFoto(t.foto_path),
            }))}
          />
        </TabsContent>

        {titolare && (
          <TabsContent value="posizioni" className="flex flex-col gap-4 pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <LinkPagina href="/lavora-con-noi" />
              <Link href="/admin/candidature" className="text-sm text-primary hover:underline">
                Vedi le candidature ricevute &rarr;
              </Link>
            </div>
            <PosizioniAperte
              posizioni={(posizioni ?? []).map((p) => ({
                ...p,
                descrizione: p.descrizione ?? "",
              }))}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function LinkPagina({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ExternalLinkIcon className="size-4" /> Apri la pagina pubblica
    </a>
  );
}
