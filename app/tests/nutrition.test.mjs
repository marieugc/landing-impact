// Tests du calculateur nutrition. Lancer : node --test app/tests/nutrition.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { besoins, journeeType, arrondir, libelleQuantite, REGLAGES_DEFAUT } from '../js/nutrition-calcul.js';

const camille = { poids: 62, taille: 165, age: 29, seances_semaine: 4, objectif: 'perte_de_gras' };

test('dépense, déficit et macros', () => {
  const b = besoins(camille);
  assert.equal(b.base, 1345);                 // 620 + 1031,25 − 145 − 161
  assert.equal(b.depense, 2085);              // × 1,55 (4 séances)
  assert.equal(b.moyenne, 1585);              // − 500 kcal
  assert.equal(b.training.proteines, 124);    // 2 g/kg
  assert.equal(b.training.lipides, 56);       // 0,9 g/kg
  assert.ok(b.training.glucides > b.off.glucides, 'plus de glucides les jours training');
  assert.equal(b.training.proteines, b.off.proteines);
  // Moyenne de la semaine conservée (4 jours training, 3 jours off)
  const semaine = (b.training.kcal * 4 + b.off.kcal * 3) / 7;
  assert.ok(Math.abs(semaine - b.moyenne) <= 3, `moyenne ${semaine}`);
});

test('prise de muscle : +500 kcal', () => {
  const b = besoins({ ...camille, objectif: 'prise_de_muscle', seances_semaine: 3 });
  assert.equal(b.moyenne, Math.round(1345.25 * 1.45 + 500));
});

test('les coefficients de la coach sont utilisés', () => {
  const b = besoins(camille, { ...REGLAGES_DEFAUT.coefficients, proteines_g_kg: 1.8, deficit_perte_de_gras: 300 });
  assert.equal(b.training.proteines, 112);
  assert.equal(b.moyenne, 1785);
});

test('arrondis : chiffres ronds uniquement', () => {
  assert.equal(arrondir(165, 50), 150);
  assert.equal(arrondir(168, 50), 150);
  assert.equal(arrondir(176, 50), 200);
  assert.equal(arrondir(20, 50), 50);
  assert.equal(arrondir(13, 5), 15);
});

test('journée type : quantités rondes, proche de la cible, poids cuit / cru indiqués', () => {
  const b = besoins(camille);
  for (const type of ['training', 'off']) {
    const j = journeeType(b[type], REGLAGES_DEFAUT.journees[type], REGLAGES_DEFAUT.aliments);
    for (const r of j.repas) for (const it of r.items) {
      if (it.unite === 'g') assert.equal(it.quantite % (it.aliment.pas || 50), 0, `${it.aliment.nom} ${it.quantite}`);
    }
    const ecart = Math.abs(j.total.kcal - b[type].kcal) / b[type].kcal;
    console.log(type, 'cible', b[type], '→ journée', j.total, `écart ${(ecart * 100).toFixed(1)} %`);
    for (const r of j.repas) console.log('   ', r.nom, '·', r.items.map(libelleQuantite).join(' + '));
    assert.ok(ecart < 0.12, `écart ${ecart}`);
  }
  const riz = journeeType(b.training, REGLAGES_DEFAUT.journees.training).repas[1].items.find((x) => x.aliment.id === 'riz');
  assert.match(libelleQuantite(riz), /poids cuit/);
});

test('structure Booty Flow : pancake, avant / après l\'entraînement, 2 g/kg de protéines', () => {
  for (const profil of [camille, { ...camille, poids: 75, objectif: 'prise_de_muscle', seances_semaine: 3 }]) {
    const b = besoins(profil);
    const j = journeeType(b.training, REGLAGES_DEFAUT.journees.training, REGLAGES_DEFAUT.aliments);
    const repas = (debut) => j.repas.find((r) => r.nom.startsWith(debut));
    const ids = (r) => r.items.map((x) => x.aliment.id);
    assert.deepEqual(j.repas.map((r) => r.nom.split(' (')[0]), ['Petit-déjeuner', 'Déjeuner', 'Collation', 'Avant l\'entraînement', 'Après l\'entraînement', 'Dîner']);
    assert.deepEqual(ids(repas('Petit-déjeuner')), ['oeuf', 'sarrasin']);
    assert.match(libelleQuantite(repas('Petit-déjeuner').items[1]), /farine de sarrasin ou \d+ g de crème de riz/);
    assert.deepEqual(ids(repas('Avant')), ['creme_riz', 'banane']);
    assert.ok(repas('Avant').items[0].quantite >= 20, 'assez de crème de riz avant la séance');
    assert.deepEqual(ids(repas('Après')), ['whey_iso', 'compote']);
    // Protéines de la journée : 2 g/kg (à 3 % près, arrondis compris)
    const cible = profil.poids * 2;
    assert.ok(Math.abs(j.total.proteines - cible) / cible <= 0.03, `protéines ${j.total.proteines} pour ${cible}`);
    const off = journeeType(b.off, REGLAGES_DEFAUT.journees.off, REGLAGES_DEFAUT.aliments);
    assert.deepEqual(off.repas.map((r) => r.nom.split(' (')[0]), ['Petit-déjeuner', 'Déjeuner', 'Collation', 'Dîner']);
    assert.ok(Math.abs(off.total.proteines - cible) / cible <= 0.03, `protéines off ${off.total.proteines} pour ${cible}`);
  }
});
