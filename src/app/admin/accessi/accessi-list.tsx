"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { decidiAccesso } from "@/lib/accessi/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Richiesta = {
  id: string;
  nome: string;
  ip: string | null;
  user_agent: string | null;
  stato: "in_attesa" | "approvato" | "negato" | "revocato";
  scade_at: string | null;
  deciso_at: string | null;
  created_at: string;
};

function dispositivo(ua: string | null) {
  if (!ua) return "Dispositivo sconosciuto";
  const sistema = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Altro";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "";
  return [sistema, browser].filter(Boolean).join(" · ");
}

function quando(iso: string) {
  return new Date(iso).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function AccessiList({ richieste }: { richieste: Richiesta[] }) {
  const router = useRouter();

  // Aggiorna da sola mentre c'e' qualcuno in attesa.
  const inAttesa = richieste.filter((r) => r.stato === "in_attesa");
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(timer);
  }, [router]);

  const ora = new Date().toISOString();
  const attivi = richieste.filter((r) => r.stato === "approvato" && (!r.scade_at || r.scade_at > ora));
  const storico = richieste.filter((r) => !inAttesa.includes(r) && !attivi.includes(r));

  return (
    <div className="flex flex-col gap-8">
      <Sezione titolo={`In attesa (${inAttesa.length})`} vuoto="Nessuna richiesta in attesa.">
        {inAttesa.map((r) => (
          <Riga key={r.id} r={r} dettaglio={`Chiesto il ${quando(r.created_at)}`}>
            <Azione id={r.id} decisione="approvato" label="Approva" />
            <Azione id={r.id} decisione="negato" label="Nega" variant="destructive" />
          </Riga>
        ))}
      </Sezione>

      <Sezione titolo={`Accessi attivi (${attivi.length})`} vuoto="Nessun accesso attivo.">
        {attivi.map((r) => (
          <Riga key={r.id} r={r} dettaglio={`Fino al ${r.scade_at ? quando(r.scade_at) : "—"}`}>
            <Azione id={r.id} decisione="revocato" label="Revoca" variant="destructive" />
          </Riga>
        ))}
      </Sezione>

      {storico.length > 0 && (
        <Sezione titolo="Storico" vuoto="">
          {storico.slice(0, 50).map((r) => (
            <Riga key={r.id} r={r} dettaglio={r.deciso_at ? `Deciso il ${quando(r.deciso_at)}` : quando(r.created_at)}>
              <Badge variant="outline">
                {r.stato === "negato" ? "Negato" : r.stato === "revocato" ? "Revocato" : "Scaduto"}
              </Badge>
            </Riga>
          ))}
        </Sezione>
      )}
    </div>
  );
}

function Sezione({ titolo, vuoto, children }: { titolo: string; vuoto: string; children: React.ReactNode }) {
  const vuota = Array.isArray(children) && children.length === 0;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl uppercase">{titolo}</h2>
      {vuota ? (
        <p className="text-muted-foreground text-sm">{vuoto}</p>
      ) : (
        <div className="panel-3d overflow-hidden rounded-xl">
          <ul className="divide-y divide-border">{children}</ul>
        </div>
      )}
    </section>
  );
}

function Riga({ r, dettaglio, children }: { r: Richiesta; dettaglio: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="font-medium">{r.nome}</p>
        <p className="text-muted-foreground text-xs">
          {dettaglio} · {dispositivo(r.user_agent)}
          {r.ip && ` · IP ${r.ip}`}
        </p>
      </div>
      <div className="flex gap-2">{children}</div>
    </li>
  );
}

function Azione({
  id,
  decisione,
  label,
  variant = "default",
}: {
  id: string;
  decisione: "approvato" | "negato" | "revocato";
  label: string;
  variant?: "default" | "destructive";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      size="sm"
      variant={variant}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const r = await decidiAccesso(id, decisione);
        setPending(false);
        if (r.error) return void toast.error(r.error);
        toast.success(decisione === "approvato" ? "Accesso approvato." : decisione === "negato" ? "Accesso negato." : "Accesso revocato.");
        router.refresh();
      }}
    >
      {label}
    </Button>
  );
}
