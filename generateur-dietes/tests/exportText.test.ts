import { describe, expect, it } from 'vitest';
import { dietToHtml, dietToText } from '../src/engine/exportText';
import { DEFAULT_FOODS } from '../src/engine/foods';
import { generateDays } from '../src/engine/generator';
import { formatQty, withCookedMode } from '../src/engine/nutrition';
import { createRng } from '../src/engine/random';
import { DEFAULT_SETTINGS } from '../src/engine/settings';
import { shoppingList } from '../src/engine/shopping';
import { computeTargets } from '../src/engine/targets';
import { EMPTY_OPTIONS, type Diet, type Student } from '../src/engine/types';

const student: Student = {
  firstName: 'Léa',
  age: 29,
  sex: 'F',
  height: 165,
  weight: 62,
  objective: 'perte_de_gras',
  phase: 'deficit',
  level: 'Intermédiaire',
  sessionsPerWeek: 4,
  trainingTime: '18:00',
  useAdjustedWeight: false,
  options: { ...EMPTY_OPTIONS },
  notes: '',
  createdAt: '2026-10-22',
};

function makeDiet(): Diet {
  const t = computeTargets({ weight: 62, height: 165, objective: 'perte_de_gras', phase: 'deficit', useAdjustedWeight: false, kcalTraining: 1900, kcalRest: 1650 }, DEFAULT_SETTINGS);
  const days = generateDays({ foods: withCookedMode(DEFAULT_FOODS, true), options: { ...EMPTY_OPTIONS }, settings: DEFAULT_SETTINGS, rng: createRng(7) }, t, '18:00');
  return {
    studentId: 1,
    createdAt: '2026-10-22',
    title: 'Diète déficit',
    phase: 'deficit',
    objective: 'perte_de_gras',
    weight: 62,
    kcalTraining: 1900,
    kcalRest: 1650,
    overrides: {},
    options: { ...EMPTY_OPTIONS },
    trainingTime: '18:00',
    days,
    trainingDaysPerWeek: 4,
    restDaysPerWeek: 3,
    notes: 'On garde le cap !',
  };
}

describe('copie de la diète en texte', () => {
  const diet = makeDiet();

  it('contient chaque repas et chaque aliment avec sa quantité', () => {
    const txt = dietToText(diet, student, DEFAULT_SETTINGS, { macros: false, variants: false, shopping: false });
    expect(txt).toContain('Plan alimentaire de Léa');
    expect(txt).toContain('JOUR TRAINING — 1 900 kcal');
    expect(txt).toContain('JOUR REPOS');
    expect(txt).toContain('On garde le cap !');
    for (const day of diet.days)
      for (const m of day.meals) {
        expect(txt).toContain(`${m.time} · ${m.label}`);
        for (const it of m.variants[m.selected].items) expect(txt).toContain(`- ${it.food.name} : ${formatQty(it)}`);
      }
    expect(txt).not.toContain('kcal ·'); // pas de macros
    expect(txt).not.toContain('Ou variante');
  });

  it('options : macros, variantes, une seule journée, liste de courses', () => {
    const shopping = shoppingList([{ day: diet.days[0], count: 4 }]);
    const txt = dietToText(diet, student, DEFAULT_SETTINGS, { days: [0], macros: true, variants: true, shopping: true }, shopping);
    expect(txt).toContain('TOTAL DU JOUR');
    expect(txt).toContain('Total du repas');
    expect(txt).toContain('Ou variante 2');
    expect(txt).not.toContain('JOUR REPOS');
    expect(txt).toContain('LISTE DE COURSES');
    expect(txt).toContain('(poids sec)');
  });

  it('version HTML avec tableaux pour Word / Google Docs', () => {
    const html = dietToHtml(diet, student, DEFAULT_SETTINGS, { macros: true, variants: true, shopping: false });
    expect(html).toContain('<table');
    expect(html).toContain('Total du repas');
    expect(html).toContain('Léa');
  });
});
