/**
 * Il giorno di calendario in Italia (AAAA-MM-GG), qualunque sia il fuso del
 * server (Vercel lavora in UTC) o del dispositivo. Da usare per "oggi",
 * scadenze e date proposte, invece di toISOString() che e' in UTC: tra
 * mezzanotte e le 2 in Italia darebbe ancora il giorno prima.
 */
export function giornoRoma(d: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
