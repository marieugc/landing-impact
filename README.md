# landing-impact
page de vente ugc pixel

## App Booty Flow (PWA)

L'application de coaching (espace élève + espace coach) est dans le dossier [`app/`](app/).
Pour la mettre en ligne pas à pas, suis le [**GUIDE.md**](GUIDE.md).

## Test « Fessier court ou fessier long ? » 🍑

Mini-guide interactif (lead magnet) dans [`test-fessier/index.html`](test-fessier/index.html).
Une fois GitHub Pages activé : `https://marieugc.github.io/landing-impact/test-fessier/`

## Tunnel « RECOMP » 💜

Quiz de recomposition corporelle → profil personnalisé → offre → appel Calendly, dans [`recomp/`](recomp/).
Mode d'emploi (photo avant/après, textes, mise en ligne Netlify) : [`recomp/README.md`](recomp/README.md).

## Test « Diagnostic » 💜

Quiz 3 objectifs (gras / muscle / fessiers) → diagnostic sur 3 piliers → preuve → qualification → offres 6 ou 3 mois → appel Calendly, dans [`diagnostic/`](diagnostic/).
Mode d'emploi (photos, textes, prix, mise en ligne Netlify) : [`diagnostic/README.md`](diagnostic/README.md).

## Guide « Séance fessiers » 🍑💜

Guide d'entraînement offert (à envoyer en DM aux abonnées qui commentent), dans [`seance-fessiers/`](seance-fessiers/) :
auto-diagnostic, 4 règles de l'hypertrophie, séance complète (séries à cocher, charges enregistrées, minuteur de repos),
progression sur 4 semaines, transformations, présentation de Marie et appel à l'action coaching (Calendly + Instagram).
Les exercices se modifient en haut du `<script>` de `seance-fessiers/index.html` (tableau `EXERCICES`).
Une fois GitHub Pages activé : `https://marieugc.github.io/landing-impact/seance-fessiers/`

## Guide « HIP THRUST » 🍑💜

Guide offert envoyé en DM aux abonnées qui commentent **HIP THRUST** (reel « masseuses à leur compte qui sautent leur séance »),
dans [`hip-thrust/index.html`](hip-thrust/index.html) : auto-diagnostic en 5 signes, 5 erreurs sur le hip thrust avec un test express
pour chacune, séance 30 minutes pour les journées qui débordent, carnet de charge (enregistré sur le téléphone), mini-diagnostic noté sur 6,
résultats clientes, accompagnement et réservation du diagnostic offert (Calendly). Bouton « Télécharger ce guide en PDF » en bas de page.
Les liens (Calendly, Instagram, lien de ta vidéo sur les erreurs) se modifient en haut du `<script>` (`CONFIG`).
Une fois GitHub Pages activé : `https://marieugc.github.io/landing-impact/hip-thrust/`

## Ressource post-R1 « Tu avances à l'aveugle » 💜

