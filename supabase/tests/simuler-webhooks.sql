-- ─────────────────────────────────────────────────────────────
--  SIMULER LES WEBHOOKS SYSTEME.IO (sans payer)
--  Supabase › SQL Editor › New query. Lance les blocs UN PAR UN (sélectionne le bloc, puis Run).
--
--  AVANT : dans Edge Functions › Secrets, mets SYSTEMEIO_FILTRE_IP = non
--          (ces essais partent des serveurs de Supabase, pas de ceux de Systeme.io).
--  APRÈS : remets SYSTEMEIO_FILTRE_IP = oui.
--
--  Remplace partout :
--    TON-SECRET         → la valeur de SYSTEMEIO_WEBHOOK_SECRET
--    123456             → l'identifiant de ton offre (SYSTEMEIO_OFFER_ID)
--    ton.adresse+test@gmail.com → une adresse de test où tu reçois les e-mails
--      (astuce Gmail : ajoute +test avant le @ de ton adresse, tu reçois tout dans ta boîte habituelle)
-- ─────────────────────────────────────────────────────────────

-- ═══ 1. « New sale » : achat de Booty Flow App ═══
-- Attendu : un compte App est créé et l'e-mail de bienvenue arrive sur l'adresse de test.
-- (La date de commande est fixe pour que le bloc 3 envoie exactement le même webhook. Si elle date de plus
--  de 40 jours, la date du jour est prise à la place.)
select net.http_post(
  url := 'https://ubenkqedyjrdeyetzzet.supabase.co/functions/v1/webhook-systemeio?secret=TON-SECRET',
  headers := '{"Content-Type": "application/json", "X-Webhook-Event": "SALE_NEW"}'::jsonb,
  body := jsonb_build_object(
    'type', 'SALE_NEW',
    'data', jsonb_build_object(
      'customer', jsonb_build_object('id', 11112222, 'email', 'ton.adresse+test@gmail.com',
                                     'fields', jsonb_build_object('first_name', 'Camille')),
      'offer_price_plan', jsonb_build_object('id', 123456, 'name', 'Booty Flow App'),
      'order', jsonb_build_object('id', 98765432, 'created_at', '2026-11-18T10:00:00Z')
    )
  )
);

-- ═══ 2. Résultat (attendre 5 secondes) ═══
select recu_le, evenement, email, statut, message from public.webhooks_systemeio order by recu_le desc limit 5;
select email, formule, statut_abonnement, compte_valide, dernier_paiement, fin_acces
from public.profiles where email = 'ton.adresse+test@gmail.com';

-- ═══ 3. Relance le bloc 1 À L'IDENTIQUE ═══
-- Attendu : aucun nouveau compte, aucun nouvel e-mail (le journal ne grandit pas : même contenu = doublon).

-- ═══ 4. « Sale canceled » : résiliation ═══
-- Attendu : statut « resilie », la date de fin d'accès ne bouge pas, l'accès reste ouvert dans l'app.
select net.http_post(
  url := 'https://ubenkqedyjrdeyetzzet.supabase.co/functions/v1/webhook-systemeio?secret=TON-SECRET',
  headers := '{"Content-Type": "application/json", "X-Webhook-Event": "SALE_CANCELED"}'::jsonb,
  body := jsonb_build_object(
    'type', 'SALE_CANCELED',
    'data', jsonb_build_object(
      'customer', jsonb_build_object('id', 11112222, 'email', 'ton.adresse+test@gmail.com'),
      'offer_price_plan', jsonb_build_object('id', 123456, 'name', 'Booty Flow App'),
      'order', jsonb_build_object('id', 98765432)
    )
  )
);
-- Puis relance le bloc 2.

-- ═══ 5. Fin d'accès : on fait comme si la période payée était terminée ═══
-- Attendu : statut « expire », l'app affiche « Ton abonnement Booty Flow App est terminé ».
update public.profiles set fin_acces = now() - interval '1 day' where email = 'ton.adresse+test@gmail.com';
select public.expirer_abonnements();   -- renvoie le nombre de comptes passés en « expire »
-- Puis relance le bloc 2.

-- ═══ 6. Réabonnement : relance le bloc 1 en changeant le numéro de commande (98765432 → 98765433) ═══
--       et la date de commande par la date d'aujourd'hui
-- Attendu : statut « actif », nouvelle date de fin dans un mois, pas de nouvel e-mail de bienvenue.

-- ═══ 7. Ménage après les essais ═══
-- Supprime le compte de test (Authentication › Users › … › Delete user), puis :
-- delete from public.webhooks_systemeio where email = 'ton.adresse+test@gmail.com';

-- En cas de souci : la réponse brute de la fonction au dernier essai
-- select status_code, content from net._http_response order by created desc limit 3;
