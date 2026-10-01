-- ─────────────────────────────────────────────────────────────
--  BOOTY FLOW — base de données
--  À copier-coller en entier dans Supabase › SQL Editor › New query › Run
--  (étape 3 du GUIDE.md). Tu ne le fais qu'une seule fois.
-- ─────────────────────────────────────────────────────────────

-- 1. Profils (une ligne par personne inscrite : élève ou coach)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  prenom text,
  role text not null default 'eleve' check (role in ('eleve', 'coach')),
  objectif text,
  semaine int not null default 1,
  semaines_total int not null default 12,
  competitrice boolean not null default false,
  message_coach text,
  prochain_bilan date,
  created_at timestamptz not null default now()
);

-- Crée automatiquement le profil quand une élève s'inscrit
create or replace function public.creer_profil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, prenom)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'prenom', split_part(new.email, '@', 1)));
  return new;
end $$;

drop trigger if exists quand_inscription on auth.users;
create trigger quand_inscription after insert on auth.users
  for each row execute function public.creer_profil();

-- Petite fonction pour savoir si la personne connectée est la coach
create or replace function public.est_coach()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'coach');
$$;

-- 2. Plan nutrition (un par élève)
create table if not exists public.nutrition (
  eleve_id uuid primary key references public.profiles on delete cascade,
  type_jour text default 'Jour entraînement',
  kcal int,
  proteines int,
  glucides int,
  lipides int,
  repas jsonb not null default '[]',
  ajustement text,
  ajustement_date date,
  pdf_chemin text,
  updated_at timestamptz not null default now()
);

-- 3. Vidéos envoyées (mouvement ou posing)
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null default auth.uid() references public.profiles on delete cascade,
  type text not null default 'mouvement' check (type in ('mouvement', 'posing')),
  exercice text not null,
  chemin text,
  statut text not null default 'a_corriger' check (statut in ('a_corriger', 'corrige')),
  retour text,
  retour_chemin text,
  corrige_le timestamptz,
  created_at timestamptz not null default now()
);

-- Vidéo de correction de la coach (ajoutée après la première version)
alter table public.videos add column if not exists retour_chemin text;

-- 4. Bilans hebdomadaires
create table if not exists public.bilans (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null default auth.uid() references public.profiles on delete cascade,
  date date not null default current_date,
  poids numeric,
  taille numeric,
  hanches numeric,
  cuisse numeric,
  ressenti text,
  photo_face text,
  photo_profil text,
  photo_dos text,
  lu boolean not null default false,
  created_at timestamptz not null default now()
);

-- 5. Compétition (pour les compétitrices)
create table if not exists public.competitions (
  eleve_id uuid primary key references public.profiles on delete cascade,
  nom text,
  categorie text,
  date_compet date,
  ville text,
  poses jsonb not null default '[]',
  checklist jsonb not null default '[]'
);

-- 6. Suivi des charges (musculation)
create table if not exists public.charges (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null default auth.uid() references public.profiles on delete cascade,
  exercice text not null,
  date date not null default current_date,
  poids numeric not null,
  series int,
  reps int,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists charges_eleve_exercice on public.charges (eleve_id, exercice, date);

-- ─── Sécurité : chaque élève ne voit QUE ses données, la coach voit tout ───
alter table public.profiles enable row level security;
alter table public.nutrition enable row level security;
alter table public.videos enable row level security;
alter table public.bilans enable row level security;
alter table public.competitions enable row level security;
alter table public.charges enable row level security;

drop policy if exists "profil lecture" on public.profiles;
create policy "profil lecture" on public.profiles for select using (id = auth.uid() or public.est_coach());
drop policy if exists "profil modif coach" on public.profiles;
create policy "profil modif coach" on public.profiles for update using (public.est_coach());

drop policy if exists "nutrition lecture" on public.nutrition;
create policy "nutrition lecture" on public.nutrition for select using (eleve_id = auth.uid() or public.est_coach());
drop policy if exists "nutrition coach" on public.nutrition;
create policy "nutrition coach" on public.nutrition for all using (public.est_coach()) with check (public.est_coach());

drop policy if exists "videos lecture" on public.videos;
create policy "videos lecture" on public.videos for select using (eleve_id = auth.uid() or public.est_coach());
drop policy if exists "videos envoi" on public.videos;
create policy "videos envoi" on public.videos for insert with check (eleve_id = auth.uid() and statut = 'a_corriger');
drop policy if exists "videos correction" on public.videos;
create policy "videos correction" on public.videos for update using (public.est_coach());

drop policy if exists "bilans lecture" on public.bilans;
create policy "bilans lecture" on public.bilans for select using (eleve_id = auth.uid() or public.est_coach());
drop policy if exists "bilans envoi" on public.bilans;
create policy "bilans envoi" on public.bilans for insert with check (eleve_id = auth.uid() and lu = false);
drop policy if exists "bilans coach" on public.bilans;
create policy "bilans coach" on public.bilans for update using (public.est_coach());

drop policy if exists "compet lecture" on public.competitions;
create policy "compet lecture" on public.competitions for select using (eleve_id = auth.uid() or public.est_coach());
drop policy if exists "compet coach" on public.competitions;
create policy "compet coach" on public.competitions for all using (public.est_coach()) with check (public.est_coach());
drop policy if exists "compet checklist eleve" on public.competitions;
create policy "compet checklist eleve" on public.competitions for update using (eleve_id = auth.uid());

drop policy if exists "charges lecture" on public.charges;
create policy "charges lecture" on public.charges for select using (eleve_id = auth.uid() or public.est_coach());
drop policy if exists "charges ajout" on public.charges;
create policy "charges ajout" on public.charges for insert with check (eleve_id = auth.uid());
drop policy if exists "charges suppression" on public.charges;
create policy "charges suppression" on public.charges for delete using (eleve_id = auth.uid());

-- ─── Stockage des vidéos, photos et PDF ───
insert into storage.buckets (id, name, public)
values ('medias', 'medias', false)
on conflict (id) do nothing;

-- Chaque élève range ses fichiers dans un dossier à son identifiant
drop policy if exists "medias envoi" on storage.objects;
create policy "medias envoi" on storage.objects for insert
  with check (bucket_id = 'medias' and ((storage.foldername(name))[1] = auth.uid()::text or public.est_coach()));
drop policy if exists "medias lecture" on storage.objects;
create policy "medias lecture" on storage.objects for select
  using (bucket_id = 'medias' and ((storage.foldername(name))[1] = auth.uid()::text or public.est_coach()));
drop policy if exists "medias remplacement coach" on storage.objects;
create policy "medias remplacement coach" on storage.objects for update
  using (bucket_id = 'medias' and public.est_coach());

-- ─────────────────────────────────────────────────────────────
--  DERNIÈRE ÉTAPE (après avoir créé TON compte dans l'app) :
--  remplace l'adresse ci-dessous par la tienne, puis exécute
--  uniquement cette ligne pour devenir coach :
--
--  update public.profiles set role = 'coach' where email = 'ton-adresse@exemple.com';
-- ─────────────────────────────────────────────────────────────
