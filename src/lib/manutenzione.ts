/**
 * Sito chiuso al pubblico ("in manutenzione"): si entra solo con un codice.
 *
 * In produzione e' ATTIVO per impostazione predefinita: si apre il sito
 * solo impostando MANUTENZIONE=off su Vercel. Il codice d'accesso sta nella
 * variabile MANUTENZIONE_CODICE (mai nel codice sorgente): finche' non e'
 * impostata nessuno puo' entrare. In sviluppo e' attivo solo se
 * MANUTENZIONE_CODICE e' impostata in .env.local, per provarlo.
 */
export const COOKIE_ACCESSO = "od_accesso";

export function manutenzioneAttiva() {
  if (process.env.MANUTENZIONE === "off") return false;
  if (process.env.NODE_ENV === "production") return true;
  return !!process.env.MANUTENZIONE_CODICE;
}

/** Cosa si salva nel cookie: un'impronta del codice, mai il codice. */
export async function impronta(codice: string) {
  const dati = new TextEncoder().encode(`open-dance-accesso:${codice}`);
  const hash = await crypto.subtle.digest("SHA-256", dati);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Percorsi raggiungibili anche a sito chiuso. */
export function percorsoLibero(path: string) {
  return (
    path === "/manutenzione" ||
    path.startsWith("/api/cron/") ||
    path === "/manifest.webmanifest" ||
    path === "/robots.txt" ||
    /\.(png|ico|svg|webmanifest)$/.test(path)
  );
}
