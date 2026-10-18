import { describe, expect, it } from 'vitest';
import { defaultRefGrams, equivalences } from '../src/engine/equivalences';
import { isAllowed } from '../src/engine/filters';
import { DEFAULT_FOODS } from '../src/engine/foods';
import {
  dayTotals,
  generateDay,
  generateDays,
  isDayOk,
  maxMacroGap,
  regenerateMeal,
  selectVariant,
  type GenContext,
} from '../src/engine/generator';
import { foodMacros, formatQty, gramsOf, kcalOf, stepOf, variantMacros, withCookedMode } from '../src/engine/nutrition';
import { createRng } from '../src/engine/random';
import { DEFAULT_SETTINGS } from '../src/engine/settings';
import { shoppingList } from '../src/engine/shopping';
import { adjustedWeight, computeTargets, estimatedMaintenance, mifflinBmr } from '../src/engine/targets';
import { daySlots } from '../src/engine/templates';
import { EMPTY_OPTIONS, type DayPlan, type DietOptions, type Food, type Phase } from '../src/engine/types';

const S = DEFAULT_SETTINGS;
const byId = (id: string) => DEFAULT_FOODS.find((f) => f.id === id) as Food;
// mode par défaut de l'application : féculents et légumineuses en poids cuit
const COOKED = withCookedMode(DEFAULT_FOODS, true);
const ctx = (seed: number, o: Partial<DietOptions> = {}, foods = COOKED): GenContext => ({
  foods,
  options: { ...EMPTY_OPTIONS, ...o },
  settings: S,
  rng: createRng(seed),
});
const baseInput = {
  weight: 62,
  height: 165,
  objective: 'perte_de_gras' as const,
  phase: 'deficit' as Phase,
  useAdjustedWeight: false,
  kcalTraining: 1900,
  kcalRest: 1650,
};

describe('règles de calcul', () => {
  it('4 kcal / g de protéines et glucides, 9 kcal / g de lipides', () => {
    expect(kcalOf(10, 0, 0)).toBe(40);
    expect(kcalOf(0, 10, 0)).toBe(40);
    expect(kcalOf(0, 0, 10)).toBe(90);
    const m = foodMacros(byId('riz_basmati'), 100);
    expect(m.kcal).toBeCloseTo(8 * 4 + 78 * 4 + 0.8 * 9, 6);
  });

  it('les unités (œufs, fruits entiers) sont converties en grammes', () => {
    const m = foodMacros(byId('oeuf'), 2);
    expect(m.p).toBeCloseTo(12.5, 6); // 2 × 50 g à 12,5 %
  });

  it('pas d’arrondi : 5 g, 1 g pour huiles et oléagineux, 1 unité pour œufs et fruits', () => {
    expect(stepOf(byId('poulet'))).toBe(5);
    expect(stepOf(byId('creme_riz'))).toBe(5);
    expect(stepOf(byId('huile_olive'))).toBe(1);
    expect(stepOf(byId('amandes'))).toBe(1);
    expect(stepOf(byId('oeuf'))).toBe(1);
    expect(stepOf(byId('banane'))).toBe(1);
  });
});

