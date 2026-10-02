# Tunnel « RECOMP » · Booty Flow 💜

Mini web-app pour le lien envoyé en DM à chaque personne qui commente **RECOMP** :
accroche → mythe → quiz (6 questions) → profil personnalisé → transformation → offre → réservation Calendly.

## Les fichiers

```
recomp/
├── index.html      ← la structure de la page + l'aperçu du lien (Open Graph)
├── style.css       ← le design (couleurs en haut du fichier)
├── script.js       ← la logique (tu n'as pas besoin d'y toucher)
├── config.js       ← 👉 TOUS les textes, prix, liens et règles de profils
├── README.md       ← ce guide
└── assets/
    ├── og-image.png        ← l'image d'aperçu quand tu partages le lien
    ├── favicon.svg         ← la petite icône de l'onglet
    └── transformation.png  ← TON image avant/après (à ajouter)
```

---

## 1. Ajouter ton image avant / après

1. Prépare ton image (idéalement **verticale**, format 4:5, ex. 1080 × 1350 px, moins de 500 Ko).
2. Renomme-la exactement : **`transformation.png`** (tout en minuscules).
3. Place-la dans le dossier **`assets/`**.

C'est tout. Tant que l'image n'est pas là, un encadré élégant « Avant / Après » s'affiche à la place.

> Ton image est en `.jpg` ? Soit tu la renommes en `.png` après conversion, soit tu ouvres `config.js`, tu cherches `image: "assets/transformation.png"` et tu remplaces par `"assets/transformation.jpg"`.

---

## 2. Modifier un texte ou un prix (dans `config.js`)

1. Ouvre `config.js` avec un éditeur de texte (Bloc-notes, TextEdit en mode texte brut, ou [VS Code](https://code.visualstudio.com/)).
2. Cherche le texte à changer (Ctrl + F / Cmd + F).
3. Modifie **uniquement ce qui est entre les guillemets** `"…"`.
4. Enregistre, puis ouvre `index.html` dans ton navigateur pour vérifier.

**Exemple : changer le prix du coaching 6 mois**

```js
prix: "1200 €",
```
devient
```js
prix: "1350 €",
```

**Les règles à respecter :**
- Garde les guillemets `"` au début et à la fin, et la virgule en fin de ligne.
- Pour mettre un mot en gras : `<strong>mot</strong>`.
- Si tu veux utiliser des guillemets dans un texte, utilise « ces guillemets français ».
- Si la page devient blanche après une modification : il manque sûrement un guillemet ou une virgule. Annule ta dernière modification.

**Où trouver quoi dans `config.js` :**

| Ce que tu veux changer | Section |
|---|---|
| Titre et bouton du début | `accroche` |
| Les 3 cartes du mythe | `mythe` |
| Questions et réponses | `quiz` |
| Ordre de priorité des profils | `regles` |
| Nom, phrase et conseils de chaque profil | `profils` |
| Repère protéines, vidéo YouTube | `resultat` |
| Texte et image de la transformation | `transformation` |
| Offres, prix, badge, mention « places limitées » | `offre` |
| Lien Calendly | `calendly` |

### Comment fonctionne la logique de profils

Les règles sont testées **dans l'ordre**. La première qui correspond donne le **profil principal**, la suivante qui correspond (s'il y en a une) s'affiche en **« Point d'attention »**. Si aucune ne correspond : profil « Perdre du gras ET muscler en même temps ».

| Priorité | Profil | Condition |
|---|---|---|
| 1 | Historique de régimes restrictifs | Q4 = « Oui, plusieurs fois » |
| 2 | Cardio en excès | Q3 = « 4 ou plus » |
| 3 | Stagnation malgré l'assiduité | Q1 = « Plus d'un an » **et** Q2 = « Je stagne » |
| 4 | Débutante | Q1 = « Moins de 6 mois » |
| — | Perdre du gras ET muscler en même temps | par défaut |

Pour changer l'ordre, il suffit de déplacer les lignes dans `regles`.

### Voir le profil dans Calendly

Quand une personne clique sur « Réserver mon appel », son profil est ajouté au lien Calendly (`?a1=…`). Pour le voir :
1. Dans Calendly, ouvre ton événement **nouvelle-reunion** → **Questions d'invité**.
2. Vérifie que la **1re question personnalisée** est une question texte (ex. « Ton profil »).
3. Elle sera pré-remplie automatiquement, par exemple :
   `Profil : Cardio en excès · Attention : Stagnation malgré l'assiduité | Objectif : Surtout galber mes fessiers | Protéines : 100-125 g/j`

---

## 3. Mettre en ligne gratuitement sur Netlify (glisser-déposer)

1. Va sur **[app.netlify.com/drop](https://app.netlify.com/drop)** et crée un compte gratuit (avec ton e-mail ou Google).
2. Sur ton ordinateur, ouvre le dossier qui contient **`recomp`**.
3. **Glisse le dossier `recomp` entier** dans la zone « Drag and drop your site output folder here ».
4. Attends quelques secondes : Netlify te donne une adresse du type `https://nom-au-hasard-123.netlify.app`. Ta page est en ligne ✅
5. Pour un joli nom : **Site configuration** → **Change site name** → par exemple `bootyflow-recomp` → ton lien devient `https://bootyflow-recomp.netlify.app`.
6. **Important pour l'aperçu en DM :** ouvre `index.html`, remplace les 2 lignes `assets/og-image.png` (balises `og:image` et `twitter:image`) par l'adresse complète, ex. :
   `https://bootyflow-recomp.netlify.app/assets/og-image.png`
7. **Pour mettre à jour le site** après une modification : dans Netlify, onglet **Deploys** → glisse à nouveau le dossier `recomp` dans la zone en bas de la page. Le lien ne change pas.

> Instagram garde parfois l'ancien aperçu en mémoire. Tu peux forcer la mise à jour en testant ton lien sur le [Sharing Debugger de Facebook](https://developers.facebook.com/tools/debug/) → « Scrape Again ».

**Alternative GitHub Pages** : ce dossier étant dans ton dépôt, si GitHub Pages est activé il est aussi disponible à `https://marieugc.github.io/landing-impact/recomp/`.

---

## Tester sur ton ordinateur

Double-clique sur `index.html` : la page s'ouvre dans ton navigateur. Pour la voir en version mobile : clic droit → **Inspecter** → icône téléphone 📱 (en haut à gauche du panneau).
