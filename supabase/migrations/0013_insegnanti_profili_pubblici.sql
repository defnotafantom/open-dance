-- Pagina pubblica "Gli insegnanti": dati editoriali (bio, carriera, foto)
-- separati da public.profiles perche' quest'ultima contiene email/telefono
-- che non devono mai essere leggibili senza autenticazione. Solo questa
-- tabella e' pensata per essere letta da visitatori non autenticati.

create table public.insegnanti_profili (
  profilo_id uuid primary key references public.profiles (id) on delete cascade,
  bio text,
  carriera text,
  specializzazioni text,
  anni_esperienza integer,
  foto_path text,
  pubblicato boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.insegnanti_profili enable row level security;

-- Pubblico: solo i profili pubblicati. L'insegnante vede sempre il proprio
-- (anche in bozza), lo staff vede tutto per poter aiutare a compilarli.
create policy insegnanti_profili_select on public.insegnanti_profili for select
  using (pubblicato = true or profilo_id = auth.uid() or public.is_staff());

-- L'insegnante modifica solo il proprio; i titolari possono compilarlo per
-- conto di chi non e' a suo agio a farlo da solo.
create policy insegnanti_profili_insert on public.insegnanti_profili for insert
  with check (profilo_id = auth.uid() or public.is_titolare());
create policy insegnanti_profili_update on public.insegnanti_profili for update
  using (profilo_id = auth.uid() or public.is_titolare())
  with check (profilo_id = auth.uid() or public.is_titolare());
create policy insegnanti_profili_delete on public.insegnanti_profili for delete
  using (public.is_titolare());

-- Bucket pubblico per le foto profilo: a differenza di "documenti" (privato,
-- con URL firmati), qui serve un URL pubblico stabile per la pagina "about".
insert into storage.buckets (id, name, public)
values ('insegnanti', 'insegnanti', true)
on conflict (id) do nothing;

-- Convenzione path: <profilo_id>/<nome-file>, come per il bucket documenti.
create policy insegnanti_foto_select on storage.objects for select
  using (bucket_id = 'insegnanti');

create policy insegnanti_foto_insert on storage.objects for insert
  with check (
    bucket_id = 'insegnanti'
    and (
      public.is_titolare()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy insegnanti_foto_update on storage.objects for update
  using (
    bucket_id = 'insegnanti'
    and (
      public.is_titolare()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy insegnanti_foto_delete on storage.objects for delete
  using (
    bucket_id = 'insegnanti'
    and (
      public.is_titolare()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );
