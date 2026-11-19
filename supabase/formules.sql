-- ─────────────────────────────────────────────────────────────
--  BOOTY FLOW — FORMULES (Personnalisé, Autonomie, App) ET DROITS D'ACCÈS
--  Étape 1 de « Booty Flow App ».
--
--  ORDRE À RESPECTER :
--    1. lance supabase/sauvegarde.sql
--    2. fusionne la mise à jour de l'app (pull request) sur GitHub
--    3. lance CE fichier en entier : Supabase › SQL Editor › New query › Run
--  On peut le relancer sans risque : il ne supprime aucune donnée.
--
--  Ce que ça change pour tes élèves actuelles : RIEN. Elles passent toutes en
--  « personnalise », statut « actif », compte validé, avec exactement les mêmes accès.
-- ─────────────────────────────────────────────────────────────

-- 1. Nouveaux champs sur chaque compte
alter table public.profiles add column if not exists formule text not null default 'personnalise';
alter table public.profiles add column if not exists statut_abonnement text not null default 'actif';
alter table public.profiles add column if not exists dernier_paiement timestamptz;
alter table public.profiles add column if not exists fin_acces timestamptz;
-- Compte validé par la coach. Les comptes existants sont validés (valeur true au moment de l'ajout).
alter table public.profiles add column if not exists compte_valide boolean not null default true;
alter table public.profiles add column if not exists derniere_activite timestamptz;
-- D'où vient le compte : inscription dans l'app, achat Systeme.io, ou créé par la coach
alter table public.profiles add column if not exists origine text not null default 'inscription';

alter table public.profiles drop constraint if exists profiles_formule_check;
alter table public.profiles add constraint profiles_formule_check check (formule in ('personnalise', 'autonomie', 'app'));
alter table public.profiles drop constraint if exists profiles_statut_abonnement_check;
alter table public.profiles add constraint profiles_statut_abonnement_check check (statut_abonnement in ('actif', 'resilie', 'expire'));

-- À partir de maintenant, un compte créé avec « Créer mon compte » attend ta validation
-- (les élèves actuelles ne sont pas concernées : elles sont déjà validées ci-dessus).
alter table public.profiles alter column compte_valide set default false;

-- 2. Qui a accès à quoi (mêmes règles que app/js/formules.js)
-- Accès ouvert : coach, ou compte validé dont l'abonnement n'est pas expiré.
-- Abonnée App : l'accès reste ouvert jusqu'à la date de fin payée (+ 3 jours de marge
-- tant que l'abonnement est actif, le temps que le paiement du mois suivant arrive).
create or replace function public.acces_ouvert(p_uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_uid and (
      p.role = 'coach' or (
        p.compte_valide
        and p.statut_abonnement <> 'expire'
        and (
          p.formule <> 'app'
          or p.fin_acces is null
          or now() < p.fin_acces + case when p.statut_abonnement = 'actif' then interval '3 days' else interval '0' end
        )
      )
    )
  );
$$;

-- Coaching (Personnalisé ou Autonomie) : plan perso, bilans, messagerie, corrections vidéo, posing
create or replace function public.acces_coaching()
returns boolean language sql stable security definer set search_path = public as $$
  select public.acces_ouvert(auth.uid()) and exists (
    select 1 from public.profiles where id = auth.uid() and role = 'eleve' and formule in ('personnalise', 'autonomie')
  );
$$;

-- Abonnée « app » avec un accès ouvert
create or replace function public.acces_app()
returns boolean language sql stable security definer set search_path = public as $$
  select public.acces_ouvert(auth.uid()) and exists (
    select 1 from public.profiles where id = auth.uid() and role = 'eleve' and formule = 'app'
  );
$$;

-- Dernière activité (liste des abonnées dans l'admin) : l'élève ne peut modifier que cette date
create or replace function public.marquer_activite()
returns void language sql security definer set search_path = public as $$
  update public.profiles set derniere_activite = now() where id = auth.uid();
$$;

-- 3. Règles de sécurité : les sections de coaching sont fermées aux comptes « app »
--    (et à tous les comptes en attente ou expirés), même en passant à côté de l'interface.

-- Plan nutrition personnalisé
drop policy if exists "nutrition lecture" on public.nutrition;
create policy "nutrition lecture" on public.nutrition for select
  using (public.est_coach() or (eleve_id = auth.uid() and public.acces_coaching()));

-- Corrections vidéo individuelles (mouvement et posing)
drop policy if exists "videos lecture" on public.videos;
create policy "videos lecture" on public.videos for select
  using (public.est_coach() or (eleve_id = auth.uid() and public.acces_coaching()));
drop policy if exists "videos envoi" on public.videos;
create policy "videos envoi" on public.videos for insert
  with check (eleve_id = auth.uid() and statut = 'a_corriger' and de_coach = false and public.acces_coaching());

-- Bilans
drop policy if exists "bilans lecture" on public.bilans;
create policy "bilans lecture" on public.bilans for select
  using (public.est_coach() or (eleve_id = auth.uid() and public.acces_coaching()));
drop policy if exists "bilans envoi" on public.bilans;
create policy "bilans envoi" on public.bilans for insert
  with check (eleve_id = auth.uid() and lu = false and public.acces_coaching());

-- Compétition / posing
drop policy if exists "compet lecture" on public.competitions;
create policy "compet lecture" on public.competitions for select
  using (public.est_coach() or (eleve_id = auth.uid() and public.acces_coaching()));
drop policy if exists "compet checklist eleve" on public.competitions;
create policy "compet checklist eleve" on public.competitions for update
  using (eleve_id = auth.uid() and public.acces_coaching());

-- Messagerie
drop policy if exists "messages lecture" on public.messages;
create policy "messages lecture" on public.messages for select
  using (public.est_coach() or (eleve_id = auth.uid() and public.acces_coaching()));
drop policy if exists "messages envoi" on public.messages;
create policy "messages envoi" on public.messages for insert with check (
  auteur_id = auth.uid() and lu = false and (
    (eleve_id = auth.uid() and de_coach = false and public.acces_coaching()) or (public.est_coach() and de_coach = true)
  )
);

-- Programmes d'entraînement personnalisés
drop policy if exists "programmes lecture" on public.programmes;
create policy "programmes lecture" on public.programmes for select
  using (public.est_coach() or (eleve_id = auth.uid() and public.acces_coaching()));

-- Suivi des charges : toutes les formules, tant que l'accès est ouvert
drop policy if exists "charges lecture" on public.charges;
create policy "charges lecture" on public.charges for select
  using (public.est_coach() or (eleve_id = auth.uid() and public.acces_ouvert()));
drop policy if exists "charges ajout" on public.charges;
create policy "charges ajout" on public.charges for insert
  with check (eleve_id = auth.uid() and public.acces_ouvert());
drop policy if exists "charges suppression" on public.charges;
create policy "charges suppression" on public.charges for delete
  using (eleve_id = auth.uid() and public.acces_ouvert());

-- Vidéothèque : toutes les formules, tant que l'accès est ouvert
drop policy if exists "bibliotheque lecture" on public.bibliotheque;
create policy "bibliotheque lecture" on public.bibliotheque for select using (public.acces_ouvert());
drop policy if exists "medias bibliotheque lecture" on storage.objects;
create policy "medias bibliotheque lecture" on storage.objects for select
  using (bucket_id = 'medias' and (storage.foldername(name))[1] = 'bibliotheque' and public.acces_ouvert());

-- Envoi de fichiers : seulement avec un accès ouvert
drop policy if exists "medias envoi" on storage.objects;
create policy "medias envoi" on storage.objects for insert
  with check (bucket_id = 'medias' and (
    public.est_coach() or ((storage.foldername(name))[1] = auth.uid()::text and public.acces_ouvert())
  ));

-- 4. Page « Passer au coaching » : contenu lisible UNIQUEMENT par les abonnées « app »
--    (une élève Personnalisé ou Autonomie ne reçoit rien, même en tapant l'adresse de la page)
create table if not exists public.offres (
  id text primary key,
  ordre int not null default 0,
  nom text not null,
  accroche text,
  inclus jsonb not null default '[]',
  non_inclus jsonb not null default '[]',
  prix text,                -- affiché uniquement pour l'offre App
  bouton text,              -- « Réserver mon Audit » pour les formules de coaching
  mise_en_avant boolean not null default false
);
alter table public.offres enable row level security;
drop policy if exists "offres lecture app" on public.offres;
create policy "offres lecture app" on public.offres for select using (public.est_coach() or public.acces_app());
drop policy if exists "offres coach" on public.offres;
create policy "offres coach" on public.offres for all using (public.est_coach()) with check (public.est_coach());

insert into public.offres (id, ordre, nom, accroche, inclus, non_inclus, prix, bouton, mise_en_avant) values
('personnalise', 1, 'Booty Flow Personnalisé', 'Je te suis de près, chaque semaine.',
  '["Programme d''entraînement 100 % personnalisé","Plan alimentaire personnalisé et ajusté","Bilan chaque semaine avec mon retour","Messagerie avec moi (écrit et vocal)","Corrections vidéo individuelles de tes exercices","Vidéothèque complète","Suivi des charges et de ta progression"]',
  '[]', null, 'Réserver mon Audit', true),
('autonomie', 2, 'Booty Flow Autonomie', 'Un plan sur mesure, un point chaque mois.',
  '["Programme d''entraînement 100 % personnalisé","Plan alimentaire personnalisé et ajusté","Bilan chaque mois avec mon retour","Messagerie avec moi (écrit et vocal)","Corrections vidéo individuelles de tes exercices","Vidéothèque complète","Suivi des charges et de ta progression"]',
  '["Bilan chaque semaine (1 bilan par mois)"]', null, 'Réserver mon Audit', false),
('app', 3, 'Booty Flow App', 'Ta formule actuelle : 100 % autonome.',
  '["Programmes préconçus de 12 semaines","Vidéothèque (exercices + mindset)","Calculateur nutrition et journées types","Suivi de progression (charges, mensurations, photos)","Bilan du mois avec ma réponse + 1 vidéo technique"]',
  '["Programme et plan alimentaire personnalisés","Bilan chaque semaine avec ta coach","Messagerie et suivi individuel","Corrections vidéo individuelles"]',
  '49,90 €/mois', null, false)
on conflict (id) do nothing;
