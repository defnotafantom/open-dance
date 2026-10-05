/**
 * Registrazione pubblica (/registrati) aperta o chiusa.
 *
 * Al lancio in produzione resta chiusa (decisione del proprietario): le
 * famiglie vengono iscritte dalla segreteria con il modulo manuale. Per
 * riaprirla basta impostare NEXT_PUBLIC_REGISTRAZIONI_APERTE=true su Vercel
 * e ripubblicare, dopo aver ritestato tutto il flusso di iscrizione. In
 * sviluppo e' sempre aperta, per poterla provare.
 */
export const REGISTRAZIONI_APERTE =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_REGISTRAZIONI_APERTE === "true";
