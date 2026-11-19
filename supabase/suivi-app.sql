-- ─────────────────────────────────────────────────────────────
--  BOOTY FLOW APP — PESÉES ET AJUSTEMENT AUTOMATIQUE DU PLAN ALIMENTAIRE (étape 5)
--  À lancer APRÈS supabase/programmes-app.sql et supabase/nutrition-app.sql :
--  Supabase › SQL Editor › New query › Run. On peut le relancer sans risque.
--
--  Chaque pesée est enregistrée par la fonction enregistrer_pesee(). Une fois par semaine au plus,
--  elle compare le poids à celui d'au moins 7 jours avant et ajuste les GLUCIDES seulement :
--    perte de gras   : perd plus que la vitesse max → + glucides ; ne bouge pas → − glucides
--    prise de muscle : prend plus que la vitesse max → − glucides ; ne bouge pas → + glucides
--  Tous les réglages sont dans nutrition_app.coefficients (espace coach › Nutrition App).
-- ─────────────────────────────────────────────────────────────

-- 1. Pesées (une par jour au plus)
create table if not exists public.pesees_app (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null default auth.uid() references public.profiles on delete cascade,
  date date not null default current_date,
  poids numeric not null check (poids between 30 and 250),
  created_at timestamptz not null default now(),
  unique (eleve_id, date)
);
create index if not exists pesees_app_eleve on public.pesees_app (eleve_id, date);

-- 2. Ajustement en cours (g de glucides par jour, cumulé) sur le profil de l'abonnée
alter table public.profils_app add column if not exists ajustement_glucides int not null default 0;
alter table public.profils_app add column if not exists ajuste_le date;

