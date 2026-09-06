-- Migra eventuali righe esistenti sui nuovi valori (no-op su un database
-- ancora vuoto, ma corretto se qualcuno si e' gia' registrato).
update public.profiles set ruolo = 'proprietario' where ruolo = 'admin';
update public.profiles set ruolo = 'segretario' where ruolo = 'staff';
update public.profiles set ruolo = 'allievo' where ruolo in ('genitore', 'allievo_adulto');

-- is_staff(): accesso "da retrobottega" in generale (corsi, iscrizioni,
-- pagamenti, comunicazioni...). Sostituisce il precedente admin+staff.
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.ruolo in ('webmaster', 'proprietario', 'co_proprietario', 'segretario')
  );
$$;

-- is_titolare(): solo chi puo' invitare nuovo personale e fare le azioni piu'
-- delicate. Sostituisce il precedente controllo ruolo = 'admin'.
create function public.is_titolare()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.ruolo in ('webmaster', 'proprietario', 'co_proprietario')
  );
$$;

-- Il trigger di registrazione pubblica ora assegna sempre 'allievo': non
-- esiste piu' la scelta "genitore vs allievo maggiorenne" in fase di
-- iscrizione (un solo accesso puo' comunque contenere piu' iscritti, vedi
-- la tabella studenti). I ruoli di staff arrivano solo per invito, che
-- aggiorna il ruolo separatamente con la service-role key.
create or replace function public.handle_new_user()
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
    'allievo'
  );
  return new;
end;
$$;
