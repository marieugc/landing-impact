-- ─────────────────────────────────────────────────────────────
--  BOOTY FLOW APP — WEBHOOK SYSTEME.IO (étape 2)
--  À lancer APRÈS supabase/formules.sql : Supabase › SQL Editor › New query › Run.
--  On peut le relancer sans risque.
-- ─────────────────────────────────────────────────────────────

-- 1. Journal de TOUS les webhooks reçus, avec leur contenu brut
--    (pour vérifier la vraie structure des données envoyées par Systeme.io)
create table if not exists public.webhooks_systemeio (
  id uuid primary key default gen_random_uuid(),
  recu_le timestamptz not null default now(),
  cle text not null unique,           -- empreinte du contenu : un même webhook reçu deux fois n'est traité qu'une fois
  evenement text,                     -- vente, annulation ou inconnu
  email text,
  ip text,
  entetes jsonb not null default '{}',
  contenu jsonb,                      -- le contenu brut envoyé par Systeme.io
  statut text not null default 'en_cours' check (statut in ('en_cours', 'traite', 'ignore', 'erreur', 'refuse')),
  message text,                       -- ce qui a été fait (ou pourquoi c'est ignoré)
  profil_id uuid references public.profiles on delete set null,
  traite_le timestamptz
);
create index if not exists webhooks_systemeio_recu on public.webhooks_systemeio (recu_le desc);
create index if not exists webhooks_systemeio_email on public.webhooks_systemeio (lower(email));

-- Seule la coach peut lire ce journal (la fonction du webhook écrit avec la clé serveur)
alter table public.webhooks_systemeio enable row level security;
drop policy if exists "webhooks lecture coach" on public.webhooks_systemeio;
create policy "webhooks lecture coach" on public.webhooks_systemeio for select using (public.est_coach());

-- 2. Fin d'accès : les abonnements résiliés dont la période payée est finie passent en « expire ».
--    Les abonnements actifs non renouvelés aussi, 3 jours après leur date de fin
--    (même marge que dans l'app : supabase/formules.sql et app/js/formules.js).
create or replace function public.expirer_abonnements()
returns int language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  update public.profiles set statut_abonnement = 'expire'
  where formule = 'app' and fin_acces is not null and (
    (statut_abonnement = 'resilie' and fin_acces <= now())
    or (statut_abonnement = 'actif' and fin_acces + interval '3 days' <= now())
  );
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.expirer_abonnements() from anon, authenticated;

-- Tous les jours à 3 h 05 (heure de Paris en hiver) : passage automatique en « expire »
create extension if not exists pg_cron;
select cron.unschedule('expirer-abonnements') where exists (select 1 from cron.job where jobname = 'expirer-abonnements');
select cron.schedule('expirer-abonnements', '5 2 * * *', $$ select public.expirer_abonnements(); $$);

-- ─── Vérifications utiles ───
-- Les 20 derniers webhooks reçus :
--   select recu_le, evenement, email, statut, message from public.webhooks_systemeio order by recu_le desc limit 20;
-- Le contenu brut du dernier webhook :
--   select contenu, entetes, ip from public.webhooks_systemeio order by recu_le desc limit 1;
-- Lancer l'expiration tout de suite (renvoie le nombre de comptes passés en « expire ») :
--   select public.expirer_abonnements();
