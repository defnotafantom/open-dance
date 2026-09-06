-- Conferma di presenza PROSPETTICA: la famiglia dichiara prima della lezione
-- se il figlio ci sara' o no, cosi' l'insegnante puo' prepararsi sapendo
-- quante persone aspettarsi. E' concettualmente distinta da "presenze"
-- (che l'insegnante compila durante/dopo la lezione con l'esito reale).

create table public.conferme_presenza (
  id uuid primary key default gen_random_uuid(),
  lezione_id uuid not null references public.lezioni (id) on delete cascade,
  studente_id uuid not null references public.studenti (id) on delete cascade,
  verra boolean not null,
  confermato_at timestamptz not null default now(),
  unique (lezione_id, studente_id)
);

alter table public.conferme_presenza enable row level security;

create policy conferme_presenza_select on public.conferme_presenza for select
  using (
    public.is_staff()
    or studente_id in (select * from public.my_studenti_ids())
    or lezione_id in (
      select id from public.lezioni where classe_id in (select * from public.my_classi_ids())
    )
  );

create policy conferme_presenza_insert on public.conferme_presenza for insert
  with check (public.is_staff() or studente_id in (select * from public.my_studenti_ids()));

create policy conferme_presenza_update on public.conferme_presenza for update
  using (public.is_staff() or studente_id in (select * from public.my_studenti_ids()));

create policy conferme_presenza_delete on public.conferme_presenza for delete
  using (public.is_staff() or studente_id in (select * from public.my_studenti_ids()));
