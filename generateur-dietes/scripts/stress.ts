// Vérifie la tolérance sur de nombreuses graines et combinaisons d'options.
import { DEFAULT_FOODS } from '../src/engine/foods';
import { dayTotals, generateDays, maxMacroGap } from '../src/engine/generator';
import { variantMacros, withCookedMode } from '../src/engine/nutrition';
import { createRng } from '../src/engine/random';
import { DEFAULT_SETTINGS } from '../src/engine/settings';
import { computeTargets } from '../src/engine/targets';
import { EMPTY_OPTIONS, type DietOptions, type Phase } from '../src/engine/types';

const optionSets: Partial<DietOptions>[] = [
  {}, { vegan: true }, { vegetarien: true, sansGluten: true }, { sansLactose: true, sansPoisson: true },
  { sansOeufs: true, sansFruitsACoque: true }, { antiInflammatoire: true, sansPorc: true }, { vegan: true, sansGluten: true, sansFruitsACoque: true },
];
const profiles = [
  { w: 55, h: 160, kt: 1700, kr: 1500 }, { w: 62, h: 165, kt: 1900, kr: 1650 }, { w: 75, h: 170, kt: 2300, kr: 2000 },
  { w: 95, h: 165, kt: 1900, kr: 1700 }, { w: 50, h: 158, kt: 1500, kr: 1350 },
];
const phases: Phase[] = ['deficit', 'refeed', 'keto'];
const fewBy: Record<string, number> = {};
let total = 0, fails = 0, attempts = 0, meals = 0, few = 0, badVar = 0;
const t0 = Date.now();
for (const ph of phases) for (const o of optionSets) for (const pr of profiles) for (let seed = 1; seed <= 4; seed++) {
  const targets = computeTargets({ weight: pr.w, height: pr.h, objective: 'perte_de_gras', phase: ph, useAdjustedWeight: pr.w > 90, kcalTraining: pr.kt, kcalRest: pr.kr }, DEFAULT_SETTINGS);
  const days = generateDays({ foods: withCookedMode(DEFAULT_FOODS, true), options: { ...EMPTY_OPTIONS, ...o }, settings: DEFAULT_SETTINGS, rng: createRng(seed) }, targets, '18:00');
  for (const d of days) {
    total++; attempts += d.attempts;
    for (const m of d.meals) {
      if (m.slot === 'pre' || m.slot === 'post') continue;
      meals++; if (m.variants.length < 3) { few++; fewBy[ph + " " + m.slot + " " + Object.keys(o).join(",")] = (fewBy[ph + " " + m.slot + " " + Object.keys(o).join(",")] ?? 0) + 1; }
      const ref = variantMacros(m.variants[0]);
      for (const v of m.variants) if (maxMacroGap(variantMacros(v), ref) > 2) badVar++;
    }
    if (!d.ok) { fails++; const t = dayTotals(d); console.log('FAIL', ph, JSON.stringify(o), pr, d.dayType, t.p.toFixed(1), t.c.toFixed(1), t.f.toFixed(1), t.kcal.toFixed(0), 'cible', d.target.p, d.target.c, d.target.f, d.target.kcalInput); }
  }
}
console.log(`${meals} repas, ${few} avec moins de 3 variantes, ${badVar} variantes hors ±2 g`);
console.log(`${total} journées, ${fails} hors tolérance, ${(attempts / total).toFixed(2)} essais en moyenne, ${((Date.now() - t0) / total).toFixed(0)} ms / journée`);
console.log(Object.entries(fewBy).sort((a, b) => b[1] - a[1]).slice(0, 15));
