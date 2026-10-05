// Tipi scritti a mano per rispecchiare supabase/migrations/0001_init.sql.
// Quando il progetto Supabase reale esiste, rigenerare con:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts

export type RuoloEnum =
  | "webmaster"
  | "proprietario"
  | "co_proprietario"
  | "segretario"
  | "insegnante"
  | "allievo"
  // valori storici: non piu' assegnati a nuovi profili, restano solo per
  // compatibilita' con l'enum Postgres (che non permette di rimuovere valori).
  | "admin"
  | "staff"
  | "genitore"
  | "allievo_adulto";

export const RUOLI_TITOLARI: RuoloEnum[] = ["webmaster", "proprietario", "co_proprietario"];
export const RUOLI_STAFF: RuoloEnum[] = [...RUOLI_TITOLARI, "segretario"];
export type IscrizioneStatoEnum =
  | "richiesta"
  | "attiva"
  | "sospesa"
  | "terminata"
  | "lista_attesa";
export type LezioneStatoEnum = "regolare" | "annullata" | "recuperata";
export type PresenzaStatoEnum = "presente" | "assente" | "giustificato";
export type PagamentoTipoEnum = "quota_corso" | "iscrizione_annuale" | "saggio" | "altro";
export type PagamentoMetodoEnum = "contanti" | "bonifico" | "pos" | "altro";
export type PagamentoStatoEnum = "da_pagare" | "parziale" | "pagato" | "scaduto";
export type ConsensoTipoEnum = "trattamento_dati" | "foto_video" | "newsletter";
export type RichiestaCancellazioneStatoEnum = "in_attesa" | "completata" | "annullata";
export type AttivitaSocio = "danza" | "fitness" | "entrambe";
export type SezioneScuola = "scuola" | "aule" | "attivita" | "storia";
export type CategoriaTraguardo =
  | "ambizione"
  | "concorso"
  | "contest"
  | "competizione"
  | "crescita"
  | "tappa";
