-- Registri dell'ASD: soci con numero tessera, listino quote, incassi con
-- ricevuta numerata, uscite. Copre solo l'attivita' istituzionale verso i
-- soci (iscrizione e quote mensili): biglietti al pubblico, vestiti e
-- masterclass per esterni restano fuori finche' il commercialista non
-- conferma come trattarli.

-- =========================================================
-- Dati dell'ASD (intestazione delle ricevute)
-- =========================================================
alter table public.impostazioni_scuola
  add column denominazione_asd text,
  add column codice_fiscale_asd text,
  add column sede_legale text,
  add column numero_registro text;

-- =========================================================
-- Soci: numero tessera, attivita', stato
-- =========================================================
create sequence public.soci_numero_tessera_seq start 1;

alter table public.studenti
  add column numero_tessera integer unique default nextval('public.soci_numero_tessera_seq'),
  add column attivita text not null default 'danza'
    check (attivita in ('danza', 'fitness', 'entrambe')),
  add column data_tesseramento date not null default current_date,
  add column attivo boolean not null default true;

alter sequence public.soci_numero_tessera_seq owned by public.studenti.numero_tessera;

-- =========================================================
-- Listino: prezzi di iscrizione e mensile, inseriti a mano dallo staff
-- =========================================================
create table public.tariffe (
  id uuid primary key default gen_random_uuid(),
  attivita text not null check (attivita in ('danza', 'fitness')),
  voce text not null check (voce in ('iscrizione', 'mensile')),
  stagione text not null,
  importo numeric(10, 2) not null check (importo >= 0),
  updated_at timestamptz not null default now(),
  unique (attivita, voce, stagione)
);

alter table public.tariffe enable row level security;

create policy tariffe_staff on public.tariffe for all
  using (public.is_staff()) with check (public.is_staff());

-- =========================================================
-- Quote: il mese di competenza, per non generare due volte lo stesso mese
-- =========================================================
alter table public.pagamenti add column competenza date;

create unique index pagamenti_quota_mensile_unica
  on public.pagamenti (studente_id, competenza)
  where tipo = 'quota_corso' and competenza is not null;

-- =========================================================
-- Incassi (versamenti) con ricevuta numerata per anno
-- =========================================================
-- Un pagamento e' quanto e' dovuto; i versamenti sono i soldi ricevuti,
-- anche in piu' volte. Ogni versamento ha la sua ricevuta. I versamenti
-- non si cancellano: si annullano, cosi' la numerazione resta continua.
create table public.versamenti (
  id uuid primary key default gen_random_uuid(),
  pagamento_id uuid not null references public.pagamenti (id) on delete restrict,
  anno integer not null,
  numero integer not null,
  importo numeric(10, 2) not null check (importo > 0),
  data date not null default current_date,
  metodo pagamento_metodo_enum not null,
  pagatore_nome text not null,
  pagatore_codice_fiscale text,
  causale text not null,
  note text,
  annullato boolean not null default false,
  motivo_annullamento text,
  registrato_da uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (anno, numero)
);

alter table public.versamenti enable row level security;

create policy versamenti_select on public.versamenti for select
  using (public.is_staff());
create policy versamenti_insert on public.versamenti for insert
  with check (public.is_staff());
-- Solo l'annullamento (nessuna policy di delete).
create policy versamenti_update on public.versamenti for update
  using (public.is_staff()) with check (public.is_staff());

-- Numero progressivo per anno, assegnato dal database (mai dal browser).
create function public.assegna_numero_ricevuta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.anno := extract(year from new.data)::integer;
  perform pg_advisory_xact_lock(hashtext('ricevute_' || new.anno));
  select coalesce(max(numero), 0) + 1 into new.numero
  from public.versamenti
  where anno = new.anno;
  return new;
end;
$$;

create trigger versamenti_numero
  before insert on public.versamenti
  for each row execute function public.assegna_numero_ricevuta();

-- Una ricevuta emessa non cambia: si puo' solo annullare.
create function public.blocca_modifica_ricevuta()
returns trigger
language plpgsql
as $$
begin
  if old.annullato then
    raise exception 'Ricevuta gia'' annullata.';
  end if;
  if new.importo is distinct from old.importo
     or new.data is distinct from old.data
     or new.metodo is distinct from old.metodo
     or new.pagatore_nome is distinct from old.pagatore_nome
     or new.causale is distinct from old.causale
     or new.numero is distinct from old.numero
     or new.anno is distinct from old.anno
     or new.pagamento_id is distinct from old.pagamento_id then
    raise exception 'Una ricevuta emessa non si modifica: annullala e registrane una nuova.';
  end if;
  return new;
end;
$$;

create trigger versamenti_immutabili
  before update on public.versamenti
  for each row execute function public.blocca_modifica_ricevuta();

-- Il pagamento si aggiorna da solo in base ai versamenti validi.
create function public.ricalcola_pagamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := coalesce(new.pagamento_id, old.pagamento_id);
  totale numeric(10, 2);
  ultima_data date;
  ultimo_metodo pagamento_metodo_enum;
begin
  select coalesce(sum(importo), 0) into totale
  from public.versamenti where pagamento_id = pid and not annullato;

  -- Se non ci sono versamenti validi le due variabili restano null.
  select data, metodo into ultima_data, ultimo_metodo
  from public.versamenti where pagamento_id = pid and not annullato
  order by data desc, created_at desc limit 1;

  update public.pagamenti p set
    importo_pagato = totale,
    data_pagamento = ultima_data,
    metodo = coalesce(ultimo_metodo, p.metodo),
    stato = case
      when totale >= p.importo_dovuto then 'pagato'::pagamento_stato_enum
      when totale > 0 then 'parziale'::pagamento_stato_enum
      when p.data_scadenza < current_date then 'scaduto'::pagamento_stato_enum
      else 'da_pagare'::pagamento_stato_enum
    end
  where p.id = pid;
  return null;
end;
$$;

create trigger versamenti_ricalcola
  after insert or update on public.versamenti
  for each row execute function public.ricalcola_pagamento();

-- Gli importi gia' segnati come pagati prima dei registri diventano
-- versamenti, cosi' i totali restano coerenti.
insert into public.versamenti (pagamento_id, importo, data, metodo, pagatore_nome, causale, note)
select
  p.id,
  p.importo_pagato,
  coalesce(p.data_pagamento, p.created_at::date),
  coalesce(p.metodo, 'altro'),
  s.nome || ' ' || s.cognome,
  'Quota associativa',
  'Importato dai pagamenti registrati prima dei registri'
from public.pagamenti p
join public.studenti s on s.id = p.studente_id
where p.importo_pagato > 0;

-- =========================================================
-- Uscite (per il rendiconto annuale)
-- =========================================================
create table public.uscite (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  categoria text not null,
  descrizione text not null,
  importo numeric(10, 2) not null check (importo > 0),
  metodo pagamento_metodo_enum not null,
  note text,
  registrato_da uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.uscite enable row level security;

create policy uscite_staff on public.uscite for all
  using (public.is_staff()) with check (public.is_staff());
