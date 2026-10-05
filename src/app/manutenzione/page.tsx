import type { Metadata } from "next";
import { OdGlyphMark } from "@/components/brand/od-glyph-mark";
import { leggiStatoRichiesta } from "./actions";
import { CodiceForm } from "./codice-form";

export const metadata: Metadata = {
  title: "Open Dance",
  robots: { index: false, follow: false },
};

export default async function ManutenzionePage() {
  const statoIniziale = await leggiStatoRichiesta();
  return (
    <main className="dark flex min-h-dvh flex-1 flex-col items-center justify-center gap-10 bg-background px-6 text-center text-foreground">
      <div className="flex flex-col items-center gap-6">
        <OdGlyphMark estruso className="w-[180px] drop-shadow-[0_24px_20px_rgb(142_9_18/0.35)]" />
        <div className="flex flex-col items-center gap-1.5">
          <span className="pl-[0.6em] font-wordmark text-lg tracking-[0.6em] uppercase">Open Dance</span>
          <span className="pl-[0.32em] font-display text-[0.65rem] tracking-[0.32em] text-muted-foreground uppercase">
            Since 1999
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-display text-3xl uppercase">Sito in manutenzione</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Stiamo preparando il nuovo sito. Torna a trovarci presto.
        </p>
      </div>
      <CodiceForm statoIniziale={statoIniziale} />
    </main>
  );
}
