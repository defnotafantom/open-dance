-- Separata dalla 0016 perche' aggiunta dopo che la 0016 era gia' stata
-- applicata.
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
