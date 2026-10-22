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
sauvegarde » pour garder un programme par élève. « Importer un PDF » lit un programme PDF existant (tableaux
d'exercices, planning de la semaine, paragraphes) et le met en page ; un PDF exporté par l'outil est relu à l'identique. Exemple généré : `programme-eleve/Programme-Anais-BootyFlow.pdf`.
