-- ─────────────────────────────────────────────────────────────
--  RAPPELS DE BILAN : programmation automatique
--  À exécuter UNE FOIS dans Supabase › SQL Editor, APRÈS avoir créé
--  la fonction « rappels-bilans » et ses secrets (voir GUIDE.md).
--
--  Remplace TON-SECRET-RAPPELS par la valeur du secret RAPPELS_SECRET.
-- ─────────────────────────────────────────────────────────────

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Toutes les heures le dimanche et le lundi : la fonction n'envoie que
-- le dimanche à 18 h et le lundi à 9 h (heure de Paris, été comme hiver).
select cron.unschedule('rappels-bilans') where exists (select 1 from cron.job where jobname = 'rappels-bilans');
select cron.schedule('rappels-bilans', '0 * * * 0,1', $$
  select net.http_post(
    url := 'https://ubenkqedyjrdeyetzzet.supabase.co/functions/v1/rappels-bilans',
    headers := '{"Content-Type": "application/json", "x-rappels-secret": "TON-SECRET-RAPPELS"}'::jsonb,
    body := '{"moment": "auto"}'::jsonb
  );
$$);

-- ─── Pour tester tout de suite (notification d'essai à tous les téléphones abonnés) ───
-- select net.http_post(
--   url := 'https://ubenkqedyjrdeyetzzet.supabase.co/functions/v1/rappels-bilans',
--   headers := '{"Content-Type": "application/json", "x-rappels-secret": "TON-SECRET-RAPPELS"}'::jsonb,
--   body := '{"moment": "test"}'::jsonb
-- );
-- Résultat de l'essai (quelques secondes après) :
-- select status_code, content from net._http_response order by created desc limit 1;
