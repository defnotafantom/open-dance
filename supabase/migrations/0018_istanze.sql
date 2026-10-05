-- Istanze: registri liberi con un nome (es. "ABITI CONCORSO"), una data di
-- creazione presa dall'orologio del server, una scadenza o nessuna, e per
-- ogni alunno quanto deve, quanto ha versato e quanto va restituito.
-- Riusano pagamenti (il dovuto) e versamenti (gli incassi con ricevuta);
-- i rimborsi registrano le restituzioni delle eccedenze.

create table public.istanze (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descrizione text,
  importo_predefinito numeric(10, 2) check (importo_predefinito >= 0),
  scadenza date,
  chiusa boolean not null default false,
  creato_da uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.istanze enable row level security;

-- Un'istanza con delle voci non si cancella (si chiude).
alter table public.pagamenti
  add column istanza_id uuid references public.istanze (id) on delete restrict,
  add column importo_rimborsato numeric(10, 2) not null default 0;

create index pagamenti_istanza on public.pagamenti (istanza_id);


create policy istanze_staff on public.istanze for all
  using (public.is_staff()) with check (public.is_staff());

-- Le famiglie vedono il nome delle istanze che riguardano i propri figli.
create policy istanze_famiglie on public.istanze for select
  using (
    exists (
      select 1 from public.pagamenti p
      where p.istanza_id = istanze.id
        and p.studente_id in (select * from public.my_studenti_ids())
    )
  );

-- =========================================================
-- Rimborsi (restituzione di quanto versato in piu')
-- =========================================================
create table public.rimborsi (
  id uuid primary key default gen_random_uuid(),
  pagamento_id uuid not null references public.pagamenti (id) on delete restrict,
  importo numeric(10, 2) not null check (importo > 0),
  data date not null default current_date,
  metodo pagamento_metodo_enum not null,
  beneficiario text not null,
  note text,
  annullato boolean not null default false,
  motivo_annullamento text,
  registrato_da uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.rimborsi enable row level security;

create policy rimborsi_select on public.rimborsi for select using (public.is_staff());
create policy rimborsi_insert on public.rimborsi for insert with check (public.is_staff());
create policy rimborsi_update on public.rimborsi for update
  using (public.is_staff()) with check (public.is_staff());

create function public.ricalcola_rimborsi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid := coalesce(new.pagamento_id, old.pagamento_id);
begin
  update public.pagamenti set importo_rimborsato = (
    select coalesce(sum(importo), 0) from public.rimborsi
    where pagamento_id = pid and not annullato
  )
  where id = pid;
  return null;
end;
$$;

create trigger rimborsi_ricalcola
  after insert or update on public.rimborsi
  for each row execute function public.ricalcola_rimborsi();
