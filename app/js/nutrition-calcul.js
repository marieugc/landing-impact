// CALCULATEUR NUTRITION « BOOTY FLOW APP » : besoins (kcal, protéines, glucides, lipides) et journées types.
// Aucun chiffre n'est codé en dur ailleurs : tout vient des réglages de la coach (espace coach › Nutrition App),
// et REGLAGES_DEFAUT ne sert que de point de départ (mêmes valeurs que supabase/nutrition-app.sql).

export const REGLAGES_DEFAUT = {
  coefficients: {
    // Dépense de base : formule de Mifflin-St Jeor (femme) = 10 × poids + 6,25 × taille − 5 × âge − 161
    mifflin_constante: -161,
    // Multiplicateur d'activité selon le nombre de séances par semaine
    activite_3_seances: 1.45,
    activite_4_seances: 1.55,
    // Objectif : écart par rapport à la dépense (kcal / jour, en moyenne sur la semaine)
    deficit_perte_de_gras: 500,
    surplus_prise_de_muscle: 500,
    // Macros
    proteines_g_kg: 2,
    lipides_g_kg: 0.9,
    // Les jours d'entraînement reçoivent ce supplément (en glucides) ; les jours off sont baissés d'autant
    // sur la semaine, pour garder la même moyenne
    bonus_jour_training_kcal: 150,
    // Garde-fous
    kcal_minimum: 1200,
    glucides_minimum_g: 50
  },
  // Valeurs pour 100 g (poids indiqué : cru ou cuit). pas = arrondi des quantités ; unite = « g » ou un mot (œuf, banane)
  aliments: [
    { id: 'poulet', nom: 'Blanc de poulet', etat: 'cru', categorie: 'proteine', kcal: 110, proteines: 23, glucides: 0, lipides: 1.5, pas: 50 },
    { id: 'dinde', nom: 'Escalope de dinde', etat: 'cru', categorie: 'proteine', kcal: 107, proteines: 23, glucides: 0, lipides: 1.5, pas: 50 },
    { id: 'boeuf5', nom: 'Bœuf haché 5 %', etat: 'cru', categorie: 'proteine', kcal: 125, proteines: 21, glucides: 0, lipides: 5, pas: 50 },
    { id: 'saumon', nom: 'Saumon', etat: 'cru', categorie: 'proteine', kcal: 200, proteines: 20, glucides: 0, lipides: 13, pas: 50 },
    { id: 'cabillaud', nom: 'Cabillaud', etat: 'cru', categorie: 'proteine', kcal: 80, proteines: 18, glucides: 0, lipides: 0.7, pas: 50 },
    { id: 'oeuf', nom: 'Œuf', etat: '', categorie: 'proteine', kcal: 140, proteines: 12.5, glucides: 0.7, lipides: 10, pas: 1, unite: 'œuf', poids_unite: 60 },
    { id: 'skyr', nom: 'Skyr nature', etat: '', categorie: 'proteine', kcal: 60, proteines: 10, glucides: 4, lipides: 0.2, pas: 50 },
    { id: 'fromage_blanc', nom: 'Fromage blanc 0 %', etat: '', categorie: 'proteine', kcal: 45, proteines: 7.5, glucides: 4, lipides: 0.1, pas: 50 },
    { id: 'whey', nom: 'Whey', etat: '', categorie: 'proteine', kcal: 380, proteines: 80, glucides: 6, lipides: 5, pas: 10 },
    { id: 'riz', nom: 'Riz basmati', etat: 'cuit', categorie: 'glucide', kcal: 130, proteines: 2.7, glucides: 28, lipides: 0.3, pas: 50 },
    { id: 'pates', nom: 'Pâtes', etat: 'cuit', categorie: 'glucide', kcal: 150, proteines: 5.5, glucides: 30, lipides: 0.9, pas: 50 },
    { id: 'pdt', nom: 'Pommes de terre', etat: 'cuit', categorie: 'glucide', kcal: 80, proteines: 2, glucides: 17, lipides: 0.1, pas: 50 },
    { id: 'patate_douce', nom: 'Patate douce', etat: 'cuit', categorie: 'glucide', kcal: 86, proteines: 1.6, glucides: 20, lipides: 0.1, pas: 50 },
    { id: 'avoine', nom: 'Flocons d\'avoine', etat: '', categorie: 'glucide', kcal: 370, proteines: 13, glucides: 60, lipides: 7, pas: 10 },
    { id: 'pain', nom: 'Pain complet', etat: '', categorie: 'glucide', kcal: 250, proteines: 9, glucides: 45, lipides: 3.5, pas: 25 },
    { id: 'banane', nom: 'Banane', etat: '', categorie: 'glucide', kcal: 90, proteines: 1, glucides: 20, lipides: 0.3, pas: 1, unite: 'banane', poids_unite: 120 },
    { id: 'fruits_rouges', nom: 'Fruits rouges', etat: '', categorie: 'fruit', kcal: 50, proteines: 1, glucides: 9, lipides: 0.3, pas: 50 },
    { id: 'legumes', nom: 'Légumes verts', etat: '', categorie: 'legume', kcal: 30, proteines: 2, glucides: 4, lipides: 0.3, pas: 50 },
    { id: 'huile', nom: 'Huile d\'olive', etat: '', categorie: 'lipide', kcal: 900, proteines: 0, glucides: 0, lipides: 100, pas: 5 },
    { id: 'amandes', nom: 'Amandes', etat: '', categorie: 'lipide', kcal: 600, proteines: 21, glucides: 9, lipides: 52, pas: 10 },
    { id: 'avocat', nom: 'Avocat', etat: '', categorie: 'lipide', kcal: 160, proteines: 2, glucides: 2, lipides: 15, pas: 50 },
    { id: 'beurre_cacahuete', nom: 'Beurre de cacahuète', etat: '', categorie: 'lipide', kcal: 600, proteines: 25, glucides: 15, lipides: 50, pas: 10 }
  ],
  // Journées types : chaque repas reçoit une part de la journée (%). Rôle de chaque aliment :
  // proteine / glucide / lipide = quantité calculée pour atteindre la part du repas ; fixe = quantité donnée
  journees: {
    training: [
      { nom: 'Petit-déjeuner', heure: '8h', part: 25, aliments: [
        { aliment: 'skyr', role: 'proteine' }, { aliment: 'avoine', role: 'glucide' },
        { aliment: 'fruits_rouges', role: 'fixe', quantite: 100 }, { aliment: 'amandes', role: 'lipide' }] },
      { nom: 'Déjeuner', heure: '12h30', part: 30, aliments: [
        { aliment: 'poulet', role: 'proteine' }, { aliment: 'riz', role: 'glucide' },
        { aliment: 'legumes', role: 'fixe', quantite: 200 }, { aliment: 'huile', role: 'lipide' }] },
      { nom: 'Collation avant la séance', heure: '16h30', part: 15, aliments: [
        { aliment: 'whey', role: 'proteine' }, { aliment: 'banane', role: 'glucide' }] },
      { nom: 'Dîner', heure: '20h', part: 30, aliments: [
        { aliment: 'saumon', role: 'proteine' }, { aliment: 'pdt', role: 'glucide' },
        { aliment: 'legumes', role: 'fixe', quantite: 200 }, { aliment: 'huile', role: 'lipide' }] }
    ],
    off: [
      { nom: 'Petit-déjeuner', heure: '8h', part: 25, aliments: [
        { aliment: 'oeuf', role: 'proteine' }, { aliment: 'pain', role: 'glucide' },
        { aliment: 'fruits_rouges', role: 'fixe', quantite: 100 }, { aliment: 'avocat', role: 'lipide' }] },
      { nom: 'Déjeuner', heure: '12h30', part: 35, aliments: [
        { aliment: 'dinde', role: 'proteine' }, { aliment: 'pates', role: 'glucide' },
        { aliment: 'legumes', role: 'fixe', quantite: 200 }, { aliment: 'huile', role: 'lipide' }] },
      { nom: 'Collation', heure: '16h30', part: 10, aliments: [
        { aliment: 'skyr', role: 'proteine' }, { aliment: 'fruits_rouges', role: 'fixe', quantite: 100 }] },
      { nom: 'Dîner', heure: '20h', part: 30, aliments: [
        { aliment: 'cabillaud', role: 'proteine' }, { aliment: 'patate_douce', role: 'glucide' },
        { aliment: 'legumes', role: 'fixe', quantite: 200 }, { aliment: 'huile', role: 'lipide' }] }
    ]
  }
};

