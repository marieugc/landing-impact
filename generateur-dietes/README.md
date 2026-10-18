# Booty Flow — Générateur de diètes 💜

Logiciel pour générer les plans alimentaires des élèves du coaching Booty Flow : fiches élèves, calcul des macros,
diète complète avec 3 variantes par repas, verrouillage, liste de courses, export PDF et sauvegarde.

**Toutes les données restent sur ton ordinateur** (dans le navigateur). Rien n'est envoyé sur Internet.
Pense à faire une **sauvegarde** régulière (menu « Sauvegarde »).

---

## Option 1 : l'utiliser en ligne, sans rien installer (le plus simple)

Une fois la pull request fusionnée et GitHub Pages activé (voir le `GUIDE.md` à la racine du dépôt), ouvre :

```
https://marieugc.github.io/landing-impact/dietes/
```

L'adresse est publique mais **les données ne le sont pas** : chaque navigateur a sa propre base, vide au départ.
Tes élèves ne sont visibles que sur ton ordinateur, dans ton navigateur.
Garde toujours le même navigateur (Chrome par exemple) et ne vide pas ses « données de site ».

## Option 2 : la lancer sur ton ordinateur

1. Installe **Node.js** (version « LTS ») depuis https://nodejs.org (clique, suivant, suivant… comme un logiciel classique).
2. Télécharge le dépôt : sur GitHub, bouton vert **Code** → **Download ZIP**, puis dézippe-le.
3. Ouvre le dossier `generateur-dietes` dans un terminal :
   - **Mac** : clic droit sur le dossier → *Services* → *Nouveau terminal au dossier*.
   - **Windows** : ouvre le dossier, clique dans la barre d'adresse, tape `cmd` puis Entrée.
4. La première fois seulement, tape : `npm install` (puis Entrée, attends la fin).
5. Pour lancer l'application, tape : `npm run dev` puis ouvre l'adresse affichée (http://localhost:5173) dans ton navigateur.
6. Pour l'arrêter : `Ctrl + C` dans le terminal.

> Les données de la version locale (localhost) et celles de la version en ligne sont **séparées**.
> Pour passer de l'une à l'autre : « Sauvegarde » → télécharger, puis importer de l'autre côté.

---

## Comment l'utiliser

1. **Mes élèves → + Nouvelle élève** : prénom, âge, sexe, taille, poids, objectif, phase, heure d'entraînement, options alimentaires.
2. Dans sa fiche, **✨ Nouvelle diète** : saisis le **total kcal jour training** et **jour repos**.
   Les macros se calculent seules (protéines g/kg, lipides g/kg, glucides = le reste) et la maintenance estimée s'affiche.
   Tu peux corriger les protéines, lipides ou glucides à la main : le reste se recalcule.
3. **✨ Générer la diète**. Chaque journée affiche 🟢 si elle est à ±20 kcal et ±3 g de chaque macro (sinon 🔴).
4. Sur chaque repas : **Variante 1 / 2 / 3**, **↻ Régénérer ce repas**, **🔒 Verrouiller**, changement d'aliment ou de grammage
   (recalcul immédiat). Après une modification à la main, **⚖ Rééquilibrer la journée** ajuste les autres repas.
5. En bas : **tableau d'équivalences**, **liste de courses** (nombre de jours training / repos), **export PDF**
   (fond clair pour l'impression ou violet néon).
6. **Aliments** : vérifie les valeurs (reprises de la table CIQUAL, à contrôler), ajoute tes marques de whey, crème de riz, compote.
7. **Réglages** : g/kg de protéines par objectif, lipides, refeed, cétogène, répartition entre les repas, nom affiché sur le PDF.
8. **Sauvegarde** : télécharge un fichier `.json` avec tout, et réimporte-le si besoin.

## Règles de calcul appliquées

- 4 kcal / g de protéines et de glucides, 9 kcal / g de lipides (les kcal sont toujours recalculées ainsi).
- Quantités pesées crues / sèches, arrondies à 5 g (1 g pour huiles et oléagineux), unités entières pour œufs et fruits entiers.
- Jour training : petit-déj, midi, pré-training (crème de riz + banane), post-training (compote + whey), collation, soir,
  placés selon l'heure d'entraînement. Jour repos : une collation libre (sans crème de riz ni whey) remplace pré et post.
- Si la journée ne tombe pas à ±20 kcal et ±3 g par macro, l'algorithme recommence (jusqu'à 50 essais) avant d'afficher.
- Variantes : équivalentes à ±2 g sur chaque macro.
- Phases : refeed (+30 % de kcal en glucides), diet break (calories à la maintenance), cétogène (30 g de glucides,
  lipides = le reste, structure jour repos) avec un jour rebond glucidique.

## Pour les curieux (technique)

React + Vite + TypeScript, stockage IndexedDB (Dexie), PDF avec jsPDF.

| Commande | Rôle |
|---|---|
| `npm run dev` | lance l'application en local |
| `npm test` | lance les tests automatiques du moteur de calcul |
| `npm run demo` | affiche une diète générée dans le terminal |
| `npm run build` | reconstruit la version en ligne dans `../dietes/` |

Le moteur de calcul est dans `src/engine/` (sans interface), les tests dans `tests/`.
Le dossier `../dietes/` est **généré** par `npm run build` : ne le modifie pas à la main.
