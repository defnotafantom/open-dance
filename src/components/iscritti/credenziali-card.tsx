"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type CredenzialiMostrate = { codice: string; password: string; email: string; nome: string };

function escape(t: string) {
  return t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Le credenziali si vedono una volta sola: la password non viene salvata da
 * nessuna parte in chiaro. Se va persa se ne genera una nuova.
 */
export function CredenzialiCard({ credenziali }: { credenziali: CredenzialiMostrate }) {
  const sito = typeof window !== "undefined" ? window.location.origin : "";

  function stampa() {
    const w = window.open("", "_blank", "width=600,height=700");
    if (!w) return void toast.error("Il browser ha bloccato la finestra di stampa.");
    w.document.write(`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Credenziali Open Dance</title>
<style>body{font-family:system-ui,sans-serif;padding:40px;color:#0b0c0e}h1{font-size:20px;letter-spacing:.1em;text-transform:uppercase}
.box{border:2px solid #0b0c0e;border-radius:12px;padding:20px;margin-top:16px}p{margin:8px 0}b{font-family:ui-monospace,monospace;font-size:20px;letter-spacing:.08em}
small{color:#555}</style></head><body>
<h1>Open Dance · Accesso all'area iscritti</h1>
<p>Per: ${escape(credenziali.nome)}</p>
<div class="box"><p>Sito: ${escape(sito)}</p><p>Codice: <b>${escape(credenziali.codice)}</b></p><p>Password: <b>${escape(credenziali.password)}</b></p>
<p><small>Si può entrare anche con l'email ${escape(credenziali.email)} al posto del codice.</small></p></div>
<p><small>Conserva questo foglio. Se perdi la password chiedi in segreteria: ne verrà generata una nuova.</small></p>
<script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  }

  return (
    <div className="panel-3d tile-ink flex flex-col gap-3 rounded-xl p-5">
      <p className="font-display text-xs tracking-[0.2em] uppercase opacity-70">
        Credenziali di {credenziali.nome}
      </p>
      <div className="grid gap-1 font-mono text-lg">
        <span>
          Codice <strong className="tracking-wider">{credenziali.codice}</strong>
        </span>
        <span>
          Password <strong className="tracking-wider">{credenziali.password}</strong>
        </span>
      </div>
      <p className="text-xs opacity-75">
        Si vedono solo adesso: stampale o copiale per la famiglia. Se vanno perse, dalla scheda
        dell&apos;iscritto se ne genera una nuova.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={stampa}>
          Stampa foglio
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `Open Dance – ${sito}\nCodice: ${credenziali.codice}\nPassword: ${credenziali.password}`
              );
              toast.success("Copiate.");
            } catch {
              toast.error("Copia non riuscita.");
            }
          }}
        >
          Copia
        </Button>
      </div>
    </div>
  );
}