const nb = (v, defaut = 0) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : defaut);

// ───────────── Besoins ─────────────
// profil : { poids, taille, age, seances_semaine, objectif } ; renvoie les besoins des jours training et off
export function besoins(profil, coefficients = REGLAGES_DEFAUT.coefficients) {
  const c = { ...REGLAGES_DEFAUT.coefficients, ...coefficients };
  const poids = nb(profil.poids), taille = nb(profil.taille), age = nb(profil.age);
  if (!poids || !taille || !age) return null;
  const seances = nb(profil.seances_semaine, 3);
  const base = 10 * poids + 6.25 * taille - 5 * age + nb(c.mifflin_constante);
  const activite = nb(seances >= 4 ? c.activite_4_seances : c.activite_3_seances, 1.5);
  const depense = base * activite;
  const ecart = profil.objectif === 'prise_de_muscle' ? nb(c.surplus_prise_de_muscle) : -nb(c.deficit_perte_de_gras);
  const moyenne = Math.max(nb(c.kcal_minimum), depense + ecart);
  const joursOff = Math.max(1, 7 - seances);
  const bonus = nb(c.bonus_jour_training_kcal);
  const proteines = poids * nb(c.proteines_g_kg);
  const lipides = poids * nb(c.lipides_g_kg);
  const jour = (kcal) => {
    const glucides = Math.max(nb(c.glucides_minimum_g), (kcal - proteines * 4 - lipides * 9) / 4);
    return {
      kcal: Math.round(proteines * 4 + lipides * 9 + glucides * 4),
      proteines: Math.round(proteines), glucides: Math.round(glucides), lipides: Math.round(lipides)
    };
  };
  return {
    base: Math.round(base), depense: Math.round(depense), ecart, moyenne: Math.round(moyenne),
    training: jour(Math.max(nb(c.kcal_minimum), moyenne + bonus)),
    off: jour(Math.max(nb(c.kcal_minimum), moyenne - (bonus * seances) / joursOff))
  };
}

