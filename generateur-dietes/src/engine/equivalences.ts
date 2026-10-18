import { gramsOf, roundToStep } from './nutrition';
import type { Food, MacroKey } from './types';

export interface Equivalence {
  food: Food;
  grams: number;
  /** pour les œufs / fruits entiers : nombre d'unités approximatif */
  units?: number;
}

/**
 * Quantité de chaque aliment qui apporte autant de la macro choisie que la référence.
 * Ex. : 150 g de poulet = 190 g de cabillaud (même quantité de protéines).
 */
export function equivalences(ref: Food, refGrams: number, macro: MacroKey, foods: Food[]): Equivalence[] {
  const amount = (ref[macro] * refGrams) / 100;
  return foods
    .filter((f) => f.id !== ref.id && f[macro] > 0)
    .map((f) => {
      const raw = (amount * 100) / f[macro];
      if (f.unitWeight) {
        const units = Math.max(1, Math.round(raw / f.unitWeight));
        return { food: f, grams: Math.round(gramsOf(f, units)), units };
      }
      return { food: f, grams: Math.max(roundToStep(f, raw), 1) };
    })
    .sort((a, b) => a.food.name.localeCompare(b.food.name, 'fr'));
}

export interface EquivalenceGroup {
  title: string;
  macro: MacroKey;
  refId: string;
  refGrams: number;
  roles: string[];
}

/** Tableaux d'équivalences proposés par défaut. */
export const EQUIVALENCE_GROUPS: EquivalenceGroup[] = [
  { title: 'Protéines (viandes, poissons, végétal)', macro: 'p', refId: 'poulet', refGrams: 150, roles: ['prot_repas'] },
  { title: 'Féculents (pesés crus / secs)', macro: 'c', refId: 'riz_basmati', refGrams: 80, roles: ['fec_repas'] },
  { title: 'Petit-déjeuner / collations (glucides)', macro: 'c', refId: 'flocons', refGrams: 50, roles: ['gluc_pdj', 'gluc_pdj_sale', 'gluc_collation'] },
  { title: 'Laitages / protéines collation', macro: 'p', refId: 'skyr', refGrams: 150, roles: ['prot_pdj', 'prot_collation'] },
  { title: 'Matières grasses', macro: 'f', refId: 'huile_olive', refGrams: 10, roles: ['mg_repas', 'mg_pdj', 'mg_pdj_sale', 'mg_collation'] },
];
