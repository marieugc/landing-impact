-- ─────────────────────────────────────────────────────────────
--  BOOTY FLOW — Bilan postural (bilan-postural/index.html)
--  À copier-coller en entier dans Supabase › SQL Editor › New query › Run.
--  À faire une seule fois, APRÈS schema.sql (il utilise la fonction est_coach()).
--
--  Les nouvelles élèves n'ont pas besoin de compte : elles peuvent ENVOYER
--  un bilan, mais seule la coach peut le LIRE, le marquer « vu » ou le supprimer.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.bilans_posturaux (
  id uuid primary key default gen_random_uuid(),
  prenom text not null check (char_length(prenom) between 1 and 80),
  email text check (email is null or char_length(email) <= 200),
  reponses jsonb not null default '{}'::jsonb check (pg_column_size(reponses) < 200000),
  fichiers jsonb not null default '[]'::jsonb check (pg_column_size(fichiers) < 50000),
  vu boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.bilans_posturaux enable row level security;

drop policy if exists "bilan postural envoi" on public.bilans_posturaux;
create policy "bilan postural envoi" on public.bilans_posturaux
  for insert to anon, authenticated with check (vu = false);

drop policy if exists "bilan postural lecture coach" on public.bilans_posturaux;
create policy "bilan postural lecture coach" on public.bilans_posturaux
  for select using (public.est_coach());

drop policy if exists "bilan postural modif coach" on public.bilans_posturaux;
create policy "bilan postural modif coach" on public.bilans_posturaux
  for update using (public.est_coach());

drop policy if exists "bilan postural suppression coach" on public.bilans_posturaux;
create policy "bilan postural suppression coach" on public.bilans_posturaux
  for delete using (public.est_coach());

grant insert on public.bilans_posturaux to anon, authenticated;
grant select, update, delete on public.bilans_posturaux to authenticated;

-- ─── Stockage privé des photos et vidéos du bilan (50 Mo max par fichier) ───
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bilans-posturaux', 'bilans-posturaux', false, 52428800, array['image/*', 'video/*'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "bilan postural fichiers envoi" on storage.objects;
create policy "bilan postural fichiers envoi" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'bilans-posturaux');

drop policy if exists "bilan postural fichiers lecture coach" on storage.objects;
create policy "bilan postural fichiers lecture coach" on storage.objects
  for select using (bucket_id = 'bilans-posturaux' and public.est_coach());

drop policy if exists "bilan postural fichiers suppression coach" on storage.objects;
create policy "bilan postural fichiers suppression coach" on storage.objects
  for delete using (bucket_id = 'bilans-posturaux' and public.est_coach());
