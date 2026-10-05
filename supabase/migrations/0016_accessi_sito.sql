-- Sito chiuso al pubblico: chi conosce il codice chiede l'accesso, un
-- titolare lo approva (o lo nega, o lo revoca in seguito). Il visitatore
-- tiene nel cookie solo un token casuale; il permesso vive qui, quindi una
-- revoca vale subito.

create table public.accessi_sito (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  nome text not null,
  ip text,
  user_agent text,
  stato text not null default 'in_attesa'
    check (stato in ('in_attesa', 'approvato', 'negato', 'revocato')),
  scade_at timestamptz,
  deciso_at timestamptz,
  deciso_da uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index accessi_sito_ip_recenti on public.accessi_sito (ip, created_at);

alter table public.accessi_sito enable row level security;

-- Le richieste le crea solo il server (service-role); le vedono e le
-- decidono solo i titolari.
create policy accessi_sito_select on public.accessi_sito for select
  using (public.is_titolare());
create policy accessi_sito_update on public.accessi_sito for update
  using (public.is_titolare()) with check (public.is_titolare());

-- Unica cosa che un visitatore anonimo puo' chiedere: "il mio token e'
-- approvato e non scaduto?". Non rivela nient'altro.
create function public.accesso_sito_stato(p_token text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case
    when stato = 'approvato' and (scade_at is null or scade_at > now()) then 'approvato'
    when stato = 'approvato' then 'scaduto'
    else stato
  end
  from public.accessi_sito
  where token = p_token;
$$;

grant execute on function public.accesso_sito_stato(text) to anon, authenticated;

-- Le notifiche di accesso vanno solo al webmaster. Finche' il webmaster non
-- ha nessun dispositivo con le notifiche attive, il login resta raggiungibile
-- anche a sito chiuso, cosi' puo' entrare e attivarle (altrimenti nessuno
-- potrebbe mai approvare la prima richiesta).
create function public.webmaster_ha_notifiche()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.push_subscriptions ps
    join public.profiles p on p.id = ps.profilo_id
    where p.ruolo = 'webmaster'
  );
$$;

grant execute on function public.webmaster_ha_notifiche() to anon, authenticated;
