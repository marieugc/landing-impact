# Guide Booty Flow : mettre ton app en ligne, étape par étape

Ce guide est fait pour toi même si tu n'as jamais codé. Compte environ **45 minutes** en tout.
Tu n'as rien à installer sur ton ordinateur : tout se fait dans ton navigateur.

---

## Ce qu'il y a dans ton projet

| Dossier / fichier | À quoi ça sert |
|---|---|
| `index.html` (à la racine) | Ta landing page actuelle (pixel Meta + Tally). **On n'y touche pas.** |
| `app/` | Ton application Booty Flow (espace élève + espace coach) |
| `app/js/config.js` | **Le seul fichier que tu devras modifier** (tes clés Supabase) |
| `supabase/schema.sql` | La base de données, à copier-coller une seule fois dans Supabase |

L'app fonctionne en deux modes :

- **Mode démo** (tout de suite) : données fictives, rien n'est envoyé en ligne. Parfait pour tester.
- **Mode réel** (après l'étape 3) : vraies élèves, vraies vidéos, vrais bilans.

---

## Étape 1 : mettre l'app en ligne (GitHub Pages, gratuit)

1. Va sur la page de ton dépôt : **github.com/marieugc/landing-impact**
2. Clique sur **Settings** (l'onglet avec l'engrenage, en haut).
3. Dans le menu de gauche, clique sur **Pages**.
4. Sous « Build and deployment » :
   - **Source** : `Deploy from a branch`
   - **Branch** : choisis `main` et le dossier `/ (root)`, puis **Save**.
5. Attends 1 à 2 minutes et recharge la page : GitHub affiche l'adresse de ton site, par exemple
   `https://marieugc.github.io/landing-impact/`

Ton app est à cette adresse, **avec `app/` à la fin** :

```
https://marieugc.github.io/landing-impact/app/
```

> ⚠️ L'app doit d'abord être sur la branche `main`. Je l'ai mise sur une branche de travail :
> il faut ouvrir puis accepter (« merge ») la pull request. Demande-moi de la créer si tu veux.

---

## Étape 2 : tester la démo

Ouvre l'adresse de ton app sur ton téléphone. En bas de l'écran de connexion, trois boutons :

- **Espace élève (Sarah)** : accueil, nutrition, vidéos, progression, bilan
- **Espace compétitrice (Chloé)** : en plus, l'onglet Posing avec le compte à rebours
- **Espace coach (Marie)** : ton tableau de bord (plus confortable sur ordinateur)

Tu peux tout essayer : envoyer un bilan, corriger une vidéo, modifier un plan nutrition…
Le bouton « Remettre la démo à zéro » efface tes essais.

---

## Étape 3 : brancher la vraie base de données (Supabase, gratuit)

Supabase gère pour toi les **comptes** (e-mail + mot de passe), la **base de données** et le
**stockage des vidéos et photos**. La formule gratuite suffit largement pour démarrer.

### 3a. Créer ton projet

1. Va sur **supabase.com** et crée un compte (tu peux te connecter avec GitHub).
2. Clique sur **New project**.
   - Name : `booty-flow`
   - Database Password : clique sur **Generate** et garde-le dans un endroit sûr
   - Region : **West EU (Paris)** ou **Central EU (Frankfurt)**
3. Clique sur **Create new project** et patiente 2 minutes.

### 3b. Créer les tables

1. Dans le menu de gauche, clique sur **SQL Editor**, puis **New query**.
2. Ouvre le fichier `supabase/schema.sql` de ton dépôt GitHub, clique sur l'icône **Copy**
   (deux petits carrés en haut à droite du fichier).
3. Colle tout dans Supabase, puis clique sur **Run** (en bas à droite).
4. Tu dois voir « Success. No rows returned ». C'est tout bon !

### 3c. Régler les adresses de connexion

1. Menu de gauche : **Authentication** › **URL Configuration**.
2. **Site URL** : colle l'adresse de ton app, par exemple
   `https://marieugc.github.io/landing-impact/app/`
3. **Redirect URLs** : clique **Add URL** et colle la même adresse. **Save**.

> 💡 Facultatif : dans **Authentication › Sign In / Providers › Email**, tu peux décocher
> **Confirm email** si tu ne veux pas que tes élèves aient à cliquer un lien de confirmation.

### 3d. Copier tes clés dans l'app

1. Dans Supabase : **Project Settings** (engrenage en bas à gauche) › **API**
   (ou **Data API** / **API Keys** selon la version).
2. Repère :
   - **Project URL**, qui ressemble à `https://abcdefgh.supabase.co`
   - **anon public key**, un long texte qui commence par `eyJ...`
3. Sur GitHub, ouvre `app/js/config.js`, clique sur le **crayon** (Edit), et remplis :

   ```js
   export const SUPABASE_URL = 'https://abcdefgh.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJ...ta-longue-clé...';
   ```

4. Clique sur **Commit changes**. Après 1 à 2 minutes, ton app n'est plus en démo.

> 🔒 La clé « anon public » est faite pour être visible : la sécurité est assurée par les règles
> du fichier `schema.sql` (chaque élève ne voit que ses propres données). Par contre,
> **ne mets jamais la clé `service_role`** dans l'app.

### 3e. Devenir coach

1. Ouvre ton app et clique sur **Créer mon compte** avec ton adresse e-mail.
2. Retourne dans Supabase › **SQL Editor** › **New query**, colle cette ligne en mettant TON adresse :

   ```sql
   update public.profiles set role = 'coach' where email = 'ton-adresse@exemple.com';
   ```

3. **Run**. Déconnecte-toi puis reconnecte-toi dans l'app : tu arrives dans l'espace coach. 🎉

---

## Étape 4 : inviter tes élèves

Dans l'espace coach, clique sur **+ Ajouter une élève** puis **Copier le message**, et envoie-le
par SMS, WhatsApp ou Instagram. Ton élève :

1. ouvre le lien,
2. clique sur **Créer mon compte**,
3. apparaît automatiquement dans ta liste « Mes élèves ».

Ensuite, clique sur son nom pour remplir sa fiche : objectif, semaines, date du prochain bilan,
message du jour, plan nutrition, et « Compétitrice » si elle prépare une compétition (ça active
son onglet Posing).

---

## Étape 5 : installer l'app sur le téléphone

**iPhone (Safari obligatoire)** : ouvre le lien › bouton **Partager** (carré avec une flèche) ›
**Sur l'écran d'accueil** › **Ajouter**.

**Android (Chrome)** : ouvre le lien › menu **⋮** › **Installer l'application**
(ou le bouton « Installer l'app sur mon téléphone » en bas de l'accueil).

L'icône Booty Flow apparaît alors comme une vraie app, en plein écran.

---

## Ce que fait l'app

**Espace élève (téléphone)**
- **Accueil** : objectif et avancement, prochain bilan, vidéos corrigées, ton message du jour
- **Plan › Training** : le programme d'entraînement en cours (fichier PDF / image / Excel à ouvrir ou télécharger, consignes, lien), et les programmes précédents
- **Plan › Nutrition** : calories, macros, repas de la journée, dernier ajustement, plan PDF
- **Mouvement** : la **Vidéothèque** (tes vidéos d'explication, par catégorie, avec badge « Nouveau ») et **Mes corrections** (envoi de vidéos d'exercice et tes corrections)
- **Posing** (compétitrices seulement) : compte à rebours, poses imposées, checklist jour J, envoi de posing
- **Chat** : discussion privée avec la coach, en messages écrits ou vocaux (bouton micro)
- **Progrès** : courbe de poids, mensurations, **suivi des charges par exercice** (courbe, record, historique), photos avant/après, formulaire de bilan hebdo

**Espace coach (ordinateur ou téléphone)**
- **Mes élèves** : chiffres clés et liste avec statut automatique (vidéo à corriger, bilan reçu, bilan en retard, à jour)
- **Fiche élève** : suivi, plan nutrition, vidéos, bilans (avec photos et écarts), charges de musculation, compétition
- **Vidéos à corriger** : toutes les vidéos en attente, avec un retour écrit et/ou une vidéo de correction
- **Bilans**, **Compétitrices**, **Plans nutrition** : vues d'ensemble
- **Fiche élève › Training** : dépose le programme de chaque élève (fichier, lien Google Drive ou consignes écrites). Le dernier ajouté devient son « programme en cours » et elle voit un badge « Nouveau »
- **Vidéothèque** : ajoute, modifie ou supprime tes vidéos d'explication (fichier de 50 Mo max, ou lien YouTube / Vimeo). Tes élèves voient un badge « Nouveau », une pastille sur l'onglet Mouvement et une notification dans l'app. Pour renommer cette partie, change `NOM_VIDEOTHEQUE` dans `app/js/config.js`
- **Messages** : une conversation par élève (texte et vocaux), avec le nombre de messages non lus dans le menu ; bouton « Écrire » sur chaque fiche élève
- **Suivi des charges** : pour chaque élève, dernière séance, exercices suivis, records de la semaine et meilleure progression ; un clic ouvre le détail par exercice

---

## Questions fréquentes

**Combien ça coûte ?** GitHub Pages et Supabase sont gratuits. La formule gratuite de Supabase
offre 1 Go de stockage : les vidéos sont limitées à 50 Mo chacune. Quand tu auras beaucoup
d'élèves, la formule Pro de Supabase (environ 25 $/mois) passe à 100 Go.

**Une élève a oublié son mot de passe ?** Elle clique sur « Mot de passe oublié ? » sur l'écran
de connexion et reçoit un lien par e-mail.

**Je veux changer une couleur ou un texte ?** Les couleurs sont en haut de `app/css/styles.css`.
Les textes sont dans `app/js/eleve.js` (élève) et `app/js/coach.js` (coach). Tu peux aussi
simplement me demander !

**Une nouvelle fonction a été ajoutée à la base de données (ex. : suivi des charges) ?**
Si tu avais déjà fait l'étape 3b, refais-la simplement : recopie tout `supabase/schema.sql`
dans le SQL Editor et clique sur **Run**. Tes données existantes ne sont pas effacées.

**Le bouton micro ne marche pas ?** La première fois, le téléphone demande l'autorisation
d'utiliser le micro : il faut accepter. Si elle a été refusée : sur iPhone, Réglages › Safari ›
Micro ; sur Android, appuyer sur le cadenas à côté de l'adresse › Autorisations › Micro.

**J'ai modifié l'app mais je vois l'ancienne version sur mon téléphone ?** Ferme complètement
l'app et rouvre-la (parfois deux fois) : elle se met à jour toute seule.
