-- Eventi della scuola (saggi, spettacoli, giornate porte aperte...).
create table public.eventi (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data date not null,
  luogo text,
  descrizione text,
  created_at timestamptz not null default now()
);

alter table public.eventi enable row level security;

-- Visibile a chiunque sia autenticato (staff, insegnanti, famiglie).
create policy eventi_select on public.eventi for select using (true);
create policy eventi_modifica on public.eventi for all
  using (public.is_staff()) with check (public.is_staff());
