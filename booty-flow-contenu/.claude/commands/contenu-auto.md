---
description: Pipeline complet sans pause, produit 3 contenus sur 3 angles différents
argument-hint: <fichier dans transcripts/>
---

Lance le pipeline complet sur la transcription `$ARGUMENTS`, **sans aucune pause**, et produis **3 contenus** sur 3 angles différents.

1. Lis `.claude/commands/contenu.md` : c'est la référence du pipeline (9 étapes). Suis-la à la lettre, avec ces différences :
   - Tu ne t'arrêtes à aucune étape ⏸️ : tu fais toi-même chaque choix (angle, big fast, hook, CTA).
   - Tu justifies chaque choix en une ligne dans le fichier du contenu, dans une section « Choix automatiques » placée juste après le script final.
2. Étape 1 : une seule analyse pour les 3 contenus (réutilise-la si elle existe déjà).
3. Étape 2 : propose les 5 angles comme d'habitude (écris-les dans le chat), puis retiens-en 3, **si possible de 3 types différents** (croyance, actionnable, objection, BOFU) et donc de structures différentes.
4. Étapes 3 à 9 : déroule-les entièrement pour chacun des 3 angles. Chaque contenu a son propre fichier `contenus/AAAA-MM-JJ-<angle-en-quelques-mots>.md`, avec ses 8 à 12 big fasts, ses 100 hooks et ses 3 CTA. Les hooks des 3 contenus ne doivent pas se répéter.
5. À la fin, dans le chat, donne pour chaque contenu : le chemin du fichier, le type, la structure, le hook retenu, et le script final. Signale les prompts `07`/`08` passés parce que vides, et rappelle les 2 angles non utilisés.
