-- Fix: le policy storage create in 0002_storage_documenti.sql usano
-- "select id from public.my_studenti_ids()", ma la funzione ritorna un
-- semplice setof uuid (nessuna colonna letteralmente chiamata "id"). Nel
-- contesto di storage.objects (che ha una propria colonna "id"), Postgres
-- risolve quell'"id" nudo come riferimento alla colonna esterna invece di
-- segnalare errore, con lo stesso bug gia' corretto in 0001_init.sql per le
-- policy sulle tabelle applicative. Qui va corretto con una migrazione
-- separata perche' 0002 e' gia' stata applicata.

drop policy if exists documenti_storage_select on storage.objects;
drop policy if exists documenti_storage_insert on storage.objects;
drop policy if exists documenti_storage_delete on storage.objects;

create policy documenti_storage_select on storage.objects for select
  using (
    bucket_id = 'documenti'
    and (
      public.is_staff()
      or (storage.foldername(name))[1]::uuid in (select * from public.my_studenti_ids())
    )
  );

create policy documenti_storage_insert on storage.objects for insert
  with check (
    bucket_id = 'documenti'
    and (
      public.is_staff()
      or (storage.foldername(name))[1]::uuid in (select * from public.my_studenti_ids())
    )
  );

create policy documenti_storage_delete on storage.objects for delete
  using (
    bucket_id = 'documenti'
    and (
      public.is_staff()
      or (storage.foldername(name))[1]::uuid in (select * from public.my_studenti_ids())
    )
  );
