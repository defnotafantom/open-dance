-- Pannello "Lavori sul sito": lo staff segnala quali voci in coda vorrebbe
-- (voce = id della voce nel codice) o propone qualcosa di nuovo (voce null,
-- testo libero). Il contenuto del pannello sta nel codice; qui solo le
-- richieste, cosi' restano anche quando il pannello viene aggiornato.

create table public.richieste_lavori (
  id uuid primary key default gen_random_uuid(),
  voce text,
  testo text check (char_length(testo) <= 2000),
  profilo_id uuid not null references public.profiles (id) on delete cascade,
  evasa boolean not null default false,
  created_at timestamptz not null default now(),
  check (voce is not null or coalesce(trim(testo), '') <> '')
);

-- Una sola richiesta per persona per ogni voce in coda.
create unique index richieste_lavori_voce_profilo
  on public.richieste_lavori (voce, profilo_id) where voce is not null;

alter table public.richieste_lavori enable row level security;

create policy richieste_lavori_select on public.richieste_lavori for select
  using (public.is_staff());

create policy richieste_lavori_insert on public.richieste_lavori for insert
  with check (public.is_staff() and profilo_id = auth.uid());

-- Si ritira la propria richiesta; il webmaster puo' toglierne qualsiasi.
create policy richieste_lavori_delete on public.richieste_lavori for delete
  using (
    profilo_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and ruolo = 'webmaster')
  );

-- Solo il webmaster segna una proposta come evasa.
create policy richieste_lavori_update on public.richieste_lavori for update
  using (exists (select 1 from public.profiles where id = auth.uid() and ruolo = 'webmaster'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and ruolo = 'webmaster'));