export type TipoPosizione = "personale" | "insegnante_esterno" | "masterclass";
export type TipoCandidatura = TipoPosizione | "spontanea";
export type StatoCandidatura = "nuova" | "in_valutazione" | "archiviata";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string;
          cognome: string;
          email: string;
          telefono: string | null;
          ruolo: RuoloEnum;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; email: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      studenti: {
        Row: {
          id: string;
          nome: string;
          cognome: string;
          data_nascita: string;
          codice_fiscale: string | null;
          is_adulto: boolean;
          genitore_id: string | null;
          profilo_id: string | null;
          numero_tessera: number | null;
          attivita: AttivitaSocio;
          data_tesseramento: string;
          attivo: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["studenti"]["Row"]> & {
          nome: string;
          cognome: string;
          data_nascita: string;
        };
        Update: Partial<Database["public"]["Tables"]["studenti"]["Row"]>;
        Relationships: [];
      };
      studenti_note_mediche: {
        Row: { studente_id: string; note: string | null; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["studenti_note_mediche"]["Row"]> & { studente_id: string };
        Update: Partial<Database["public"]["Tables"]["studenti_note_mediche"]["Row"]>;
        Relationships: [];
      };
      corsi: {
        Row: {
          id: string;
          nome: string;
          descrizione: string | null;
          categoria: string | null;
          livello: string | null;
          attivo: boolean;
          pubblicato: boolean;
          tappa: number | null;
          eta_consigliata: string | null;
          impatto: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["corsi"]["Row"]> & { nome: string };
        Update: Partial<Database["public"]["Tables"]["corsi"]["Row"]>;
        Relationships: [];
      };
      classi: {
        Row: {
          id: string;
          corso_id: string;
          insegnante_id: string | null;
          giorno_settimana: number;
          orario_inizio: string;
          orario_fine: string;
          sala: string | null;
          capienza_max: number | null;
          stagione: string;
          attiva: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["classi"]["Row"]> & {
          corso_id: string;
          giorno_settimana: number;
          orario_inizio: string;
          orario_fine: string;
          stagione: string;
        };
        Update: Partial<Database["public"]["Tables"]["classi"]["Row"]>;
        Relationships: [];
      };
      lezioni: {
        Row: {
          id: string;
          classe_id: string;
          data: string;
          orario_inizio: string | null;
          orario_fine: string | null;
          stato: LezioneStatoEnum;
          sostituita_da_lezione_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["lezioni"]["Row"]> & { classe_id: string; data: string };
        Update: Partial<Database["public"]["Tables"]["lezioni"]["Row"]>;
        Relationships: [];
      };
      iscrizioni: {
        Row: {
          id: string;
          studente_id: string;
          classe_id: string;
          data_iscrizione: string;
          stato: IscrizioneStatoEnum;
          quota_concordata: number | null;
          note: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["iscrizioni"]["Row"]> & { studente_id: string; classe_id: string };
        Update: Partial<Database["public"]["Tables"]["iscrizioni"]["Row"]>;
        Relationships: [];
      };
      presenze: {
        Row: {
          id: string;
          lezione_id: string;
          studente_id: string;
          stato: PresenzaStatoEnum;
          segnato_da: string | null;
          segnato_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["presenze"]["Row"]> & {
          lezione_id: string;
          studente_id: string;
          stato: PresenzaStatoEnum;
        };
        Update: Partial<Database["public"]["Tables"]["presenze"]["Row"]>;
        Relationships: [];
      };
      pagamenti: {
        Row: {
          id: string;
          studente_id: string;
          iscrizione_id: string | null;
          tipo: PagamentoTipoEnum;
          importo_dovuto: number;
          importo_pagato: number;
          data_scadenza: string | null;
          data_pagamento: string | null;
          metodo: PagamentoMetodoEnum | null;
          stato: PagamentoStatoEnum;
          note: string | null;
          registrato_da: string | null;
          promemoria_inviato_at: string | null;
          competenza: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pagamenti"]["Row"]> & {
          studente_id: string;
          tipo: PagamentoTipoEnum;
          importo_dovuto: number;
        };
        Update: Partial<Database["public"]["Tables"]["pagamenti"]["Row"]>;
        Relationships: [];
      };
      comunicazioni: {
        Row: {
          id: string;
          titolo: string;
          corpo: string;
          autore_id: string;
          pubblicato_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["comunicazioni"]["Row"]> & {
          titolo: string;
          corpo: string;
          autore_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["comunicazioni"]["Row"]>;
        Relationships: [];
      };
      comunicazioni_target: {
        Row: {
          id: string;
          comunicazione_id: string;
          classe_id: string | null;
          corso_id: string | null;
          ruolo: RuoloEnum | null;
        };
        Insert: Partial<Database["public"]["Tables"]["comunicazioni_target"]["Row"]> & { comunicazione_id: string };
        Update: Partial<Database["public"]["Tables"]["comunicazioni_target"]["Row"]>;
        Relationships: [];
      };
      letture_comunicazioni: {
        Row: { comunicazione_id: string; profilo_id: string; letta_at: string };
        Insert: { comunicazione_id: string; profilo_id: string; letta_at?: string };
        Update: Partial<Database["public"]["Tables"]["letture_comunicazioni"]["Row"]>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          profilo_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]> & {
          profilo_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]>;
        Relationships: [];
      };
      documenti: {
        Row: {
          id: string;
          studente_id: string;
          tipo: string;
          file_path: string;
          data_scadenza: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["documenti"]["Row"]> & {
          studente_id: string;
          tipo: string;
          file_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["documenti"]["Row"]>;
        Relationships: [];
      };
      conferme_presenza: {
        Row: {
          id: string;
          lezione_id: string;
          studente_id: string;
          verra: boolean;
          confermato_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["conferme_presenza"]["Row"]> & {
          lezione_id: string;
          studente_id: string;
          verra: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["conferme_presenza"]["Row"]>;
        Relationships: [];
      };
      consensi_privacy: {
        Row: {
          id: string;
          profilo_id: string;
          studente_id: string | null;
          tipo_consenso: ConsensoTipoEnum;
          concesso: boolean;
          data: string;
          versione_informativa: string;
        };
        Insert: Partial<Database["public"]["Tables"]["consensi_privacy"]["Row"]> & {
          profilo_id: string;
          tipo_consenso: ConsensoTipoEnum;
          concesso: boolean;
          versione_informativa: string;
        };
        Update: Partial<Database["public"]["Tables"]["consensi_privacy"]["Row"]>;
        Relationships: [];
      };
      eventi: {
        Row: {
          id: string;
          nome: string;
          data: string;
          luogo: string | null;
          descrizione: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["eventi"]["Row"]> & { nome: string; data: string };
        Update: Partial<Database["public"]["Tables"]["eventi"]["Row"]>;
        Relationships: [];
      };
      impostazioni_scuola: {
        Row: {
          id: number;
          nome_scuola: string;
          anno_fondazione: number | null;
          indirizzo: string | null;
          telefono: string | null;
          email_contatto: string | null;
          denominazione_asd: string | null;
          codice_fiscale_asd: string | null;
          sede_legale: string | null;
          numero_registro: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["impostazioni_scuola"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["impostazioni_scuola"]["Row"]>;
        Relationships: [];
      };
      richieste_cancellazione: {
        Row: {
          id: string;
          profilo_id: string;
          stato: RichiestaCancellazioneStatoEnum;
          richiesto_at: string;
          gestito_da: string | null;
          gestito_at: string | null;
          note: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["richieste_cancellazione"]["Row"]> & {
          profilo_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["richieste_cancellazione"]["Row"]>;
        Relationships: [];
      };
      insegnanti_profili: {
        Row: {
          profilo_id: string;
          bio: string | null;
          carriera: string | null;
          specializzazioni: string | null;
          anni_esperienza: number | null;
          foto_path: string | null;
          cv_path: string | null;
          pubblicato: boolean;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["insegnanti_profili"]["Row"]> & {
          profilo_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["insegnanti_profili"]["Row"]>;
        Relationships: [];
      };
      scuola_contenuti: {
        Row: {
          id: string;
          sezione: SezioneScuola;
          titolo: string;
          descrizione: string | null;
          foto_path: string | null;
          ordine: number;
          pubblicato: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["scuola_contenuti"]["Row"]> & {
          sezione: SezioneScuola;
          titolo: string;
        };
        Update: Partial<Database["public"]["Tables"]["scuola_contenuti"]["Row"]>;
        Relationships: [];
      };
      traguardi: {
        Row: {
          id: string;
          anno: number;
          categoria: CategoriaTraguardo;
          titolo: string;
          contesto: string | null;
          risultato: string | null;
          foto_path: string | null;
          ordine: number;
          pubblicato: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["traguardi"]["Row"]> & {
          anno: number;
          categoria: CategoriaTraguardo;
          titolo: string;
        };
        Update: Partial<Database["public"]["Tables"]["traguardi"]["Row"]>;
        Relationships: [];
      };
      posizioni_aperte: {
        Row: {
          id: string;
          tipo: TipoPosizione;
          titolo: string;
          descrizione: string | null;
          attiva: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["posizioni_aperte"]["Row"]> & {
          tipo: TipoPosizione;
          titolo: string;
        };
        Update: Partial<Database["public"]["Tables"]["posizioni_aperte"]["Row"]>;
        Relationships: [];
      };
      candidature: {
        Row: {
          id: string;
          tipo: TipoCandidatura;
          posizione_id: string | null;
          nome: string;
          cognome: string;
          email: string;
          telefono: string | null;
          messaggio: string | null;
          link_portfolio: string | null;
          cv_path: string | null;
          consenso_privacy: boolean;
          stato: StatoCandidatura;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["candidature"]["Row"]> & {
          tipo: TipoCandidatura;
          nome: string;
          cognome: string;
          email: string;
          consenso_privacy: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["candidature"]["Row"]>;
        Relationships: [];
      };
      tariffe: {
        Row: {
          id: string;
          attivita: "danza" | "fitness";
          voce: "iscrizione" | "mensile";
          stagione: string;
          importo: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tariffe"]["Row"]> & {
          attivita: "danza" | "fitness";
          voce: "iscrizione" | "mensile";
          stagione: string;
          importo: number;
        };
        Update: Partial<Database["public"]["Tables"]["tariffe"]["Row"]>;
        Relationships: [];
      };
      versamenti: {
        Row: {
          id: string;
          pagamento_id: string;
          anno: number;
          numero: number;
          importo: number;
          data: string;
          metodo: PagamentoMetodoEnum;
          pagatore_nome: string;
          pagatore_codice_fiscale: string | null;
          causale: string;
          note: string | null;
          annullato: boolean;
          motivo_annullamento: string | null;
          registrato_da: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["versamenti"]["Row"]> & {
          pagamento_id: string;
          importo: number;
          metodo: PagamentoMetodoEnum;
          pagatore_nome: string;
          causale: string;
        };
        Update: Partial<Database["public"]["Tables"]["versamenti"]["Row"]>;
        Relationships: [];
      };
      accessi_sito: {
        Row: {
          id: string;
          token: string;
          nome: string;
          ip: string | null;
          user_agent: string | null;
          stato: "in_attesa" | "approvato" | "negato" | "revocato";
          scade_at: string | null;
          deciso_at: string | null;
          deciso_da: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["accessi_sito"]["Row"]> & {
          token: string;
          nome: string;
        };
        Update: Partial<Database["public"]["Tables"]["accessi_sito"]["Row"]>;
        Relationships: [];
      };
      uscite: {
        Row: {
          id: string;
          data: string;
          categoria: string;
          descrizione: string;
          importo: number;
          metodo: PagamentoMetodoEnum;
          note: string | null;
          registrato_da: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["uscite"]["Row"]> & {
          categoria: string;
          descrizione: string;
          importo: number;
          metodo: PagamentoMetodoEnum;
        };
        Update: Partial<Database["public"]["Tables"]["uscite"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accesso_sito_stato: {
        Args: { p_token: string };
        Returns: string | null;
      };
    };
  };
}
