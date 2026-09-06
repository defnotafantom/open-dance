-- Collega una lezione annullata alla lezione di recupero creata al suo posto.
alter table public.lezioni
  add column sostituita_da_lezione_id uuid references public.lezioni (id) on delete set null;
