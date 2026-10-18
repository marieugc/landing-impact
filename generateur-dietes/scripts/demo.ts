// Démo terminal : npm run demo
import { DEFAULT_FOODS } from '../src/engine/foods';
import { dayTotals, generateDays } from '../src/engine/generator';
import { formatQty, itemMacros, macroPercents, variantMacros, withCookedMode } from '../src/engine/nutrition';
import { createRng } from '../src/engine/random';
import { DEFAULT_SETTINGS } from '../src/engine/settings';
import { computeTargets, DAY_LABELS, estimatedMaintenance } from '../src/engine/targets';
import { EMPTY_OPTIONS } from '../src/engine/types';

const eleve = { prenom: 'Léa', sex: 'F' as const, age: 29, height: 165, weight: 62, sessionsPerWeek: 4 };
const settings = DEFAULT_SETTINGS;
const targets = computeTargets(
  { weight: eleve.weight, height: eleve.height, objective: 'perte_de_gras', phase: 'deficit', useAdjustedWeight: false, kcalTraining: 1900, kcalRest: 1650 },
  settings,
);
const ctx = { foods: withCookedMode(DEFAULT_FOODS, true), options: { ...EMPTY_OPTIONS }, settings, rng: createRng(Number(process.argv[2] ?? 42)) };
const days = generateDays(ctx, targets, '18:00');

const pad = (s: string | number, n: number) => String(s).padEnd(n);
const num = (x: number, n = 7) => x.toFixed(1).padStart(n);
console.log(`\nÉlève : ${eleve.prenom}, ${eleve.weight} kg, ${eleve.height} cm, perte de gras`);
console.log(`Maintenance estimée (Mifflin-St Jeor) : ${estimatedMaintenance(eleve, settings)} kcal`);
console.log(`Socle : protéines ${targets.p} g (${settings.proteinGkg.perte_de_gras} g/kg), lipides ${targets.f} g (${settings.fatGkg} g/kg)`);
for (const day of days) {
  const t = day.target;
  console.log(`\n================ ${DAY_LABELS[day.dayType].toUpperCase()} : cible ${t.kcalInput} kcal | P ${t.p} g  G ${t.c} g  L ${t.f} g`);
  for (const meal of day.meals) {
    const v = meal.variants[meal.selected];
    console.log(`\n  ${meal.time}  ${meal.label}   (${meal.variants.length} variante(s))`);
    console.log(`    ${pad('Aliment', 38)}${pad('Quantité', 22)}      P      G      L    kcal`);
    for (const it of v.items) {
      const m = itemMacros(it);
      console.log(`    ${pad(it.food.name, 38)}${pad(formatQty(it), 22)}${num(m.p)}${num(m.c)}${num(m.f)}${m.kcal.toFixed(0).padStart(8)}`);
    }
    const tm = variantMacros(v);
    console.log(`    ${pad('Total repas', 60)}${num(tm.p)}${num(tm.c)}${num(tm.f)}${tm.kcal.toFixed(0).padStart(8)}`);
  }
  const tot = dayTotals(day);
  const pc = macroPercents(tot);
  console.log(`\n  TOTAL JOUR : ${tot.kcal.toFixed(0)} kcal (écart ${(tot.kcal - t.kcalInput).toFixed(0)}) | P ${tot.p.toFixed(1)} (${(tot.p - t.p).toFixed(1)})  G ${tot.c.toFixed(1)} (${(tot.c - t.c).toFixed(1)})  L ${tot.f.toFixed(1)} (${(tot.f - t.f).toFixed(1)})`);
  console.log(`  Répartition : P ${pc.p.toFixed(0)} % / G ${pc.c.toFixed(0)} % / L ${pc.f.toFixed(0)} %   ${day.ok ? '✅ dans la tolérance' : '❌ HORS tolérance'}  (essai n°${day.attempts})`);
}
