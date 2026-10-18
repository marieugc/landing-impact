import { CATEGORY_LABELS } from './foods';
import { gramsOf } from './nutrition';
import type { DayPlan, Food, FoodCategory } from './types';

export interface ShoppingLine {
  food: Food;
  grams: number;
  units?: number;
}

export interface ShoppingGroup {
  category: FoodCategory;
  label: string;
  lines: ShoppingLine[];
}

const ORDER: FoodCategory[] = [
  'viande',
  'poisson',
  'oeuf',
  'laitage',
  'proteine_vegetale',
  'complement',
  'feculent',
  'legumineuse',
  'legume',
  'fruit',
  'huile',
  'matiere_grasse',
  'oleagineux',
  'divers',
];

/**
 * Liste de courses de la semaine : variantes sélectionnées de chaque journée
 * multipliées par le nombre de jours de ce type. Arrondi à la dizaine de grammes supérieure.
 */
export function shoppingList(days: { day: DayPlan; count: number }[]): ShoppingGroup[] {
  const acc = new Map<string, ShoppingLine>();
  for (const { day, count } of days) {
    if (count <= 0) continue;
    for (const meal of day.meals) {
      const v = meal.variants[meal.selected];
      if (!v) continue;
      for (const it of v.items) {
        const key = it.food.id + '|' + it.food.name;
        const line = acc.get(key) ?? { food: it.food, grams: 0, units: it.food.unitWeight ? 0 : undefined };
        line.grams += gramsOf(it.food, it.qty) * count;
        if (it.food.unitWeight) line.units = (line.units ?? 0) + it.qty * count;
        acc.set(key, line);
      }
    }
  }
  const groups = new Map<FoodCategory, ShoppingLine[]>();
  for (const line of acc.values()) {
    line.grams = Math.ceil(line.grams / 10) * 10;
    const list = groups.get(line.food.category) ?? [];
    list.push(line);
    groups.set(line.food.category, list);
  }
  return ORDER.filter((c) => groups.has(c)).map((c) => ({
    category: c,
    label: CATEGORY_LABELS[c],
    lines: (groups.get(c) as ShoppingLine[]).sort((a, b) => a.food.name.localeCompare(b.food.name, 'fr')),
  }));
}
