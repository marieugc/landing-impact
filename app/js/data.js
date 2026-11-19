// Couche de données : l'app parle uniquement à cet objet `api`.
// - MODE DÉMO  : données fictives rangées dans le navigateur (localStorage)
// - MODE RÉEL  : Supabase (comptes, base de données, stockage des vidéos)
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const MODE = SUPABASE_URL && SUPABASE_ANON_KEY ? 'supabase' : 'demo';
// Arrivée par le lien de l'e-mail de bienvenue (compte créé après un achat sur Systeme.io) :
// lu avant que Supabase n'efface le lien de l'adresse
export const ARRIVEE_INVITATION = MODE === 'supabase' && /type=invite/.test(location.hash);

const aujourdhui = () => new Date().toISOString().slice(0, 10);
const dansJours = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

// ───────────────────────── MODE DÉMO ─────────────────────────

const CLE_DEMO = 'bootyflow-demo-v17';
const CLE_SESSION = 'bootyflow-demo-session';
const fichiersDemo = new Map(); // vidéos/photos gardées le temps de la visite

function donneesDemo() {
  const eleves = [
    ['sarah', 'Sarah', 'Galber le bas du corps', 6, 24, false, dansJours(5)],
    ['ines', 'Inès', 'Recomposition', 10, 24, false, dansJours(3)],
    ['chloe', 'Chloé', 'Prépa Wellness', 14, 24, true, dansJours(2)],
    ['lea', 'Léa', 'Prise de masse', 3, 12, false, dansJours(6)],
    ['nadia', 'Nadia', 'Perte de gras', 18, 24, false, dansJours(-2)]
  ];
  const profiles = [
    { id: 'marie', email: 'marie@demo.fr', prenom: 'Marie', role: 'coach' },
    ...eleves.map(([id, prenom, objectif, semaine, semaines_total, competitrice, prochain_bilan]) => ({
      id, email: `${id}@demo.fr`, prenom, role: 'eleve', objectif, semaine, semaines_total,
      competitrice, prochain_bilan,
      message_coach: id === 'sarah'
        ? "Super semaine Sarah ! On garde la même charge sur le hip thrust et on ajoute une série. Pense à bien boire."
        : '',
      formule: id === 'lea' ? 'autonomie' : 'personnalise', statut_abonnement: 'actif', compte_valide: true, origine: 'inscription',
      created_at: dansJours(-semaine * 7) + 'T09:00:00.000Z', derniere_activite: dansJours(-1) + 'T18:00:00.000Z'
    })),
    // Abonnées « Booty Flow App » (formule autonome, achat sur Systeme.io)
    ...[
      ['emma', 'Emma', 'actif', -10, 20, -1],
      ['jade', 'Jade', 'resilie', -25, 5, -3],
      ['clara', 'Clara', 'expire', -50, -20, -21],
      ['nina', 'Nina', 'actif', 0, 31, 0]
    ].map(([id, prenom, statut, paiement, fin, activite]) => ({
      id, email: `${id}@demo.fr`, prenom, role: 'eleve', objectif: '', semaine: 1, semaines_total: 12, competitrice: false,
      message_coach: '', prochain_bilan: null, formule: 'app', statut_abonnement: statut, compte_valide: true, origine: 'systemeio',
      dernier_paiement: dansJours(paiement) + 'T10:00:00.000Z', fin_acces: dansJours(fin) + 'T10:00:00.000Z',
      created_at: dansJours(paiement - 30) + 'T10:00:00.000Z', derniere_activite: dansJours(activite) + 'T20:00:00.000Z'
    })),
    // Compte créé avec « Créer mon compte » : attend la validation de la coach
    { id: 'zoe', email: 'zoe@demo.fr', prenom: 'Zoé', role: 'eleve', objectif: '', semaine: 1, semaines_total: 12, competitrice: false,
      message_coach: '', prochain_bilan: null, formule: 'personnalise', statut_abonnement: 'actif', compte_valide: false, origine: 'inscription',
      created_at: dansJours(0) + 'T08:00:00.000Z' }
  ];
  const repas = [
    { heure: '7h30', nom: 'Petit-déjeuner', details: "Flocons d'avoine, skyr, fruits rouges" },
    { heure: '12h30', nom: 'Déjeuner', details: 'Poulet, riz basmati, légumes verts' },
    { heure: '16h30', nom: 'Collation pré-séance', details: 'Banane, whey' },
    { heure: '20h00', nom: 'Dîner', details: 'Saumon, patate douce, salade' }
  ];
  const nutrition = Object.fromEntries(eleves.map(([id]) => [id, {
    eleve_id: id, type_jour: 'Jour entraînement', kcal: 1850, proteines: 130, glucides: 190, lipides: 60,
    repas, ajustement: "+100 kcal les jours d'entraînement", ajustement_date: dansJours(-7), pdf_chemin: null
  }]));
  const videos = [
    { id: 'v1', eleve_id: 'sarah', type: 'mouvement', exercice: 'Hip thrust', statut: 'corrige',
      retour: 'Menton rentré, bassin en rétroversion en haut du mouvement. Top !', created_at: dansJours(-2) },
    { id: 'v2', eleve_id: 'sarah', type: 'mouvement', exercice: 'Squat bulgare', statut: 'a_corriger',
      retour: null, created_at: dansJours(-1) },
    { id: 'v3', eleve_id: 'sarah', type: 'mouvement', exercice: 'Soulevé de terre roumain', statut: 'corrige',
      retour: 'Garde le dos bien neutre, pousse les fesses loin derrière.', created_at: dansJours(-6) },
    { id: 'v4', eleve_id: 'ines', type: 'mouvement', exercice: 'Fentes marchées', statut: 'a_corriger',
      retour: null, created_at: dansJours(-1) },
    { id: 'v5', eleve_id: 'chloe', type: 'posing', exercice: 'Pose 3 · Dos', statut: 'a_corriger',
      retour: null, created_at: dansJours(0) }
  ].map((v) => ({ chemin: null, ...v }));
  const bilans = [
    [72.5, 71, 97, 55.5, -41], [72.1, 70.5, 97, 56, -34], [71.8, 70, 97.5, 56, -27],
    [71.6, 69.5, 97.5, 56.5, -20], [71.3, 69, 98, 56.5, -13], [71.0, 68, 98, 57, -6]
  ].map(([poids, taille, hanches, cuisse, j], i) => ({
    id: `b${i}`, eleve_id: 'sarah', date: dansJours(j), poids, taille, hanches, cuisse,
    // État de la semaine (difficulté, énergie, récupération, sommeil, motivation) : baisse de forme sur le dernier bilan
    ...(i >= 3 ? Object.fromEntries(['difficulte', 'energie', 'recuperation', 'sommeil', 'motivation']
      .map((cle, k) => [cle, [[6, 7, 7, 8, 8], [7, 7, 6, 7, 8], [8, 4, 3, 4, 5]][i - 3][k]])) : {}),
    ressenti: '', lu: i < 5, photo_face: null, photo_profil: null, photo_dos: null,
    retour: i === 4 ? 'Super régularité Sarah ! La taille continue de baisser et les cuisses se dessinent. On garde le même plan cette semaine.' : null,
    retour_audio: null, retour_audio_duree: null, retour_photos: [], retour_le: i === 4 ? dansJours(-12) + 'T18:00:00.000Z' : null
  }));
  const competitions = {
    chloe: {
      eleve_id: 'chloe', nom: 'Championnat régional', categorie: 'Wellness', date_compet: dansJours(42), ville: 'Lyon',
      poses: ['Face', 'Profil gauche', 'Dos', 'Profil droit'].map((nom) => ({ nom })),
      checklist: [
        { label: 'Bikini et accessoires validés', fait: true },
        { label: 'Planning bronzage', fait: false },
        { label: 'Routine du matin de la compétition', fait: false }
      ]
    }
  };
  const series = {
    'Hip thrust': [60, 65, 70, 70, 75, 80],
    'Squat bulgare': [8, 10, 10, 12, 12, 14],
    'Soulevé de terre roumain': [40, 42.5, 45, 47.5, 50, 50]
  };
  const charges = Object.entries(series).flatMap(([exercice, poids]) => poids.map((kg, i) => ({
    id: `c-${exercice}-${i}`, eleve_id: 'sarah', exercice, date: dansJours(-41 + i * 7),
    poids: kg, series: 4, reps: exercice === 'Squat bulgare' ? 10 : 8, note: ''
  })));
  const heure = (jours, h) => new Date(Date.now() + jours * 864e5 - h * 36e5).toISOString();
  const messages = [
    { id: 'm1', eleve_id: 'sarah', de_coach: true, texte: "Coucou Sarah ! N'hésite pas à m'écrire ici si tu as la moindre question.", lu: true, created_at: heure(-2, 3) },
    { id: 'm2', eleve_id: 'sarah', de_coach: false, texte: 'Merci ! Je peux remplacer le riz par des pâtes le midi ?', lu: true, created_at: heure(-1, 5) },
    { id: 'm3', eleve_id: 'sarah', de_coach: true, texte: 'Oui bien sûr, même quantité une fois cuites.', lu: false, created_at: heure(-1, 4) },
    { id: 'm4', eleve_id: 'ines', de_coach: false, texte: 'Petite douleur au genou sur les fentes, je continue ou je remplace ?', lu: false, created_at: heure(0, 2) }
  ].map((m) => ({ audio_chemin: null, duree: null, ...m }));
  const bibliotheque = [
    ['Hip thrust : placement du bassin', 'Fessiers', 'Rétroversion en haut, menton rentré, tibias verticaux.', -20],
    ['Squat bulgare : distance du pied', 'Jambes', 'Comment trouver la bonne distance pour cibler les fessiers.', -12],
    ['Échauffement bas du corps (8 min)', 'Échauffement', 'À faire avant chaque séance jambes / fessiers.', -6],
    ['Soulevé de terre roumain', 'Fessiers', 'Garder le dos neutre et pousser les hanches loin derrière.', -1]
  ].map(([titre, categorie, description, j], i) => ({
    id: `bib${i}`, titre, categorie, description, chemin: null, lien: null, created_at: dansJours(j) + 'T10:00:00.000Z'
  }));
  // Sarah a ouvert la vidéothèque il y a 3 jours : la dernière vidéo est « Nouveau »
  profiles.find((p) => p.id === 'sarah').biblio_vue_le = dansJours(-3) + 'T12:00:00.000Z';
  const programmes = [
    { id: 'p1', eleve_id: 'sarah', titre: 'Bloc 1 · Semaines 1 à 4', chemin: null, nom_fichier: null, lien: null,
      description: 'Phase d\'apprentissage technique : 3 séances par semaine, charges modérées.', created_at: dansJours(-40) + 'T09:00:00.000Z' },
    { id: 'p2', eleve_id: 'sarah', titre: 'Bloc 2 · Semaines 5 à 8', chemin: null, nom_fichier: null, lien: null,
      description: 'Séance A : Hip thrust 4×8, Squat bulgare 3×10, RDL 3×10.\nSéance B : Fentes 3×12, Abduction 3×15, Kickback 3×15.\nSéance C : Full body + gainage.',
      created_at: dansJours(-2) + 'T09:00:00.000Z' }
  ];
  return { profiles, nutrition, videos, bilans, competitions, charges, messages, bibliotheque, programmes };
}

