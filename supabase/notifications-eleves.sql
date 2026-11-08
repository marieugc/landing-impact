-- ─────────────────────────────────────────────────────────────
--  NOTIFICATIONS DES ÉLÈVES : la coach écrit un message, corrige
--  une vidéo (mouvement ou posing), envoie une vidéo ou commente
--  un bilan → notification sur le téléphone de l'élève.
--  À exécuter UNE FOIS dans Supabase › SQL Editor, APRÈS
--  supabase/notifications-coach.sql (qui crée parametres_notifications)
--  et après avoir redéployé la dernière version de la fonction.
-- ─────────────────────────────────────────────────────────────

create or replace function public.notifier_eleve() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  p public.parametres_notifications;
  evenement text;
  n jsonb := to_jsonb(new);
  o jsonb := case when TG_OP = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
begin
  if TG_TABLE_NAME = 'messages' then
    if (n ->> 'de_coach')::boolean then evenement := 'message'; end if;
  elsif TG_TABLE_NAME = 'videos' then
    if TG_OP = 'INSERT' and (n ->> 'de_coach')::boolean then evenement := 'video_coach';
    -- Première correction seulement (pas à chaque modification d'une correction déjà envoyée)
    elsif TG_OP = 'UPDATE' and n ->> 'statut' = 'corrige' and o ->> 'statut' is distinct from 'corrige'
      and not coalesce((n ->> 'de_coach')::boolean, false) then evenement := 'correction';
    end if;
  elsif TG_TABLE_NAME = 'bilans' then
    -- Premier retour de la coach sur ce bilan
    if TG_OP = 'UPDATE' and n ->> 'retour_le' is not null and o ->> 'retour_le' is null then evenement := 'bilan'; end if;
  end if;
  if evenement is null then return new; end if;

  select * into p from public.parametres_notifications where id = 1;
  if p.url is null then return new; end if;

  perform net.http_post(
    url := p.url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-rappels-secret', p.secret),
    body := jsonb_build_object('moment', 'eleve', 'evenement', evenement, 'ligne', n)
  );
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists notifier_eleve on public.messages;
create trigger notifier_eleve after insert on public.messages for each row execute function public.notifier_eleve();
drop trigger if exists notifier_eleve on public.videos;
create trigger notifier_eleve after insert or update of statut on public.videos for each row execute function public.notifier_eleve();
drop trigger if exists notifier_eleve on public.bilans;
create trigger notifier_eleve after update of retour_le on public.bilans for each row execute function public.notifier_eleve();
