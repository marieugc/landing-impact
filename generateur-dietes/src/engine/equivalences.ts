import { foodMacros, qtyFromRawGrams, roundToStep, servedGramsOf } from './nutrition';
import type { Food, MacroKey } from './types';

export interface Equivalence {
  food: Food;
  /** grammes dans l'assiette (cuits pour les féculents pesés cuits) */
  grams: number;
  /** pour les œufs / fruits entiers : nombre d'unités approximatif */
  units?: number;
}

/**
 * Quantité de chaque aliment qui apporte autant de la macro choisie que la référence.
 * Ex. : 150 g de poulet = 190 g de cabillaud (même quantité de protéines).
 */
export function equivalences(ref: Food, refGrams: number, macro: MacroKey, foods: Food[]): Equivalence[] {
  // refGrams : poids dans l'assiette de la référence (cuit si elle est pesée cuite)
  const amount = foodMacros(ref, ref.unitWeight ? refGrams / ref.unitWeight : refGrams)[macro];
  return foods
    .filter((f) => f.id !== ref.id && f[macro] > 0)
    .map((f) => {
      const qty = qtyFromRawGrams(f, (amount * 100) / f[macro]);
      if (f.unitWeight) {
        const units = Math.max(1, Math.round(qty));
        return { food: f, grams: Math.round(servedGramsOf(f, units)), units };
      }
      return { food: f, grams: Math.max(roundToStep(f, qty), 1) };
    })
    .sort((a, b) => a.food.name.localeCompare(b.food.name, 'fr'));
}

/** Quantité de référence par défaut, convertie en poids cuit si l'aliment est pesé cuit. */
export function defaultRefGrams(ref: Food, rawGrams: number): number {
  return ref.unitWeight ? rawGrams : roundToStep(ref, qtyFromRawGrams(ref, rawGrams));
}

export interface EquivalenceGroup {
  title: string;
  macro: MacroKey;
  refId: string;
  /** quantité de référence en poids cru / sec */
  refGrams: number;
  roles: string[];
}

/** Tableaux d'équivalences proposés par défaut. */
export const EQUIVALENCE_GROUPS: EquivalenceGroup[] = [
  { title: 'Protéines (viandes, poissons, végétal)', macro: 'p', refId: 'poulet', refGrams: 150, roles: ['prot_repas'] },
  { title: 'Féculents', macro: 'c', refId: 'riz_basmati', refGrams: 80, roles: ['fec_repas'] },
  { title: 'Petit-déjeuner / collations (glucides)', macro: 'c', refId: 'flocons', refGrams: 50, roles: ['gluc_pdj', 'gluc_pdj_sale', 'gluc_collation'] },
  { title: 'Laitages / protéines collation', macro: 'p', refId: 'skyr', refGrams: 150, roles: ['prot_pdj', 'prot_collation'] },
  { title: 'Matières grasses', macro: 'f', refId: 'huile_olive', refGrams: 10, roles: ['mg_repas', 'mg_pdj', 'mg_pdj_sale', 'mg_collation'] },
];
