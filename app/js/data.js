// Couche de données : l'app parle uniquement à cet objet `api`.
// - MODE DÉMO  : données fictives rangées dans le navigateur (localStorage)
// - MODE RÉEL  : Supabase (comptes, base de données, stockage des vidéos)
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const MODE = SUPABASE_URL && SUPABASE_ANON_KEY ? 'supabase' : 'demo';

const aujourdhui = () => new Date().toISOString().slice(0, 10);
const dansJours = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

// ───────────────────────── MODE DÉMO ─────────────────────────

const CLE_DEMO = 'bootyflow-demo-v3';
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
        : ''
    }))
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
    ressenti: '', lu: i < 5, photo_face: null, photo_profil: null, photo_dos: null
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
  return { profiles, nutrition, videos, bilans, competitions, charges, messages };
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
      competitrice: false, message_coach: '', prochain_bilan: dansJours(7) };
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
  async addVideo({ eleveId, type, exercice, file }) {
    const d = lireDemo();
    d.videos.push({ id: id(), eleve_id: eleveId, type, exercice, chemin: garderFichier(file),
      statut: 'a_corriger', retour: null, created_at: new Date().toISOString() });
    ecrireDemo(d);
  },
  async correctVideo(vid, retour, fichier) {
    const d = lireDemo();
    const v = d.videos.find((x) => x.id === vid);
    Object.assign(v, { retour, statut: 'corrige', corrige_le: new Date().toISOString() });
    if (fichier) v.retour_chemin = garderFichier(fichier);
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

  async getCompetition(uid) { return lireDemo().competitions[uid] || null; },
  async saveCompetition(uid, data) {
    const d = lireDemo();
    d.competitions[uid] = { ...(d.competitions[uid] || {}), ...data, eleve_id: uid };
    ecrireDemo(d);
  },
  async saveChecklist(uid, checklist) { await demo.saveCompetition(uid, { checklist }); },

  async listMessages(eleveId) {
    return (lireDemo().messages || [])
      .filter((m) => !eleveId || m.eleve_id === eleveId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },
  async sendMessage(eleveId, { deCoach, texte, audio, duree }) {
    const d = lireDemo();
    d.messages = d.messages || [];
    d.messages.push({ id: id(), eleve_id: eleveId, de_coach: deCoach, texte: texte || null,
      audio_chemin: garderFichier(audio), duree: duree || null, lu: false, created_at: new Date().toISOString() });
    ecrireDemo(d);
  },
  async markMessagesLus(eleveId, lecteurEstCoach) {
    const d = lireDemo();
    for (const m of d.messages || []) {
      if (m.eleve_id === eleveId && m.de_coach !== lecteurEstCoach) m.lu = true;
    }
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
  async addVideo({ eleveId, type, exercice, file }) {
    const chemin = await envoyerFichier(eleveId, type, file);
    verifier(await (await client()).from('videos').insert({ eleve_id: eleveId, type, exercice, chemin }));
  },
  // La vidéo de correction est rangée dans le dossier de l'élève pour qu'elle puisse la voir
  async correctVideo(vid, retour, fichier, eleveId) {
    const maj = { retour, statut: 'corrige', corrige_le: new Date().toISOString() };
    if (fichier) maj.retour_chemin = await envoyerFichier(eleveId, 'corrections', fichier);
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
  async listMessages(eleveId) {
    let q = (await client()).from('messages').select('*').order('created_at');
    if (eleveId) q = q.eq('eleve_id', eleveId);
    return verifier(await q);
  },
  async sendMessage(eleveId, { deCoach, texte, audio, duree }) {
    const audio_chemin = await envoyerFichier(eleveId, 'vocaux', audio);
    verifier(await (await client()).from('messages').insert({
      eleve_id: eleveId, de_coach: deCoach, texte: texte || null, audio_chemin, duree: duree || null
    }));
  },
  async markMessagesLus(eleveId) {
    verifier(await (await client()).rpc('marquer_messages_lus', { p_eleve: eleveId }));
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

  async mediaUrl(chemin) {
    if (!chemin) return null;
    const { data } = await (await client()).storage.from('medias').createSignedUrl(chemin, 3600);
    return data?.signedUrl || null;
  }
};

export const api = MODE === 'supabase' ? reel : demo;
