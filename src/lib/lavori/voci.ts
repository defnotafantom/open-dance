// Contenuto del pannello "Lavori sul sito" (/admin/lavori). Si aggiorna a
// ogni rilascio: le voci "fatto" scendono in fondo man mano che invecchiano,
// quelle "in coda" hanno un id stabile perche' le richieste dello staff
// (tabella richieste_lavori) vi si agganciano.

export type Voce = {
  titolo: string;
  dettaglio: string;
  /** Dove si trova nel sito, se c'e' gia'. */
  link?: string;
};

export type VoceFatta = Voce & { data: string };

export type VoceInCoda = Voce & { id: string; area: string };

export const AGGIORNATO_AL = "2026-10-05";

export const APPENA_FATTO: VoceFatta[] = [
  {
    data: "2026-10-05",
    titolo: "Iscritti: un solo elenco",
    dettaglio:
      "Studenti e Soci uniti in Iscritti. Ogni scheda ha corsi (con ritiro), quote, ricevute, accesso al sito e storia.",
    link: "/admin/iscritti",
  },
  {
    data: "2026-10-05",
    titolo: "Iscrizione solo dalla segreteria, con credenziali generate",
    dettaglio:
      "Le famiglie non si registrano più da sole. Lo staff crea l'iscritto e il sito genera codice (OD-0001) e password da stampare. Nessuna email parte.",
    link: "/admin/iscritti/nuovo",
  },
  {
    data: "2026-10-05",
    titolo: "Attività staff tracciata",
    dettaglio:
      "Ogni passaggio (iscrizioni, corsi, credenziali, incassi, istanze, modifiche) con chi, giorno e ora. Visibile a tutto lo staff, non modificabile.",
    link: "/admin/attivita",
  },
  {
    data: "2026-10-05",
    titolo: "Promemoria di pagamento spenti",
    dettaglio: "Nessuna notifica sui pagamenti alle famiglie finché non è chiaro se si può.",
  },
  {
    data: "2026-10-05",
    titolo: "Stessi numeri ovunque",
    dettaglio:
      "Panoramica, Registri e area famiglie ora leggono le stesse fonti: quote in ritardo calcolate su oggi, incassi al netto delle restituzioni.",
    link: "/admin",
  },
  {
    data: "2026-10-05",
    titolo: "Ognuno nella propria area",
    dettaglio: "Chi apre una pagina non sua viene portato nella propria area invece che sulla vetrina.",
  },
  {
    data: "2026-10-05",
    titolo: "Pannello lavori sul sito",
    dettaglio: "Questa pagina: cosa è pronto, cosa si sta facendo, cosa viene dopo, e le richieste dello staff.",
    link: "/admin/lavori",
  },
  {
    data: "2026-10-05",
    titolo: "Scheda unica del socio",
    dettaglio:
      "Un clic sul nome in Registri → Soci: avvisi, anagrafica, referente, corsi, presenze, quote, istanze e ricevute in una pagina.",
    link: "/admin/iscritti",
  },
  {
    data: "2026-10-05",
    titolo: "Pagamenti dentro i Registri",
    dettaglio:
      "Un solo posto per quote e incassi. In Ricevute due esportazioni CSV per il commercialista (ricevute e situazione quote).",
    link: "/admin/registri/ricevute",
  },
  {
    data: "2026-10-05",
    titolo: "Quota d'iscrizione automatica",
    dettaglio:
      "Quando un'iscrizione diventa attiva la quota della stagione si crea dal listino, una sola volta per stagione.",
    link: "/admin/registri/quote",
  },
  {
    data: "2026-10-05",
    titolo: "Istanze con avvisi permanenti",
    dettaglio:
      "Registri liberi con un nome (es. ABITI CONCORSO), scadenza facoltativa, importo per alunno, restituzioni. Gli avvisi spariscono da soli quando la voce è in regola.",
    link: "/admin/registri/istanze",
  },
  {
    data: "2026-10-05",
    titolo: "Iscrizione a più corsi",
    dettaglio: "Dalla segreteria si iscrive un alunno a più classi in una volta sola.",
    link: "/admin/iscrizioni",
  },
  {
    data: "2026-10-05",
    titolo: "Accesso al sito con codice e approvazione",
    dettaglio:
      "Codice d'ingresso, approvazione dal telefono del webmaster, uscita a fine sessione o dopo 15 minuti in background.",
  },
  {
    data: "2026-10-05",
    titolo: "Registri dei soci",
    dettaglio:
      "Libro soci con numero di tessera, listino, quote mensili e d'iscrizione, ricevute numerate non fiscali, entrate e uscite con grafici.",
    link: "/admin/registri",
  },
  {
    data: "2026-10-05",
    titolo: "Sito pubblico completo e nuovo stile",
    dettaglio:
      "Insegnanti con percorso e CV, La scuola, Speciale 28 anni, Lavora con noi, corsi come percorso. Palette siderale e monogramma OD.",
    link: "/admin/sito",
  },
];