// ───────────── Journée type ─────────────
// Arrondi « chiffre rond » : multiple du pas de l'aliment (50 g → 100, 150, 200 g ; jamais 165 ou 168)
export function arrondir(quantite, pas = 50) {
  const p = nb(pas, 50) || 50;
  if (!(quantite > 0)) return 0;
  return Math.max(p, Math.round(quantite / p) * p);
}

const macros = (a, q) => ({
  kcal: (a.kcal * q) / 100, proteines: (a.proteines * q) / 100, glucides: (a.glucides * q) / 100, lipides: (a.lipides * q) / 100
});
const somme = (liste) => liste.reduce((t, m) => ({
  kcal: t.kcal + m.kcal, proteines: t.proteines + m.proteines, glucides: t.glucides + m.glucides, lipides: t.lipides + m.lipides
}), { kcal: 0, proteines: 0, glucides: 0, lipides: 0 });
const CLE_ROLE = { proteine: 'proteines', glucide: 'glucides', lipide: 'lipides' };

// Un aliment compté à l'unité (œuf, banane) : quantité en grammes ↔ nombre d'unités
const enGrammes = (a, q) => (a.unite && a.unite !== 'g' ? q * nb(a.poids_unite, 100) : q);

// besoinsJour : { proteines, glucides, lipides } ; repas : modèle de la coach ; aliments : table des aliments
export function journeeType(besoinsJour, repas = [], aliments = REGLAGES_DEFAUT.aliments) {
  const parId = new Map(aliments.map((a) => [a.id, a]));
  const totalParts = repas.reduce((t, r) => t + nb(r.part), 0) || 1;
  const resultat = repas.map((r) => {
    const part = nb(r.part) / totalParts;
    const cible = { proteines: besoinsJour.proteines * part, glucides: besoinsJour.glucides * part, lipides: besoinsJour.lipides * part };
    const lignes = (r.aliments || []).map((x) => ({ ...x, a: parId.get(x.aliment) })).filter((x) => x.a);
    // Quantités en grammes : fixes d'abord, puis chaque source ajustée à son macro (quelques passes, car un aliment
    // apporte un peu des autres macros : l'avoine a des protéines, le saumon des lipides…)
    const q = lignes.map((x) => (x.role === 'fixe' ? enGrammes(x.a, nb(x.quantite)) : 0));
    for (let passe = 0; passe < 8; passe++) {
      lignes.forEach((x, i) => {
        const cle = CLE_ROLE[x.role];
        if (!cle || !x.a[cle]) return;
        const autres = somme(lignes.map((y, j) => (j === i ? macros(y.a, 0) : macros(y.a, q[j]))));
        // Deux aliments au même rôle dans un repas se partagent le besoin
        const memeRole = lignes.filter((y) => y.role === x.role).length;
        q[i] = Math.max(0, ((cible[cle] - autres[cle]) / memeRole) * 100 / x.a[cle]);
      });
    }
    const items = lignes.map((x, i) => {
      const unitaire = x.a.unite && x.a.unite !== 'g';
      const valeur = unitaire ? q[i] / nb(x.a.poids_unite, 100) : q[i];
      // Chaque aliment prévu garde au moins un pas (même si un autre aliment couvre déjà son macro)
      const pas = nb(x.a.pas, unitaire ? 1 : 50) || 1;
      const arrondi = x.role === 'fixe' ? nb(x.quantite) : Math.max(pas, unitaire ? Math.round(valeur / pas) * pas : arrondir(valeur, pas));
      const grammes = unitaire ? arrondi * nb(x.a.poids_unite, 100) : arrondi;
      return { aliment: x.a, role: x.role, quantite: arrondi, unite: unitaire ? x.a.unite : 'g', grammes, ...arrondis(macros(x.a, grammes)) };
    });
    return { nom: r.nom, heure: r.heure, items };
  });
  ajuster(resultat, besoinsJour);
  for (const r of resultat) {
    r.items = r.items.filter((x) => x.quantite > 0);
    r.total = arrondis(somme(r.items));
  }
  return { repas: resultat, total: arrondis(somme(resultat.map((r) => r.total))) };
}

