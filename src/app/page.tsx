import { redirect } from "next/navigation";
import Link from "next/link";
import { getOptionalProfile, areaPerRuolo } from "@/lib/auth/dal";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { CalendarDays, MessagesSquare, Wallet } from "lucide-react";

const PUNTI_FORZA = [
  {
    icona: CalendarDays,
    titolo: "Orari e iscrizioni",
    testo: "Corsi, classi e posti disponibili sempre aggiornati, iscrizione con un tocco.",
  },
  {
    icona: Wallet,
    titolo: "Pagamenti tracciati",
    testo: "Scadenze e quote sempre chiari, senza rincorrere ricevute e messaggi.",
  },
  {
    icona: MessagesSquare,
    titolo: "Comunicazioni al posto giusto",
    testo: "Avvisi mirati per corso o classe, con notifiche invece di gruppi WhatsApp.",
  },
];

export default async function Home() {
  const profile = await getOptionalProfile();

  if (profile) {
    redirect(areaPerRuolo(profile.ruolo));
  }

  return (
    <main className="flex flex-1 flex-col">
      <section className="dark relative flex flex-col items-center gap-10 overflow-hidden bg-background px-6 py-20 text-center text-foreground sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, color-mix(in oklch, var(--primary), transparent 78%), transparent)",
          }}
        />
        <Logo size={40} className="relative" />
        <div className="relative flex flex-col items-center gap-4">
          <p className="text-xs font-semibold tracking-[0.3em] text-primary uppercase">
            Since 1999
          </p>
          <h1 className="max-w-2xl text-4xl font-black tracking-tight text-balance sm:text-6xl">
            La tua scuola di danza,
            <br />
            tutta in un posto.
          </h1>
          <p className="max-w-md text-base text-muted-foreground">
            Corsi, orari, iscrizioni, pagamenti e comunicazioni: tutto quello
            che prima girava tra telefonate e messaggi, ora a portata di mano.
          </p>
        </div>
        <div className="relative flex gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/login">Accedi</Link>} />
          <Button
            size="lg"
            nativeButton={false}
            variant="outline"
            render={<Link href="/registrati">Registrati</Link>}
          />
        </div>
      </section>

      <section className="grid gap-8 px-6 py-16 sm:grid-cols-3 sm:px-12 lg:px-24">
        {PUNTI_FORZA.map(({ icona: Icona, titolo, testo }) => (
          <div key={titolo} className="flex flex-col items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icona className="size-5" />
            </span>
            <h2 className="font-semibold">{titolo}</h2>
            <p className="text-muted-foreground text-sm">{testo}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
