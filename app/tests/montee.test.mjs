// Tests de la montée en gamme. Lancer : node --test app/tests/montee.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detecterPlateau, bilanCycle, exercicesPrincipaux } from '../js/montee-calcul.js';

const jour = (n) => new Date(Date.UTC(2026, 10, 18) + n * 864e5).toISOString().slice(0, 10);
const AUJ = jour(0);
const serie = (exercice, poids) => poids.map((kg, i) => ({ exercice, date: jour(-7 * (poids.length - 1 - i)), poids: kg }));

test('exercices principaux du programme', () => {
  const seances = [{ exercices: [{ nom: 'Hip thrust', principal: true }, { nom: 'Abduction', principal: false }] },
    { exercices: [{ nom: 'Hip thrust', principal: true }, { nom: 'Soulevé de terre roumain', principal: true }] }];
  assert.deepEqual(exercicesPrincipaux(seances), ['Hip thrust', 'Soulevé de terre roumain']);
});

test('plateau : aucune charge principale ne monte depuis 4 semaines', () => {
  const charges = [...serie('Hip thrust', [60, 65, 70, 70, 70, 70, 70]), ...serie('Soulevé de terre roumain', [40, 45, 45, 45, 45, 45, 45])];
  const r = detecterPlateau(charges, ['Hip thrust', 'Soulevé de terre roumain'], AUJ);
  assert.equal(r.plateau, true);
  assert.equal(r.exercices.length, 2);
});

test('pas de plateau si au moins un exercice principal progresse', () => {
  const charges = [...serie('Hip thrust', [60, 65, 70, 70, 70, 70, 72.5]), ...serie('Soulevé de terre roumain', [40, 45, 45, 45, 45, 45, 45])];
  assert.equal(detecterPlateau(charges, ['Hip thrust', 'Soulevé de terre roumain'], AUJ).plateau, false);
});

test('pas de plateau sans assez d\'historique ou sans charge récente', () => {
  assert.equal(detecterPlateau(serie('Hip thrust', [60, 60, 60, 60]), ['Hip thrust'], AUJ).plateau, false);   // 3 semaines d'historique
  const anciennes = serie('Hip thrust', [60, 65, 70, 70, 70, 70]).map((c) => ({ ...c, date: jour(-30 - (6 * 7 - 7 * 6)) }));
  assert.equal(detecterPlateau(anciennes, ['Hip thrust'], AUJ).plateau, false);
  assert.equal(detecterPlateau([], ['Hip thrust'], AUJ).plateau, false);
});

test('noms d\'exercices comparés sans majuscules ni accents', () => {
  const charges = serie('hip  THRUST', [60, 70, 70, 70, 70, 70, 70]);
  assert.equal(detecterPlateau(charges, ['Hip thrust'], AUJ).plateau, true);
});

test('bilan de fin de cycle', () => {
  const debut = jour(-84);
  const seances = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const faites = Array.from({ length: 34 }, () => ({ statut: 'faite' })).concat([{ statut: 'sautee' }, { statut: 'sautee' }]);
  const pesees = [{ date: jour(-86), poids: 64.2 }, { date: jour(-40), poids: 62.8 }, { date: jour(-1), poids: 61.5 }];
  const releves = [{ date: jour(-84), tour_taille: 70, fessiers: 100 }, { date: jour(-2), tour_taille: 66.5, fessiers: 101.5 }];
  const charges = [{ exercice: 'Hip thrust', date: jour(-80), poids: 50 }, { exercice: 'Hip thrust', date: jour(-10), poids: 72.5 }, { exercice: 'Hip thrust', date: jour(-100), poids: 30 }];
  const b = bilanCycle({ debut, fin: AUJ, seances, faites, pesees, releves, charges, principaux: ['Hip thrust', 'Squat'] });
  assert.deepEqual(b.seances, { total: 36, faites: 34, sautees: 2, regularite: 94 });
  assert.deepEqual(b.poids, { debut: 64.2, fin: 61.5, ecart: -2.7 });
  assert.deepEqual(b.mesures.map((m) => [m.cle, m.ecart]), [['tour_taille', -3.5], ['fessiers', 1.5]]);
  assert.deepEqual(b.charges, [{ exercice: 'Hip thrust', depart: 50, record: 72.5, gain: 22.5, pourcent: 45 }]);
});
