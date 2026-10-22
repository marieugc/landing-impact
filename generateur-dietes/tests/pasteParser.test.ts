import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { countItems, parseItem, parseItems, parsePastedDiet } from '../src/engine/pasteParser';

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

describe('lecture d’un aliment', () => {
  it.each([
    ['150 g de skyr nature', 'Skyr nature', '150 g'],
    ['40g flocons d’avoine', 'Flocons d’avoine', '40 g'],
    ['Riz basmati 180 g cuit', 'Riz basmati', '180 g cuit'],
    ['Blanc de poulet : 130 g', 'Blanc de poulet', '130 g'],
    ['Riz complet 150g (pesé cuit)', 'Riz complet', '150 g pesé cuit'],
    ['1 c. à soupe d’huile d’olive', 'Huile d’olive', '1 c. à soupe'],
    ['1 c.à.s beurre de cacahuète', 'Beurre de cacahuète', '1 c. à soupe'],
    ['2 tranches pain complet', 'Pain complet', '2 tranches'],
    ['1 banane', 'Banane', '1'],
    ['Une pomme', 'Pomme', '1'],
    ['1/2 avocat', 'Avocat', '1/2'],
    ['3 œufs', 'Œufs', '3'],
    ['2 steaks hachés 5%', 'Steaks hachés 5%', '2'],
    ['Omelette 3 oeufs', 'Omelette', '3 œufs'],
    ['Oméga 3 x2', 'Oméga 3', '× 2'],
    ['200 ml lait d’amande', 'Lait d’amande', '200 ml'],
    ['100-120 g de poulet', 'Poulet', '100-120 g'],
    ['Légumes à volonté', 'Légumes à volonté', ''],
  ])('%s', (input, name, qty) => {
    expect(parseItem(input)).toEqual({ name, qty });
  });

  it('plusieurs aliments sur une ligne et alternatives', () => {
    const items = parseItems('150 g cabillaud ou 120 g saumon + 200 g patate douce cuite');
    expect(items.map((i) => [i.name, i.qty, Boolean(i.alt)])).toEqual([
      ['Cabillaud', '150 g', false],
      ['Saumon', '120 g', true],
      ['Patate douce', '200 g cuite', false],
    ]);
    expect(parseItems('150 g dinde, 150 g quinoa cuit, 10 g huile').length).toBe(3);
    const porridge = parseItems('Porridge : 50g flocons + 200ml lait');
    expect(porridge[0]).toEqual({ name: 'Porridge', qty: '', heading: true });
    expect(porridge.length).toBe(3);
  });
});

describe('lecture d’une diète complète', () => {
  it('journées, repas, heures, macros et conseils', () => {
    const d = parsePastedDiet(fixture('diete-julie.txt'));
    expect(d.title).toBe('Diète de Julie – Sèche semaine 3');
    expect(d.days.map((x) => x.title)).toEqual(['Jour training', 'Jour repos']);
    expect(d.days[0].subtitle).toContain('1850 kcal');
    expect(d.days[0].subtitle).toContain('P 130 g');
    const training = d.days[0].meals.map((m) => m.title);
    expect(training).toEqual(['Petit-déjeuner', 'Repas du midi', 'Collation pré-training', 'Post-training', 'Dîner']);
    expect(d.days[0].meals[0].time).toBe('08h00');
    expect(d.days[0].meals[2].items.map((i) => i.name)).toEqual(['Crème de riz', 'Banane']);
    const diner = d.days[0].meals[4].items;
    expect(diner.find((i) => i.name === 'Saumon')?.alt).toBe(true);
    expect(diner.find((i) => i.name === 'Pâtes')?.alt).toBe(true); // ligne « OU » seule
    expect(d.days[1].meals.length).toBe(4);
    expect(d.notes).toEqual(["Boire 2 L d'eau par jour.", 'Pesée à jeun le lundi matin.']);
    expect(countItems(d)).toBeGreaterThan(25);
  });

  it('format avec émojis, heures et numéros, sans journées', () => {
    const d = parsePastedDiet(fixture('diete-sarah.txt'));
    expect(d.title).toBe('PLAN ALIMENTAIRE – Sarah');
    expect(d.days.length).toBe(1);
    const meals = d.days[0].meals;
    expect(meals.map((m) => [m.time, m.title])).toEqual([
      ['07h30', 'Petit déjeuner'],
      ['12h30', 'Déjeuner'],
      ['16h00', 'Goûter'],
      ['20h00', 'Dîner'],
      ['', 'Compléments'],
    ]);
    expect(meals[1].items.map((i) => i.name)).toEqual(['Saumon', 'Riz complet', 'Brocolis', "Huile d'olive"]);
    expect(meals[4].items.map((i) => i.qty)).toEqual(['× 2', '1 gélule']);
  });

  it('texte vide ou sans aliment', () => {
    expect(countItems(parsePastedDiet(''))).toBe(0);
    expect(parsePastedDiet('Bonjour Julie').title).toBe('Bonjour Julie');
  });
});
