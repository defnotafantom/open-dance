-- Iscritti gestiti solo dallo staff.
-- 1. Registro attivita': ogni passaggio fatto dallo staff (nuovo iscritto,
--    classi, credenziali, incassi, modifiche...) con chi, giorno e ora.
--    Lo scrive solo il server (chiave di servizio); lo staff lo legge e
--    nessuno puo' modificarlo o cancellarlo.
-- 2. Codice d'accesso per gli account delle famiglie: si entra con codice
--    (o email) e la password generata dalla segreteria.
-- 3. Le famiglie non creano piu' alunni ne' iscrizioni: lo fa lo staff.

create table public.attivita_staff (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  autore_id uuid references public.profiles (id) on delete set null,
  -- Il nome resta anche se il profilo viene cancellato.
  autore_nome text not null,
  studente_id uuid references public.studenti (id) on delete set null,
  -- Il nome dell'iscritto resta anche se l'iscritto viene cancellato.
  studente_nome text,
  azione text not null,
  dettaglio text
);

create index attivita_staff_data on public.attivita_staff (created_at desc);
create index attivita_staff_studente on public.attivita_staff (studente_id, created_at desc);

alter table public.attivita_staff enable row level security;

create policy attivita_staff_select on public.attivita_staff for select
  using (public.is_staff());
-- Nessuna policy di insert/update/delete: scrive solo il server.

-- Codice d'accesso (es. OD-0001), assegnato alla creazione dell'account.
create sequence public.codice_accesso_seq;

alter table public.profiles add column codice_accesso text unique;

create function public.prossimo_codice_accesso()
returns text
language sql
security definer
set search_path = public
as $$
  select 'OD-' || lpad(nextval('public.codice_accesso_seq')::text, 4, '0');
$$;

revoke execute on function public.prossimo_codice_accesso() from public, anon, authenticated;
grant execute on function public.prossimo_codice_accesso() to service_role;

-- Solo lo staff crea alunni e iscrizioni; le famiglie possono ancora
-- correggere i dati anagrafici (tracciato dal server).
drop policy studenti_insert on public.studenti;
create policy studenti_insert on public.studenti for insert
  with check (public.is_staff());

drop policy iscrizioni_insert on public.iscrizioni;
create policy iscrizioni_insert on public.iscrizioni for insert
  with check (public.is_staff());

drop policy iscrizioni_delete on public.iscrizioni;
create policy iscrizioni_delete on public.iscrizioni for delete
  using (public.is_staff());
