import { isAllowed, preferenceWeight } from './filters';
import { foodMacros, macros, subMacros, sumMacros, variantMacros, ZERO } from './nutrition';
import { weightedPick, type Rng } from './random';
import type { Settings } from './settings';
import { initialEstimate, solve, type GroupGoal, type SolverItem } from './solver';
import { daySlots, mealWeights, SLOT_LABELS, templatesForSlot, type MealTemplate } from './templates';
import type { TargetResult } from './targets';
import type {
  DayPlan,
  DayTarget,
  DayType,
  DietOptions,
  Food,
  FoodRole,
  MacroKey,
  Macros,
  MealItem,
  MealPlan,
  MealVariant,
  SlotKind,
} from './types';

export const TOLERANCE = { kcal: 20, macro: 3, variant: 2 } as const;

export interface GenContext {
  foods: Food[];
  options: DietOptions;
  settings: Settings;
  rng: Rng;
}

const KEYS: MacroKey[] = ['p', 'c', 'f'];

// ---------------------------------------------------------------- vérifications

export function dayTotals(day: DayPlan): Macros {
  return sumMacros(day.meals.map((m) => selectedMacros(m)));
}

export function selectedMacros(meal: MealPlan): Macros {
  const v = meal.variants[meal.selected] ?? meal.variants[0];
  return v ? variantMacros(v) : ZERO;
}

/** Tolérance finale : ±20 kcal sur le total du jour et ±3 g sur chaque macro. */
export function isWithinTolerance(total: Macros, target: DayTarget): boolean {
  if (Math.abs(total.kcal - target.kcalInput) > TOLERANCE.kcal) return false;
  return KEYS.every((k) => Math.abs(total[k] - target[k]) <= TOLERANCE.macro);
}

export function isDayOk(day: DayPlan): boolean {
  return isWithinTolerance(dayTotals(day), day.target);
}

export function maxMacroGap(a: Macros, b: Macros): number {
  return Math.max(...KEYS.map((k) => Math.abs(a[k] - b[k])));
}

// ---------------------------------------------------------------- construction d'un repas

interface BuiltVariant {
  templateId: string;
  items: SolverItem[];
  fixed: boolean[];
}

function candidates(ctx: GenContext, role: FoodRole, slot: SlotKind, keto = false): Food[] {
  return ctx.foods.filter((f) => {
    if (!f.roles.includes(role)) return false;
    // cétogène : uniquement des légumes pauvres en glucides
    if (keto && role === 'legume' && f.c > 4) return false;
    if (!isAllowed(f, ctx.options, role)) return false;
    // la collation libre du jour repos : ni crème de riz ni whey
    if (slot === 'collation_libre' && (f.roles.includes('pre_creme_riz') || f.roles.includes('post_proteine'))) return false;
    return true;
  });
}

function applicable(ctx: GenContext, t: MealTemplate, slot: SlotKind, keto: boolean): boolean {
  return t.roles.every((r) => r.optional || candidates(ctx, r.role, slot, keto).length > 0);
}

export function hasApplicableTemplate(ctx: GenContext, slot: SlotKind, keto: boolean): boolean {
  return templatesForSlot(slot, keto).some((t) => applicable(ctx, t, slot, keto));
}

function buildVariant(
  ctx: GenContext,
  slot: SlotKind,
  keto: boolean,
  avoid: Set<string>,
  usedInDay: Set<string>,
): BuiltVariant | null {
  const templates = templatesForSlot(slot, keto).filter((t) => applicable(ctx, t, slot, keto));
  const t = templates[Math.floor(ctx.rng() * templates.length)];
  if (!t) return null;
  const items: SolverItem[] = [];
  const fixed: boolean[] = [];
  const inMeal = new Set<string>();
  for (const r of t.roles) {
    const cands = candidates(ctx, r.role, slot, keto).filter((f) => !inMeal.has(f.id));
    // pré / post-training : on garde de préférence l'aliment de base (crème de riz, whey…) en tête de liste
    const food = weightedPick(ctx.rng, cands, (f) => {
      let w = preferenceWeight(f, ctx.options);
      if (avoid.has(f.id)) w *= 0.03;
      if (usedInDay.has(f.id)) w *= 0.3;
      if ((slot === 'pre' || slot === 'post') && f.custom) w *= 3;
      if (slot !== 'post' && f.category === 'complement') w *= 0.4;
      // sources végétales et légumineuses moins fréquentes si l'élève mange de la viande / du poisson
      if (!ctx.options.vegetarien && !ctx.options.vegan && (f.category === 'proteine_vegetale' || f.category === 'legumineuse')) w *= 0.4;
      return w;
    });
    if (!food) {
      if (r.optional) continue;
      return null;
    }
    inMeal.add(food.id);
    if (r.fixed) {
      const qty = food.unitWeight ? 1 : r.role === 'legume' ? (keto ? ctx.settings.vegQty + 50 : ctx.settings.vegQty) : 100;
      items.push({ food, qty, adjustable: false, group: 0 });
      fixed.push(true);
    } else {
      items.push({ food, qty: 0, adjustable: true, group: 0, driver: r.driver });
      fixed.push(false);
    }
  }
  return { templateId: t.id, items, fixed };
}