function lireDemo() {
  try {
    const brut = localStorage.getItem(CLE_DEMO);
    if (brut) return JSON.parse(brut);
  } catch (e) { /* stockage indisponible */ }
  const d = donneesDemo();
  ecrireDemo(d);
  return d;
}
function ecrireDemo(d) {
  try { localStorage.setItem(CLE_DEMO, JSON.stringify(d)); } catch (e) { /* ignore */ }
}
const id = () => Math.random().toString(36).slice(2, 10);

function garderFichier(file) {
  if (!file) return null;
  const chemin = `demo:${id()}`;
  fichiersDemo.set(chemin, URL.createObjectURL(file));
  return chemin;
}

// Même contenu que dans supabase/formules.sql
const OFFRES_DEMO = [
  { id: 'personnalise', ordre: 1, nom: 'Booty Flow Personnalisé', accroche: 'Je te suis de près, chaque semaine.', mise_en_avant: true,
    inclus: ["Programme d'entraînement 100 % personnalisé", 'Plan alimentaire personnalisé et ajusté', 'Bilan chaque semaine avec mon retour',
      'Messagerie avec moi (écrit et vocal)', 'Corrections vidéo individuelles de tes exercices', 'Vidéothèque complète', 'Suivi des charges et de ta progression'],
    non_inclus: [], prix: null, bouton: 'Réserver mon Audit' },
  { id: 'autonomie', ordre: 2, nom: 'Booty Flow Autonomie', accroche: 'Un plan sur mesure, un point chaque mois.', mise_en_avant: false,
    inclus: ["Programme d'entraînement 100 % personnalisé", 'Plan alimentaire personnalisé et ajusté', 'Bilan chaque mois avec mon retour',
      'Messagerie avec moi (écrit et vocal)', 'Corrections vidéo individuelles de tes exercices', 'Vidéothèque complète', 'Suivi des charges et de ta progression'],
    non_inclus: ['Bilan chaque semaine (1 bilan par mois)'], prix: null, bouton: 'Réserver mon Audit' },
  { id: 'app', ordre: 3, nom: 'Booty Flow App', accroche: 'Ta formule actuelle : 100 % autonome.', mise_en_avant: false,
    inclus: ['Programmes préconçus de 12 semaines', 'Vidéothèque (exercices + mindset)', 'Calculateur nutrition et journées types',
      'Suivi de progression (charges, mensurations, photos)', 'Bilan du mois avec ma réponse + 1 vidéo technique'],
    non_inclus: ['Programme et plan alimentaire personnalisés', 'Bilan chaque semaine avec ta coach', 'Messagerie et suivi individuel', 'Corrections vidéo individuelles'],
    prix: '49 €/mois', bouton: null }
];

// 12 semaines sans consigne (nouveau cycle)
export const semainesVides = () => Array.from({ length: 12 }, (_, i) => ({ numero: i + 1, consigne: '' }));

// Mode démo : programmes préconçus (chargés seulement quand on en a besoin), questionnaires et séances cochées
async function demoApp() {
  const d = lireDemo();
  if (!d.programmesApp) {
    const { PROGRAMMES_DEMO } = await import('./programmes-app-demo.js');
    d.programmesApp = PROGRAMMES_DEMO;
    const questionnaire = (uid, programme, niveau, seances, debut) => ({ eleve_id: uid, age: 31, taille: 166, poids_depart: 64, niveau,
      seances_semaine: seances, lieu: 'salle', objectif: 'perte_de_gras', programme_id: programme, cycle_numero: 1,
      debut_cycle: dansJours(debut), complete_le: dansJours(debut) + 'T10:00:00.000Z' });
    d.profilsApp = {
      emma: questionnaire('emma', 'prog2', 'intermediaire', 4, -17),
      jade: questionnaire('jade', 'prog1', 'intermediaire', 3, -40),
      clara: questionnaire('clara', 'prog3', 'avancee', 3, -80)
    };
    // Emma : semaines 1 et 2 faites, semaine 3 commencée (séance A faite)
    const emma = PROGRAMMES_DEMO[1].cycles[0].seances;
    d.seancesFaites = [1, 2].flatMap((semaine) => emma.map((s, i) => ({ id: id(), eleve_id: 'emma', seance_id: s.id, cycle_numero: 1, semaine,
      statut: 'faite', fait_le: dansJours(-17 + (semaine - 1) * 7 + i * 2) + 'T18:00:00.000Z' })));
    d.seancesFaites.push({ id: id(), eleve_id: 'emma', seance_id: emma[0].id, cycle_numero: 1, semaine: 3, statut: 'faite', fait_le: dansJours(-2) + 'T18:00:00.000Z' });
    // Jade a terminé son cycle 1 (3 séances × 12 semaines, 2 séances passées) : son bilan de cycle est prêt
    d.profilsApp.jade.debut_cycle = dansJours(-86);
    const jade = PROGRAMMES_DEMO[0].cycles[0].seances;
    for (let semaine = 1; semaine <= 12; semaine++) jade.forEach((s, i) => d.seancesFaites.push({ id: id(), eleve_id: 'jade', seance_id: s.id, cycle_numero: 1, semaine,
      statut: semaine === 6 && i === 2 || semaine === 10 && i === 1 ? 'sautee' : 'faite', fait_le: dansJours(-86 + (semaine - 1) * 7 + i * 2) + 'T18:00:00.000Z' }));
    // Charges : Emma stagne depuis 4 semaines sur ses exercices principaux (plateau), Jade a bien progressé
    const serie = (eleve, exercice, poids, fin = -2) => poids.map((kg, i) => ({ id: id(), eleve_id: eleve, exercice, date: dansJours(fin - 7 * (poids.length - 1 - i)), poids: kg, series: 4, reps: 8, note: '' }));
    d.charges.push(...serie('emma', 'Hip thrust', [60, 65, 70, 70, 70, 70, 70]), ...serie('emma', 'Squat', [40, 42.5, 45, 45, 45, 45, 45]),
      ...serie('emma', 'Soulevé de terre roumain', [40, 45, 45, 45, 45, 45, 45]),
      ...serie('jade', 'Hip thrust', [50, 55, 57.5, 60, 62.5, 65, 67.5, 70, 72.5], -3), ...serie('jade', 'Soulevé de terre roumain', [35, 37.5, 40, 42.5, 45, 47.5, 50], -3));
    // Pesées d'Emma : elle perd bien au début, puis son poids stagne (sa prochaine pesée déclenchera un ajustement)
    d.pesees = [64.2, 63.8, 63.5, 63.4].map((poids, i) => ({ id: id(), eleve_id: 'emma', date: dansJours(-28 + i * 7), poids }));
    d.pesees.push(...[64.5, 63.9, 63.1, 62.4, 61.8].map((poids, i) => ({ id: id(), eleve_id: 'jade', date: dansJours(-88 + i * 21), poids })));
    d.ajustements = [];
    // Relevés du mois d'Emma : mensurations (sans photos en démo)
    d.releves = [[-31, 70, 99, 101, 57.5, 28.5], [-3, 68.5, 98, 101.5, 56.5, 28.5]].map(([j, tour_taille, hanches, fessiers, cuisse, bras], i) =>
      ({ id: id(), eleve_id: 'emma', date: dansJours(j), tour_taille, hanches, fessiers, cuisse, bras, photo_face: null, photo_profil: null, photo_dos: null,
        ressenti: i ? 'Je me sens plus forte sur le hip thrust, un peu fatiguée en fin de semaine.' : 'Premier mois, j\'apprends les mouvements.',
        question: i ? 'Est-ce que je descends assez bas sur les fentes bulgares ?' : null, video_exercice: i ? 'Fentes bulgares' : null, video_chemin: null,
        retour: i ? null : 'Super premier mois Emma ! Ton tour de taille va bouger, garde le cap sur les protéines.',
        retour_audio: null, retour_audio_duree: null, retour_photos: [], retour_le: i ? null : dansJours(-29) + 'T18:00:00.000Z', lu: !i }));
    d.releves.push(...[[-86, 71, 100, 99.5, 58], [-4, 67.5, 98, 101, 56.5]].map(([j, tour_taille, hanches, fessiers, cuisse]) => ({ id: id(), eleve_id: 'jade', date: dansJours(j),
      tour_taille, hanches, fessiers, cuisse, bras: null, photo_face: null, photo_profil: null, photo_dos: null, ressenti: null, question: null, video_exercice: null,
      video_chemin: null, retour: null, retour_audio: null, retour_audio_duree: null, retour_photos: [], retour_le: null, lu: true })));
    ecrireDemo(d);
  }
  return d;
}