describe('répartition des macros', () => {
  it('protéines en g/kg selon l’objectif, lipides 0,9 g/kg, glucides = le reste', () => {
    const t = computeTargets(baseInput, S);
    expect(t.p).toBe(124); // 2,0 × 62
    expect(t.f).toBe(56); // 0,9 × 62
    const tr = t.days.training!;
    expect(tr.c).toBe(Math.round((1900 - 124 * 4 - 56 * 9) / 4));
    expect(Math.abs(tr.kcal - 1900)).toBeLessThanOrEqual(2);
    const reco = computeTargets({ ...baseInput, objective: 'recomposition' }, S);
    expect(reco.p).toBe(Math.round(1.8 * 62));
  });

  it('seuls les glucides changent entre jour training et jour repos', () => {
    const t = computeTargets(baseInput, S);
    const tr = t.days.training!;
    const re = t.days.rest!;
    expect(re.p).toBe(tr.p);
    expect(re.f).toBe(tr.f);
    expect(Math.abs(tr.c - re.c - (1900 - 1650) / 4)).toBeLessThanOrEqual(1); // arrondi au gramme
  });

  it('lipides jamais sous 0,7 g/kg', () => {
    const t = computeTargets({ ...baseInput, overrides: { f: 20 } }, S);
    expect(t.f).toBe(Math.round(0.7 * 62));
    expect(t.warnings.length).toBeGreaterThan(0);
  });

  it('modification manuelle : le reste se recalcule', () => {
    const t = computeTargets({ ...baseInput, overrides: { p: 110 } }, S);
    expect(t.p).toBe(110);
    expect(t.days.training!.c).toBe(Math.round((1900 - 110 * 4 - 56 * 9) / 4));
    const t2 = computeTargets({ ...baseInput, overrides: { c: { training: 200 } } }, S);
    expect(t2.days.training!.c).toBe(200);
    expect(t2.days.training!.kcalInput).toBe(124 * 4 + 200 * 4 + 56 * 9);
  });

  it('poids ajusté pour le fort surpoids', () => {
    const w = adjustedWeight(95, 165, 0.25);
    const ideal = 25 * 1.65 * 1.65;
    expect(w).toBeCloseTo(ideal + 0.25 * (95 - ideal), 6);
    const t = computeTargets({ ...baseInput, weight: 95, useAdjustedWeight: true }, S);
    expect(t.adjusted).toBe(true);
    expect(t.p).toBe(Math.round(2 * w));
  });

  it('maintenance Mifflin-St Jeor', () => {
    expect(mifflinBmr('F', 62, 165, 29)).toBeCloseTo(620 + 1031.25 - 145 - 161, 6);
    expect(mifflinBmr('H', 80, 180, 30)).toBeCloseTo(800 + 1125 - 150 + 5, 6);
    expect(estimatedMaintenance({ sex: 'F', weight: 62, height: 165, age: 29, sessionsPerWeek: 4 }, S)).toBe(
      Math.round((620 + 1031.25 - 145 - 161) * 1.55),
    );
  });

  it('phases : refeed (+ glucides), cétogène (glucides bas) avec jour rebond', () => {
    const r = computeTargets({ ...baseInput, phase: 'refeed' }, S);
    expect(r.dayTypes).toEqual(['training', 'rest', 'refeed']);
    expect(r.days.refeed!.c).toBeGreaterThan(r.days.training!.c);
    expect(r.days.refeed!.p).toBe(r.days.training!.p);
    const k = computeTargets({ ...baseInput, phase: 'keto' }, S);
    expect(k.days.training!.c).toBe(S.ketoCarbs);
    expect(k.days.training!.keto).toBe(true);
    expect(k.days.rebond!.keto).toBe(false);
    expect(k.days.rebond!.c).toBe(computeTargets(baseInput, S).days.training!.c);
  });
});

describe('structure de la journée', () => {
  it('jour training : 6 prises, pré et post autour de la séance de 18h', () => {
    const slots = daySlots('training', false, '18:00', S);
    expect(slots.map((s) => s.slot)).toEqual(['petit_dej', 'midi', 'collation', 'pre', 'post', 'soir']);
    expect(slots.find((s) => s.slot === 'pre')!.time).toBe('17h00');
  });

  it('training à 7h : pré, post puis petit-déjeuner', () => {
    const slots = daySlots('training', false, '07:00', S).map((s) => s.slot);
    expect(slots.slice(0, 3)).toEqual(['pre', 'post', 'petit_dej']);
  });

  it('jour repos : collation libre à la place du pré / post-training', () => {
    const slots = daySlots('rest', false, '18:00', S).map((s) => s.slot);
    expect(slots).not.toContain('pre');
    expect(slots).not.toContain('post');
    expect(slots).toContain('collation_libre');
  });

  it('pré-training = crème de riz + banane, post-training = compote + whey', () => {
    const t = computeTargets(baseInput, S);
    for (let seed = 1; seed <= 10; seed++) {
      const d = generateDay(ctx(seed), { dayType: 'training', target: t.days.training!, trainingTime: '18:00' });
      const pre = d.meals.find((m) => m.slot === 'pre')!;
      const post = d.meals.find((m) => m.slot === 'post')!;
      expect(pre.variants[0].items.map((i) => i.food.id).sort()).toEqual(['banane', 'creme_riz']);
      expect(post.variants[0].items.map((i) => i.food.id).sort()).toEqual(['compote', 'whey']);
    }
  });

  it('collation libre du jour repos sans crème de riz ni whey', () => {
    const t = computeTargets(baseInput, S);
    for (let seed = 1; seed <= 15; seed++) {
      const d = generateDay(ctx(seed), { dayType: 'rest', target: t.days.rest!, trainingTime: '18:00' });
      const libre = d.meals.find((m) => m.slot === 'collation_libre')!;
      for (const v of libre.variants) for (const it of v.items) expect(['creme_riz', 'whey']).not.toContain(it.food.id);
    }
  });
});

