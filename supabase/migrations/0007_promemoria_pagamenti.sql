-- Traccia se e quando e' stato inviato il promemoria per un pagamento, cosi'
-- il cron non lo rimanda ogni giorno per lo stesso pagamento.
alter table public.pagamenti
  add column promemoria_inviato_at timestamptz;
