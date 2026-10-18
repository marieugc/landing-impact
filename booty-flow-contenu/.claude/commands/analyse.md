---
description: Analyse une transcription d'appel (étape 1 du pipeline)
argument-hint: <fichier dans transcripts/>
---

Analyse la transcription `$ARGUMENTS`.

1. Trouve le fichier dans `transcripts/` (avec ou sans extension). S'il n'existe pas, liste les fichiers disponibles dans `transcripts/` et arrête-toi.
2. Si une analyse existe déjà pour ce fichier dans `analyses/` (fichier `*-<nom-du-fichier>.md`), dis-le-moi et demande si je veux la refaire. Ne l'écrase pas sans mon accord.
3. Lis la transcription en entier (pour un `.docx`, extrais le texte d'abord).
4. Applique le prompt `prompts/01-analyste-appels.md` à la lettre : structure 0 à 6, citations mot pour mot, faits séparés des interprétations.
5. Comme le prompt s'arrête à la section 7, termine par une section « 7. 💥 Synthèse émotionnelle » de 5 lignes maximum.
6. Enregistre le résultat dans `analyses/AAAA-MM-JJ-<nom-du-fichier>.md` (date du jour, nom sans extension). Commence le fichier par un en-tête :
   - Source : `transcripts/<fichier>`
   - Date d'analyse
   - Limites de l'analyse (transcript court, mal retranscrit, etc.)
7. Dans le chat, montre-moi seulement le Top 3 des insights et le chemin du fichier créé.

Rappel : respecte les règles de `CLAUDE.md`. L'analyse est le seul endroit où les citations exactes ont le droit d'exister.
