-- Nuovi valori di ruolo, in una migrazione a se' stante (vedi 0005 per il
-- perche': Postgres non fa usare un valore enum nella stessa transazione in
-- cui e' stato creato). I vecchi valori (admin, staff, genitore,
-- allievo_adulto) restano nel tipo ma smettono di essere usati da qui in
-- avanti: Postgres non permette di rimuovere valori da un enum in sicurezza,
-- quindi restano innocuamente inutilizzati invece di essere cancellati.
alter type ruolo_enum add value 'webmaster';
alter type ruolo_enum add value 'proprietario';
alter type ruolo_enum add value 'co_proprietario';
alter type ruolo_enum add value 'segretario';
alter type ruolo_enum add value 'allievo';
