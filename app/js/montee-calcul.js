// MONTÉE EN GAMME — calculs (sans affichage, testés par app/tests/montee.test.mjs) :
// détection de plateau sur les exercices principaux et bilan de fin de cycle.

const JOUR = 864e5;
const versDate = (d) => new Date(`${String(d).slice(0, 10)}T12:00:00Z`);
const ecartJours = (a, b) => Math.round((versDate(a) - versDate(b)) / JOUR);
export const normaliser = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

// Exercices principaux du programme (cochés « principal » par la coach), sans doublon
export function exercicesPrincipaux(seances = []) {
  const vus = new Map();
  for (const s of seances) for (const ex of s.exercices || []) {
    if (ex.principal && ex.nom && !vus.has(normaliser(ex.nom))) vus.set(normaliser(ex.nom), ex.nom);
  }
  return [...vus.values()];
}

// Plateau : sur chaque exercice principal suivi, la meilleure charge des 4 dernières semaines
// ne dépasse pas la meilleure charge d'avant. Il faut au moins 5 semaines d'historique et une charge
// notée dans les 14 derniers jours (sinon on ne sait pas).
export function detecterPlateau(charges = [], principaux = [], aujourdhui = new Date().toISOString().slice(0, 10), { semaines = 4 } = {}) {
  const fenetre = semaines * 7;
  const suivis = [];
  for (const nom of principaux) {
    const liste = charges.filter((c) => normaliser(c.exercice) === normaliser(nom) && Number(c.poids) > 0);
    if (!liste.length) continue;
    const premiere = liste.reduce((m, c) => (c.date < m ? c.date : m), liste[0].date);
    const derniere = liste.reduce((m, c) => (c.date > m ? c.date : m), liste[0].date);
    if (ecartJours(aujourdhui, premiere) < fenetre + 7 || ecartJours(aujourdhui, derniere) > 14) continue;
    const recentes = liste.filter((c) => ecartJours(aujourdhui, c.date) < fenetre);
    const avant = liste.filter((c) => ecartJours(aujourdhui, c.date) >= fenetre);
    if (!recentes.length || !avant.length) continue;
    const recordAvant = Math.max(...avant.map((c) => Number(c.poids)));
    const recordRecent = Math.max(...recentes.map((c) => Number(c.poids)));
    suivis.push({ exercice: nom, recordAvant, recordRecent, progresse: recordRecent > recordAvant });
  }
  return { plateau: suivis.length > 0 && suivis.every((s) => !s.progresse), exercices: suivis };
}

// Bilan de fin de cycle : séances, poids, mensurations et charges entre le début du cycle et aujourd'hui
export function bilanCycle({ debut, fin = new Date().toISOString().slice(0, 10), seances = [], faites = [], pesees = [], releves = [], charges = [], principaux = [] }) {
  const dans = (d) => String(d).slice(0, 10) >= debut && String(d).slice(0, 10) <= fin;
  const total = seances.length * 12;
  const nbFaites = faites.filter((f) => f.statut !== 'sautee').length;
  const nbSautees = faites.filter((f) => f.statut === 'sautee').length;
  // Poids : dernière pesée avant le début (ou la première du cycle) → dernière pesée
  const triees = [...pesees].sort((a, b) => a.date.localeCompare(b.date));
  const poidsDebut = [...triees].reverse().find((p) => p.date <= debut) || triees.find((p) => dans(p.date));
  const poidsFin = [...triees].reverse().find((p) => p.date <= fin);
  // Mensurations : premier et dernier relevé du cycle (ou le dernier avant le cycle comme point de départ)
  const rel = [...releves].sort((a, b) => a.date.localeCompare(b.date));
  const relDebut = [...rel].reverse().find((r) => r.date <= debut) || rel.find((r) => dans(r.date));
  const relFin = [...rel].reverse().find((r) => r.date <= fin);
  const mesures = relDebut && relFin && relDebut !== relFin
    ? ['tour_taille', 'hanches', 'fessiers', 'cuisse', 'bras'].filter((k) => relDebut[k] != null && relFin[k] != null)
      .map((k) => ({ cle: k, debut: Number(relDebut[k]), fin: Number(relFin[k]), ecart: Math.round((relFin[k] - relDebut[k]) * 10) / 10 }))
    : [];
  // Charges : première charge du cycle → meilleure charge du cycle, sur chaque exercice principal
  const chargesCycle = principaux.map((nom) => {
    const liste = charges.filter((c) => normaliser(c.exercice) === normaliser(nom) && dans(c.date)).sort((a, b) => a.date.localeCompare(b.date));
    if (!liste.length) return null;
    const depart = Number(liste[0].poids), record = Math.max(...liste.map((c) => Number(c.poids)));
    return { exercice: nom, depart, record, gain: Math.round((record - depart) * 10) / 10, pourcent: depart ? Math.round(((record - depart) / depart) * 100) : 0 };
  }).filter(Boolean);
  return {
    seances: { total, faites: nbFaites, sautees: nbSautees, regularite: total ? Math.round((nbFaites / total) * 100) : 0 },
    poids: poidsDebut && poidsFin ? { debut: Number(poidsDebut.poids), fin: Number(poidsFin.poids), ecart: Math.round((poidsFin.poids - poidsDebut.poids) * 10) / 10 } : null,
    mesures,
    charges: chargesCycle
  };
}