function checkDay(d: DayPlan) {
  expect(d.ok).toBe(true);
  const tot = dayTotals(d);
  expect(Math.abs(tot.kcal - d.target.kcalInput)).toBeLessThanOrEqual(20);
  expect(Math.abs(tot.p - d.target.p)).toBeLessThanOrEqual(3);
  expect(Math.abs(tot.c - d.target.c)).toBeLessThanOrEqual(3);
  expect(Math.abs(tot.f - d.target.f)).toBeLessThanOrEqual(3);
  for (const m of d.meals) {
    for (const v of m.variants) {
      for (const it of v.items) {
        const step = stepOf(it.food);
        expect(Math.abs(it.qty / step - Math.round(it.qty / step))).toBeLessThan(1e-9);
        expect(it.qty).toBeGreaterThan(0);
      }
    }
  }
}

describe('génération : tolérance ±20 kcal / ±3 g', () => {
  const optionSets: Partial<DietOptions>[] = [
    {},
    { vegan: true },
    { vegetarien: true, sansGluten: true },
    { sansLactose: true, sansPoisson: true },
    { sansOeufs: true, sansFruitsACoque: true, sansPorc: true },
    { antiInflammatoire: true },
  ];
  const phases: Phase[] = ['deficit', 'maintenance', 'refeed', 'keto'];
  for (const phase of phases) {
    for (const o of optionSets) {
      it(`${phase} ${JSON.stringify(o)}`, () => {
        for (const [weight, kt, kr] of [
          [55, 1700, 1500],
          [75, 2300, 2000],
        ]) {
          const t = computeTargets({ ...baseInput, phase, weight, kcalTraining: kt, kcalRest: kr }, S);
          const days = generateDays(ctx(weight + kt, o), t, '18:00');
          days.forEach(checkDay);
        }
      });
    }
  }
});

