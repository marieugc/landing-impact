// ESPACE COACH — Programmes Booty Flow App : créer et modifier programmes, cycles, semaines, séances et exercices.
import { api, semainesVides } from './data.js';
import { esc, icone, toast, pendant, badge } from './ui.js';
import { page } from './coach.js';
import { NIVEAUX } from './programme-app.js';

const ACTIF = 'coach/programmes';
const entete = (surtitre, titreTexte, retour) => `<div class="bureau-tete"><div class="ligne-auteur">
    ${retour ? `<a href="${retour}" class="bouton-rond" aria-label="Retour">${icone('retour', 20)}</a>` : ''}
    <div><div class="surtitre">${surtitre}</div><h1>${esc(titreTexte)}</h1></div></div></div>`;

// coach/programmes[/programme[/cycle[/séance]]]
export async function programmesApp(racine, profil, [pid, cid, sid] = []) {
  if (sid) return editeurSeance(racine, profil, pid, cid, sid);
  if (cid) return editeurCycle(racine, profil, pid, cid);
  if (pid) return editeurProgramme(racine, profil, pid);
  return listeProgrammes(racine, profil);
}

// ───────────── Liste des programmes ─────────────
async function listeProgrammes(racine, profil) {
  const [programmes, profils] = await Promise.all([api.listProgrammesApp(), api.listProfilsApp()]);
  const cartes = programmes.map((p) => {
    const nb = profils.filter((x) => x.programme_id === p.id).length;
    return `<a href="#/coach/programmes/${esc(p.id)}" class="carte carte-programme">
      <div class="ligne-entre"><span class="surtitre-carte">${esc(NIVEAUX[p.niveau] || p.niveau).toUpperCase()} · ${p.seances_semaine} SÉANCES / SEMAINE</span>
        ${p.actif ? badge('EN LIGNE', 'var(--vert)') : badge('BROUILLON', 'var(--orange)')}</div>
      <strong class="titre-carte">${esc(p.nom)}</strong>
      <span class="petit">${esc(p.description || '')}</span>
      <span class="petit">${p.nb_cycles} cycle${p.nb_cycles > 1 ? 's' : ''} de 12 semaines · ${nb} abonnée${nb > 1 ? 's' : ''} dessus</span>
    </a>`;
  }).join('');
  racine.innerHTML = page(profil, ACTIF, entete('ABONNÉES BOOTY FLOW APP', 'Programmes') + `
    <p class="petit">Après le questionnaire, chaque abonnée reçoit automatiquement le premier programme « en ligne » qui correspond à son niveau
      et à son nombre de séances. Tes modifications sont visibles tout de suite dans leur app.</p>
    <div class="grille-programmes">${cartes || '<p class="vide">Aucun programme. Lance supabase/programmes-app.sql pour ajouter les 4 brouillons.</p>'}</div>
    <button class="bouton-contour" id="nouveau">${icone('plus', 18)}Nouveau programme</button>`);
  racine.querySelector('#nouveau').addEventListener('click', async (e) => {
    const id = await pendant(e.currentTarget, 'Création…', () => api.saveProgrammeApp(null, {
      nom: 'Nouveau programme', niveau: 'intermediaire', seances_semaine: 3, description: '', actif: false, ordre: programmes.length + 1
    }));
    location.hash = `#/coach/programmes/${id}`;
  });
}

