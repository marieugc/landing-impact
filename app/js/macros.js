// MACROS : lit les calories et macros (protéines, glucides, lipides) dans un PDF nutrition,
// pour pré-remplir le plan de l'élève quand la coach dépose un nouveau PDF.
// Fonctionne avec les PDF « texte » (Word, Canva, Google Docs…), pas avec les PDF scannés (images).

const NOMBRE = '(\\d{1,4}(?:[.,]\\d+)?)';
const sep = '\\s*(?:totales?|totaux|par jour|/ ?jour|journali[eè]res?|cibles?|objectifs?|\\(g\\)|\\(kcal\\))?\\s*[:=\\-–]?\\s*';

const MOTIFS = {
  kcal: [
    new RegExp(`(?:calories|kcal|energie|apport (?:calorique|energetique))${sep}${NOMBRE}`, 'g'),
    new RegExp(`${NOMBRE}\\s*(?:kcal|calories|cal)\\b`, 'g')
  ],
  proteines: [
    new RegExp(`(?:proteines?|prot\\.?|proteins?)${sep}${NOMBRE}`, 'g'),
    new RegExp(`${NOMBRE}\\s*g\\s*(?:de\\s*)?(?:proteines?|prot\\b)`, 'g'),
    new RegExp(`\\bp\\s*[:=]\\s*${NOMBRE}\\s*g?\\b`, 'g')
  ],
  glucides: [
    new RegExp(`(?:glucides?|carbs?|carbohydrates?|hydrates de carbone)${sep}${NOMBRE}`, 'g'),
    new RegExp(`${NOMBRE}\\s*g\\s*(?:de\\s*)?(?:glucides?|carbs?)`, 'g'),
    new RegExp(`\\bg\\s*[:=]\\s*${NOMBRE}\\s*g?\\b`, 'g')
  ],
  lipides: [
    new RegExp(`(?:lipides?|graisses?|matieres? grasses?|fats?)${sep}${NOMBRE}`, 'g'),
    new RegExp(`${NOMBRE}\\s*g\\s*(?:de\\s*)?(?:lipides?|graisses?)`, 'g'),
    new RegExp(`\\bl\\s*[:=]\\s*${NOMBRE}\\s*g?\\b`, 'g')
  ]
};
// Valeurs plausibles pour une journée (évite de prendre un numéro de page ou un poids d'aliment)
const BORNES = { kcal: [800, 6000], proteines: [30, 400], glucides: [20, 900], lipides: [15, 300] };

function normaliser(texte) {
  return texte.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/(\d) (\d{3})(?!\d)/g, '$1$2'); // « 1 850 kcal » → « 1850 kcal »
}

// Un PDF peut donner les macros repas par repas puis le total du jour : on garde la plus grande valeur
// plausible, qui correspond au total journalier.
export function extraireMacros(texteBrut) {
  const texte = normaliser(texteBrut);
  const resultat = {};
  for (const [cle, motifs] of Object.entries(MOTIFS)) {
    const [min, max] = BORNES[cle];
    const valeurs = [];
    for (const motif of motifs) {
      for (const m of texte.matchAll(motif)) {
        const v = Number(m[1].replace(',', '.'));
        if (v >= min && v <= max) valeurs.push(v);
      }
      if (valeurs.length) break;
    }
    if (valeurs.length) resultat[cle] = Math.round(Math.max(...valeurs));
  }
  if (!resultat.kcal && resultat.proteines && resultat.glucides && resultat.lipides) {
    resultat.kcal = kcalDepuisMacros(resultat);
    resultat.kcalCalculees = true;
  }
  return resultat;
}

export function kcalDepuisMacros({ proteines = 0, glucides = 0, lipides = 0 }) {
  return Math.round(4 * proteines + 4 * glucides + 9 * lipides);
}

let pdfjs = null;
async function chargerPdfjs() {
  if (!pdfjs) {
    pdfjs = await import('../vendor/pdfjs/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
  }
  return pdfjs;
}

export async function lireMacrosPdf(fichier) {
  const lib = await chargerPdfjs();
  const pdf = await lib.getDocument({ data: await fichier.arrayBuffer() }).promise;
  let texte = '';
  for (let i = 1; i <= Math.min(pdf.numPages, 15); i++) {
    const contenu = await (await pdf.getPage(i)).getTextContent();
    texte += contenu.items.map((it) => it.str + (it.hasEOL ? '\n' : ' ')).join('') + '\n';
  }
  return { ...extraireMacros(texte), texteTrouve: texte.trim().length > 0 };
}
