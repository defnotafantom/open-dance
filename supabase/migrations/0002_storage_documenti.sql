-- Bucket privato per i documenti degli studenti (es. certificato medico).
-- Convenzione path: <studente_id>/<nome-file>, cosi' le policy possono
-- derivare il proprietario dal primo segmento del percorso.

insert into storage.buckets (id, name, public)
values ('documenti', 'documenti', false)
on conflict (id) do nothing;

create policy documenti_storage_select on storage.objects for select
  using (
    bucket_id = 'documenti'
    and (
      public.is_staff()
      or (storage.foldername(name))[1]::uuid in (select id from public.my_studenti_ids())
    )
  );

create policy documenti_storage_insert on storage.objects for insert
  with check (
    bucket_id = 'documenti'
    and (
      public.is_staff()
      or (storage.foldername(name))[1]::uuid in (select id from public.my_studenti_ids())
    )
  );

create policy documenti_storage_delete on storage.objects for delete
  using (
    bucket_id = 'documenti'
    and (
      public.is_staff()
      or (storage.foldername(name))[1]::uuid in (select id from public.my_studenti_ids())
    )
  );