// ───────────── Un programme : réglages + cycles ─────────────
async function editeurProgramme(racine, profil, pid) {
  const p = await api.getProgrammeApp(pid);
  if (!p) { location.hash = '#/coach/programmes'; return; }
  const option = (v, t, actuel) => `<option value="${v}"${String(actuel) === String(v) ? ' selected' : ''}>${t}</option>`;
  const cycles = p.cycles.map((c) => `<div class="ligne-cycle">
      <a href="#/coach/programmes/${esc(p.id)}/${esc(c.id)}"><strong>${esc(c.titre || `Cycle ${c.numero}`)}</strong>
        <span class="petit">Cycle ${c.numero} · ${c.seances.length} séance${c.seances.length > 1 ? 's' : ''} · ${esc(c.description || '')}</span></a>
      <div class="actions-ligne">
        <a href="#/coach/programmes/${esc(p.id)}/${esc(c.id)}" class="bouton-contour compact">Modifier</a>
        <button class="bouton-contour compact" data-dupliquer="${esc(c.id)}">Dupliquer</button>
        <button class="bouton-rond" data-supprimer="${esc(c.id)}" aria-label="Supprimer le cycle ${c.numero}">${icone('poubelle', 18)}</button>
      </div></div>`).join('');
  racine.innerHTML = page(profil, ACTIF, entete('PROGRAMME', p.nom, '#/coach/programmes') + `
    <form class="formulaire carte large" id="form-programme">
      <label>Nom<input name="nom" value="${esc(p.nom)}" required></label>
      <div class="grille-3">
        <label>Niveau<select name="niveau">${Object.entries(NIVEAUX).map(([v, t]) => option(v, t, p.niveau)).join('')}</select></label>
        <label>Séances par semaine<select name="seances_semaine">${[2, 3, 4, 5].map((n) => option(n, n, p.seances_semaine)).join('')}</select></label>
        <label>Ordre<input name="ordre" type="number" min="0" value="${p.ordre ?? 0}"></label>
      </div>
      <label>Description (vue par l'abonnée)<textarea name="description" rows="3">${esc(p.description || '')}</textarea></label>
      <label class="case"><input type="checkbox" name="actif"${p.actif ? ' checked' : ''}><span>En ligne (attribué automatiquement après le questionnaire)</span></label>
      <div class="ligne-boutons">
        <button class="bouton-principal" type="submit">ENREGISTRER</button>
        <button class="lien danger" type="button" id="supprimer-programme">Supprimer ce programme</button>
      </div>
    </form>
    <section class="carte large">
      <div class="surtitre-carte">CYCLES DE 12 SEMAINES</div>
      <p class="petit">Quand une abonnée termine les 12 semaines d'un cycle, elle débloque le suivant. « Dupliquer » crée le cycle suivant à partir de celui-ci.</p>
      ${cycles || '<p class="vide">Aucun cycle.</p>'}
      <button class="bouton-contour compact" id="nouveau-cycle">${icone('plus', 16)}Nouveau cycle vide</button>
    </section>`);

  racine.querySelector('#form-programme').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    await pendant(e.submitter, 'Enregistrement…', () => api.saveProgrammeApp(pid, {
      nom: d.get('nom').trim(), niveau: d.get('niveau'), seances_semaine: Number(d.get('seances_semaine')),
      ordre: Number(d.get('ordre')) || 0, description: d.get('description').trim(), actif: d.get('actif') === 'on'
    }));
    toast('Programme enregistré.');
    editeurProgramme(racine, profil, pid);
  });
  racine.querySelector('#supprimer-programme').addEventListener('click', async () => {
    if (!confirm(`Supprimer « ${p.nom} » et tous ses cycles ? Les abonnées qui le suivent n'auront plus de programme.`)) return;
    await api.deleteProgrammeApp(pid);
    toast('Programme supprimé.');
    location.hash = '#/coach/programmes';
  });
  racine.querySelector('#nouveau-cycle').addEventListener('click', async (e) => {
    const id = await pendant(e.currentTarget, 'Création…', () => api.saveCycleApp(null, pid, {}));
    location.hash = `#/coach/programmes/${pid}/${id}`;
  });
  racine.querySelectorAll('[data-dupliquer]').forEach((b) => b.addEventListener('click', async () => {
    await pendant(b, 'Copie…', () => api.dupliquerCycleApp(b.dataset.dupliquer));
    toast('Cycle dupliqué.');
    editeurProgramme(racine, profil, pid);
  }));
  racine.querySelectorAll('[data-supprimer]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Supprimer ce cycle et ses séances ?')) return;
    await api.deleteCycleApp(b.dataset.supprimer);
    editeurProgramme(racine, profil, pid);
  }));
}

