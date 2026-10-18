---
description: Génère 100 hooks sur un sujet à partir des trois listes de modèles
argument-hint: <sujet>
---

Sujet : $ARGUMENTS

Génère **100 hooks** sur ce sujet en t'appuyant sur les trois listes de modèles :
- `prompts/04-hooks-arrete.md` (environ 40 hooks)
- `prompts/05-hooks-series.md` (environ 20 hooks)
- `prompts/06-hooks-storytelling.md` (environ 40 hooks)

Règles :
- Chaque hook se dit en 3 secondes environ : **12 mots maximum**.
- Adapté à Booty Flow et à ma cible (voir `CLAUDE.md`).
- Aucun prénom, aucun détail identifiable, aucun chiffre ou résultat inventé : mets entre crochets ce que je dois compléter (ex. « [montant] », « [durée] »).
- Pas de body shaming, pas de promesse irréaliste.

Format : trois sections (une par liste), hooks numérotés de 1 à 100. Puis donne ton **top 10 classé**, avec une ligne d'explication pour chacun.

Enregistre le tout dans `contenus/AAAA-MM-JJ-hooks-<sujet-en-quelques-mots>.md` et donne-moi le chemin du fichier. Si le sujet est vide, demande-moi le sujet.