describe('options alimentaires', () => {
  it('vegan : aucun aliment d’origine animale, whey remplacée par une protéine végétale', () => {
    const t = computeTargets(baseInput, S);
    const days = generateDays(ctx(3, { vegan: true }), t, '18:00');
    for (const d of days)
      for (const m of d.meals) for (const v of m.variants) for (const it of v.items) expect(it.food.tags).not.toContain('animal');
  });

  it('sans lactose : whey isolate autorisée, option protéine végétale', () => {
    const whey = byId('whey');
    expect(isAllowed(whey, { ...EMPTY_OPTIONS, sansLactose: true }, 'post_proteine')).toBe(true);
    expect(isAllowed(byId('skyr'), { ...EMPTY_OPTIONS, sansLactose: true })).toBe(false);
    expect(isAllowed(whey, { ...EMPTY_OPTIONS, sansLactose: true, proteineVegetale: true }, 'post_proteine')).toBe(false);
    expect(isAllowed(byId('prot_vegetale'), { ...EMPTY_OPTIONS, proteineVegetale: true }, 'post_proteine')).toBe(true);
  });

  it('filtres : gluten, porc, poisson, œufs, fruits à coque, transformés', () => {
    const o = (x: Partial<DietOptions>) => ({ ...EMPTY_OPTIONS, ...x });
    expect(isAllowed(byId('pates'), o({ sansGluten: true }))).toBe(false);
    expect(isAllowed(byId('jambon'), o({ sansPorc: true }))).toBe(false);
    expect(isAllowed(byId('crevettes'), o({ sansPoisson: true }))).toBe(false);
    expect(isAllowed(byId('oeuf'), o({ sansOeufs: true }))).toBe(false);
    expect(isAllowed(byId('amandes'), o({ sansFruitsACoque: true }))).toBe(false);
    expect(isAllowed(byId('pain_mie'), o({ antiInflammatoire: true }))).toBe(false);
    expect(isAllowed(byId('poulet'), o({ vegetarien: true }))).toBe(false);
    expect(isAllowed(byId('oeuf'), o({ vegetarien: true }))).toBe(true);
  });

  it('liste d’aliments refusés (sans accents ni majuscules)', () => {
    const t = computeTargets(baseInput, S);
    const days = generateDays(ctx(5, { refuses: 'Brocoli, saumon, Épinards' }), t, '18:00');
    for (const d of days)
      for (const m of d.meals)
        for (const v of m.variants) for (const it of v.items) expect(['brocoli', 'saumon', 'epinards']).not.toContain(it.food.id);
  });

  it('aliments préférés plus fréquents', () => {
    const t = computeTargets(baseInput, S);
    let withPref = 0;
    let without = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const count = (o: Partial<DietOptions>) =>
        generateDays(ctx(seed, o), t, '18:00')
          .flatMap((d) => d.meals.flatMap((m) => m.variants.flatMap((v) => v.items)))
          .filter((it) => it.food.id === 'saumon').length;
      withPref += count({ preferes: 'saumon' });
      without += count({});
    }
    expect(withPref).toBeGreaterThan(without);
  });
});

describe('variantes, verrouillage, régénération', () => {
  const t = computeTargets(baseInput, S);

  it('3 variantes équivalentes à ±2 g par repas', () => {
    const d = generateDay(ctx(11), { dayType: 'training', target: t.days.training!, trainingTime: '18:00' });
    for (const m of d.meals) {
      if (m.slot === 'pre' || m.slot === 'post') continue;
      expect(m.variants.length).toBe(3);
      const ref = variantMacros(m.variants[0]);
      for (const v of m.variants) expect(maxMacroGap(variantMacros(v), ref)).toBeLessThanOrEqual(2);
    }
  });

  it('changer de variante garde la journée dans la tolérance', () => {
    const d = generateDay(ctx(12), { dayType: 'training', target: t.days.training!, trainingTime: '18:00' });
    for (let i = 0; i < d.meals.length; i++) {
      if (d.meals[i].variants.length > 1) selectVariant(d, i, d.meals[i].variants.length - 1);
    }
    expect(isDayOk(d)).toBe(true);
  });

  it('« Régénérer ce repas » change le repas et garde la journée juste', () => {
    const d = generateDay(ctx(13), { dayType: 'rest', target: t.days.rest!, trainingTime: '18:00' });
    const before = JSON.stringify(d.meals[2].variants[0].items.map((i) => i.food.id));
    regenerateMeal(ctx(99), d, 2);
    expect(JSON.stringify(d.meals[2].variants[0].items.map((i) => i.food.id))).not.toBe(before);
    expect(d.ok).toBe(true);
  });

  it('un repas verrouillé ne bouge pas quand on régénère la journée', () => {
    const d = generateDay(ctx(14), { dayType: 'training', target: t.days.training!, trainingTime: '18:00' });
    d.meals[1].locked = true;
    const locked = JSON.stringify(d.meals[1].variants);
    const d2 = generateDay(ctx(15), { dayType: 'training', target: t.days.training!, trainingTime: '18:00', previous: d });
    expect(JSON.stringify(d2.meals[1].variants)).toBe(locked);
    expect(d2.meals[1].locked).toBe(true);
    checkDay(d2);
  });
});