// ───────────── Un cycle : 12 semaines + séances ─────────────
async function editeurCycle(racine, profil, pid, cid) {
  const p = await api.getProgrammeApp(pid);
  const c = p?.cycles.find((x) => x.id === cid);
  if (!c) { location.hash = `#/coach/programmes/${pid}`; return; }
  const semaines = Array.from({ length: 12 }, (_, i) => c.semaines?.find((s) => s.numero === i + 1) || { numero: i + 1, consigne: '' });
  racine.innerHTML = page(profil, ACTIF, entete(esc(p.nom).toUpperCase(), c.titre || `Cycle ${c.numero}`, `#/coach/programmes/${pid}`) + `
    <section class="carte large">
      <div class="surtitre-carte">SÉANCES (RÉPÉTÉES CHAQUE SEMAINE)</div>
      ${c.seances.map((s) => `<a href="#/coach/programmes/${esc(pid)}/${esc(cid)}/${esc(s.id)}" class="ligne-cycle lien-bloc">
        <span><strong>${esc(s.nom)}</strong><span class="petit">${(s.exercices || []).length} exercice${(s.exercices || []).length > 1 ? 's' : ''} · ${esc(s.description || '')}</span></span>
        ${icone('chevron', 18)}</a>`).join('') || '<p class="vide">Aucune séance.</p>'}
      <button class="bouton-contour compact" id="nouvelle-seance">${icone('plus', 16)}Ajouter une séance</button>
    </section>
    <form class="formulaire carte large" id="form-cycle">
      <div class="surtitre-carte">LE CYCLE</div>
      <label>Titre<input name="titre" value="${esc(c.titre || '')}"></label>
      <label>Description<textarea name="description" rows="2">${esc(c.description || '')}</textarea></label>
      <div class="surtitre-carte">CONSIGNE DE CHAQUE SEMAINE</div>
      <div class="grille-semaines">${semaines.map((s) => `<label>Semaine ${s.numero}<input name="semaine-${s.numero}" value="${esc(s.consigne || '')}" placeholder="Ex. : semaine de décharge"></label>`).join('')}</div>
      <button class="bouton-principal" type="submit">ENREGISTRER LE CYCLE</button>
    </form>`);
  racine.querySelector('#form-cycle').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(e.target);
    await pendant(e.submitter, 'Enregistrement…', () => api.saveCycleApp(cid, pid, {
      titre: d.get('titre').trim(), description: d.get('description').trim(),
      semaines: semainesVides().map((s) => ({ numero: s.numero, consigne: d.get(`semaine-${s.numero}`).trim() }))
    }));
    toast('Cycle enregistré.');
  });
  racine.querySelector('#nouvelle-seance').addEventListener('click', async (e) => {
    const id = await pendant(e.currentTarget, 'Création…', () => api.saveSeanceApp(null, cid, {
      nom: `Séance ${String.fromCharCode(65 + c.seances.length)}`, description: '', ordre: c.seances.length + 1, exercices: []
    }));
    location.hash = `#/coach/programmes/${pid}/${cid}/${id}`;
  });
}

// ───────────── Une séance : exercices + progression semaine par semaine ─────────────
const exerciceVide = () => ({
  nom: '', principal: false, series: 3, reps: '10-12', repos: '1 min 30', consignes: '', alternative_maison: '', video_id: null,
  progression: Array.from({ length: 12 }, () => ({ series: 3, reps: '10-12', charge: '' }))
});

function carteExercice(ex, i, total, biblio) {
  const prog = Array.from({ length: 12 }, (_, s) => ex.progression?.[s] || { series: ex.series, reps: ex.reps, charge: '' });
  return `<fieldset class="carte-exercice" data-index="${i}">
    <div class="ligne-entre"><legend class="surtitre-carte">EXERCICE ${i + 1}</legend>
      <div class="actions-ligne">
        <button type="button" class="bouton-rond" data-monter="${i}" aria-label="Monter"${i === 0 ? ' disabled' : ''}>↑</button>
        <button type="button" class="bouton-rond" data-descendre="${i}" aria-label="Descendre"${i === total - 1 ? ' disabled' : ''}>↓</button>
        <button type="button" class="bouton-rond" data-retirer="${i}" aria-label="Supprimer l'exercice">${icone('poubelle', 16)}</button>
      </div></div>
    <div class="grille-2">
      <label>Exercice<input data-champ="nom" value="${esc(ex.nom)}" required placeholder="Ex. : Hip thrust"></label>
      <label>Vidéo de la vidéothèque<select data-champ="video_id">
        <option value="">Automatique (vidéo dont le titre contient le nom)</option>
        ${biblio.map((v) => `<option value="${esc(v.id)}"${v.id === ex.video_id ? ' selected' : ''}>${esc(v.titre)}</option>`).join('')}
      </select></label>
    </div>
    <div class="grille-3">
      <label>Séries<input data-champ="series" type="number" min="1" value="${esc(ex.series)}"></label>
      <label>Répétitions<input data-champ="reps" value="${esc(ex.reps)}"></label>
      <label>Repos<input data-champ="repos" value="${esc(ex.repos)}"></label>
    </div>
    <label>Consignes<textarea data-champ="consignes" rows="2">${esc(ex.consignes)}</textarea></label>
    <label>Variante à la maison<input data-champ="alternative_maison" value="${esc(ex.alternative_maison)}" placeholder="Ex. : Hip thrust au sol avec sac lesté"></label>
    <label class="case"><input type="checkbox" data-champ="principal"${ex.principal ? ' checked' : ''}><span>Exercice principal (suivi de progression et détection de plateau)</span></label>
    <details class="progression">
      <summary>Progression semaine par semaine</summary>
      <div class="tableau-progression">
        <span class="petit">Sem.</span><span class="petit">Séries</span><span class="petit">Répétitions</span><span class="petit">Consigne de charge</span>
        ${prog.map((p, s) => `<span class="petit">${s + 1}</span>
          <input data-prog="${s}" data-cle="series" type="number" min="1" value="${esc(p.series)}" aria-label="Séries semaine ${s + 1}">
          <input data-prog="${s}" data-cle="reps" value="${esc(p.reps)}" aria-label="Répétitions semaine ${s + 1}">
          <input data-prog="${s}" data-cle="charge" value="${esc(p.charge)}" aria-label="Consigne de charge semaine ${s + 1}" placeholder="Ex. : +2,5 kg">`).join('')}
      </div>
      <button type="button" class="lien" data-recopier="${i}">Recopier séries et répétitions de la semaine 1 sur les 12 semaines</button>
    </details>
  </fieldset>`;
}