// Après les arrondis, la journée peut s'écarter de la cible : on ajoute ou retire un « pas » (50 g de riz, 1 œuf…)
// aux aliments calculés, tant que ça rapproche la journée de ses macros. Les quantités restent des chiffres ronds.
function ajuster(repas, cible) {
  const items = repas.flatMap((r) => r.items).filter((x) => CLE_ROLE[x.role]);
  const pasDe = (x) => nb(x.aliment.pas, x.unite === 'g' ? 50 : 1) || 1;
  const fixer = (x, quantite) => {
    x.quantite = quantite;
    x.grammes = x.unite === 'g' ? quantite : quantite * nb(x.aliment.poids_unite, 100);
    Object.assign(x, arrondis(macros(x.aliment, x.grammes)));
  };
  // Écart relatif total sur les trois macros (chaque macro pèse selon ses kcal)
  const erreur = () => {
    const t = somme(repas.flatMap((r) => r.items));
    return Math.abs(t.proteines - cible.proteines) * 4 + Math.abs(t.glucides - cible.glucides) * 4 + Math.abs(t.lipides - cible.lipides) * 9;
  };
  for (let tour = 0; tour < 30; tour++) {
    const avant = erreur();
    let meilleur = null;
    for (const x of items) {
      for (const sens of [-1, 1]) {
        const ancienne = x.quantite;
        const nouvelle = ancienne + sens * pasDe(x);
        // Un aliment prévu par la coach ne disparaît jamais : au moins un pas (50 g, 1 œuf…)
        if (nouvelle < pasDe(x)) continue;
        fixer(x, nouvelle);
        const gain = avant - erreur();
        fixer(x, ancienne);
        if (gain > 1 && (!meilleur || gain > meilleur.gain)) meilleur = { x, nouvelle, gain };
      }
    }
    if (!meilleur) break;
    fixer(meilleur.x, meilleur.nouvelle);
  }
}
function arrondis(m) {
  return { kcal: Math.round(m.kcal), proteines: Math.round(m.proteines), glucides: Math.round(m.glucides), lipides: Math.round(m.lipides) };
}

// « 150 g de riz basmati (poids cuit) », « 2 œufs »
export function libelleQuantite(item) {
  const a = item.aliment;
  if (item.unite !== 'g') return `${item.quantite} ${a.nom.toLowerCase()}${item.quantite > 1 && !/s$/.test(a.nom) ? 's' : ''}`;
  const etat = a.etat === 'cuit' ? ' (poids cuit)' : a.etat === 'cru' ? ' (poids cru)' : '';
  const nom = `${a.nom.charAt(0).toLowerCase()}${a.nom.slice(1)}`;
  return `${item.quantite} g ${/^[aeiouyhéèêœ]/i.test(nom) ? 'd\'' : 'de '}${nom}${etat}`;
}
