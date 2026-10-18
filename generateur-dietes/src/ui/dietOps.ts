import { generateDays, isDayOk, regenerateMeal, rebalanceDay, selectVariant, type GenContext } from '../engine/generator';
import { gramsOf, roundToStep, stepOf } from '../engine/nutrition';
import { createRng, randomSeed } from '../engine/random';
import type { Settings } from '../engine/settings';
import { computeTargets, type TargetResult } from '../engine/targets';
import type { DayPlan, Diet, Food, Student } from '../engine/types';

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export function targetsFor(diet: Diet, student: Student, settings: Settings): TargetResult {
  return computeTargets(
    {
      weight: diet.weight,
      height: student.height,
      objective: diet.objective,
      phase: diet.phase,
      useAdjustedWeight: student.useAdjustedWeight,
      kcalTraining: diet.kcalTraining,
      kcalRest: diet.kcalRest,
      overrides: diet.overrides,
    },
    settings,
  );
}

/** Met à jour les cibles des journées déjà générées (les totaux sont revérifiés). */
export function applyTargets(diet: Diet, targets: TargetResult): Diet {
  diet.days = diet.days
    .filter((d) => targets.dayTypes.includes(d.dayType))
    .map((d) => {
      const t = targets.days[d.dayType]!;
      // passage cétogène <-> classique : la structure change, il faut régénérer
      if (t.keto !== d.target.keto) return { ...d, target: t, meals: [], ok: false };
      const nd = { ...d, target: t };
      nd.ok = nd.meals.length > 0 && isDayOk(nd);
      return nd;
    });
  return diet;
}

export function makeCtx(diet: Diet, foods: Food[], settings: Settings): GenContext {
  return { foods, options: diet.options, settings, rng: createRng(randomSeed()) };
}

export function generateAll(diet: Diet, targets: TargetResult, ctx: GenContext): Diet {
  diet.days = generateDays(ctx, targets, diet.trainingTime, diet.days);
  return diet;
}

export function regenerateOneDay(diet: Diet, dayIndex: number, targets: TargetResult, ctx: GenContext): Diet {
  const d = diet.days[dayIndex];
  const fresh = generateDays(ctx, { ...targets, dayTypes: [d.dayType] }, diet.trainingTime, [d]);
  diet.days[dayIndex] = fresh[0];
  return diet;
}

// ---------------------------------------------------------------- actions sur un repas

export const mealActions = {
  regenerate(day: DayPlan, mi: number, ctx: GenContext) {
    regenerateMeal(ctx, day, mi);
  },
  toggleLock(day: DayPlan, mi: number) {
    day.meals[mi].locked = !day.meals[mi].locked;
  },
  select(day: DayPlan, mi: number, vi: number) {
    selectVariant(day, mi, vi);
  },
  setQty(day: DayPlan, mi: number, ii: number, qty: number) {
    const it = day.meals[mi].variants[day.meals[mi].selected].items[ii];
    it.qty = Math.max(0, qty);
    it.manual = true;
    day.ok = isDayOk(day);
  },
  setFood(day: DayPlan, mi: number, ii: number, food: Food) {
    const it = day.meals[mi].variants[day.meals[mi].selected].items[ii];
    const grams = gramsOf(it.food, it.qty);
    it.food = { ...food };
    it.qty = food.unitWeight ? Math.max(1, Math.round(grams / food.unitWeight)) : Math.max(stepOf(food), roundToStep(food, grams));
    it.manual = true;
    it.fixed = false;
    day.ok = isDayOk(day);
  },
  remove(day: DayPlan, mi: number, ii: number) {
    day.meals[mi].variants[day.meals[mi].selected].items.splice(ii, 1);
    day.ok = isDayOk(day);
  },
  add(day: DayPlan, mi: number, food: Food) {
    day.meals[mi].variants[day.meals[mi].selected].items.push({ food: { ...food }, qty: food.unitWeight ? 1 : 100, manual: true });
    day.ok = isDayOk(day);
  },
  /** Rééquilibrage : ajuste les lignes non modifiées à la main des repas non verrouillés. */
  rebalance(day: DayPlan) {
    rebalanceDay(day);
  },
  /** Libère les modifications manuelles d'un repas (le rééquilibrage pourra les ajuster). */
  unpin(day: DayPlan, mi: number) {
    for (const it of day.meals[mi].variants[day.meals[mi].selected].items) delete it.manual;
  },
};