function solveMeal(items: SolverItem[], target: Macros, slot: SlotKind): void {
  initialEstimate(items, target);
  solve(items, { groups: [{ target, weights: mealWeights(slot), importance: 1 }] });
}

function toVariant(b: BuiltVariant): MealVariant {
  const items: MealItem[] = [];
  b.items.forEach((it, i) => {
    if (it.qty <= 0) return;
    items.push({ food: { ...it.food }, qty: it.qty, ...(b.fixed[i] ? { fixed: true } : {}) });
  });
  return { templateId: b.templateId, items };
}

function signature(v: MealVariant): string {
  return v.items
    .map((i) => i.food.id)
    .sort()
    .join('|');
}

/** Variantes équivalentes (±2 g sur chaque macro) d'un repas de référence. */
function buildAlternatives(
  ctx: GenContext,
  slot: SlotKind,
  keto: boolean,
  ref: MealVariant,
  usedInDay: Set<string>,
  count: number,
): MealVariant[] {
  if (slot === 'pre' || slot === 'post') return [];
  const refMacros = variantMacros(ref);
  const alts: MealVariant[] = [];
  const sigs = new Set([signature(ref)]);
  for (let tries = 0; tries < 60 && alts.length < count; tries++) {
    const avoid = new Set<string>();
    for (const v of [ref, ...alts]) for (const it of v.items) if (!it.fixed) avoid.add(it.food.id);
    const b = buildVariant(ctx, slot, keto, avoid, usedInDay);
    if (!b) break;
    initialEstimate(b.items, refMacros);
    solve(b.items, { groups: [{ target: refMacros, weights: { p: 1, c: 1, f: 1 }, importance: 1 }] });
    const v = toVariant(b);
    const sig = signature(v);
    if (sigs.has(sig)) continue;
    if (maxMacroGap(variantMacros(v), refMacros) <= TOLERANCE.variant) {
      sigs.add(sig);
      alts.push(v);
    }
  }
  return alts;
}

// ---------------------------------------------------------------- rééquilibrage de la journée

interface RebalanceOptions {
  /** indices des repas que l'on a le droit d'ajuster (par défaut : tous les repas non verrouillés) */
  only?: number[];
  changePenalty?: number;
}

/**
 * Ajuste finement les grammages des repas non verrouillés (variantes sélectionnées)
 * pour faire tomber la journée dans la tolérance, puis réaligne les autres variantes.
 */
export function rebalanceDay(day: DayPlan, opts: RebalanceOptions = {}): DayPlan {
  const items: SolverItem[] = [];
  const refs: { meal: number; item: number }[] = [];
  const groups: GroupGoal[] = [];
  day.meals.forEach((meal, mi) => {
    const v = meal.variants[meal.selected];
    const movable = !meal.locked && (!opts.only || opts.only.includes(mi));
    groups.push({ target: meal.target, weights: mealWeights(meal.slot), importance: movable ? 0.05 : 0 });
    v?.items.forEach((it, ii) => {
      items.push({
        food: it.food,
        qty: it.qty,
        adjustable: movable && !it.manual && !it.fixed,
        group: mi,
        origin: it.qty,
      });
      refs.push({ meal: mi, item: ii });
    });
  });
  solve(items, {
    groups,
    day: { target: { ...day.target, kcal: day.target.kcalInput }, importance: 1 },
    changePenalty: opts.changePenalty ?? 0.3,
  });
  const changed = new Set<number>();
  items.forEach((s, k) => {
    const { meal, item } = refs[k];
    const it = day.meals[meal].variants[day.meals[meal].selected].items[item];
    if (it.qty !== s.qty) {
      it.qty = s.qty;
      changed.add(meal);
    }
  });
  for (const mi of changed) {
    const meal = day.meals[mi];
    meal.variants[meal.selected].items = meal.variants[meal.selected].items.filter((it) => it.qty > 0 || it.manual);
    syncVariants(meal);
  }
  day.ok = isDayOk(day);
  return day;
}

