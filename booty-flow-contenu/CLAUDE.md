# Booty Flow — Générateur de contenu

Cet outil transforme les transcriptions de mes appels de closing en scripts de vidéos courtes (Reels Instagram, Shorts YouTube) pour attirer ma clientèle cible. Tout se passe dans Claude Code : des dossiers, des fichiers Markdown et des commandes slash. Pas d'application web, pas de clé API, pas de base de données.

## Qui je suis

- Je m'appelle Marie. Je suis coach sportive, athlète Wellness compétitrice et juge de compétition.
- Ma marque : **Booty Flow** (@booty__flow).
- J'aide les femmes à développer leurs fessiers et le bas du corps. Spécialisation : hypertrophie, recomposition corporelle, nutrition sportive.
- Ma cible : **les femmes qui s'entraînent sans obtenir de résultats sur leurs fessiers**.
- Mon contenu est en français, en tutoiement, sur un ton oral, direct et bienveillant.
- Format visé : vidéos de **45 à 60 secondes** (environ **120 à 160 mots parlés**).
- Mon CTA habituel passe par un **mot-clé en commentaire ou en DM**, géré ensuite par ManyChat (ex. « Commente FESSIERS »).

## Règles à respecter partout

1. **Confidentialité** : les transcriptions contiennent des données de vraies personnes. Dans les contenus, ne mets jamais de nom, de détail identifiable ou de citation reconnaissable telle quelle. Parle d'« une élève » ou d'« une femme que j'ai eue en appel », et reformule les citations dans le script final. Les citations exactes ne restent que dans les analyses.
2. **Pas d'invention** : n'invente aucune information sur le prospect. Distingue toujours les citations réelles des interprétations.
3. **Exactitude** : aucune promesse irréaliste (« des fessiers en 7 jours »), aucun conseil médical, aucune affirmation scientifique fausse.
4. **Respect** : pas de body shaming, pas de culpabilisation. On peut être direct et piquant, jamais humiliant.
5. **Style** : français, tutoiement, oral, phrases courtes, mots simples.
6. **Hook** : c'est l'élément le plus important. Environ 3 secondes (12 mots maximum).

Précision sur la règle 1 : dans `contenus/`, la section « Angle et citation source » contient une **reformulation** de la citation (jamais la phrase mot pour mot, jamais de prénom). La citation exacte reste dans `analyses/`, et c'est le seul endroit où elle a le droit d'exister.

## Organisation des dossiers

| Dossier | Contenu |
|---|---|
| `transcripts/` | Mes transcriptions d'appels (.txt, .md, .docx). **Non versionnées dans Git** (données personnelles). |
| `prompts/` | Les prompts de référence. Ne pas les modifier sans que je le demande. |
| `analyses/` | Analyses d'appels générées : `AAAA-MM-JJ-<nom-du-fichier>.md`. **Non versionnées dans Git** (citations exactes). |
| `contenus/` | Scripts finaux générés : `AAAA-MM-JJ-<angle-en-quelques-mots>.md`. |
| `.claude/commands/` | Les commandes slash. |

Les prompts :
- `01-analyste-appels.md` : analyse d'un appel. Il s'arrête à la section 7 : en attendant que je le complète, termine chaque analyse par une courte **« Synthèse émotionnelle » de 5 lignes maximum**.
- `02-structures-scripts.md` : structures BAB, PSS, Liste simple, Étapes séquentielles.
- `03-big-fast.md` : générateur de punchlines. Le sujet est fourni par le pipeline ou par `/bigfast` : ne demande jamais « on commence ? ». Le persona cible est celui décrit plus haut.
- `04`, `05`, `06` : les trois listes de modèles de hooks (« Arrête de… », séries/défis, storytelling).
- `07-storytelling-driven.md` et `08-value-driven.md` : à compléter par moi. Tant qu'ils ne contiennent que la ligne « [À COMPLÉTER PAR MARIE… », considère-les comme vides.

## Les commandes

| Commande | Ce qu'elle fait |
|---|---|
| `/analyse <fichier>` | Étape 1 seulement : analyse l'appel et l'enregistre dans `analyses/`. |
| `/contenu <fichier>` | Pipeline complet (9 étapes) avec des pauses pour mes choix. Je peux répondre « auto » à une pause pour te laisser choisir. |
| `/contenu-auto <fichier>` | Pipeline complet sans pause : 3 contenus sur 3 angles différents (si possible 3 types différents). |
| `/bigfast <sujet>` | Génère 8 à 12 big fasts sur un sujet. |
| `/hooks <sujet>` | Génère 100 hooks sur un sujet à partir des trois listes de modèles. |

Le détail du pipeline est dans `.claude/commands/contenu.md` : c'est la référence unique, `/contenu-auto` la suit aussi.

## Conventions

- Dates au format `AAAA-MM-JJ` (date du jour).
- Noms de fichiers en minuscules, sans accents, mots séparés par des tirets.
- `<fichier>` désigne un fichier de `transcripts/` : accepte le nom avec ou sans extension (`exemple`, `exemple.txt`).
- Pour lire un `.docx`, extrais le texte (par exemple avec `unzip -p fichier.docx word/document.xml` puis en retirant les balises, ou `pandoc` s'il est installé).
- Mot-clé de CTA en MAJUSCULES, un seul mot, sans accent de préférence (ManyChat).
