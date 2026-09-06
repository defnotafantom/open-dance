-- Diritto alla cancellazione (GDPR art. 17): un allievo/genitore puo'
-- richiedere la cancellazione dei propri dati dalla propria area; lo staff
-- la evade manualmente perche' l'anonimizzazione tocca anche iscrizioni e
-- pagamenti storici che la scuola deve poter conservare per obblighi
-- contabili (l'azione server-side anonimizza invece di cancellare in blocco).

create type richiesta_cancellazione_stato_enum as enum ('in_attesa', 'completata', 'annullata');

create table public.richieste_cancellazione (
  id uuid primary key default gen_random_uuid(),
  profilo_id uuid not null references public.profiles (id) on delete cascade,
  stato richiesta_cancellazione_stato_enum not null default 'in_attesa',
  richiesto_at timestamptz not null default now(),
  gestito_da uuid references public.profiles (id) on delete set null,
  gestito_at timestamptz,
  note text
);

-- Un solo record "in_attesa" per profilo: evita richieste duplicate.
create unique index richieste_cancellazione_una_in_attesa
  on public.richieste_cancellazione (profilo_id)
  where stato = 'in_attesa';

alter table public.richieste_cancellazione enable row level security;

create policy richieste_cancellazione_select on public.richieste_cancellazione for select
  using (profilo_id = auth.uid() or public.is_staff());

create policy richieste_cancellazione_insert on public.richieste_cancellazione for insert
  with check (profilo_id = auth.uid());

-- Solo lo staff aggiorna lo stato (evasione della richiesta); l'utente puo'
-- solo crearla, non modificarla o "auto-completarla".
create policy richieste_cancellazione_update on public.richieste_cancellazione for update
  using (public.is_staff());

-- L'utente puo' ritirare una propria richiesta ancora in attesa; lo staff
-- puo' sempre rimuovere righe (es. pulizia dopo l'evasione manuale).
create policy richieste_cancellazione_delete on public.richieste_cancellazione for delete
  using ((profilo_id = auth.uid() and stato = 'in_attesa') or public.is_staff());
