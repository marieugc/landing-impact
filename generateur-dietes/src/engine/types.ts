// Types partagés par le moteur de calcul et l'interface.

export type MacroKey = 'p' | 'c' | 'f';

/** p = protéines (g), c = glucides (g), f = lipides (g), kcal = 4p + 4c + 9f */
export interface Macros {
  p: number;
  c: number;
  f: number;
  kcal: number;
}

export type FoodCategory =
  | 'viande'
  | 'poisson'
  | 'oeuf'
  | 'laitage'
  | 'proteine_vegetale'
  | 'complement'
  | 'feculent'
  | 'legumineuse'
  | 'legume'
  | 'fruit'
  | 'huile'
  | 'oleagineux'
  | 'matiere_grasse'
  | 'divers';

export type FoodTag =
  | 'lactose'
  | 'gluten'
  | 'animal'
  | 'viande'
  | 'porc'
  | 'poisson'
  | 'fruits_de_mer'
  | 'oeuf'
  | 'fruit_a_coque'
  | 'arachide'
  | 'soja'
  | 'laitier'
  | 'transforme'
  | 'anti_inflammatoire';

/** Rôles qu'un aliment peut tenir dans un modèle de repas. */
export type FoodRole =
  | 'prot_repas'
  | 'prot_pdj'
  | 'prot_pdj_sale'
  | 'blanc_oeuf'
  | 'prot_collation'
  | 'fec_repas'
  | 'gluc_pdj'
  | 'gluc_pdj_sale'
  | 'gluc_collation'
  | 'gluc_keto'
  | 'legume'
  | 'fruit_pdj'
  | 'mg_repas'
  | 'mg_pdj'
  | 'mg_pdj_sale'
  | 'mg_collation'
  | 'pre_creme_riz'
  | 'pre_banane'
  | 'post_compote'
  | 'post_proteine';

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  /** valeurs pour 100 g, pesé cru / sec */
  p: number;
  c: number;
  f: number;
  tags: FoodTag[];
  roles: FoodRole[];
  /** poids d'une unité (œuf, fruit entier) : la quantité est alors un nombre d'unités */
  unitWeight?: number;
  unitLabel?: string;
  /** bornes de quantité (en g, ou en unités si unitWeight) */
  min?: number;
  max?: number;
  custom?: boolean;
}

/** Ligne d'un repas. L'aliment est copié pour que l'historique ne change pas si la base est modifiée. */
export interface MealItem {
  food: Food;
  /** grammes, ou nombre d'unités si food.unitWeight */
  qty: number;
  /** modifié à la main : le rééquilibrage n'y touche pas */
  manual?: boolean;
  /** quantité fixe du modèle (légumes, fruit entier) */
  fixed?: boolean;
}

export interface MealVariant {
  templateId: string;
  items: MealItem[];
}

export type SlotKind = 'petit_dej' | 'midi' | 'pre' | 'post' | 'collation' | 'collation_libre' | 'soir';

export interface MealPlan {
  slot: SlotKind;
  label: string;
  time: string;
  target: Macros;
  variants: MealVariant[];
  selected: number;
  locked: boolean;
}

export type DayType = 'training' | 'rest' | 'refeed' | 'rebond';

export interface DayTarget extends Macros {
  /** total calorique saisi par la coach (ou calculé pour refeed / diet break) */
  kcalInput: number;
  keto: boolean;
}

export interface DayPlan {
  dayType: DayType;
  target: DayTarget;
  meals: MealPlan[];
  ok: boolean;
  attempts: number;
}

export type Objective = 'perte_de_gras' | 'recomposition' | 'prise_de_masse';
export type Phase = 'deficit' | 'maintenance' | 'refeed' | 'diet_break' | 'keto';
export type Sex = 'F' | 'H';

export interface DietOptions {
  sansLactose: boolean;
  proteineVegetale: boolean;
  sansGluten: boolean;
  vegetarien: boolean;
  vegan: boolean;
  sansPorc: boolean;
  sansPoisson: boolean;
  sansOeufs: boolean;
  sansFruitsACoque: boolean;
  antiInflammatoire: boolean;
  refuses: string;
  preferes: string;
}

export const EMPTY_OPTIONS: DietOptions = {
  sansLactose: false,
  proteineVegetale: false,
  sansGluten: false,
  vegetarien: false,
  vegan: false,
  sansPorc: false,
  sansPoisson: false,
  sansOeufs: false,
  sansFruitsACoque: false,
  antiInflammatoire: false,
  refuses: '',
  preferes: '',
};

export interface Student {
  id?: number;
  firstName: string;
  age: number;
  sex: Sex;
  height: number; // cm
  weight: number; // kg
  objective: Objective;
  phase: Phase;
  level: string;
  sessionsPerWeek: number;
  trainingTime: string; // "18:00"
  useAdjustedWeight: boolean;
  options: DietOptions;
  notes: string;
  createdAt: string;
}

export interface MacroOverrides {
  p?: number;
  f?: number;
  c?: Partial<Record<DayType, number>>;
}

export interface Diet {
  id?: number;
  studentId: number;
  createdAt: string;
  title: string;
  phase: Phase;
  objective: Objective;
  weight: number;
  kcalTraining: number;
  kcalRest: number;
  overrides: MacroOverrides;
  options: DietOptions;
  trainingTime: string;
  days: DayPlan[];
  trainingDaysPerWeek: number;
  restDaysPerWeek: number;
  notes: string;
}

export interface WeightEntry {
  id?: number;
  studentId: number;
  date: string; // AAAA-MM-JJ
  weight: number;
}