/** Réaligne les variantes non sélectionnées sur les macros de la variante sélectionnée (±2 g). */
export function syncVariants(meal: MealPlan): void {
  const ref = meal.variants[meal.selected];
  if (!ref) return;
  const target = variantMacros(ref);
  meal.variants.forEach((v, vi) => {
    if (vi === meal.selected) return;
    if (maxMacroGap(variantMacros(v), target) <= 1) return;
    const items: SolverItem[] = v.items.map((it) => ({
      food: it.food,
      qty: it.qty,
      adjustable: !it.fixed && !it.manual,
      group: 0,
      origin: it.qty,
    }));
    solve(items, { groups: [{ target, weights: { p: 1, c: 1, f: 1 }, importance: 1 }], changePenalty: 0.01 });
    v.items = v.items
      .map((it, i) => ({ ...it, qty: items[i].qty }))
      .filter((it) => it.qty > 0 || it.manual);
  });
}

// ---------------------------------------------------------------- génération d'une journée

function splitFor(dayType: DayType, keto: boolean, settings: Settings): Partial<Record<SlotKind, number>> {
  return !keto && dayType !== 'rest' ? settings.trainingSplit : settings.restSplit;
}

function prePostTarget(slot: SlotKind, day: DayTarget, s: Settings): Macros {
  if (slot === 'pre') {
    const c = Math.min(Math.max((s.preCarbPct / 100) * day.c, 25), Math.max(25, 0.4 * day.c));
    return macros(0, c, 0);
  }
  const c = Math.min(Math.max((s.postCarbPct / 100) * day.c, 10), 40);
  return macros(s.postProtein, c, 0);
}

export interface GenerateDayInput {
  dayType: DayType;
  target: DayTarget;
  trainingTime: string;
  /** journée précédente : ses repas verrouillés sont conservés tels quels */
  previous?: DayPlan;
  maxAttempts?: number;
}

export function generateDay(ctx: GenContext, input: GenerateDayInput): DayPlan {
  const { dayType, target } = input;
  const keto = target.keto;
  const slots = daySlots(dayType, keto, input.trainingTime, ctx.settings);
  const lockedBySlot = new Map<SlotKind, MealPlan>();
  input.previous?.meals.forEach((m) => m.locked && lockedBySlot.set(m.slot, m));

  let best: { day: DayPlan; gap: number } | null = null;
  const maxAttempts = input.maxAttempts ?? 50;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const usedInDay = new Set<string>();
    const meals: MealPlan[] = [];
    const built = new Map<number, BuiltVariant>();
    let failed = false;

    // 1. repas verrouillés, pré et post-training
    let residual: Macros = { ...target, kcal: target.kcal };
    slots.forEach((s, i) => {
      const locked = lockedBySlot.get(s.slot);
      if (locked) {
        const copy: MealPlan = JSON.parse(JSON.stringify(locked));
        copy.time = s.time;
        meals[i] = copy;
        residual = subMacros(residual, selectedMacros(copy));
        return;
      }
      meals[i] = { slot: s.slot, label: SLOT_LABELS[s.slot], time: s.time, target: ZERO, variants: [], selected: 0, locked: false };
      if (s.slot === 'pre' || s.slot === 'post') {
        const t = prePostTarget(s.slot, target, ctx.settings);
        const b = buildVariant(ctx, s.slot, keto, new Set(), usedInDay);
        if (!b) {
          failed = true;
          return;
        }
        solveMeal(b.items, t, s.slot);
        built.set(i, b);
        const got = sumMacros(b.items.map((it) => foodMacros(it.food, it.qty)));
        meals[i].target = got;
        residual = subMacros(residual, got);
      }
    });
    if (failed) continue;

    // 2. répartition du reste entre les autres repas
    const split = splitFor(dayType, keto, ctx.settings);
    const free = slots.map((_, i) => i).filter((i) => !built.has(i) && !lockedBySlot.has(slots[i].slot));
    const pctSum = free.reduce((acc, i) => acc + (split[slots[i].slot] ?? 0), 0) || free.length;
    for (const i of free) {
      const share = (split[slots[i].slot] ?? (pctSum === free.length ? 1 : 0)) / pctSum;
      const t = macros(Math.max(0, residual.p * share), Math.max(0, residual.c * share), Math.max(0, residual.f * share));
      meals[i].target = t;
      const b = buildVariant(ctx, slots[i].slot, keto, new Set(), usedInDay);
      if (!b) {
        failed = true;
        break;
      }
      solveMeal(b.items, t, slots[i].slot);
      b.items.forEach((it, k) => !b.fixed[k] && usedInDay.add(it.food.id));
      built.set(i, b);
    }
    if (failed) continue;

    built.forEach((b, i) => {
      meals[i].variants = [toVariant(b)];
      meals[i].selected = 0;
    });

    // 3. ajustement fin de la journée entière (tolérance ±20 kcal / ±3 g)
    const day: DayPlan = { dayType, target, meals, ok: false, attempts: attempt };
    rebalanceDay(day, { changePenalty: 0 });

    // 4. variantes équivalentes
    built.forEach((_, i) => {
      const m = meals[i];
      m.variants = [m.variants[0], ...buildAlternatives(ctx, m.slot, keto, m.variants[0], usedInDay, 2)];
    });
    day.ok = isDayOk(day);
    if (day.ok) return day;
    const gap = maxMacroGap(dayTotals(day), target) + Math.abs(dayTotals(day).kcal - target.kcalInput) / 9;
    if (!best || gap < best.gap) best = { day, gap };
  }
  if (best) return best.day;
  return { dayType, target, meals: [], ok: false, attempts: maxAttempts };
}

