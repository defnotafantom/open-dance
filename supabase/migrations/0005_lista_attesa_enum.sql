-- Nuovo valore enum in una migrazione a se' stante: Postgres non permette di
-- usare un valore appena aggiunto a un enum nella STESSA transazione in cui
-- e' stato creato, quindi va lanciata da sola, prima di 0006.
alter type iscrizione_stato_enum add value 'lista_attesa';
