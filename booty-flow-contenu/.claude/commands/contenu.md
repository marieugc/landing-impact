---
description: Pipeline complet transcription → script vidéo, avec pauses pour mes choix
argument-hint: <fichier dans transcripts/>
---

Crée un contenu vidéo à partir de la transcription `$ARGUMENTS` en suivant les 9 étapes ci-dessous, dans l'ordre.

Aux étapes marquées ⏸️, arrête-toi et attends mon choix. Si je réponds « auto », choisis toi-même, justifie ton choix en une ligne et continue. Respecte en permanence les règles de `CLAUDE.md` (confidentialité, pas d'invention, exactitude, respect, style, hook).

---

## Étape 1 – Analyse de l'appel
- Trouve la transcription dans `transcripts/` (avec ou sans extension).
- Si une analyse existe déjà pour ce fichier dans `analyses/` (`*-<nom-du-fichier>.md`), **réutilise-la** au lieu de tout refaire.
- Sinon, applique le prompt `prompts/01-analyste-appels.md`, termine par une « Synthèse émotionnelle » de 5 lignes maximum, et enregistre le résultat dans `analyses/AAAA-MM-JJ-<nom-du-fichier>.md`.

## Étape 2 – Choix de l'angle ⏸️
- À partir de l'analyse, propose **5 angles de contenu**, numérotés.
- Pour chaque angle, indique :
  - la citation exacte du prospect qui l'inspire (elle reste dans le chat et l'analyse, jamais dans le script) ;
  - le type de contenu : **croyance**, **actionnable**, **objection** ou **BOFU** (un BOFU peut prendre la forme d'un storytelling) ;
  - en une phrase, pourquoi il parle à ma cible.
- Demande-moi lequel je choisis.

## Étape 3 – Script brut
Remplis ces 5 blocs à partir de l'angle choisi, en utilisant au maximum les mots exacts du prospect. Dans le chat, tu peux les citer mot pour mot. Dans le fichier enregistré dans `contenus/`, le script brut est **reformulé** (règle de confidentialité de `CLAUDE.md`) et renvoie à l'analyse pour les mots exacts :
- **Ce qu'elle fait** : son comportement actuel.
- **Ce qu'elle ressent** : ses émotions, frustrations, doutes.
- **La logique** : l'explication ou l'action concrète.
- **Le déclic** : la prise de conscience qui change tout.
- **La nouvelle batterie** : ce qu'elle vit une fois le problème réglé.

Pour chaque bloc, marque ce qui vient de l'appel (C), ce qui est ton interprétation (I) et ce qui est mon apport d'experte (E).

## Étape 4 – Structure
Range le script brut dans la structure qui correspond au type de contenu (détails et exemples dans `prompts/02-structures-scripts.md`) :

| Type de contenu | Structure | Correspondance des blocs |
|---|---|---|
| Croyance ou objection | PSS | Problem ← Ce qu'elle fait · Struggle ← Ce qu'elle ressent · Solution ← La logique + Le déclic + La nouvelle batterie |
| Actionnable | Étapes | Hook et re-hook ← Ce qu'elle fait + Ce qu'elle ressent · Étapes 1-2-3 ← La logique · Big Fast ← Le déclic + La nouvelle batterie |
| Actionnable (3 conseils indépendants) | Liste simple | Même logique que Étapes, mais les 3 points ne sont pas séquentiels |
| BOFU ou storytelling | BAB | Before ← Ce qu'elle fait + Ce qu'elle ressent · After ← La nouvelle batterie · Bridge ← La logique + Le déclic |

Pour un contenu actionnable, choisis **Étapes** si les actions s'enchaînent, **Liste simple** si elles sont indépendantes, et dis-moi pourquoi.

Remplis tous les emplacements de la structure (hook, re-hook, transition, etc.). Laisse les emplacements « Hook », « Big Fast » et « CTA » marqués `[à choisir]` : ils sont remplis aux étapes 6, 7 et 8. (BAB n'a pas d'emplacement Big Fast : la big fast choisie sert alors de phrase de chute à la fin du Bridge.)

## Étape 5 – Mon avis d'experte + Big Fast
- Ajoute une section **« Ce que j'en pense »**, écrite avec ma voix (je, tutoiement) de coach et d'athlète Wellness spécialisée en hypertrophie. Elle doit être juste sur le plan scientifique (tension mécanique, surcharge progressive, volume, proximité de l'échec, récupération, apport en protéines, déficit ou surplus calorique, etc.). Si une affirmation mériterait d'être vérifiée, signale-la avec ⚠️. Pas de conseil médical.
- Applique ensuite le prompt `prompts/03-big-fast.md` au sujet du script (sans demander « on commence ? ») : génère **8 à 12 big fasts**.

## Étape 6 – Choix de la Big Fast ⏸️
- Présente tes **3 big fasts préférées**, en expliquant pourquoi en une ligne chacune.
- Demande-moi laquelle je garde.
- Place-la dans l'emplacement « Big Fast » (le bénéfice) de la structure.

## Étape 7 – Hooks ⏸️
- Génère **100 hooks** adaptés au sujet en t'appuyant sur les trois listes de modèles : `prompts/04-hooks-arrete.md`, `prompts/05-hooks-series.md`, `prompts/06-hooks-storytelling.md`. Répartis-les à peu près en 40 / 20 / 40 et regroupe-les par liste.
- Chaque hook se dit en 3 secondes environ : **12 mots maximum**.
- Aucun prénom ni détail identifiable. Aucun chiffre ou résultat inventé (pas de « mes clientes me payent X € » ou « 30 jours pour… » si ce n'est pas vrai et réaliste : mets le montant ou la durée entre crochets pour que je le complète).
- Enregistre-les tous dans le fichier du contenu (voir étape 9).
- Montre-moi dans le chat tes **10 meilleurs, classés**.
- Demande-moi lequel je garde.

## Étape 8 – CTA
- Propose **3 CTA** : un orienté **valeur**, un orienté **interaction**, un orienté **conversion**.
- Chaque CTA utilise un mot-clé en MAJUSCULES à commenter (exemple : « Commente FESSIERS »).
- Intègre le plus cohérent dans le script, sauf si je demande autre chose.

## Étape 9 – Finalisation
- Si le contenu est du storytelling (BAB), applique `prompts/07-storytelling-driven.md`. Sinon, applique `prompts/08-value-driven.md`.
- Si le fichier correspondant est encore vide (il ne contient que la ligne « [À COMPLÉTER PAR MARIE… »), préviens-moi et passe cette étape.
- Rédige le **script final**, prêt à être dit face caméra : phrases courtes, langage parlé, 45 à 60 secondes (120 à 160 mots). Indique le nombre de mots et la durée estimée. Toutes les citations y sont reformulées, aucun nom, aucun détail identifiable.
- Enregistre tout dans `contenus/AAAA-MM-JJ-<angle-en-quelques-mots>.md` avec, dans cet ordre :
  1. Le script final
  2. L'angle et la citation source (reformulée, voir `CLAUDE.md`) + le type de contenu + la structure
  3. Le script brut
  4. La structure remplie
  5. « Ce que j'en pense »
  6. Toutes les big fasts (avec celle retenue en premier)
  7. Les 100 hooks (avec celui retenu en premier)
  8. Les 3 CTA (avec celui retenu en premier)
- Avant d'enregistrer, relis le fichier et vérifie : aucun prénom, aucune citation mot pour mot du prospect nulle part dans le fichier (y compris hooks et big fasts), aucun détail identifiable (durée exacte, prix payé, entourage), aucune promesse irréaliste, hooks de 12 mots maximum, exactement 100 hooks sans doublon. Marque ⚠️ tout CTA qui promet une ressource qui n'existe pas encore.
- À la fin, propose-moi de créer un autre contenu à partir d'un autre angle de la même analyse (rappelle les 4 angles restants).