// Lit le formulaire et renvoie la liste des exercices
function lireExercices(zone) {
  return [...zone.querySelectorAll('.carte-exercice')].map((f) => {
    const champ = (k) => f.querySelector(`[data-champ="${k}"]`);
    const progression = Array.from({ length: 12 }, (_, s) => ({
      series: Number(f.querySelector(`[data-prog="${s}"][data-cle="series"]`).value) || null,
      reps: f.querySelector(`[data-prog="${s}"][data-cle="reps"]`).value.trim(),
      charge: f.querySelector(`[data-prog="${s}"][data-cle="charge"]`).value.trim()
    }));
    return {
      nom: champ('nom').value.trim(), video_id: champ('video_id').value || null,
      series: Number(champ('series').value) || null, reps: champ('reps').value.trim(), repos: champ('repos').value.trim(),
      consignes: champ('consignes').value.trim(), alternative_maison: champ('alternative_maison').value.trim(),
      principal: champ('principal').checked, progression
    };
  });
}

async function editeurSeance(racine, profil, pid, cid, sid) {
  const [p, biblio] = await Promise.all([api.getProgrammeApp(pid), api.listBibliotheque()]);
  const c = p?.cycles.find((x) => x.id === cid);
  const s = c?.seances.find((x) => x.id === sid);
  if (!s) { location.hash = `#/coach/programmes/${pid}/${cid}`; return; }
  let exercices = structuredClone(s.exercices || []);

  const dessiner = () => {
    racine.innerHTML = page(profil, ACTIF, entete(`${esc(p.nom).toUpperCase()} · ${esc(c.titre || `CYCLE ${c.numero}`).toUpperCase()}`, s.nom, `#/coach/programmes/${pid}/${cid}`) + `
      <form class="formulaire carte large" id="form-seance">
        <div class="grille-2">
          <label>Nom de la séance<input name="nom" value="${esc(s.nom)}" required></label>
          <label>Ordre dans la semaine<input name="ordre" type="number" min="1" value="${s.ordre ?? 1}"></label>
        </div>
        <label>Description<input name="description" value="${esc(s.description || '')}"></label>
        <div class="pile" id="exercices">${exercices.map((ex, i) => carteExercice(ex, i, exercices.length, biblio)).join('')}</div>
        <button type="button" class="bouton-contour" id="ajouter">${icone('plus', 18)}Ajouter un exercice</button>
        <div class="ligne-boutons barre-enregistrer">
          <button class="bouton-principal" type="submit">ENREGISTRER LA SÉANCE</button>
          <button class="lien danger" type="button" id="supprimer">Supprimer la séance</button>
        </div>
      </form>`);
    const form = racine.querySelector('#form-seance');
    const garder = () => { exercices = lireExercices(form); };
    form.querySelector('#ajouter').addEventListener('click', () => { garder(); exercices.push(exerciceVide()); dessiner(); });
    form.querySelectorAll('[data-retirer]').forEach((b) => b.addEventListener('click', () => {
      garder();
      if (!confirm(`Supprimer « ${exercices[b.dataset.retirer].nom || 'cet exercice'} » ?`)) return;
      exercices.splice(Number(b.dataset.retirer), 1); dessiner();
    }));
    const deplacer = (i, d) => { garder(); [exercices[i], exercices[i + d]] = [exercices[i + d], exercices[i]]; dessiner(); };
    form.querySelectorAll('[data-monter]').forEach((b) => b.addEventListener('click', () => deplacer(Number(b.dataset.monter), -1)));
    form.querySelectorAll('[data-descendre]').forEach((b) => b.addEventListener('click', () => deplacer(Number(b.dataset.descendre), 1)));
    form.querySelectorAll('[data-recopier]').forEach((b) => b.addEventListener('click', () => {
      const f = b.closest('.carte-exercice');
      const series = f.querySelector('[data-champ="series"]').value, reps = f.querySelector('[data-champ="reps"]').value;
      f.querySelectorAll('[data-cle="series"]').forEach((x) => { x.value = series; });
      f.querySelectorAll('[data-cle="reps"]').forEach((x) => { x.value = reps; });
      toast('Séries et répétitions recopiées sur les 12 semaines.');
    }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      garder();
      const d = new FormData(form);
      await pendant(e.submitter, 'Enregistrement…', () => api.saveSeanceApp(sid, cid, {
        nom: d.get('nom').trim(), ordre: Number(d.get('ordre')) || 1, description: d.get('description').trim(), exercices
      }));
      s.nom = d.get('nom').trim();
      toast('Séance enregistrée : elle est à jour chez tes abonnées.');
    });
    form.querySelector('#supprimer').addEventListener('click', async () => {
      if (!confirm(`Supprimer « ${s.nom} » ?`)) return;
      await api.deleteSeanceApp(sid);
      location.hash = `#/coach/programmes/${pid}/${cid}`;
    });
  };
  dessiner();
}

