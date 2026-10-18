import type { DietOptions, Food, FoodRole } from './types';

/** Minuscules, sans accents, pour comparer des noms d'aliments. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .trim();
}

export function parseList(text: string): string[] {
  return text
    .split(/[,;\n]/)
    .map(normalize)
    .filter((s) => s.length >= 2);
}

function matchesAny(food: Food, words: string[]): boolean {
  if (words.length === 0) return false;
  const name = normalize(food.name);
  return words.some((w) => name.includes(w));
}

/** L'aliment est-il compatible avec les options de l'élève ? */
export function isAllowed(food: Food, o: DietOptions, role?: FoodRole): boolean {
  const t = new Set(food.tags);
  if (o.sansLactose && t.has('lactose')) return false;
  if (o.sansGluten && t.has('gluten')) return false;
  if ((o.vegetarien || o.vegan) && (t.has('viande') || t.has('poisson') || t.has('fruits_de_mer'))) return false;
  if (o.vegan && t.has('animal')) return false;
  if (o.sansPorc && t.has('porc')) return false;
  if (o.sansPoisson && (t.has('poisson') || t.has('fruits_de_mer'))) return false;
  if (o.sansOeufs && t.has('oeuf')) return false;
  if (o.sansFruitsACoque && (t.has('fruit_a_coque') || t.has('arachide'))) return false;
  if (o.antiInflammatoire && t.has('transforme')) return false;
  if (o.proteineVegetale && food.category === 'complement' && t.has('animal')) return false;
  if (role === 'post_proteine') {
    // whey isolate par défaut, protéine végétale si vegan ou option cochée
    const vegetale = o.vegan || o.proteineVegetale;
    if (vegetale && t.has('animal')) return false;
    if (!vegetale && !t.has('animal')) return false;
  }
  if (matchesAny(food, parseList(o.refuses))) return false;
  return true;
}

/** Poids de tirage : aliments préférés et anti-inflammatoires privilégiés. */
export function preferenceWeight(food: Food, o: DietOptions): number {
  let w = 1;
  if (matchesAny(food, parseList(o.preferes))) w *= 4;
  if (o.antiInflammatoire && food.tags.includes('anti_inflammatoire')) w *= 2.5;
  return w;
}

export function compatibleFoods(foods: Food[], o: DietOptions): Food[] {
  return foods.filter((f) => isAllowed(f, o));
}