/** Génère toutes les journées d'une diète (training, repos, refeed / rebond selon la phase). */
export function generateDays(
  ctx: GenContext,
  targets: TargetResult,
  trainingTime: string,
  previous: DayPlan[] = [],
): DayPlan[] {
  return targets.dayTypes.map((dt) =>
    generateDay(ctx, {
      dayType: dt,
      target: targets.days[dt] as DayTarget,
      trainingTime,
      previous: previous.find((d) => d.dayType === dt),
    }),
  );
}

// ---------------------------------------------------------------- actions de l'interface

/** « Régénérer ce repas » : nouvelles variantes équivalentes au repas actuel, la journée reste juste. */
export function regenerateMeal(ctx: GenContext, day: DayPlan, mealIndex: number): DayPlan {
  const meal = day.meals[mealIndex];
  if (!meal || meal.locked) return day;
  const keto = day.target.keto;
  const ref = selectedMacros(meal);
  const usedInDay = new Set<string>();
  day.meals.forEach((m, i) => {
    if (i !== mealIndex) m.variants[m.selected]?.items.forEach((it) => !it.fixed && usedInDay.add(it.food.id));
  });
  const current = new Set(meal.variants.flatMap((v) => v.items.filter((it) => !it.fixed).map((it) => it.food.id)));
  let primary: MealVariant | null = null;
  let bestGap = Infinity;
  for (let tries = 0; tries < 40; tries++) {
    const b = buildVariant(ctx, meal.slot, keto, meal.slot === 'pre' || meal.slot === 'post' ? new Set() : current, usedInDay);
    if (!b) break;
    initialEstimate(b.items, ref);
    solve(b.items, { groups: [{ target: ref, weights: mealWeights(meal.slot), importance: 1 }] });
    const v = toVariant(b);
    const gap = maxMacroGap(variantMacros(v), ref);
    if (gap < bestGap) {
      bestGap = gap;
      primary = v;
    }
    if (gap <= 1) break;
  }
  if (!primary) return day;
  meal.variants = [primary, ...buildAlternatives(ctx, meal.slot, keto, primary, usedInDay, 2)];
  meal.selected = 0;
  rebalanceDay(day, { only: [mealIndex] });
  if (!day.ok) rebalanceDay(day);
  return day;
}

/** Choix d'une autre variante : la journée est rééquilibrée automatiquement. */
export function selectVariant(day: DayPlan, mealIndex: number, variantIndex: number): DayPlan {
  const meal = day.meals[mealIndex];
  if (!meal || !meal.variants[variantIndex]) return day;
  meal.selected = variantIndex;
  day.ok = isDayOk(day);
  if (!day.ok) rebalanceDay(day);
  return day;
}
