-- Open Dance: schema iniziale + RLS.
-- Tutti gli utenti autenticati condividono il ruolo Postgres "authenticated":
-- lo scoping per ruolo applicativo (staff/insegnante/genitore/allievo) e' quindi
-- interamente delegato alle policy RLS sottostanti, non ai permessi Postgres.

create extension if not exists "pgcrypto";

create type ruolo_enum as enum ('admin', 'staff', 'insegnante', 'genitore', 'allievo_adulto');
create type iscrizione_stato_enum as enum ('richiesta', 'attiva', 'sospesa', 'terminata');
create type lezione_stato_enum as enum ('regolare', 'annullata', 'recuperata');
create type presenza_stato_enum as enum ('presente', 'assente', 'giustificato');
create type pagamento_tipo_enum as enum ('quota_corso', 'iscrizione_annuale', 'saggio', 'altro');
create type pagamento_metodo_enum as enum ('contanti', 'bonifico', 'pos', 'altro');
create type pagamento_stato_enum as enum ('da_pagare', 'parziale', 'pagato', 'scaduto');
create type consenso_tipo_enum as enum ('trattamento_dati', 'foto_video', 'newsletter');

-- =========================================================================
-- TABELLE
-- =========================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  cognome text not null default '',
  email text not null,
  telefono text,
  ruolo ruolo_enum not null default 'genitore',
  created_at timestamptz not null default now()
);

create table public.studenti (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cognome text not null,
  data_nascita date not null,
  codice_fiscale text,
  is_adulto boolean not null default false,
  genitore_id uuid references public.profiles (id) on delete set null,
  profilo_id uuid unique references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint studenti_un_solo_referente check (
    (genitore_id is not null and profilo_id is null)
    or (genitore_id is null and profilo_id is not null)
  )
);

-- Dati sensibili separati dall'anagrafica: solo lo staff puo' leggerli/scriverli,
-- indipendentemente da come l'app compone le query (vedi policy piu' sotto).
create table public.studenti_note_mediche (
  studente_id uuid primary key references public.studenti (id) on delete cascade,
  note text,
  updated_at timestamptz not null default now()
);