const demo = {
  async getSession() {
    try {
      const uid = localStorage.getItem(CLE_SESSION);
      return uid ? { userId: uid } : null;
    } catch (e) { return null; }
  },
  async signIn(email) {
    const p = lireDemo().profiles.find((x) => x.email === email.trim().toLowerCase());
    if (!p) throw new Error('Compte démo inconnu. Utilise sarah@demo.fr (élève) ou marie@demo.fr (coach).');
    localStorage.setItem(CLE_SESSION, p.id);
  },
  async signUp(email, _mdp, prenom) {
    const d = lireDemo();
    email = email.trim().toLowerCase();
    if (d.profiles.some((x) => x.email === email)) throw new Error('Un compte existe déjà avec cette adresse.');
    const p = { id: id(), email, prenom, role: 'eleve', objectif: '', semaine: 1, semaines_total: 12,
      competitrice: false, message_coach: '', prochain_bilan: null, created_at: new Date().toISOString(),
      formule: 'personnalise', statut_abonnement: 'actif', compte_valide: false, origine: 'inscription' };
    d.profiles.push(p);
    ecrireDemo(d);
    localStorage.setItem(CLE_SESSION, p.id);
    return { confirmationRequise: false };
  },
  async signOut() { localStorage.removeItem(CLE_SESSION); },
  async resetPassword() { /* rien en démo */ },
  async updatePassword() { /* rien en démo */ },
  onRecovery() { /* rien en démo */ },
  reinitialiserDemo() { localStorage.removeItem(CLE_DEMO); },

  async getProfile(uid) { return lireDemo().profiles.find((p) => p.id === uid) || null; },
  async updateProfile(uid, patch) {
    const d = lireDemo();
    Object.assign(d.profiles.find((p) => p.id === uid), patch);
    ecrireDemo(d);
  },
  async listEleves() {
    return lireDemo().profiles.filter((p) => p.role === 'eleve').sort((a, b) => a.prenom.localeCompare(b.prenom));
  },
  async marquerActivite() {
    const d = lireDemo();
    const p = d.profiles.find((x) => x.id === localStorage.getItem(CLE_SESSION));
    if (p) { p.derniere_activite = new Date().toISOString(); ecrireDemo(d); }
  },
  // ── Booty Flow App : questionnaire, programmes préconçus, séances cochées ──
  async getProfilApp(uid) { return (await demoApp()).profilsApp[uid] || null; },
  async terminerQuestionnaire(r) {
    const d = await demoApp();
    const uid = localStorage.getItem(CLE_SESSION);
    const prog = d.programmesApp.filter((p) => p.actif && p.niveau === r.niveau && p.seances_semaine === r.seances_semaine)
      .sort((a, b) => a.ordre - b.ordre)[0];
    const avant = d.profilsApp[uid];
    const change = !avant?.programme_id || avant.niveau !== r.niveau || avant.seances_semaine !== r.seances_semaine;
    d.profilsApp[uid] = { ...avant, eleve_id: uid, age: r.age, taille: r.taille, poids_depart: avant?.poids_depart ?? r.poids,
      niveau: r.niveau, seances_semaine: r.seances_semaine, lieu: r.lieu, objectif: r.objectif,
      programme_id: change ? prog?.id || null : avant.programme_id, cycle_numero: change ? 1 : avant.cycle_numero,
      debut_cycle: avant?.debut_cycle || aujourdhui(), complete_le: avant?.complete_le || new Date().toISOString() };
    const p = d.profiles.find((x) => x.id === uid);
    if (r.prenom) p.prenom = r.prenom;
    ecrireDemo(d);
    return d.profilsApp[uid];
  },
  async listProgrammesApp() {
    return (await demoApp()).programmesApp.map(({ cycles, ...p }) => ({ ...p, nb_cycles: cycles.length }))
      .sort((a, b) => a.ordre - b.ordre);
  },
  async getProgrammeApp(pid) { return structuredClone((await demoApp()).programmesApp.find((p) => p.id === pid) || null); },
  async getCycleApp(pid, numero) {
    const p = (await demoApp()).programmesApp.find((x) => x.id === pid);
    return structuredClone(p?.cycles.find((c) => c.numero === numero) || null);
  },
  async listSeancesFaites(uid, cycle) {
    return (await demoApp()).seancesFaites.filter((f) => f.eleve_id === uid && (cycle == null || f.cycle_numero === cycle));
  },
  async marquerSeances(lignes) {
    const d = await demoApp();
    const uid = localStorage.getItem(CLE_SESSION);
    for (const l of lignes) {
      if (d.seancesFaites.some((f) => f.eleve_id === uid && f.seance_id === l.seance_id && f.cycle_numero === l.cycle_numero && f.semaine === l.semaine)) continue;
      d.seancesFaites.push({ id: id(), eleve_id: uid, statut: 'faite', fait_le: new Date().toISOString(), ...l });
    }
    ecrireDemo(d);
  },
  async annulerSeance({ seance_id, cycle_numero, semaine }) {
    const d = await demoApp();
    const uid = localStorage.getItem(CLE_SESSION);
    d.seancesFaites = d.seancesFaites.filter((f) => !(f.eleve_id === uid && f.seance_id === seance_id && f.cycle_numero === cycle_numero && f.semaine === semaine));
    ecrireDemo(d);
  },
  async passerCycleSuivant() {
    const d = await demoApp();
    const uid = localStorage.getItem(CLE_SESSION);
    const pa = d.profilsApp[uid];
    const p = d.programmesApp.find((x) => x.id === pa.programme_id);
    const cycle = p.cycles.find((c) => c.numero === pa.cycle_numero);
    const faites = d.seancesFaites.filter((f) => f.eleve_id === uid && f.cycle_numero === pa.cycle_numero).length;
    if (faites < cycle.seances.length * 12) throw new Error("Le cycle en cours n'est pas terminé");
    if (!p.cycles.some((c) => c.numero === pa.cycle_numero + 1)) throw new Error("Le cycle suivant n'est pas encore prêt");
    pa.cycle_numero += 1;
    pa.debut_cycle = aujourdhui();
    ecrireDemo(d);
    return pa.cycle_numero;
  },
  // Coach
  async setProfilApp(uid, patch) {
    const d = await demoApp();
    d.profilsApp[uid] = { ...(d.profilsApp[uid] || { eleve_id: uid, cycle_numero: 1 }), ...patch };
    ecrireDemo(d);
  },
  async saveProgrammeApp(pid, data) {
    const d = await demoApp();
    if (pid) Object.assign(d.programmesApp.find((p) => p.id === pid), data);
    else { pid = `prog-${id()}`; d.programmesApp.push({ id: pid, actif: true, ordre: d.programmesApp.length + 1, ...data, cycles: [] }); }
    ecrireDemo(d);
    return pid;
  },
  async deleteProgrammeApp(pid) {
    const d = await demoApp();
    d.programmesApp = d.programmesApp.filter((p) => p.id !== pid);
    ecrireDemo(d);
  },
  async saveCycleApp(cid, programmeId, data) {
    const d = await demoApp();
    const p = d.programmesApp.find((x) => x.id === programmeId);
    if (cid) Object.assign(p.cycles.find((c) => c.id === cid), data);
    else {
      cid = `cy-${id()}`;
      const numero = Math.max(0, ...p.cycles.map((c) => c.numero)) + 1;
      p.cycles.push({ id: cid, programme_id: programmeId, numero, titre: `Cycle ${numero}`, description: '', semaines: semainesVides(), seances: [], ...data });
    }
    ecrireDemo(d);
    return cid;
  },
  async dupliquerCycleApp(cid) {
    const d = await demoApp();
    const p = d.programmesApp.find((x) => x.cycles.some((c) => c.id === cid));
    const source = p.cycles.find((c) => c.id === cid);
    const numero = Math.max(...p.cycles.map((c) => c.numero)) + 1;
    const nouveau = { ...structuredClone(source), id: `cy-${id()}`, numero, titre: `Cycle ${numero}` };
    nouveau.seances = nouveau.seances.map((s) => ({ ...s, id: `se-${id()}`, cycle_id: nouveau.id }));
    p.cycles.push(nouveau);
    ecrireDemo(d);
    return nouveau.id;
  },
  async deleteCycleApp(cid) {
    const d = await demoApp();
    for (const p of d.programmesApp) p.cycles = p.cycles.filter((c) => c.id !== cid);
    ecrireDemo(d);
  },
  async saveSeanceApp(sid, cycleId, data) {
    const d = await demoApp();
    const cycle = d.programmesApp.flatMap((p) => p.cycles).find((c) => c.id === cycleId);
    if (sid) Object.assign(cycle.seances.find((s) => s.id === sid), data);
    else { sid = `se-${id()}`; cycle.seances.push({ id: sid, cycle_id: cycleId, ordre: cycle.seances.length + 1, exercices: [], ...data }); }
    ecrireDemo(d);
    return sid;
  },
  async deleteSeanceApp(sid) {
    const d = await demoApp();
    for (const c of d.programmesApp.flatMap((p) => p.cycles)) c.seances = c.seances.filter((s) => s.id !== sid);
    ecrireDemo(d);
  },
  async listProfilsApp() { return Object.values((await demoApp()).profilsApp); },
  // ── Pesées et ajustement automatique (même règle que enregistrer_pesee() côté base) ──
  async listPesees(uid) {
    return (await demoApp()).pesees.filter((p) => p.eleve_id === uid).sort((a, b) => a.date.localeCompare(b.date));
  },
  async listAjustements(uid) {
    return (await demoApp()).ajustements.filter((a) => a.eleve_id === uid).sort((a, b) => a.date.localeCompare(b.date));
  },
  async enregistrerPesee(poids, date = aujourdhui()) {
    const d = await demoApp();
    const uid = localStorage.getItem(CLE_SESSION);
    d.pesees = d.pesees.filter((p) => !(p.eleve_id === uid && p.date === date));
    d.pesees.push({ id: id(), eleve_id: uid, date, poids });
    const pa = d.profilsApp[uid] || {};
    const { decisionAjustement, REGLAGES_DEFAUT } = await import('./nutrition-calcul.js');
    const r = decisionAjustement({ objectif: pa.objectif, date, ajustement: pa.ajustement_glucides || 0, ajusteLe: pa.ajuste_le,
      pesees: d.pesees.filter((p) => p.eleve_id === uid), coefficients: (d.nutritionApp || REGLAGES_DEFAUT).coefficients });
    if (r.delta) {
      Object.assign(pa, { ajustement_glucides: r.total, ajuste_le: date });
      d.ajustements.push({ id: id(), eleve_id: uid, date, delta: r.delta, total: r.total, vitesse: r.vitesse, raison: r.raison, par_coach: false });
    }
    ecrireDemo(d);
    return r;
  },
  async listReleves(uid) {
    return ((await demoApp()).releves || []).filter((r) => r.eleve_id === uid).sort((a, b) => a.date.localeCompare(b.date));
  },
  async addReleve(mesures, photos = {}, video = null) {
    const d = await demoApp();
    d.releves ??= [];
    const uid = localStorage.getItem(CLE_SESSION);
    d.releves.push({ id: id(), eleve_id: uid, date: aujourdhui(), ...mesures, video_chemin: garderFichier(video),
      photo_face: garderFichier(photos.face), photo_profil: garderFichier(photos.profil), photo_dos: garderFichier(photos.dos),
      retour: null, retour_audio: null, retour_audio_duree: null, retour_photos: [], retour_le: null, lu: false });
    ecrireDemo(d);
  },
  // Coach : tous les bilans du mois des abonnées App
  async listBilansApp() {
    const d = await demoApp();
    return (d.releves || []).map((r) => ({ ...r, prenom: d.profiles.find((p) => p.id === r.eleve_id)?.prenom }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },
  async compterBilansAppNonLus() { return ((await demoApp()).releves || []).filter((r) => !r.lu).length; },
  async repondreBilanApp(rid, eleveId, { texte, audio, duree }) {
    const d = await demoApp();
    const r = d.releves.find((x) => x.id === rid);
    Object.assign(r, { retour: texte || null, retour_le: new Date().toISOString(), lu: true });
    if (audio) Object.assign(r, { retour_audio: garderFichier(audio), retour_audio_duree: duree || null });
    ecrireDemo(d);
  },
  async supprimerReleve(rid) {
    const d = await demoApp();
    d.releves = (d.releves || []).filter((r) => r.id !== rid);
    ecrireDemo(d);
  },
  async supprimerPesee(pid) {
    const d = await demoApp();
    d.pesees = d.pesees.filter((p) => p.id !== pid);
    ecrireDemo(d);
  },
  async ajusterGlucidesCoach(uid, total, raison) {
    const d = await demoApp();
    const pa = d.profilsApp[uid];
    const delta = total - (pa.ajustement_glucides || 0);
    Object.assign(pa, { ajustement_glucides: total, ajuste_le: aujourdhui() });
    d.ajustements.push({ id: id(), eleve_id: uid, date: aujourdhui(), delta, total, vitesse: null, raison: raison || 'ajustement de la coach', par_coach: true });
    ecrireDemo(d);
  },
  async envoyerVideoExercice(fichier) { return garderFichier(fichier); },
  // Réglages du calculateur nutrition (coefficients, aliments, journées types)
  async getNutritionApp() {
    const d = lireDemo();
    if (!d.nutritionApp) {
      const { REGLAGES_DEFAUT } = await import('./nutrition-calcul.js');
      d.nutritionApp = structuredClone(REGLAGES_DEFAUT);
      ecrireDemo(d);
    }
    return structuredClone(d.nutritionApp);
  },
  async saveNutritionApp(patch) {
    const d = lireDemo();
    d.nutritionApp = { ...(d.nutritionApp || {}), ...patch };
    ecrireDemo(d);
  },

  // Journal des webhooks Systeme.io (exemples en démo)
  async listWebhooks() {
    const h = (j, hh) => new Date(Date.now() + j * 864e5 - hh * 36e5).toISOString();
    const vente = (email, prenom, offre) => ({ type: 'SALE_NEW', data: { customer: { email, fields: { first_name: prenom } },
      offer_price_plan: { id: offre, name: offre === 123456 ? 'Booty Flow App' : 'Ebook recettes' }, order: { id: 98765432 } } });
    return [
      { id: 'w4', recu_le: h(0, 2), evenement: 'vente', email: 'lou@demo.fr', ip: '185.236.142.1', statut: 'ignore',
        message: 'Autre offre que Booty Flow App (identifiants trouvés : 999999)', contenu: vente('lou@demo.fr', 'Lou', 999999), entetes: { 'x-webhook-event': 'SALE_NEW' } },
      { id: 'w3', recu_le: h(-3, 5), evenement: 'annulation', email: 'jade@demo.fr', ip: '185.236.142.2', statut: 'traite',
        message: "Abonnement résilié, accès ouvert jusqu'au " + dansJours(5), contenu: { type: 'SALE_CANCELED', data: { customer: { email: 'jade@demo.fr' } } }, entetes: { 'x-webhook-event': 'SALE_CANCELED' } },
      { id: 'w2', recu_le: h(-10, 3), evenement: 'vente', email: 'emma@demo.fr', ip: '185.236.142.3', statut: 'traite',
        message: "Abonnement App renouvelé, accès jusqu'au " + dansJours(20), contenu: vente('emma@demo.fr', 'Emma', 123456), entetes: { 'x-webhook-event': 'SALE_NEW' } },
      { id: 'w1', recu_le: h(-12, 1), evenement: 'vente', email: 'test@exemple.fr', ip: '51.15.0.12', statut: 'refuse',
        message: 'Adresse IP non autorisée : 51.15.0.12', contenu: vente('test@exemple.fr', 'Test', 123456), entetes: {} }
    ];
  },
  // Simule la règle de la base : seules les abonnées App (accès ouvert) et la coach lisent les offres
  async listOffres() {
    const moi = lireDemo().profiles.find((x) => x.id === localStorage.getItem(CLE_SESSION));
    const { aAcces } = await import('./formules.js');
    if (!moi || (moi.role !== 'coach' && !aAcces(moi, 'offres'))) return [];
    return OFFRES_DEMO;
  },

  async getNutrition(uid) { return lireDemo().nutrition[uid] || null; },
  async saveNutrition(uid, data, pdf) {
    const d = lireDemo();
    const avant = d.nutrition[uid] || {};
    d.nutrition[uid] = { ...avant, ...data, eleve_id: uid, pdf_chemin: pdf ? garderFichier(pdf) : avant.pdf_chemin || null };
    ecrireDemo(d);
  },

  async listVideos({ eleveId, type, statut } = {}) {
    const d = lireDemo();
    return d.videos
      .filter((v) => (!eleveId || v.eleve_id === eleveId) && (!type || v.type === type) && (!statut || v.statut === statut))
      .map((v) => ({ ...v, prenom: d.profiles.find((p) => p.id === v.eleve_id)?.prenom }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async addVideo({ eleveId, type, exercice, file, photos = [] }) {
    const d = lireDemo();
    d.videos.push({ id: id(), eleve_id: eleveId, type, exercice, chemin: garderFichier(file), photos: photos.map(garderFichier),
      statut: 'a_corriger', retour: null, created_at: new Date().toISOString() });
    ecrireDemo(d);
  },
  async envoyerVideoCoach({ eleveId, type, exercice, file, lien, texte }) {
    const d = lireDemo();
    const maintenant = new Date().toISOString();
    d.videos.push({ id: id(), eleve_id: eleveId, type, exercice, chemin: garderFichier(file), retour_lien: lien || null, photos: [], de_coach: true,
      statut: 'corrige', retour: texte || null, corrige_le: maintenant, created_at: maintenant });
    ecrireDemo(d);
  },
  async supprimerVideo(v) {
    const d = lireDemo();
    d.videos = d.videos.filter((x) => x.id !== v.id);
    ecrireDemo(d);
  },
  async correctVideo(vid, retour, fichier, eleveId, { audio, duree, supprimerAudio = false, photos = [], photosGardees = [], lien = null } = {}) {
    const d = lireDemo();
    const v = d.videos.find((x) => x.id === vid);
    Object.assign(v, { retour, statut: 'corrige', corrige_le: new Date().toISOString(), retour_lien: lien || null,
      retour_photos: [...photosGardees, ...photos.map(garderFichier)] });
    if (fichier) v.retour_chemin = garderFichier(fichier);
    if (audio) Object.assign(v, { retour_audio: garderFichier(audio), retour_audio_duree: duree || null });
    else if (supprimerAudio) Object.assign(v, { retour_audio: null, retour_audio_duree: null });
    ecrireDemo(d);
  },

  async listBilans(eleveId) {
    const d = lireDemo();
    return d.bilans
      .filter((b) => !eleveId || b.eleve_id === eleveId)
      .map((b) => ({ ...b, prenom: d.profiles.find((p) => p.id === b.eleve_id)?.prenom }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
  async addBilan(eleveId, data, photos = {}) {
    const d = lireDemo();
    d.bilans.push({ id: id(), eleve_id: eleveId, date: aujourdhui(), lu: false, ...data,
      photo_face: garderFichier(photos.face), photo_profil: garderFichier(photos.profil), photo_dos: garderFichier(photos.dos) });
    ecrireDemo(d);
  },
  async markBilanLu(bid) {
    const d = lireDemo();
    d.bilans.find((b) => b.id === bid).lu = true;
    ecrireDemo(d);
  },
  // Retour de la coach : texte, vocal (fichier) et photos (fichiers ajoutés + chemins conservés)
  async repondreBilan(bid, eleveId, { texte, audio, duree, photos = [], photosGardees = [], supprimerAudio = false }) {
    const d = lireDemo();
    const b = d.bilans.find((x) => x.id === bid);
    Object.assign(b, {
      retour: texte || null,
      retour_photos: [...photosGardees, ...photos.map(garderFichier)],
      retour_le: new Date().toISOString(), lu: true
    });
    if (audio) Object.assign(b, { retour_audio: garderFichier(audio), retour_audio_duree: duree || null });
    else if (supprimerAudio) Object.assign(b, { retour_audio: null, retour_audio_duree: null });
    ecrireDemo(d);
  },

  async getCompetition(uid) { return lireDemo().competitions[uid] || null; },
  async saveCompetition(uid, data) {
    const d = lireDemo();
    d.competitions[uid] = { ...(d.competitions[uid] || {}), ...data, eleve_id: uid };
    ecrireDemo(d);
  },
  async saveChecklist(uid, checklist) { await demo.saveCompetition(uid, { checklist }); },

  // Rappels sur le téléphone : en démo, l'abonnement est seulement retenu localement
  async enregistrerAbonnement(eleveId, { endpoint, keys }) {
    const d = lireDemo();
    d.abonnements = (d.abonnements || []).filter((a) => a.endpoint !== endpoint);
    d.abonnements.push({ id: id(), eleve_id: eleveId, endpoint, p256dh: keys.p256dh, auth: keys.auth });
    ecrireDemo(d);
  },
  async supprimerAbonnement(endpoint) {
    const d = lireDemo();
    d.abonnements = (d.abonnements || []).filter((a) => a.endpoint !== endpoint);
    ecrireDemo(d);
  },
  async compterAbonnements(eleveId) {
    return (lireDemo().abonnements || []).filter((a) => a.eleve_id === eleveId).length;
  },

  // Compteurs pour les pastilles (sans télécharger tous les messages)
  async compterNonLus(eleveId, lecteurEstCoach) {
    return (lireDemo().messages || []).filter((m) => (!eleveId || m.eleve_id === eleveId) && !m.lu && m.de_coach !== lecteurEstCoach).length;
  },
  async compterBilansNonLus() {
    return lireDemo().bilans.filter((b) => !b.lu).length;
  },
  async compterVideosACorriger(type) {
    return lireDemo().videos.filter((v) => v.statut === 'a_corriger' && !v.de_coach && (!type || v.type === type)).length;
  },
  // Page Messages de la coach : dernier message et non-lus de chaque conversation
  async apercuConversations() {
    const tous = [...(lireDemo().messages || [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const derniers = {}, nonLus = {};
    for (const m of tous) {
      derniers[m.eleve_id] ??= m;
      if (!m.lu && !m.de_coach) nonLus[m.eleve_id] = (nonLus[m.eleve_id] || 0) + 1;
    }
    return { derniers, nonLus };
  },
  async listMessages(eleveId) {
    return (lireDemo().messages || [])
      .filter((m) => !eleveId || m.eleve_id === eleveId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },
  async sendMessage(eleveId, { deCoach, texte, audio, duree, photos = [] }) {
    const d = lireDemo();
    d.messages = d.messages || [];
    d.messages.push({ id: id(), eleve_id: eleveId, de_coach: deCoach, texte: texte || null,
      audio_chemin: garderFichier(audio), duree: duree || null, photos: photos.map(garderFichier),
      lu: false, created_at: new Date().toISOString() });
    ecrireDemo(d);
  },
  async markMessagesLus(eleveId, lecteurEstCoach) {
    const d = lireDemo();
    for (const m of d.messages || []) {
      if (m.eleve_id === eleveId && m.de_coach !== lecteurEstCoach) m.lu = true;
    }
    ecrireDemo(d);
  },

  async listProgrammes(eleveId) {
    return (lireDemo().programmes || [])
      .filter((p) => p.eleve_id === eleveId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async saveProgramme(pid, eleveId, data, fichier) {
    const d = lireDemo();
    d.programmes = d.programmes || [];
    const ligne = { ...data, ...(fichier ? { chemin: garderFichier(fichier), nom_fichier: fichier.name } : {}) };
    if (pid) Object.assign(d.programmes.find((p) => p.id === pid), ligne);
    else d.programmes.push({ id: id(), eleve_id: eleveId, chemin: null, nom_fichier: null, lien: null, ...ligne, created_at: new Date().toISOString() });
    ecrireDemo(d);
  },
  async deleteProgramme(pid) {
    const d = lireDemo();
    d.programmes = (d.programmes || []).filter((p) => p.id !== pid);
    ecrireDemo(d);
  },

  async listBibliotheque() {
    return [...(lireDemo().bibliotheque || [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async saveBibliotheque(vid, data, fichier) {
    const d = lireDemo();
    d.bibliotheque = d.bibliotheque || [];
    const ligne = { ...data, ...(fichier ? { chemin: garderFichier(fichier) } : {}) };
    if (vid) Object.assign(d.bibliotheque.find((v) => v.id === vid), ligne);
    else d.bibliotheque.push({ id: id(), chemin: null, lien: null, ...ligne, created_at: new Date().toISOString() });
    ecrireDemo(d);
  },
  async deleteBibliotheque(vid) {
    const d = lireDemo();
    d.bibliotheque = (d.bibliotheque || []).filter((v) => v.id !== vid);
    ecrireDemo(d);
  },
  async markBibliothequeVue() {
    const d = lireDemo();
    const uid = localStorage.getItem(CLE_SESSION);
    const p = d.profiles.find((x) => x.id === uid);
    if (p) p.biblio_vue_le = new Date().toISOString();
    ecrireDemo(d);
  },

  async listCharges(eleveId) {
    return (lireDemo().charges || [])
      .filter((c) => !eleveId || c.eleve_id === eleveId)
      .sort((a, b) => a.date.localeCompare(b.date));
  },
  async addCharge(eleveId, data) {
    const d = lireDemo();
    d.charges = d.charges || [];
    d.charges.push({ id: id(), eleve_id: eleveId, ...data });
    ecrireDemo(d);
  },
  async deleteCharge(cid) {
    const d = lireDemo();
    d.charges = (d.charges || []).filter((c) => c.id !== cid);
    ecrireDemo(d);
  },

  async mediaUrl(chemin) { return chemin ? fichiersDemo.get(chemin) || null : null; }
};

// ───────────────────────── MODE RÉEL (SUPABASE) ─────────────────────────

let sb = null;
async function client() {
  if (!sb) {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return sb;
}
function verifier({ data, error }) {
  if (error) throw new Error(traduire(error.message));
  return data;
}
function traduire(msg) {
  const t = {
    'Invalid login credentials': 'Adresse ou mot de passe incorrect.',
    'Email not confirmed': "Ton adresse n'est pas encore confirmée : clique sur le lien reçu par e-mail.",
    'User already registered': 'Un compte existe déjà avec cette adresse.',
    'Password should be at least 6 characters.': 'Le mot de passe doit contenir au moins 6 caractères.'
  };
  return t[msg] || msg;
}
async function envoyerFichier(eleveId, dossier, file) {
  if (!file) return null;
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const chemin = `${eleveId}/${dossier}/${Date.now()}-${id()}.${ext}`;
  verifier(await (await client()).storage.from('medias').upload(chemin, file, { contentType: file.type }));
  return chemin;
}

function normaliserCycle({ seances_app, ...c }) {
  return { ...c, seances: (seances_app || []).sort((a, b) => a.ordre - b.ordre) };
}

const reel = {
  async getSession() {
    const { data } = await (await client()).auth.getSession();
    return data.session ? { userId: data.session.user.id } : null;
  },
  async signIn(email, mdp) {
    verifier(await (await client()).auth.signInWithPassword({ email: email.trim(), password: mdp }));
  },
  async signUp(email, mdp, prenom) {
    const data = verifier(await (await client()).auth.signUp({
      email: email.trim(), password: mdp,
      options: { data: { prenom }, emailRedirectTo: location.origin + location.pathname }
    }));
    return { confirmationRequise: !data.session };
  },
  async signOut() { await (await client()).auth.signOut(); },
  async resetPassword(email) {
    verifier(await (await client()).auth.resetPasswordForEmail(email.trim(), {
      redirectTo: location.origin + location.pathname
    }));
  },
  async updatePassword(mdp) { verifier(await (await client()).auth.updateUser({ password: mdp })); },
  async onRecovery(cb) {
    (await client()).auth.onAuthStateChange((evenement) => { if (evenement === 'PASSWORD_RECOVERY') cb(); });
  },

  async getProfile(uid) {
    return verifier(await (await client()).from('profiles').select('*').eq('id', uid).maybeSingle());
  },
  async updateProfile(uid, patch) {
    verifier(await (await client()).from('profiles').update(patch).eq('id', uid));
  },
  async listEleves() {
    return verifier(await (await client()).from('profiles').select('*').eq('role', 'eleve').order('prenom'));
  },
  async marquerActivite() {
    await (await client()).rpc('marquer_activite');
  },
  // ── Booty Flow App : questionnaire, programmes préconçus, séances cochées ──
  async getProfilApp(uid) {
    const { data, error } = await (await client()).from('profils_app').select('*').eq('eleve_id', uid).maybeSingle();
    if (error) return null; // table pas encore créée (supabase/programmes-app.sql)
    return data;
  },
  async terminerQuestionnaire(r) {
    return verifier(await (await client()).rpc('terminer_questionnaire', {
      p_prenom: r.prenom, p_age: r.age, p_taille: r.taille, p_poids: r.poids,
      p_niveau: r.niveau, p_seances: r.seances_semaine, p_lieu: r.lieu, p_objectif: r.objectif
    }));
  },
  async listProgrammesApp() {
    const lignes = verifier(await (await client()).from('programmes_app').select('*, cycles_app(count)').order('ordre'));
    return lignes.map(({ cycles_app, ...p }) => ({ ...p, nb_cycles: cycles_app?.[0]?.count ?? 0 }));
  },
  async getProgrammeApp(pid) {
    const p = verifier(await (await client()).from('programmes_app').select('*, cycles_app(*, seances_app(*))').eq('id', pid).maybeSingle());
    if (!p) return null;
    const { cycles_app, ...reste } = p;
    return { ...reste, cycles: (cycles_app || []).map(normaliserCycle).sort((a, b) => a.numero - b.numero) };
  },
  async getCycleApp(pid, numero) {
    const c = verifier(await (await client()).from('cycles_app').select('*, seances_app(*)').eq('programme_id', pid).eq('numero', numero).maybeSingle());
    return c ? normaliserCycle(c) : null;
  },
  async listSeancesFaites(uid, cycle) {
    let q = (await client()).from('seances_faites').select('*').eq('eleve_id', uid);
    if (cycle != null) q = q.eq('cycle_numero', cycle);
    return verifier(await q);
  },
  async marquerSeances(lignes) {
    const uid = (await reel.getSession())?.userId;
    verifier(await (await client()).from('seances_faites')
      .upsert(lignes.map((l) => ({ ...l, eleve_id: uid })), { onConflict: 'eleve_id,seance_id,cycle_numero,semaine', ignoreDuplicates: true }));
  },
  async annulerSeance({ seance_id, cycle_numero, semaine }) {
    verifier(await (await client()).from('seances_faites').delete()
      .eq('seance_id', seance_id).eq('cycle_numero', cycle_numero).eq('semaine', semaine));
  },
  async passerCycleSuivant() { return verifier(await (await client()).rpc('passer_cycle_suivant')); },
  // Coach
  async setProfilApp(uid, patch) {
    verifier(await (await client()).from('profils_app').upsert({ eleve_id: uid, ...patch, updated_at: new Date().toISOString() }));
  },
  async saveProgrammeApp(pid, data) {
    const table = (await client()).from('programmes_app');
    if (pid) { verifier(await table.update(data).eq('id', pid)); return pid; }
    return verifier(await table.insert(data).select('id').single()).id;
  },
  async deleteProgrammeApp(pid) { verifier(await (await client()).from('programmes_app').delete().eq('id', pid)); },
  async saveCycleApp(cid, programmeId, data) {
    const sb = await client();
    if (cid) { verifier(await sb.from('cycles_app').update(data).eq('id', cid)); return cid; }
    const existants = verifier(await sb.from('cycles_app').select('numero').eq('programme_id', programmeId));
    const numero = Math.max(0, ...existants.map((c) => c.numero)) + 1;
    return verifier(await sb.from('cycles_app').insert({ programme_id: programmeId, numero, titre: `Cycle ${numero}`, semaines: semainesVides(), ...data })
      .select('id').single()).id;
  },
  async dupliquerCycleApp(cid) {
    const sb = await client();
    const c = normaliserCycle(verifier(await sb.from('cycles_app').select('*, seances_app(*)').eq('id', cid).single()));
    const existants = verifier(await sb.from('cycles_app').select('numero').eq('programme_id', c.programme_id));
    const numero = Math.max(...existants.map((x) => x.numero)) + 1;
    const nouveau = verifier(await sb.from('cycles_app').insert({ programme_id: c.programme_id, numero, titre: `Cycle ${numero}`,
      description: c.description, semaines: c.semaines }).select('id').single());
    if (c.seances.length) {
      verifier(await sb.from('seances_app').insert(c.seances.map(({ ordre, nom, description, exercices }) =>
        ({ cycle_id: nouveau.id, ordre, nom, description, exercices }))));
    }
    return nouveau.id;
  },
  async deleteCycleApp(cid) { verifier(await (await client()).from('cycles_app').delete().eq('id', cid)); },
  async saveSeanceApp(sid, cycleId, data) {
    const table = (await client()).from('seances_app');
    if (sid) { verifier(await table.update(data).eq('id', sid)); return sid; }
    return verifier(await table.insert({ ...data, cycle_id: cycleId }).select('id').single()).id;
  },
  async deleteSeanceApp(sid) { verifier(await (await client()).from('seances_app').delete().eq('id', sid)); },
  async listProfilsApp() {
    const { data, error } = await (await client()).from('profils_app').select('*');
    return error ? [] : data;
  },
  async getNutritionApp() {
    const { data, error } = await (await client()).from('nutrition_app').select('*').eq('id', 1).maybeSingle();
    if (error || !data) {
      // Table pas encore créée (supabase/nutrition-app.sql) : réglages par défaut
      const { REGLAGES_DEFAUT } = await import('./nutrition-calcul.js');
      return structuredClone(REGLAGES_DEFAUT);
    }
    return data;
  },
  async saveNutritionApp(patch) {
    verifier(await (await client()).from('nutrition_app').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1));
  },
  // ── Pesées et ajustement automatique (calculé dans la base : enregistrer_pesee) ──
  async listPesees(uid) {
    const { data, error } = await (await client()).from('pesees_app').select('*').eq('eleve_id', uid).order('date');
    return error ? [] : data;
  },
  async listAjustements(uid) {
    const { data, error } = await (await client()).from('ajustements_app').select('*').eq('eleve_id', uid).order('date').order('created_at');
    return error ? [] : data;
  },
  async enregistrerPesee(poids, date) {
    return verifier(await (await client()).rpc('enregistrer_pesee', date ? { p_poids: poids, p_date: date } : { p_poids: poids }));
  },
  async supprimerPesee(pid) { verifier(await (await client()).from('pesees_app').delete().eq('id', pid)); },
  // Relevé du mois : mensurations + photos (rangées dans le dossier de l'abonnée)
  async listReleves(uid) {
    const { data, error } = await (await client()).from('releves_app').select('*').eq('eleve_id', uid).order('date');
    return error ? [] : data;
  },
  async addReleve(mesures, photos = {}, video = null) {
    const uid = (await reel.getSession())?.userId;
    const ligne = { ...mesures, eleve_id: uid };
    for (const cote of ['face', 'profil', 'dos']) ligne[`photo_${cote}`] = await envoyerFichier(uid, 'suivi', photos[cote]);
    if (video) ligne.video_chemin = await envoyerFichier(uid, 'suivi-videos', video);
    verifier(await (await client()).from('releves_app').insert(ligne));
  },
  async listBilansApp() {
    const { data, error } = await (await client()).from('releves_app').select('*, profiles(prenom)').order('date', { ascending: false }).limit(300);
    return error ? [] : data.map((r) => ({ ...r, prenom: r.profiles?.prenom }));
  },
  async compterBilansAppNonLus() {
    const { count, error } = await (await client()).from('releves_app').select('id', { count: 'exact', head: true }).eq('lu', false);
    return error ? 0 : count || 0;
  },
  // Réponse de la coach : texte et/ou vocal (rangé dans le dossier de l'abonnée pour qu'elle puisse l'écouter)
  async repondreBilanApp(rid, eleveId, { texte, audio, duree }) {
    const maj = { retour: texte || null, retour_le: new Date().toISOString(), lu: true };
    if (audio) Object.assign(maj, { retour_audio: await envoyerFichier(eleveId, 'bilans-retours', audio), retour_audio_duree: duree || null });
    verifier(await (await client()).from('releves_app').update(maj).eq('id', rid));
  },
  async supprimerReleve(rid) { verifier(await (await client()).from('releves_app').delete().eq('id', rid)); },
  async ajusterGlucidesCoach(uid, total, raison) {
    const sb = await client();
    const pa = verifier(await sb.from('profils_app').select('ajustement_glucides').eq('eleve_id', uid).single());
    const today = new Date().toISOString().slice(0, 10);
    verifier(await sb.from('profils_app').update({ ajustement_glucides: total, ajuste_le: today, updated_at: new Date().toISOString() }).eq('eleve_id', uid));
    verifier(await sb.from('ajustements_app').insert({ eleve_id: uid, date: today, delta: total - (pa.ajustement_glucides || 0), total,
      raison: raison || 'ajustement de la coach', par_coach: true }));
  },
  // Vidéo d'un exercice de programme : rangée dans le dossier « bibliotheque », lisible par les abonnées (accès ouvert)
  async envoyerVideoExercice(fichier) { return envoyerFichier('bibliotheque', 'exercices', fichier); },

  async listWebhooks() {
    const { data, error } = await (await client()).from('webhooks_systemeio').select('*').order('recu_le', { ascending: false }).limit(200);
    if (error) return []; // table pas encore créée (supabase/webhook-systemeio.sql)
    return data;
  },
  // La base ne renvoie les offres qu'aux abonnées App (et à la coach) : vide pour une élève coaching
  async listOffres() {
    const { data, error } = await (await client()).from('offres').select('*').order('ordre');
    if (error) return [];
    return data;
  },

  async getNutrition(uid) {
    return verifier(await (await client()).from('nutrition').select('*').eq('eleve_id', uid).maybeSingle());
  },
  async saveNutrition(uid, data, pdf) {
    const ligne = { ...data, eleve_id: uid, updated_at: new Date().toISOString() };
    if (pdf) ligne.pdf_chemin = await envoyerFichier(uid, 'nutrition', pdf);
    verifier(await (await client()).from('nutrition').upsert(ligne));
  },

  async listVideos({ eleveId, type, statut } = {}) {
    let q = (await client()).from('videos').select('*, profiles(prenom)').order('created_at', { ascending: false });
    if (eleveId) q = q.eq('eleve_id', eleveId);
    if (type) q = q.eq('type', type);
    if (statut) q = q.eq('statut', statut);
    return verifier(await q).map((v) => ({ ...v, prenom: v.profiles?.prenom }));
  },
  async addVideo({ eleveId, type, exercice, file, photos = [] }) {
    const chemin = await envoyerFichier(eleveId, type, file);
    const cheminsPhotos = [];
    for (const p of photos) cheminsPhotos.push(await envoyerFichier(eleveId, `${type}-photos`, p));
    verifier(await (await client()).from('videos').insert({ eleve_id: eleveId, type, exercice, chemin, photos: cheminsPhotos }));
  },
  // Vidéo envoyée par la coach (rangée dans le dossier de l'élève pour qu'elle puisse la voir)
  async envoyerVideoCoach({ eleveId, type, exercice, file, lien, texte }) {
    const chemin = await envoyerFichier(eleveId, `${type}-coach`, file);
    const maintenant = new Date().toISOString();
    verifier(await (await client()).from('videos').insert({
      eleve_id: eleveId, type, exercice, chemin, retour_lien: lien || null, de_coach: true, statut: 'corrige', retour: texte || null, corrige_le: maintenant
    }));
  },
  async supprimerVideo(v) {
    verifier(await (await client()).from('videos').delete().eq('id', v.id));
    if (v.chemin) await (await client()).storage.from('medias').remove([v.chemin]);
  },
  // La vidéo de correction est rangée dans le dossier de l'élève pour qu'elle puisse la voir
  async correctVideo(vid, retour, fichier, eleveId, { audio, duree, supprimerAudio = false, photos = [], photosGardees = [], lien = null } = {}) {
    const nouvelles = [];
    for (const p of photos) nouvelles.push(await envoyerFichier(eleveId, 'corrections', p));
    const maj = { retour, statut: 'corrige', corrige_le: new Date().toISOString(), retour_photos: [...photosGardees, ...nouvelles], retour_lien: lien || null };
    if (fichier) maj.retour_chemin = await envoyerFichier(eleveId, 'corrections', fichier);
    if (audio) Object.assign(maj, { retour_audio: await envoyerFichier(eleveId, 'corrections', audio), retour_audio_duree: duree || null });
    else if (supprimerAudio) Object.assign(maj, { retour_audio: null, retour_audio_duree: null });
    verifier(await (await client()).from('videos').update(maj).eq('id', vid));
  },

  async listBilans(eleveId) {
    let q = (await client()).from('bilans').select('*, profiles(prenom)').order('date');
    if (eleveId) q = q.eq('eleve_id', eleveId);
    return verifier(await q).map((b) => ({ ...b, prenom: b.profiles?.prenom }));
  },
  async addBilan(eleveId, data, photos = {}) {
    const ligne = { ...data, eleve_id: eleveId };
    for (const cote of ['face', 'profil', 'dos']) {
      ligne[`photo_${cote}`] = await envoyerFichier(eleveId, 'bilans', photos[cote]);
    }
    verifier(await (await client()).from('bilans').insert(ligne));
  },
  async markBilanLu(bid) {
    verifier(await (await client()).from('bilans').update({ lu: true }).eq('id', bid));
  },
  async repondreBilan(bid, eleveId, { texte, audio, duree, photos = [], photosGardees = [], supprimerAudio = false }) {
    const nouvelles = [];
    for (const photo of photos) nouvelles.push(await envoyerFichier(eleveId, 'bilans-retours', photo));
    const maj = { retour: texte || null, retour_photos: [...photosGardees, ...nouvelles], retour_le: new Date().toISOString(), lu: true };
    if (audio) Object.assign(maj, { retour_audio: await envoyerFichier(eleveId, 'bilans-retours', audio), retour_audio_duree: duree || null });
    else if (supprimerAudio) Object.assign(maj, { retour_audio: null, retour_audio_duree: null });
    verifier(await (await client()).from('bilans').update(maj).eq('id', bid));
  },

  async getCompetition(uid) {
    return verifier(await (await client()).from('competitions').select('*').eq('eleve_id', uid).maybeSingle());
  },
  async saveCompetition(uid, data) {
    verifier(await (await client()).from('competitions').upsert({ ...data, eleve_id: uid }));
  },
  // L'élève ne peut que cocher sa checklist (pas créer la fiche compétition)
  async saveChecklist(uid, checklist) {
    verifier(await (await client()).from('competitions').update({ checklist }).eq('eleve_id', uid));
  },

  // Sans eleveId : tous les messages (la coach uniquement, grâce aux règles de sécurité)
  async enregistrerAbonnement(eleveId, { endpoint, keys }) {
    verifier(await (await client()).from('abonnements_push')
      .upsert({ eleve_id: eleveId, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: 'endpoint' }));
  },
  async supprimerAbonnement(endpoint) {
    verifier(await (await client()).from('abonnements_push').delete().eq('endpoint', endpoint));
  },
  async compterAbonnements(eleveId) {
    const { count, error } = await (await client()).from('abonnements_push')
      .select('id', { count: 'exact', head: true }).eq('eleve_id', eleveId);
    if (error) return null;
    return count;
  },

  // Comptages directs : Supabase ne renvoie que 1 000 lignes par requête, il ne faut donc
  // jamais compter en téléchargeant tous les messages
  async compterNonLus(eleveId, lecteurEstCoach) {
    let q = (await client()).from('messages').select('id', { count: 'exact', head: true })
      .eq('lu', false).eq('de_coach', !lecteurEstCoach);
    if (eleveId) q = q.eq('eleve_id', eleveId);
    const { count, error } = await q;
    if (error) throw new Error(traduire(error.message));
    return count || 0;
  },
  async compterBilansNonLus() {
    const { count, error } = await (await client()).from('bilans').select('id', { count: 'exact', head: true }).eq('lu', false);
    if (error) throw new Error(traduire(error.message));
    return count || 0;
  },
  async compterVideosACorriger(type) {
    let q = (await client()).from('videos').select('id', { count: 'exact', head: true }).eq('statut', 'a_corriger').eq('de_coach', false);
    if (type) q = q.eq('type', type);
    const { count, error } = await q;
    if (error) throw new Error(traduire(error.message));
    return count || 0;
  },
  // Page Messages : les 1 000 messages les plus récents suffisent pour le dernier message de chaque élève ;
  // les non-lus sont comptés à part
  async apercuConversations() {
    const c = await client();
    const [recents, nonLusListe] = await Promise.all([
      c.from('messages').select('eleve_id, de_coach, texte, audio_chemin, photos, created_at').order('created_at', { ascending: false }).limit(1000),
      c.from('messages').select('eleve_id').eq('lu', false).eq('de_coach', false)
    ]);
    const derniers = {}, nonLus = {};
    for (const m of verifier(recents)) derniers[m.eleve_id] ??= m;
    for (const m of verifier(nonLusListe)) nonLus[m.eleve_id] = (nonLus[m.eleve_id] || 0) + 1;
    return { derniers, nonLus };
  },
  async listMessages(eleveId) {
    let q = (await client()).from('messages').select('*').order('created_at');
    if (eleveId) q = q.eq('eleve_id', eleveId);
    return verifier(await q);
  },
  async sendMessage(eleveId, { deCoach, texte, audio, duree, photos = [] }) {
    const audio_chemin = await envoyerFichier(eleveId, 'vocaux', audio);
    const cheminsPhotos = [];
    for (const p of photos) cheminsPhotos.push(await envoyerFichier(eleveId, 'photos-messages', p));
    verifier(await (await client()).from('messages').insert({
      eleve_id: eleveId, de_coach: deCoach, texte: texte || null, audio_chemin, duree: duree || null, photos: cheminsPhotos
    }));
  },
  async markMessagesLus(eleveId) {
    verifier(await (await client()).rpc('marquer_messages_lus', { p_eleve: eleveId }));
  },

  async listProgrammes(eleveId) {
    return verifier(await (await client()).from('programmes').select('*')
      .eq('eleve_id', eleveId).order('created_at', { ascending: false }));
  },
  async saveProgramme(pid, eleveId, data, fichier) {
    const ligne = { ...data };
    if (fichier) {
      ligne.chemin = await envoyerFichier(eleveId, 'programmes', fichier);
      ligne.nom_fichier = fichier.name;
    }
    const table = (await client()).from('programmes');
    verifier(await (pid ? table.update(ligne).eq('id', pid) : table.insert({ ...ligne, eleve_id: eleveId })));
  },
  async deleteProgramme(pid) {
    const sb = await client();
    const p = verifier(await sb.from('programmes').select('chemin').eq('id', pid).maybeSingle());
    verifier(await sb.from('programmes').delete().eq('id', pid));
    if (p?.chemin) await sb.storage.from('medias').remove([p.chemin]);
  },

  async listBibliotheque() {
    return verifier(await (await client()).from('bibliotheque').select('*').order('created_at', { ascending: false }));
  },
  async saveBibliotheque(vid, data, fichier) {
    const ligne = { ...data };
    if (fichier) ligne.chemin = await envoyerFichier('bibliotheque', 'videos', fichier);
    const table = (await client()).from('bibliotheque');
    verifier(await (vid ? table.update(ligne).eq('id', vid) : table.insert(ligne)));
  },
  async deleteBibliotheque(vid) {
    const sb = await client();
    const v = verifier(await sb.from('bibliotheque').select('chemin').eq('id', vid).maybeSingle());
    verifier(await sb.from('bibliotheque').delete().eq('id', vid));
    if (v?.chemin) await sb.storage.from('medias').remove([v.chemin]);
  },
  async markBibliothequeVue() {
    verifier(await (await client()).rpc('marquer_bibliotheque_vue'));
  },

  // Sans eleveId : toutes les charges (la coach uniquement, grâce aux règles de sécurité)
  async listCharges(eleveId) {
    let q = (await client()).from('charges').select('*').order('date').order('created_at');
    if (eleveId) q = q.eq('eleve_id', eleveId);
    return verifier(await q);
  },
  async addCharge(eleveId, data) {
    verifier(await (await client()).from('charges').insert({ ...data, eleve_id: eleveId }));
  },
  async deleteCharge(cid) {
    verifier(await (await client()).from('charges').delete().eq('id', cid));
  },

  // telecharger : nom du fichier à proposer, pour forcer le téléchargement au lieu de l'ouverture
  async mediaUrl(chemin, telecharger) {
    if (!chemin) return null;
    const { data } = await (await client()).storage.from('medias')
      .createSignedUrl(chemin, 3600, telecharger ? { download: telecharger } : undefined);
    return data?.signedUrl || null;
  }
};

export const api = MODE === 'supabase' ? reel : demo;