describe('équivalences et liste de courses', () => {
  it('150 g de poulet = même quantité de protéines en cabillaud', () => {
    const eq = equivalences(byId('poulet'), 150, 'p', [byId('cabillaud'), byId('boeuf5')]);
    const cab = eq.find((e) => e.food.id === 'cabillaud')!;
    expect(cab.grams).toBe(Math.round((150 * 23) / 18 / 5) * 5);
  });

  it('liste de courses = jours training × quantités + jours repos × quantités', () => {
    const t = computeTargets(baseInput, S);
    const [tr, re] = generateDays(ctx(21), t, '18:00');
    const list = shoppingList([
      { day: tr, count: 4 },
      { day: re, count: 3 },
    ]);
    const whey = list.flatMap((g) => g.lines).find((l) => l.food.id === 'whey')!;
    const wheyPerDay = tr.meals.flatMap((m) => m.variants[m.selected].items).filter((i) => i.food.id === 'whey');
    const expected = wheyPerDay.reduce((s, i) => s + i.qty, 0) * 4;
    const restWhey = re.meals.flatMap((m) => m.variants[m.selected].items).filter((i) => i.food.id === 'whey');
    const total = expected + restWhey.reduce((s, i) => s + i.qty, 0) * 3;
    expect(whey.grams).toBe(Math.ceil(total / 10) * 10);
  });
});

describe('féculents en poids cuit', () => {
  const cooked = (id: string) => COOKED.find((f) => f.id === id) as Food;

  it('260 g de riz basmati cuit = 100 g de riz cru', () => {
    const rice = cooked('riz_basmati');
    expect(rice.weighedCooked).toBe(true);
    expect(gramsOf(rice, 260)).toBeCloseTo(100, 6);
    expect(foodMacros(rice, 260).c).toBeCloseTo(78, 6);
    expect(formatQty({ food: rice, qty: 260 })).toBe('260 g cuit');
  });

  it('crème de riz, flocons, viandes restent pesés crus / secs', () => {
    for (const id of ['creme_riz', 'flocons', 'poulet', 'banane']) expect(cooked(id).weighedCooked).toBeFalsy();
  });

  it('les diètes générées donnent les féculents en poids cuit, dans la tolérance', () => {
    const t = computeTargets(baseInput, S);
    const days = generateDays(ctx(31), t, '18:00');
    days.forEach(checkDay);
    const starches = days.flatMap((d) => d.meals.flatMap((m) => m.variants.flatMap((v) => v.items))).filter((i) => i.food.roles.includes('fec_repas'));
    expect(starches.length).toBeGreaterThan(0);
    for (const it of starches) expect(it.food.weighedCooked).toBe(true);
  });

  it('réglage désactivé : retour au poids cru', () => {
    const raw = withCookedMode(COOKED, false);
    const rice = raw.find((f) => f.id === 'riz_basmati')!;
    expect(rice.weighedCooked).toBeFalsy();
    expect(gramsOf(rice, 80)).toBe(80);
    const t = computeTargets(baseInput, S);
    generateDays(ctx(32, {}, raw), t, '18:00').forEach(checkDay);
  });

  it('liste de courses en poids sec à acheter', () => {
    const t = computeTargets(baseInput, S);
    const [tr] = generateDays(ctx(33), t, '18:00');
    const items = tr.meals.flatMap((m) => m.variants[m.selected].items).filter((i) => i.food.weighedCooked);
    const first = items[0];
    const cookedTotal = items.filter((i) => i.food.id === first.food.id).reduce((s, i) => s + i.qty, 0);
    const line = shoppingList([{ day: tr, count: 1 }])
      .flatMap((g) => g.lines)
      .find((l) => l.food.id === first.food.id)!;
    expect(line.grams).toBe(Math.ceil(cookedTotal / first.food.cooked! / 10) * 10);
  });

  it('équivalences en poids cuit : 80 g de riz cru = 210 g cuit', () => {
    const rice = cooked('riz_basmati');
    expect(defaultRefGrams(rice, 80)).toBe(210);
    const pasta = equivalences(rice, 208, 'c', [cooked('pates')])[0];
    // 208 g cuit de riz = 80 g cru = 62,4 g de glucides = 87,9 g de pâtes crues = 202 g cuites -> 200 g
    expect(pasta.grams).toBe(200);
  });
});
