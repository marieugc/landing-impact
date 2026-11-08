-- ─────────────────────────────────────────────────────────────
--  NOTIFICATIONS DE LA COACH : nouveau message, bilan, vidéo à
--  corriger (mouvement ou posing) et suivi des charges.
--  À exécuter UNE FOIS dans Supabase › SQL Editor, APRÈS avoir
--  déployé la dernière version de la fonction « rappels-bilans ».
--
--  Remplace TON-SECRET-RAPPELS par la valeur du secret RAPPELS_SECRET
--  (le même que dans supabase/rappels.sql).
-- ─────────────────────────────────────────────────────────────

create extension if not exists pg_net;

-- Adresse de la fonction et secret : rangés dans une table que personne ne peut lire depuis l'app
create table if not exists public.parametres_notifications (
  id int primary key default 1 check (id = 1),
  url text not null,
  secret text not null
);
alter table public.parametres_notifications enable row level security;
revoke all on public.parametres_notifications from anon, authenticated;

insert into public.parametres_notifications (url, secret)
values ('https://ubenkqedyjrdeyetzzet.supabase.co/functions/v1/rappels-bilans', 'TON-SECRET-RAPPELS')
on conflict (id) do update set url = excluded.url, secret = excluded.secret;

-- Prévient la fonction à chaque envoi d'une élève. Ne bloque jamais l'envoi, même en cas de souci.
create or replace function public.notifier_coach() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  p public.parametres_notifications;
begin
  -- Ce que la coach envoie elle-même ne la notifie pas (test séparé : bilans et charges n'ont pas de colonne de_coach)
  if TG_TABLE_NAME in ('messages', 'videos') then
    if (to_jsonb(new) ->> 'de_coach')::boolean then return new; end if;
  end if;
  -- Charges : une seule notification par séance (rien si l'élève a déjà noté une charge dans les 2 dernières heures)
  if TG_TABLE_NAME = 'charges' and exists (
    select 1 from public.charges c
    where c.eleve_id = new.eleve_id and c.id <> new.id and c.created_at > now() - interval '2 hours'
  ) then return new; end if;

  select * into p from public.parametres_notifications where id = 1;
  if p.url is null then return new; end if;

  perform net.http_post(
    url := p.url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-rappels-secret', p.secret),
    body := jsonb_build_object('moment', 'coach', 'table', TG_TABLE_NAME, 'ligne', to_jsonb(new))
  );
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists notifier_coach on public.messages;
create trigger notifier_coach after insert on public.messages for each row execute function public.notifier_coach();
drop trigger if exists notifier_coach on public.bilans;
create trigger notifier_coach after insert on public.bilans for each row execute function public.notifier_coach();
drop trigger if exists notifier_coach on public.videos;
create trigger notifier_coach after insert on public.videos for each row execute function public.notifier_coach();
drop trigger if exists notifier_coach on public.charges;
create trigger notifier_coach after insert on public.charges for each row execute function public.notifier_coach();

-- Pour vérifier après un essai (dernier appel envoyé à la fonction) :
-- select status_code, content from net._http_response order by created desc limit 1;
