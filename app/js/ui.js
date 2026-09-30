// Petits outils d'affichage partagés par l'espace élève et l'espace coach.

// Protège le texte saisi (évite qu'un nom ou un message casse la page)
export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const TRACES = {
  accueil: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  nutrition: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2-3 6s1 5 3 5v7"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  etoile: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  progres: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  cloche: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  horloge: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  retour: '<path d="M15 5l-7 7 7 7"/>',
  envoi: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  eleves: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 8M22 21a6 6 0 0 0-4-5.6"/>',
  sortie: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h11"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  poubelle: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  lecture: '<path d="M8 5v14l11-7z"/>',
  photo: '<rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l2-2h4l2 2"/>',
  croix: '<path d="M6 6l12 12M18 6L6 18"/>'
};

export function icone(nom, taille = 22, couleur = 'currentColor', plein = false) {
  return `<svg width="${taille}" height="${taille}" viewBox="0 0 24 24" fill="${plein ? couleur : 'none'}" stroke="${couleur}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRACES[nom] || ''}</svg>`;
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const JOURS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];

function versDate(v) {
  if (!v) return null;
  // Une date seule "2026-10-05" est lue à midi pour éviter les décalages de fuseau
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T12:00:00` : v);
}
export function dateCourte(v) {
  const d = versDate(v);
  return d ? `${d.getDate()} ${MOIS[d.getMonth()]}` : '—';
}
export function dateAvecJour(v) {
  const d = versDate(v);
  return d ? `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}` : '—';
}
export function joursAvant(v) {
  const d = versDate(v);
  if (!d) return null;
  const midi = new Date();
  midi.setHours(12, 0, 0, 0);
  return Math.round((d - midi) / 864e5);
}
export function nombre(v, dec = 1) {
  if (v === null || v === undefined || v === '') return '—';
  return Number(v).toLocaleString('fr-FR', { maximumFractionDigits: dec });
}
export function ecart(v, dec = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return '';
  const r = Math.round(v * 10 ** dec) / 10 ** dec;
  if (r === 0) return '=';
  return (r > 0 ? '+' : '−') + Math.abs(r).toLocaleString('fr-FR', { maximumFractionDigits: dec });
}

export function badge(texte, couleur = 'var(--accent)') {
  return `<span class="badge" style="color:${couleur};border-color:${couleur}">${esc(texte)}</span>`;
}

// Message bref en bas de l'écran
export function toast(message, erreur = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (erreur ? ' toast-erreur' : '');
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('visible'), 10);
  setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 300); }, 3200);
}

// Fenêtre par-dessus l'écran. `contenu` est du HTML ; renvoie l'élément pour brancher les boutons.
export function fenetre(titre, contenu) {
  fermerFenetre();
  const fond = document.createElement('div');
  fond.className = 'fenetre-fond';
  fond.innerHTML = `<div class="fenetre" role="dialog" aria-modal="true" aria-label="${esc(titre)}">
    <div class="fenetre-tete"><h2>${esc(titre)}</h2>
    <button class="bouton-icone" data-fermer aria-label="Fermer">${icone('croix', 20)}</button></div>
    <div class="fenetre-corps">${contenu}</div></div>`;
  fond.addEventListener('click', (e) => {
    if (e.target === fond || e.target.closest('[data-fermer]')) fermerFenetre();
  });
  document.body.appendChild(fond);
  fond.querySelector('input, textarea, select')?.focus();
  return fond;
}
export function fermerFenetre() {
  document.querySelector('.fenetre-fond')?.remove();
}

// Désactive un bouton pendant un envoi et affiche un texte d'attente
export async function pendant(bouton, texte, action) {
  const avant = bouton.innerHTML;
  bouton.disabled = true;
  bouton.textContent = texte;
  try {
    return await action();
  } catch (e) {
    toast(e.message || 'Une erreur est survenue.', true);
    throw e;
  } finally {
    bouton.disabled = false;
    bouton.innerHTML = avant;
  }
}

// Petit graphique en ligne (poids) en SVG
export function courbe(points, { largeur = 320, hauteur = 110 } = {}) {
  const valeurs = points.map((p) => Number(p.valeur)).filter((v) => !Number.isNaN(v));
  if (valeurs.length < 2) {
    return `<p class="vide">Le graphique apparaîtra après ton deuxième bilan.</p>`;
  }
  const min = Math.min(...valeurs), max = Math.max(...valeurs);
  const marge = (max - min) * 0.2 || 1;
  const bas = min - marge, haut = max + marge;
  const x = (i) => 8 + (i * (largeur - 16)) / (valeurs.length - 1);
  const y = (v) => 8 + ((haut - v) * (hauteur - 16)) / (haut - bas);
  const ligne = valeurs.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const zone = `${ligne} L${x(valeurs.length - 1).toFixed(1)} ${hauteur} L${x(0).toFixed(1)} ${hauteur} Z`;
  const dernier = valeurs.length - 1;
  return `<svg class="courbe" viewBox="0 0 ${largeur} ${hauteur}" role="img" aria-label="Évolution du poids : de ${nombre(valeurs[0])} à ${nombre(valeurs[dernier])} kg">
    <defs><linearGradient id="degrade-courbe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B266FF" stop-opacity="0.35"/><stop offset="1" stop-color="#B266FF" stop-opacity="0"/></linearGradient></defs>
    <path d="${zone}" fill="url(#degrade-courbe)"/>
    <path d="${ligne}" fill="none" stroke="#B266FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${x(dernier).toFixed(1)}" cy="${y(valeurs[dernier]).toFixed(1)}" r="4" fill="#E3C8FF"/>
  </svg>`;
}
