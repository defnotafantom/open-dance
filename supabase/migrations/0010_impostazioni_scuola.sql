-- Riga singola con i dati anagrafici della scuola, modificabili dal sito
-- (area Impostazioni) invece che via codice.
create table public.impostazioni_scuola (
  id smallint primary key default 1 check (id = 1),
  nome_scuola text not null default 'Open Dance',
  anno_fondazione integer,
  indirizzo text,
  telefono text,
  email_contatto text,
  updated_at timestamptz not null default now()
);

insert into public.impostazioni_scuola (id, nome_scuola, anno_fondazione, indirizzo)
values (1, 'Open Dance', 1999, 'Via IV Novembre, Terme Vigliatore (ME)')
on conflict (id) do nothing;

alter table public.impostazioni_scuola enable row level security;

-- Visibile a chiunque sia autenticato (serve anche a genitori/insegnanti,
-- es. per mostrare indirizzo/contatti).
create policy impostazioni_scuola_select on public.impostazioni_scuola for select using (true);

-- Modificabile solo dai titolari (webmaster/proprietario/co-proprietario),
-- non dalla segreteria ne' dagli insegnanti.
create policy impostazioni_scuola_update on public.impostazioni_scuola for update
  using (public.is_titolare()) with check (public.is_titolare());
