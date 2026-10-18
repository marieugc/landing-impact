import type { Food, Macros, MealItem, MealVariant } from './types';

export const KCAL_PER_G = { p: 4, c: 4, f: 9 } as const;

export const ZERO: Macros = { p: 0, c: 0, f: 0, kcal: 0 };

export function kcalOf(p: number, c: number, f: number): number {
  return p * KCAL_PER_G.p + c * KCAL_PER_G.c + f * KCAL_PER_G.f;
}

export function macros(p: number, c: number, f: number): Macros {
  return { p, c, f, kcal: kcalOf(p, c, f) };
}

/** Poids en grammes d'une quantité (unités converties pour les œufs / fruits entiers). */
export function gramsOf(food: Food, qty: number): number {
  return food.unitWeight ? qty * food.unitWeight : qty;
}

export function foodMacros(food: Food, qty: number): Macros {
  const g = gramsOf(food, qty) / 100;
  return macros(food.p * g, food.c * g, food.f * g);
}

export function itemMacros(item: MealItem): Macros {
  return foodMacros(item.food, item.qty);
}

export function addMacros(a: Macros, b: Macros): Macros {
  return macros(a.p + b.p, a.c + b.c, a.f + b.f);
}

export function subMacros(a: Macros, b: Macros): Macros {
  return macros(a.p - b.p, a.c - b.c, a.f - b.f);
}

export function scaleMacros(a: Macros, k: number): Macros {
  return macros(a.p * k, a.c * k, a.f * k);
}

export function sumMacros(list: Macros[]): Macros {
  return list.reduce(addMacros, ZERO);
}

export function variantMacros(v: MealVariant): Macros {
  return sumMacros(v.items.map(itemMacros));
}

/** Pas d'arrondi : 1 unité (œufs, fruits entiers), 1 g (huiles, oléagineux), 5 g sinon. */
export function stepOf(food: Food): number {
  if (food.unitWeight) return 1;
  if (food.category === 'huile' || food.category === 'oleagineux') return 1;
  return 5;
}

export function roundToStep(food: Food, qty: number): number {
  const s = stepOf(food);
  return Math.round(qty / s) * s;
}

/** Bornes de quantité d'un aliment (g, ou unités). */
export function boundsOf(food: Food): { min: number; max: number; minUsed: number } {
  const def = defaultBounds(food);
  const min = food.min ?? def.min;
  return { min, max: food.max ?? def.max, minUsed: min > 0 ? min : minIfUsed(food) };
}

/** Quantité minimale quand un aliment optionnel est présent (pas de « 1 g de noisettes »). */
function minIfUsed(food: Food): number {
  if (food.unitWeight) return 1;
  switch (food.category) {
    case 'huile':
      return 3;
    case 'oleagineux':
      return 5;
    case 'matiere_grasse':
      return food.f > 50 ? 5 : 20;
    default:
      return 30;
  }
}

function defaultBounds(food: Food): { min: number; max: number } {
  if (food.unitWeight) return { min: 1, max: 3 };
  switch (food.category) {
    case 'viande':
    case 'poisson':
      return food.p > 24 || food.roles.includes('prot_pdj_sale') ? { min: 40, max: 250 } : { min: 80, max: 300 };
    case 'proteine_vegetale':
      return { min: 60, max: 300 };
    case 'laitage':
      return { min: 50, max: 400 };
    case 'complement':
      return { min: 10, max: 60 };
    case 'legumineuse':
      return { min: 30, max: 150 };
    case 'feculent':
      return food.c < 30 ? { min: 80, max: 700 } : food.c < 50 ? { min: 30, max: 200 } : { min: 20, max: 180 };
    case 'legume':
      return { min: 50, max: 400 };
    case 'fruit':
      return { min: 0, max: 300 };
    case 'huile':
      return { min: 0, max: 30 };
    case 'oleagineux':
      return { min: 0, max: 50 };
    case 'matiere_grasse':
      return { min: 0, max: 30 };
    default:
      return { min: 0, max: 300 };
  }
}

/** Affichage d'une quantité : « 150 g » ou « 2 œufs (100 g) ». */
export function formatQty(item: MealItem): string {
  const f = item.food;
  if (f.unitWeight) {
    const label = f.unitLabel ?? 'unité';
    const plural = item.qty > 1 && !label.endsWith('s') ? label + 's' : label;
    return `${item.qty} ${plural} (${Math.round(gramsOf(f, item.qty))} g)`;
  }
  return `${Math.round(item.qty)} g`;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Répartition des calories en % (protéines / glucides / lipides). */
export function macroPercents(m: Macros): { p: number; c: number; f: number } {
  if (m.kcal <= 0) return { p: 0, c: 0, f: 0 };
  return {
    p: (m.p * 4 * 100) / m.kcal,
    c: (m.c * 4 * 100) / m.kcal,
    f: (m.f * 9 * 100) / m.kcal,
  };
}
