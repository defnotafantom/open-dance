/**
 * Sito chiuso al pubblico ("in manutenzione").
 *
 * In produzione e' ATTIVO per impostazione predefinita; si riapre con
 * MANUTENZIONE=off su Vercel. Chi non ha un account inserisce il codice e il
 * proprio nome: parte una richiesta che un titolare approva o nega dal
 * gestionale (con notifica sul telefono). Il cookie contiene solo un token
 * casuale; il permesso sta nel database, quindi una revoca vale subito.
 * Chi ha fatto il login entra senza codice. In sviluppo e' attivo solo se
 * MANUTENZIONE=on in .env.local, per provarlo.
 */
export const COOKIE_ACCESSO = "od_accesso";

/** Il codice e' solo il primo filtro: senza approvazione non si entra. */
export function codiceAccesso() {
  return process.env.MANUTENZIONE_CODICE || "1999";
}

export function manutenzioneAttiva() {
  if (process.env.MANUTENZIONE === "off") return false;
  if (process.env.NODE_ENV === "production") return true;
  return process.env.MANUTENZIONE === "on";
}

/** Durata di un accesso approvato. */
export const GIORNI_ACCESSO = 30;

/** Percorsi raggiungibili anche a sito chiuso (login compreso, per lo staff). */
export function percorsoLibero(path: string) {
  return (
    path === "/manutenzione" ||
    path === "/login" ||
    path.startsWith("/recupera-password") ||
    path === "/verifica-accesso" ||
    path.startsWith("/auth/") ||
    path.startsWith("/invito/") ||
    path.startsWith("/api/cron/") ||
    path === "/manifest.webmanifest" ||
    path === "/robots.txt" ||
    path === "/sw.js" ||
    /\.(png|ico|svg|webmanifest)$/.test(path)
  );
}