create table public.corsi (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descrizione text,
  categoria text,
  livello text,
  attivo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.classi (
  id uuid primary key default gen_random_uuid(),
  corso_id uuid not null references public.corsi (id) on delete cascade,
  insegnante_id uuid references public.profiles (id) on delete set null,
  giorno_settimana smallint not null check (giorno_settimana between 0 and 6),
  orario_inizio time not null,
  orario_fine time not null,
  sala text,
  capienza_max int,
  stagione text not null,
  attiva boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.lezioni (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid not null references public.classi (id) on delete cascade,
  data date not null,
  orario_inizio time,
  orario_fine time,
  stato lezione_stato_enum not null default 'regolare',
  created_at timestamptz not null default now(),
  unique (classe_id, data)
);

create table public.iscrizioni (
  id uuid primary key default gen_random_uuid(),
  studente_id uuid not null references public.studenti (id) on delete cascade,
  classe_id uuid not null references public.classi (id) on delete cascade,
  data_iscrizione date not null default current_date,
  stato iscrizione_stato_enum not null default 'richiesta',
  quota_concordata numeric(10, 2),
  note text,
  created_at timestamptz not null default now()
);

create unique index iscrizioni_attiva_unica
  on public.iscrizioni (studente_id, classe_id)
  where (stato = 'attiva');

create table public.presenze (
  id uuid primary key default gen_random_uuid(),
  lezione_id uuid not null references public.lezioni (id) on delete cascade,
  studente_id uuid not null references public.studenti (id) on delete cascade,
  stato presenza_stato_enum not null,
  segnato_da uuid references public.profiles (id) on delete set null,
  segnato_at timestamptz not null default now(),
  unique (lezione_id, studente_id)
);

create table public.pagamenti (
  id uuid primary key default gen_random_uuid(),
  studente_id uuid not null references public.studenti (id) on delete cascade,
  iscrizione_id uuid references public.iscrizioni (id) on delete set null,
  tipo pagamento_tipo_enum not null,
  importo_dovuto numeric(10, 2) not null,
  importo_pagato numeric(10, 2) not null default 0,
  data_scadenza date,
  data_pagamento date,
  metodo pagamento_metodo_enum,
  stato pagamento_stato_enum not null default 'da_pagare',
  note text,
  registrato_da uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.comunicazioni (
  id uuid primary key default gen_random_uuid(),
  titolo text not null,
  corpo text not null,
  autore_id uuid not null references public.profiles (id) on delete cascade,
  pubblicato_at timestamptz,
  created_at timestamptz not null default now()
);

-- Nessuna riga per una comunicazione = visibile a tutti.
create table public.comunicazioni_target (
  id uuid primary key default gen_random_uuid(),
  comunicazione_id uuid not null references public.comunicazioni (id) on delete cascade,
  classe_id uuid references public.classi (id) on delete cascade,
  corso_id uuid references public.corsi (id) on delete cascade,
  ruolo ruolo_enum,
  constraint comunicazioni_target_un_criterio check (
    (case when classe_id is not null then 1 else 0 end
      + case when corso_id is not null then 1 else 0 end
      + case when ruolo is not null then 1 else 0 end) = 1
  )
);

create table public.letture_comunicazioni (
  comunicazione_id uuid not null references public.comunicazioni (id) on delete cascade,
  profilo_id uuid not null references public.profiles (id) on delete cascade,
  letta_at timestamptz not null default now(),
  primary key (comunicazione_id, profilo_id)
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profilo_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.documenti (
  id uuid primary key default gen_random_uuid(),
  studente_id uuid not null references public.studenti (id) on delete cascade,
  tipo text not null,
  file_path text not null,
  data_scadenza date,
  created_at timestamptz not null default now()
);

create table public.consensi_privacy (
  id uuid primary key default gen_random_uuid(),
  profilo_id uuid not null references public.profiles (id) on delete cascade,
  studente_id uuid references public.studenti (id) on delete cascade,
  tipo_consenso consenso_tipo_enum not null,
  concesso boolean not null,
  data timestamptz not null default now(),
  versione_informativa text not null
);

-- =========================================================================
-- FUNZIONI HELPER (security definer: bypassano la RLS delle tabelle che
-- interrogano internamente, evitando ricorsione tra policy e tabelle correlate)
-- =========================================================================

create function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and ruolo in ('admin', 'staff')
  );
$$;

create function public.my_studenti_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.studenti
  where genitore_id = auth.uid() or profilo_id = auth.uid();
$$;

create function public.my_classi_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.classi where insegnante_id = auth.uid();
$$;

create function public.can_see_comunicazione(comm_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_staff()
    or (
      exists (select 1 from public.comunicazioni c where c.id = comm_id and c.pubblicato_at is not null)
      and (
        not exists (select 1 from public.comunicazioni_target t where t.comunicazione_id = comm_id)
        or exists (
          select 1 from public.comunicazioni_target t
          where t.comunicazione_id = comm_id
          and (
            t.ruolo = (select ruolo from public.profiles where id = auth.uid())
            or t.classe_id in (select id from public.my_classi_ids())
            or t.classe_id in (
              select i.classe_id from public.iscrizioni i
              where i.studente_id in (select id from public.my_studenti_ids()) and i.stato = 'attiva'
            )
            or t.corso_id in (
              select cl.corso_id from public.classi cl
              join public.iscrizioni i on i.classe_id = cl.id
              where i.studente_id in (select id from public.my_studenti_ids()) and i.stato = 'attiva'
            )
          )
        )
      )
    );
$$;

-- Impedisce che un utente si assegni da solo un ruolo diverso (privilege escalation).
create function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() e' null per le chiamate con la service-role key (es. la rotta
  -- di invito staff): quelle bypassano volutamente questo controllo.
  if new.ruolo is distinct from old.ruolo and auth.uid() is not null and not public.is_staff() then
    raise exception 'Non puoi modificare il tuo ruolo.';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- Crea automaticamente il profilo alla registrazione. Il ruolo e' forzato a
-- genitore/allievo_adulto: i ruoli staff/insegnante sono assegnati solo in un
-- secondo momento, server-side, dalla rotta di invito (service-role key).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, cognome, email, ruolo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', ''),
    coalesce(new.raw_user_meta_data ->> 'cognome', ''),
    new.email,
    case
      when new.raw_user_meta_data ->> 'ruolo' = 'allievo_adulto' then 'allievo_adulto'::ruolo_enum
      else 'genitore'::ruolo_enum
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.studenti enable row level security;
alter table public.studenti_note_mediche enable row level security;
alter table public.corsi enable row level security;
alter table public.classi enable row level security;
alter table public.lezioni enable row level security;
alter table public.iscrizioni enable row level security;
alter table public.presenze enable row level security;
alter table public.pagamenti enable row level security;
alter table public.comunicazioni enable row level security;
alter table public.comunicazioni_target enable row level security;
alter table public.letture_comunicazioni enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.documenti enable row level security;
alter table public.consensi_privacy enable row level security;

-- profiles: ognuno vede/modifica il proprio profilo, lo staff vede/modifica tutti.
-- Nessuna policy di insert/delete: la riga nasce dal trigger on_auth_user_created.
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_staff());
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_staff());

-- studenti
create policy studenti_select on public.studenti for select
  using (
    public.is_staff()
    or genitore_id = auth.uid()
    or profilo_id = auth.uid()
    or id in (
      select i.studente_id from public.iscrizioni i
      where i.stato = 'attiva' and i.classe_id in (select id from public.my_classi_ids())
    )
  );
create policy studenti_insert on public.studenti for insert
  with check (public.is_staff() or genitore_id = auth.uid() or profilo_id = auth.uid());
create policy studenti_update on public.studenti for update
  using (public.is_staff() or genitore_id = auth.uid() or profilo_id = auth.uid());
create policy studenti_delete on public.studenti for delete
  using (public.is_staff());

-- studenti_note_mediche: SOLO staff, in nessun caso genitori o insegnanti.
create policy note_mediche_solo_staff on public.studenti_note_mediche for all
  using (public.is_staff()) with check (public.is_staff());

-- corsi: catalogo visibile a tutti gli utenti autenticati, gestito solo dallo staff.
create policy corsi_select on public.corsi for select using (true);
create policy corsi_modifica on public.corsi for all
  using (public.is_staff()) with check (public.is_staff());

-- classi: orario visibile a tutti, gestito solo dallo staff.
create policy classi_select on public.classi for select using (true);
create policy classi_modifica on public.classi for all
  using (public.is_staff()) with check (public.is_staff());

-- lezioni: visibili a tutti (calendario); annullamento anche da parte dell'insegnante.
create policy lezioni_select on public.lezioni for select using (true);
create policy lezioni_insert on public.lezioni for insert with check (public.is_staff());
create policy lezioni_update on public.lezioni for update
  using (public.is_staff() or classe_id in (select id from public.my_classi_ids()));
create policy lezioni_delete on public.lezioni for delete using (public.is_staff());

-- iscrizioni
create policy iscrizioni_select on public.iscrizioni for select
  using (
    public.is_staff()
    or studente_id in (select id from public.my_studenti_ids())
    or classe_id in (select id from public.my_classi_ids())
  );
create policy iscrizioni_insert on public.iscrizioni for insert
  with check (public.is_staff() or studente_id in (select id from public.my_studenti_ids()));
create policy iscrizioni_update on public.iscrizioni for update
  using (public.is_staff());
create policy iscrizioni_delete on public.iscrizioni for delete
  using (
    public.is_staff()
    or (studente_id in (select id from public.my_studenti_ids()) and stato = 'richiesta')
  );

-- presenze
create policy presenze_select on public.presenze for select
  using (
    public.is_staff()
    or studente_id in (select id from public.my_studenti_ids())
    or lezione_id in (select id from public.lezioni where classe_id in (select id from public.my_classi_ids()))
  );
create policy presenze_modifica on public.presenze for all
  using (
    public.is_staff()
    or lezione_id in (select id from public.lezioni where classe_id in (select id from public.my_classi_ids()))
  )
  with check (
    public.is_staff()
    or lezione_id in (select id from public.lezioni where classe_id in (select id from public.my_classi_ids()))
  );

-- pagamenti: nessun accesso per gli insegnanti (nessuna policy dedicata).
create policy pagamenti_select on public.pagamenti for select
  using (public.is_staff() or studente_id in (select id from public.my_studenti_ids()));
create policy pagamenti_modifica on public.pagamenti for all
  using (public.is_staff()) with check (public.is_staff());

-- comunicazioni
create policy comunicazioni_select on public.comunicazioni for select
  using (public.can_see_comunicazione(id));
create policy comunicazioni_insert on public.comunicazioni for insert
  with check (
    autore_id = auth.uid()
    and (public.is_staff() or exists (select 1 from public.profiles where id = auth.uid() and ruolo = 'insegnante'))
  );
create policy comunicazioni_update on public.comunicazioni for update
  using (public.is_staff() or autore_id = auth.uid());
create policy comunicazioni_delete on public.comunicazioni for delete
  using (public.is_staff() or autore_id = auth.uid());

create policy comunicazioni_target_select on public.comunicazioni_target for select
  using (public.can_see_comunicazione(comunicazione_id));
create policy comunicazioni_target_insert on public.comunicazioni_target for insert
  with check (
    public.is_staff()
    or classe_id in (select id from public.my_classi_ids())
  );
create policy comunicazioni_target_delete on public.comunicazioni_target for delete
  using (
    public.is_staff()
    or classe_id in (select id from public.my_classi_ids())
  );

-- letture_comunicazioni: ognuno segna/legge le proprie ricevute, lo staff vede tutte.
create policy letture_select on public.letture_comunicazioni for select
  using (public.is_staff() or profilo_id = auth.uid());
create policy letture_insert on public.letture_comunicazioni for insert
  with check (profilo_id = auth.uid() or public.is_staff());

-- push_subscriptions: ognuno gestisce le proprie sottoscrizioni.
create policy push_select on public.push_subscriptions for select
  using (public.is_staff() or profilo_id = auth.uid());
create policy push_modifica on public.push_subscriptions for all
  using (profilo_id = auth.uid()) with check (profilo_id = auth.uid());

-- documenti: staff completo, genitore/allievo solo i propri, insegnanti esclusi.
create policy documenti_select on public.documenti for select
  using (public.is_staff() or studente_id in (select id from public.my_studenti_ids()));
create policy documenti_modifica on public.documenti for all
  using (public.is_staff() or studente_id in (select id from public.my_studenti_ids()))
  with check (public.is_staff() or studente_id in (select id from public.my_studenti_ids()));

-- consensi_privacy
create policy consensi_select on public.consensi_privacy for select
  using (public.is_staff() or profilo_id = auth.uid());
create policy consensi_insert on public.consensi_privacy for insert
  with check (profilo_id = auth.uid() or public.is_staff());
create policy consensi_update on public.consensi_privacy for update
  using (profilo_id = auth.uid() or public.is_staff());
create policy consensi_delete on public.consensi_privacy for delete
  using (public.is_staff());
