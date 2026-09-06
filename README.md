# Open Dance — cos'è e cosa fa

Open Dance è il sito/app della scuola che sostituisce telefonate, messaggi e
fogli sparsi con un unico posto dove staff, insegnanti e famiglie trovano
tutto: corsi, iscrizioni, pagamenti, presenze e comunicazioni.

È pensato soprattutto per essere usato da telefono (è installabile come
un'app vera e propria, senza passare da App Store o Play Store), ma funziona
anche da computer.

## I ruoli

Ogni persona che accede vede solo quello che le serve:

- **Proprietario** e **Co-Proprietario** — accesso completo a tutto.
- **Segretario/a** — gestisce corsi, iscrizioni, pagamenti, comunicazioni e
  studenti, ma non lo staff né le impostazioni della scuola.
- **Insegnante** — vede le proprie classi, fa l'appello, comunica con i suoi
  allievi.
- **Allievo** — l'account con cui una famiglia (o un allievo maggiorenne)
  gestisce le proprie iscrizioni. Un solo accesso può gestire più figli.
- **Webmaster** — un ruolo tecnico in più, per poter cambiare alcune
  impostazioni del sito senza dover toccare il codice.

Gli account di staff e insegnanti non si creano da soli: vengono invitati via
email da un Proprietario/Co-Proprietario, per sicurezza.

## Area staff (Proprietari, Segreteria, Insegnanti)

- **Panoramica** — un cruscotto con i numeri principali: studenti iscritti,
  classi attive, iscrizioni in attesa, pagamenti in sospeso, grafici delle
  nuove iscrizioni e degli incassi degli ultimi mesi, tasso di presenza per
  classe.
- **Corsi e classi** — creazione dei corsi (nome, categoria, livello) e delle
  classi (giorno, orario, sala, insegnante, capienza massima, stagione).
- **Studenti** — l'elenco di tutti gli iscritti, con chi li segue (genitore o
  se stessi se maggiorenni).
- **Iscrizioni** — le richieste in attesa di approvazione, la lista d'attesa
  quando una classe è piena, e un **modulo per registrare a mano
  un'iscrizione** raccolta fuori dal sito (di persona, al telefono): cerca o
  crea l'account della famiglia, aggiunge l'iscritto e lo mette subito
  attivo in una classe, senza passare dall'approvazione.
- **Pagamenti** — registrazione di quanto dovuto/pagato per ogni iscritto,
  scadenze, metodo di pagamento, stato (da pagare/parziale/pagato/scaduto).
  Promemoria automatici (email + notifica) quando una scadenza si avvicina.
  Esportazione in CSV per il commercialista.
- **Eventi** — saggi e altri eventi della scuola, visibili anche a famiglie e
  insegnanti.
- **Comunicazioni** — bacheca per avvisi mirati: a tutti, a un ruolo
  specifico, a un corso o a una singola classe. Ogni comunicazione arriva
  anche come notifica push e tiene traccia di chi l'ha letta.
- **Staff** — invito di nuovi account per segreteria, insegnanti,
  proprietari.
- **Impostazioni** *(solo Proprietari/Webmaster)* — dati della scuola (nome,
  anno di fondazione, indirizzo, contatti) modificabili direttamente dal
  sito, e la gestione delle richieste di cancellazione dati (vedi Privacy
  più sotto).

## Area famiglia (Allievo)

- **Home** — un riepilogo personale: quanti iscritti, quante lezioni nei
  prossimi 7 giorni, quanto c'è da saldare, quante comunicazioni non lette.
- **Iscritti** — aggiunta dei propri figli (o iscrizione di se stessi se
  maggiorenni); un solo accesso gestisce tutta la famiglia.
- **Orario** — l'orario settimanale dei corsi, con la possibilità di
  richiedere l'iscrizione di un figlio a una classe (va in approvazione, o in
  lista d'attesa se la classe è piena) e di **rinnovare con un tocco**
  l'iscrizione alla stagione successiva dello stesso corso.
- **Pagamenti** — consultazione in sola lettura di quanto dovuto/pagato e
  delle scadenze.
- **Presenze** — conferma anticipata "ci sarò/non ci sarò" per le lezioni dei
  prossimi 14 giorni (aiuta l'insegnante a organizzarsi), più lo storico
  delle presenze registrate a lezione.
- **Documenti** — caricamento di documenti come il certificato medico, con
  avviso quando sta per scadere.
- **Eventi** e **Comunicazioni** — come sopra, dal punto di vista della
  famiglia.
- **Privacy** — scaricare una copia di tutti i propri dati, oppure chiedere
  la cancellazione dell'account: lo staff la evade rimuovendo i dati
  identificativi (nome, documenti, note mediche) e disabilitando l'accesso,
  mantenendo solo lo storico di iscrizioni/pagamenti in forma anonima per
  gli obblighi contabili della scuola.

## Area insegnante

- **Le mie classi** e **appello** — segna le presenze a lezione.
- **Comunicazioni** — messaggi alla propria classe.
- **Eventi** — consultazione.

## Notifiche

Chi attiva le notifiche sul telefono riceve un avviso push per: nuove
comunicazioni, promemoria di pagamento in scadenza. Le email arrivano come
seconda via per gli avvisi più importanti.

## Cosa manca ancora

- **Le migrazioni del database** per i ruoli, il modulo di iscrizione
  manuale, le impostazioni della scuola e la privacy vanno ancora applicate
  al progetto Supabase reale (si fa dal pannello Supabase, una alla volta).
- **La messa online (deploy)** è volutamente rimandata a più avanti, su
  richiesta esplicita.
