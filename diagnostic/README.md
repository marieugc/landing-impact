# Test « Diagnostic » Booty Flow 💜

Mini-application : quiz → diagnostic personnalisé → preuve → qualification → offres → appel Calendly.
Elle fonctionne sans serveur et sans abonnement : tu la déposes sur Netlify et c'est en ligne.

---

## 1. Ce qu'il y a dans le dossier

| Fichier | À quoi il sert | Tu y touches ? |
|---|---|---|
| `config.js` | **Tous** les textes, questions, points, diagnostics, prix et liens | ✅ Oui, c'est LE fichier à modifier |
| `assets/` | Tes images (logo, photo, transformations, aperçu du lien) | ✅ Oui, pour changer une photo |
| `index.html` | La page (et l'aperçu du lien en DM) | Seulement pour l'adresse du site (étape 4) |
| `style.css` | Les couleurs et la mise en page | Non (sauf pour changer une couleur, en haut du fichier) |
| `script.js` | Le moteur du test | Non |

---

## 2. Ajouter ou changer tes photos

Dépose tes images dans le dossier `assets/`, **avec exactement le même nom** que celle que tu remplaces :

| Fichier | Où il apparaît | Format conseillé |
|---|---|---|
| `assets/marie.jpg` | Ta photo ronde (accueil, diagnostic, offres, fin) | Carré, ton visage au centre, 400 × 400 px |
| `assets/logo.webp` | Le logo néon (en-tête + accueil) | Rectangle, environ 900 × 425 px |
| `assets/transformation-face.webp`, `assets/transformation-dos.webp` | Le carrousel avant/après | Vertical 4:5, ex. 1080 × 1350 px |
| `assets/og-image.jpg` | L'image de l'aperçu quand tu envoies le lien en DM | 1200 × 630 px |

> Si une image manque, un joli cadre lavande 💜 s'affiche à la place : rien ne casse.

**Ajouter une transformation au carrousel** : dans `config.js`, section `11. ÉCRAN PREUVE`, copie un bloc
`{ src: …, alt: …, legende: …, texte: … },`, colle-le juste en dessous, puis change le nom de l'image et les textes.
Dépose l'image dans `assets/`. Les points et les flèches du carrousel s'ajoutent tout seuls.
Si ta photo est plus large que haute (deux photos côte à côte, par exemple), ajoute la ligne `format: "paysage",` dans son bloc :
elle s'affichera entière, sans être recadrée (comme celle de Maria).

---

## 3. Modifier un texte, une question ou un prix

Ouvre `config.js` avec n'importe quel éditeur de texte (Bloc-notes, TextEdit en « texte brut », ou directement sur GitHub avec le crayon ✏️).

Les règles d'or :
1. Ne modifie que ce qui est **entre les guillemets** `"…"`.
2. Ne supprime ni les virgules en fin de ligne, ni les accolades `{ }`.
3. Pour mettre en gras : `<strong>mot</strong>`.
4. Si tu veux une apostrophe, écris-la normalement (`t'entraînes`) : les textes sont entre guillemets doubles.
5. Enregistre, puis recharge la page pour vérifier.

### Exemples

**Changer un prix** (section `14. ÉCRAN OFFRES`) :
```js
prix: "1200 €",
paiement: "payable en 3 ou 4 fois"
```

**Changer le texte d'une réponse** : modifie seulement le `label`.
```js
{ valeur: "moins6", label: "Moins de 6 mois", points: { E: 2 } },
```
⚠️ Ne change pas la `valeur` : elle sert à la logique du diagnostic.

**Ajouter ton lien YouTube** (section `1. MARQUE & LIENS`) :
```js
youtubeUrl: "https://youtube.com/@tachaine"
```

**Activer la capture prénom + e-mail** (section `8. CAPTURE`) : passe `actif: false` à `actif: true`.
- Avec ton propre outil (Make, Zapier, Google Sheets…) : colle l'adresse de ton webhook dans `webhookUrl`.
- Avec Tally : mets `mode: "tally"` et colle le lien de ton formulaire dans `tallyUrl`.
  Tally reçoit aussi `objectif` et `pilier` si tu crées ces deux « hidden fields » dans ton formulaire.

---

## 4. Comment le diagnostic est calculé

Chaque réponse ajoute des **points « à corriger »** sur 3 piliers : **E** (Entraînement), **A** (Alimentation), **S** (Suivi).
Exemple : `points: { E: 3, S: 1 }` = +3 en Entraînement, +1 en Suivi.

Pour chaque pilier, le test calcule un pourcentage : points obtenus ÷ maximum possible sur son parcours.
- 0 à 30 % → **À optimiser** (jauge verte)
- 31 à 60 % → **À structurer** (jauge orange)
- 61 à 100 % → **Point bloquant** (jauge rose néon)

La **priorité n°1** est le pilier au pourcentage le plus élevé. Un petit `bonusPriorite` (section `9.`) aide à départager :
pour l'objectif fessiers, l'entraînement ciblé passe devant à score proche.
Tous ces réglages sont dans `config.js`, section `9. LOGIQUE DE DIAGNOSTIC`.

Les textes du diagnostic (section `10.`) ont une partie toujours affichée (`texte`) et des **ajouts**
affichés seulement selon les réponses, par exemple :
```js
{ si: { question: "regimes", valeurs: ["plusieurs", "unefois"] }, texte: "…remonter progressivement tes calories…" }
```

**Qualification** (section `12.`) : la personne voit directement les offres seulement si
« Oui, totalement » + « Maintenant / Dans les prochaines semaines » + « Oui ».
Sinon, elle arrive sur l'écran « Pas encore prête », avec un lien discret vers les formules.

**Calendly** : le bouton « Réserver mon appel » reste grisé tant qu'aucune formule n'est choisie ET que la case n'est pas cochée.
C'est le seul accès à ton agenda dans tout le test.

---

## 5. Recevoir les infos dans Calendly (à faire une fois)

1. Dans Calendly, ouvre ton événement **Nouvelle réunion** → **Questions pour les invités**.
2. Ajoute 3 questions (texte sur une ligne), **dans cet ordre** :
   1. Formule choisie
   2. Objectif
   3. Pilier prioritaire
3. Enregistre. Elles seront pré-remplies automatiquement, et tu les verras dans chaque réservation.
   Exemple : « Coaching Transformation 6 mois (1200 €) » · « Développement des fessiers » · « Entraînement · Point bloquant ».

---

## 6. Mettre en ligne sur Netlify (glisser-déposer, gratuit)

1. Télécharge ce dossier `diagnostic` sur ton ordinateur
   (sur GitHub : bouton vert **Code** → **Download ZIP**, puis décompresse le fichier).
2. Va sur **https://app.netlify.com/drop** et crée un compte gratuit (avec ton e-mail ou Google).
3. **Glisse le dossier `diagnostic`** (le dossier entier, pas les fichiers un par un) dans la zone
   « Drag and drop your site output folder here ».
4. Attends quelques secondes : Netlify te donne une adresse du type `https://nom-au-hasard.netlify.app`.
5. Renomme-la : **Site configuration** → **Change site name** → par exemple `bootyflow-diagnostic`.
   Ton lien devient `https://bootyflow-diagnostic.netlify.app`.
6. **Pour un bel aperçu en DM** : ouvre `index.html`, cherche les 3 lignes contenant
   `https://marieugc.github.io/landing-impact/diagnostic/` et remplace ce début d'adresse par la tienne
   (ex. `https://bootyflow-diagnostic.netlify.app/`). Garde la fin `assets/og-image.jpg`.
7. **Mettre à jour plus tard** : dans Netlify, onglet **Deploys**, glisse à nouveau le dossier dans la zone
   « Need to update your site? Drag and drop… ». L'adresse ne change pas.
8. Colle ton lien dans ManyChat (réponse au mot-clé **RÉSULTAT**). C'est en ligne 💜

> Astuce : après une modification, si ton téléphone affiche encore l'ancienne version, augmente le numéro
> `?v=1` en `?v=2` dans `index.html` (sur les 3 lignes `style.css`, `config.js`, `script.js`).

---

## 7. Tester avant de partager

Ouvre le lien sur ton téléphone et fais les 3 parcours (gras, muscle, fessiers), puis :
- réponds « Plus tard » à la qualification → tu dois voir l'écran « Pas encore prête » ;
- sur les offres, vérifie que le bouton reste grisé tant que tu n'as pas choisi une formule ET coché la case.
