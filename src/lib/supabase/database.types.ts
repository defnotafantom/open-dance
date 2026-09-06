// Tipi scritti a mano per rispecchiare supabase/migrations/0001_init.sql.
// Quando il progetto Supabase reale esiste, rigenerare con:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts

export type RuoloEnum = "admin" | "staff" | "insegnante" | "genitore" | "allievo_adulto";
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