// ───────────── Fiche d'une abonnée : questionnaire et programme ─────────────
export async function blocProgrammeAbonnee(zone, e) {
  const [pa, programmes] = await Promise.all([api.getProfilApp(e.id), api.listProgrammesApp()]);
  const faites = pa?.programme_id ? (await api.listSeancesFaites(e.id, pa.cycle_numero)).filter((f) => f.statut === 'faite').length : 0;
  const OBJ = { perte_de_gras: 'Perte de gras', prise_de_muscle: 'Prise de muscle' };
  zone.innerHTML = pa?.complete_le ? `<form class="formulaire carte large" id="form-programme-abonnee">
      <div class="surtitre-carte">QUESTIONNAIRE ET PROGRAMME</div>
      <p class="petit">${pa.age} ans · ${pa.taille} cm · ${pa.poids_depart} kg au départ · ${esc(NIVEAUX[pa.niveau] || '')} · ${pa.seances_semaine} séances
        · ${pa.lieu === 'maison' ? 'à la maison' : 'en salle'} · ${esc(OBJ[pa.objectif] || '')}</p>
      <div class="grille-2">
        <label>Programme<select name="programme_id"><option value="">Aucun</option>
          ${programmes.map((p) => `<option value="${esc(p.id)}"${p.id === pa.programme_id ? ' selected' : ''}>${esc(p.nom)}</option>`).join('')}</select></label>
        <label>Cycle en cours<input name="cycle_numero" type="number" min="1" value="${pa.cycle_numero || 1}"></label>
      </div>
      <p class="petit">${faites} séance${faites > 1 ? 's' : ''} faite${faites > 1 ? 's' : ''} dans ce cycle.</p>
      <button class="bouton-contour" type="submit">Changer son programme</button>
    </form>` : '<section class="carte large"><p class="petit">Elle n\'a pas encore rempli le questionnaire de première connexion.</p></section>';
  zone.querySelector('form')?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const d = new FormData(ev.target);
    await pendant(ev.submitter, 'Enregistrement…', () => api.setProfilApp(e.id, {
      programme_id: d.get('programme_id') || null, cycle_numero: Number(d.get('cycle_numero')) || 1
    }));
    toast('Programme mis à jour.');
  });
}
