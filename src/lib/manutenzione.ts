/**
 * Sito chiuso al pubblico ("in manutenzione").
 *
 * In produzione e' ATTIVO per impostazione predefinita; si riapre con
 * MANUTENZIONE=off su Vercel. Chi non ha un account inserisce il codice e il
 * proprio nome: parte una richiesta che SOLO il webmaster riceve come
 * notifica sul telefono e approva o nega dal link della notifica. Il cookie contiene solo un token
 * casuale; il permesso sta nel database, quindi una revoca vale subito.
 * Il login sta dentro l'involucro: anche chi ha un account passa dal codice
 * a ogni nuova sessione del browser o dopo MINUTI_INATTIVITA di inattivita'. In sviluppo e' attivo solo se
 * MANUTENZIONE=on in .env.local, per provarlo.
 */
export const COOKIE_ACCESSO = "od_accesso";
/** Ora dell'ultima richiesta: oltre MINUTI_INATTIVITA si torna al codice. */
export const COOKIE_ATTIVITA = "od_attivita";
export const MINUTI_INATTIVITA = 15;

/**
 * Cookie di sessione (nessuna scadenza esplicita): spariscono quando si
 * chiude il browser, e alla riapertura si riparte dal codice.
 */
export const opzioniCookieSessione = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

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

/** Percorsi raggiungibili anche a sito chiuso. */
export function percorsoLibero(path: string) {
  return (
    path === "/manutenzione" ||
    path.startsWith("/manutenzione/") ||
    path.startsWith("/auth/") ||
    path.startsWith("/api/cron/") ||
    path === "/manifest.webmanifest" ||
    path === "/robots.txt" ||
    path === "/sw.js" ||
    /\.(png|ico|svg|webmanifest)$/.test(path)
  );
}

/**
 * Le pagine di accesso stanno DENTRO l'involucro. Unica eccezione: finche'
 * il webmaster non ha attivato le notifiche su nessun dispositivo, restano
 * raggiungibili, altrimenti nessuno potrebbe approvare la prima richiesta.
 */
export function percorsoLogin(path: string) {
  return (
    path === "/login" ||
    path.startsWith("/recupera-password") ||
    path === "/verifica-accesso"
  );
}