export const IN_LAVORAZIONE: Voce[] = [];

/** Cose decise che partono appena arriva quello che manca. */
export const IN_PROGRAMMA: (Voce & { serve: string })[] = [
  {
    titolo: "Prezzi per corso, pacchetti e sconti",
    dettaglio: "Oggi la quota mensile dipende solo da danza / fitness / entrambe.",
    serve: "Elenco dei corsi e regole dei prezzi",
  },
  {
    titolo: "Importazione degli alunni",
    dettaglio: "Caricare l'elenco attuale invece di inserirlo a mano.",
    serve: "Il file con l'elenco (Excel o CSV)",
  },
  {
    titolo: "Funzioni dell'area iscritti",
    dettaglio: "Cosa vedono e fanno le famiglie dopo l'accesso, oltre a quanto c'è già.",
    serve: "Una chiacchierata per decidere insieme",
  },
  {
    titolo: "Biglietti saggio, costumi, masterclass per esterni",
    dettaglio: "Incassi da non soci: si costruiscono solo nel modo indicato dal commercialista.",
    serve: "Risposte del commercialista",
  },
  {
    titolo: "Messa online",
    dettaglio:
      "Informativa privacy, dominio, piani a pagamento di hosting e database, archivio svuotato dai dati di prova, nuova password, codice d'ingresso tolto.",
    serve: "Via libera finale",
  },
];

/** Idee pronte da fare: lo staff segnala quali vuole. */
export const IN_CODA: VoceInCoda[] = [
  {
    id: "certificati-medici",
    area: "Segreteria",
    titolo: "Certificati medici con scadenza",
    dettaglio: "Data di scadenza per ogni alunno e avviso permanente quando manca o è scaduto.",
  },
  {
    id: "consensi-firmati",
    area: "Segreteria",
    titolo: "Consensi firmati online",
    dettaglio: "Privacy, liberatoria foto e regolamento accettati dalla famiglia nell'area iscritti, con data.",
  },
  {
    id: "libro-soci-stampa",
    area: "Registri",
    titolo: "Libro soci stampabile",
    dettaglio: "Stampa o PDF del libro soci della stagione, con numero di tessera e data di adesione.",
  },
  {
    id: "riempimento-classi",
    area: "Corsi",
    titolo: "Riempimento delle classi",
    dettaglio: "Posti occupati e liberi per ogni classe, con lista d'attesa in evidenza.",
  },
  {
    id: "lezione-prova",
    area: "Sito pubblico",
    titolo: "Richiesta di lezione di prova",
    dettaglio: "Modulo dal sito che arriva in segreteria come richiesta da confermare.",
  },
  {
    id: "galleria-saggi",
    area: "Sito pubblico",
    titolo: "Galleria foto e video",
    dettaglio: "Saggi e concorsi, con foto pubblicate solo per chi ha dato il consenso.",
  },
  {
    id: "calendario-telefono",
    area: "Famiglie",
    titolo: "Orario nel calendario del telefono",
    dettaglio: "Le lezioni dei figli sincronizzate nel calendario di Google o dell'iPhone.",
  },
  {
    id: "sostituzioni",
    area: "Insegnanti",
    titolo: "Sostituzioni e assenze insegnanti",
    dettaglio: "Segnare un'assenza e assegnare chi sostituisce, con avviso alle famiglie della classe.",
  },
  {
    id: "presenze-qr",
    area: "Insegnanti",
    titolo: "Presenze con QR",
    dettaglio: "L'alunno mostra un codice all'ingresso e la presenza si segna da sola.",
  },
  {
    id: "cambio-password",
    area: "Famiglie",
    titolo: "Cambio password al primo accesso",
    dettaglio: "La famiglia sceglie una password sua la prima volta che entra con quella stampata.",
  },
  {
    id: "promemoria-quote",
    area: "Famiglie",
    titolo: "Promemoria quote sul telefono",
    dettaglio: "Sospesi: si riattivano solo se il commercialista conferma che non ci sono problemi.",
  },
  {
    id: "esporta-tutto",
    area: "Sicurezza",
    titolo: "Copia completa dei dati",
    dettaglio: "Un'esportazione periodica di tutti i registri, da conservare fuori dal sito.",
  },
];
