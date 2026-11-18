-- ─────────────────────────────────────────────────────────────
--  SAUVEGARDE DE LA BASE — à lancer AVANT chaque mise à jour
--  Supabase › SQL Editor › New query › coller tout › Run
--
--  Copie toutes les tables de l'app dans un dossier séparé « sauvegarde_AAAA_MM_JJ »
--  (date du jour). Rien n'est modifié dans tes vraies tables.
--  Les vidéos et photos (Storage) ne sont pas touchées par les mises à jour : pas besoin de les copier.
--
--  Pour vérifier : Table Editor › en haut à gauche, choisis le schéma « sauvegarde_… ».
--  Pour supprimer une vieille sauvegarde : drop schema sauvegarde_2026_11_18 cascade;
-- ─────────────────────────────────────────────────────────────

do $$
declare
  dossier text := 'sauvegarde_' || to_char(now() at time zone 'Europe/Paris', 'YYYY_MM_DD');
  t text;
  n bigint;
begin
  execute format('create schema if not exists %I', dossier);
  foreach t in array array[
    'profiles', 'nutrition', 'videos', 'bilans', 'competitions', 'charges', 'messages',
    'bibliotheque', 'programmes', 'abonnements_push', 'bilans_posturaux', 'parametres_notifications'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop table if exists %I.%I', dossier, t);
      execute format('create table %I.%I as table public.%I', dossier, t, t);
      execute format('select count(*) from %I.%I', dossier, t) into n;
      raise notice '% : % lignes sauvegardées', t, n;
    end if;
  end loop;
  -- Les comptes de connexion (adresse e-mail, date d'inscription) : copie de sécurité en lecture seule
  execute format('drop table if exists %I.comptes', dossier);
  execute format('create table %I.comptes as select id, email, created_at, last_sign_in_at, raw_user_meta_data from auth.users', dossier);
  -- Le dossier de sauvegarde n'est lisible par personne depuis l'app (seulement depuis Supabase)
  execute format('revoke all on schema %I from anon, authenticated', dossier);
end $$;

-- Résumé : nombre de lignes de chaque table sauvegardée aujourd'hui
select table_name as table_sauvegardee
from information_schema.tables
where table_schema = 'sauvegarde_' || to_char(now() at time zone 'Europe/Paris', 'YYYY_MM_DD')
order by 1;