-- 3. Historique des ajustements (automatiques ou faits par la coach)
create table if not exists public.ajustements_app (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references public.profiles on delete cascade,
  date date not null default current_date,
  delta int not null,               -- g de glucides par jour ajoutés (+) ou retirés (−)
  total int not null,               -- ajustement total après ce changement
  vitesse numeric,                  -- kg par semaine mesurés
  raison text,
  par_coach boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ajustements_app_eleve on public.ajustements_app (eleve_id, date);

-- ─── Sécurité ───
alter table public.pesees_app enable row level security;
alter table public.ajustements_app enable row level security;
drop policy if exists "pesees lecture" on public.pesees_app;
create policy "pesees lecture" on public.pesees_app for select using (public.est_coach() or eleve_id = auth.uid());
drop policy if exists "pesees suppression" on public.pesees_app;
create policy "pesees suppression" on public.pesees_app for delete using (eleve_id = auth.uid() and public.acces_app());
drop policy if exists "pesees coach" on public.pesees_app;
create policy "pesees coach" on public.pesees_app for all using (public.est_coach()) with check (public.est_coach());
drop policy if exists "ajustements lecture" on public.ajustements_app;
create policy "ajustements lecture" on public.ajustements_app for select using (public.est_coach() or eleve_id = auth.uid());
drop policy if exists "ajustements coach" on public.ajustements_app;
create policy "ajustements coach" on public.ajustements_app for all using (public.est_coach()) with check (public.est_coach());

-- ─── Enregistrer une pesée (et ajuster le plan si besoin) ───
-- Même règle que decisionAjustement() dans app/js/nutrition-calcul.js
create or replace function public.enregistrer_pesee(p_poids numeric, p_date date default current_date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  pa public.profils_app;
  c jsonb;
  ref public.pesees_app;
  vitesse numeric;
  vmax numeric; stagnation numeric; palier int; maxi int; delai int;
  delta int := 0;
  total int;
  raison text;
begin
  if not public.acces_app() then raise exception 'Réservé aux abonnées Booty Flow App'; end if;
  if p_poids is null or p_poids < 30 or p_poids > 250 then raise exception 'Poids invalide'; end if;
  if p_date > current_date or p_date < current_date - 14 then raise exception 'Date invalide'; end if;

  insert into public.pesees_app (eleve_id, date, poids) values (auth.uid(), p_date, p_poids)
    on conflict (eleve_id, date) do update set poids = excluded.poids;

  select * into pa from public.profils_app where eleve_id = auth.uid();
  select coefficients into c from public.nutrition_app where id = 1;
  if pa.eleve_id is null or c is null or coalesce((c->>'ajustement_auto')::boolean, true) = false then
    return jsonb_build_object('delta', 0);
  end if;
  vmax := coalesce((c->>'vitesse_max_kg_semaine')::numeric, 0.5);
  stagnation := coalesce((c->>'seuil_stagnation_kg_semaine')::numeric, 0.1);
  palier := coalesce((c->>'palier_glucides_g')::int, 30);
  maxi := coalesce((c->>'ajustement_max_g')::int, 150);
  delai := coalesce((c->>'delai_ajustement_jours')::int, 7);

  -- Au plus un ajustement par période (le corps a besoin de temps pour réagir)
  if pa.ajuste_le is not null and p_date - pa.ajuste_le < delai then
    return jsonb_build_object('delta', 0, 'raison', 'attente');
  end if;
  -- Pesée de référence : la plus récente d'au moins 7 jours avant (et pas plus de 21 jours)
  select * into ref from public.pesees_app
    where eleve_id = auth.uid() and date <= p_date - 7 and date >= p_date - 21 order by date desc limit 1;
  if ref.id is null then return jsonb_build_object('delta', 0, 'raison', 'pas assez de pesées'); end if;
  vitesse := round((p_poids - ref.poids) / ((p_date - ref.date) / 7.0), 2);

  if pa.objectif = 'prise_de_muscle' then
    if vitesse > vmax then delta := -palier; raison := 'prise de poids trop rapide';
    elsif vitesse < stagnation then delta := palier; raison := 'poids qui ne bouge pas';
    end if;
  else
    if vitesse < -vmax then delta := palier; raison := 'perte de poids trop rapide';
    elsif vitesse > -stagnation then delta := -palier; raison := 'poids qui ne bouge pas';
    end if;
  end if;
  total := greatest(-maxi, least(maxi, pa.ajustement_glucides + delta));
  delta := total - pa.ajustement_glucides;
  if delta = 0 then return jsonb_build_object('delta', 0, 'vitesse', vitesse); end if;

  update public.profils_app set ajustement_glucides = total, ajuste_le = p_date, updated_at = now() where eleve_id = auth.uid();
  insert into public.ajustements_app (eleve_id, date, delta, total, vitesse, raison)
    values (auth.uid(), p_date, delta, total, vitesse, raison);
  return jsonb_build_object('delta', delta, 'total', total, 'vitesse', vitesse, 'raison', raison);
end $$;

-- Réglages par défaut de l'ajustement automatique (ajoutés aux réglages existants, sans écraser les tiens)
update public.nutrition_app set coefficients = '{
  "ajustement_auto": true, "vitesse_max_kg_semaine": 0.5, "seuil_stagnation_kg_semaine": 0.1,
  "palier_glucides_g": 30, "ajustement_max_g": 150, "delai_ajustement_jours": 7
}'::jsonb || coefficients where id = 1;

-- ─── Relevé du mois : mensurations + 3 photos (face, profil, dos), rappel toutes les 4 semaines ───
create table if not exists public.releves_app (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null default auth.uid() references public.profiles on delete cascade,
  date date not null default current_date,
  tour_taille numeric check (tour_taille between 30 and 200),
  hanches numeric check (hanches between 30 and 200),
  fessiers numeric check (fessiers between 30 and 200),
  cuisse numeric check (cuisse between 20 and 120),
  bras numeric check (bras between 10 and 80),
  photo_face text,
  photo_profil text,
  photo_dos text,
  created_at timestamptz not null default now()
);
create index if not exists releves_app_eleve on public.releves_app (eleve_id, date);
alter table public.releves_app enable row level security;
drop policy if exists "releves lecture" on public.releves_app;
create policy "releves lecture" on public.releves_app for select using (public.est_coach() or eleve_id = auth.uid());
drop policy if exists "releves ajout" on public.releves_app;
create policy "releves ajout" on public.releves_app for insert with check (eleve_id = auth.uid() and public.acces_app());
drop policy if exists "releves suppression" on public.releves_app;
create policy "releves suppression" on public.releves_app for delete using (eleve_id = auth.uid() and public.acces_app());
drop policy if exists "releves coach" on public.releves_app;
create policy "releves coach" on public.releves_app for all using (public.est_coach()) with check (public.est_coach());
