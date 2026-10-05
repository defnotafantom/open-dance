-- Sezioni pubbliche del sito (visibili anche a chi non fa parte della
-- scuola): La scuola, Speciale 28 anni, Lavora con noi, il percorso dei
-- corsi e il CV degli insegnanti. Tutti i contenuti sono gestiti dallo staff
-- dall'area riservata, nessuno e' scritto nel codice.

-- =========================================================
-- Insegnanti: CV scaricabile dalla pagina pubblica
-- =========================================================
-- Il file vive nel bucket pubblico "insegnanti" (<profilo_id>/cv.pdf): le
-- policy di 0013 coprono gia' upload e lettura con la stessa convenzione.
alter table public.insegnanti_profili add column cv_path text;

-- =========================================================
-- Corsi: presentazione pubblica come percorso graduale
-- =========================================================
-- tappa: 1 Primi passi, 2 Fondamenta, 3 Crescita, 4 Alta formazione.
-- impatto: cosa sviluppa concretamente il corso (corpo, testa, relazioni).
alter table public.corsi
  add column pubblicato boolean not null default false,
  add column tappa smallint check (tappa between 1 and 4),
  add column eta_consigliata text,
  add column impatto text;

-- =========================================================
-- La scuola: aule, la scuola, cosa facciamo, cosa abbiamo fatto
-- =========================================================
create table public.scuola_contenuti (
  id uuid primary key default gen_random_uuid(),
  sezione text not null check (sezione in ('scuola', 'aule', 'attivita', 'storia')),
  titolo text not null,
  descrizione text,
  foto_path text,
  ordine integer not null default 0,
  pubblicato boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.scuola_contenuti enable row level security;

create policy scuola_contenuti_select on public.scuola_contenuti for select
  using (pubblicato = true or public.is_staff());
create policy scuola_contenuti_modifica on public.scuola_contenuti for all
  using (public.is_staff()) with check (public.is_staff());

-- =========================================================
-- Speciale 28 anni: i traguardi, raccontati con il loro contesto
-- =========================================================
-- "contesto" e' il cuore di ogni voce (preparazione, ostacoli, cosa ha
-- significato per le allieve/gli allievi); "risultato" e' facoltativo,
-- perche' non tutto quello che conta finisce con un premio.
create table public.traguardi (
  id uuid primary key default gen_random_uuid(),
  anno integer not null check (anno between 1999 and 2100),
  categoria text not null check (
    categoria in ('ambizione', 'concorso', 'contest', 'competizione', 'crescita', 'tappa')
  ),
  titolo text not null,
  contesto text,
  risultato text,
  foto_path text,
  ordine integer not null default 0,
  pubblicato boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.traguardi enable row level security;

create policy traguardi_select on public.traguardi for select
  using (pubblicato = true or public.is_staff());
create policy traguardi_modifica on public.traguardi for all
  using (public.is_staff()) with check (public.is_staff());

-- =========================================================
-- Lavora con noi: posizioni aperte e candidature
-- =========================================================
create table public.posizioni_aperte (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('personale', 'insegnante_esterno', 'masterclass')),
  titolo text not null,
  descrizione text,
  attiva boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.posizioni_aperte enable row level security;

create policy posizioni_aperte_select on public.posizioni_aperte for select
  using (attiva = true or public.is_staff());
create policy posizioni_aperte_modifica on public.posizioni_aperte for all
  using (public.is_titolare()) with check (public.is_titolare());

-- Le candidature arrivano da visitatori anonimi tramite una Server Action
-- che usa la service-role key (validazione e limiti lato server): per
-- questo non c'e' nessuna policy di insert. Contengono dati personali, per
-- cui solo i titolari le leggono e le gestiscono.
create table public.candidature (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (
    tipo in ('personale', 'insegnante_esterno', 'masterclass', 'spontanea')
  ),
  posizione_id uuid references public.posizioni_aperte (id) on delete set null,
  nome text not null,
  cognome text not null,
  email text not null,
  telefono text,
  messaggio text,
  link_portfolio text,
  cv_path text,
  consenso_privacy boolean not null check (consenso_privacy = true),
  stato text not null default 'nuova' check (stato in ('nuova', 'in_valutazione', 'archiviata')),
  created_at timestamptz not null default now()
);

alter table public.candidature enable row level security;

create policy candidature_select on public.candidature for select
  using (public.is_titolare());
create policy candidature_update on public.candidature for update
  using (public.is_titolare()) with check (public.is_titolare());
create policy candidature_delete on public.candidature for delete
  using (public.is_titolare());

-- =========================================================
-- Storage
-- =========================================================
-- "sito": foto pubbliche di galleria e traguardi, caricate dallo staff.
insert into storage.buckets (id, name, public)
values ('sito', 'sito', true)
on conflict (id) do nothing;

create policy sito_foto_select on storage.objects for select
  using (bucket_id = 'sito');
create policy sito_foto_insert on storage.objects for insert
  with check (bucket_id = 'sito' and public.is_staff());
create policy sito_foto_update on storage.objects for update
  using (bucket_id = 'sito' and public.is_staff());
create policy sito_foto_delete on storage.objects for delete
  using (bucket_id = 'sito' and public.is_staff());

-- "candidature": privato. Upload solo via service-role, lettura con URL
-- firmati generati per i titolari.
insert into storage.buckets (id, name, public)
values ('candidature', 'candidature', false)
on conflict (id) do nothing;

create policy candidature_cv_select on storage.objects for select
  using (bucket_id = 'candidature' and public.is_titolare());
create policy candidature_cv_delete on storage.objects for delete
  using (bucket_id = 'candidature' and public.is_titolare());