Page à envoyer aux prospects qui n'ont pas pris le R2 après le R1, dans [`a-l-aveugle/index.html`](a-l-aveugle/index.html).
Ce n'est pas une séance de plus : elle brise les croyances. Test de précision (structure / ciblage / diète, 9 questions),
compteur des séances déjà faites « sans boussole », 8 croyances à retourner (« ça brûle donc ça travaille », « healthy suffit »,
« c'est génétique »…), comparaison « à l'aveugle / pilotée », objections post-appel et réservation du R2.
Bouton « Copier mon résultat » : la prospect t'envoie son score en DM, ton R2 démarre de là.
Lien personnalisé avec le prénom : `https://marieugc.github.io/landing-impact/a-l-aveugle/?p=Sarah`
Liens (Calendly, Instagram), questions et croyances se modifient en haut du `<script>` (`CONFIG`, `QUESTIONS`, `CROYANCES`).

## Formation coach « GluteLab » 🍑⚡

Formation interactive pour coachs (hypertrophie des fessiers, evidence-based), en un seul fichier :
[`formation-coach-fessiers/index.html`](formation-coach-fessiers/index.html). 7 modules + règles d'or, bibliothèque
d'exercices filtrable, techniques d'intensité, périodisation (graphique Chart.js), programmes complets, calculateur
de volume, générateur de séance, quiz et checklist. Progression sauvegardée dans le navigateur, version imprimable (PDF).
Toutes les données (exercices, techniques, repères de volume, programmes, quiz) sont dans le premier `<script>` du fichier.
Une fois GitHub Pages activé : `https://marieugc.github.io/landing-impact/formation-coach-fessiers/`

## Générateur de contenu « Booty Flow » 🎬

Outil Claude Code (commandes slash + prompts Markdown) qui transforme les transcriptions d'appels de closing en scripts
de Reels / Shorts, dans [`booty-flow-contenu/`](booty-flow-contenu/). Mode d'emploi : [`booty-flow-contenu/CLAUDE.md`](booty-flow-contenu/CLAUDE.md).
Les transcriptions et analyses réelles ne sont jamais versionnées (`.gitignore`).

## Générateur de diètes « Booty Flow » 🥗💜

Logiciel de création des plans alimentaires des élèves (macros calculées, 3 variantes par repas, verrouillage,
liste de courses, export PDF, sauvegarde). Code source et mode d'emploi : [`generateur-dietes/`](generateur-dietes/README.md).
Une fois GitHub Pages activé : `https://marieugc.github.io/landing-impact/dietes/` (les données restent dans ton navigateur).

## Programme élève (éditeur + PDF) 💜

Programme d'entraînement personnalisé au style Booty Flow (fond violet néon + logo), dans
[`programme-eleve/index.html`](programme-eleve/index.html). Bouton « Modifier le programme » : clique sur un texte
pour le changer, colle un lien vidéo de démo sous chaque exercice (bouton « ▶ Voir la démo », cliquable aussi dans le PDF), ajoute / supprime / déplace des exercices, supersets (5a + 5b) et séances. « Télécharger en PDF »
ouvre l'impression (choisir « Enregistrer en PDF », arrière-plans activés). « Sauvegarder (fichier) » / « Ouvrir une
sauvegarde » pour garder un programme par élève. « Mes programmes » : retrouve, ouvre, duplique ou supprime chaque programme créé (enregistrés dans le navigateur). « 📝 Coller l'entraînement » sur chaque séance : colle le texte du jour, la séance et la semaine type sont remises en page. « Nouveau programme (coller un texte) » : colle le texte de l'entraînement tel qu'il est écrit (une séance par paragraphe, un exercice par ligne avec « 4x10 », repos, tempo…) et il est mis en page proprement. « Importer un PDF » lit un programme PDF existant (tableaux
d'exercices, planning de la semaine, paragraphes) et le met en page ; un PDF exporté par l'outil est relu à l'identique. Exemple généré : `programme-eleve/Programme-Anais-BootyFlow.pdf`.

## Dossier BC5 CQP · Jamet Sporting Club 📊

Dossier BC5 (stratégie commerciale) du stage au Jamet Sporting Club, mis en page de façon interactive :
planning filtrable, simulateur de tarifs, zone de chalandise, SWOT, objectifs SMART, argumentaires et objections.
Bouton « Tout afficher · PDF » puis « Télécharger en PDF » pour la version à rendre. Fichier : [`dossier-bc5/index.html`](dossier-bc5/index.html).
Une fois GitHub Pages activé : `https://marieugc.github.io/landing-impact/dossier-bc5/`

## Kit de démarrage « Bilan postural » 🧍‍♀️💜

Document interactif à envoyer à chaque nouvelle élève, dans [`bilan-postural/index.html`](bilan-postural/index.html) :
installation du téléphone (schéma), 4 photos de posture (face, dos, 2 profils) et 9 tests de mobilité expliqués pas à pas
avec un schéma chacun (squat bras tendus, flexion avant + test d'Adams, genou au mur, test de Thomas, rotations de hanche,
bras dos au mur, mains dans le dos, squat sur une jambe, pont fessier une jambe) + auto-test diastasis facultatif,
carte du corps cliquable pour les douleurs, questionnaire (quotidien, sport, grossesse, blessures).
Sous chaque test, l'élève dépose ses photos / vidéos (allégées automatiquement) et note son ressenti et ses mesures.
Tout reste enregistré sur son téléphone tant qu'elle n'a pas envoyé. Si l'envoi échoue : « Plan B » (partage WhatsApp / DM + récap écrit).

- **À faire une seule fois** : copier-coller [`supabase/bilan-postural.sql`](supabase/bilan-postural.sql) dans Supabase › SQL Editor › Run.
  Les élèves n'ont pas besoin de compte pour envoyer ; seule la coach peut lire les bilans.
- Lien élève (prénom pré-rempli) : `https://marieugc.github.io/landing-impact/bilan-postural/?p=Sarah`
- **Espace coach** (connexion avec le compte coach de l'app) : `https://marieugc.github.io/landing-impact/bilan-postural/?coach`
  → liste des bilans reçus, photos et vidéos, réponses, grille de lecture de chaque test, bouton « Copier le lien » pour une nouvelle élève.
- Les tests (textes, consignes, repères, ce que tu observes) se modifient en haut du `<script>` (`TESTS`).
