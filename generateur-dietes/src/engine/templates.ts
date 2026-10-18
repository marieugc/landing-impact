import type { Settings } from './settings';
import type { DayType, FoodRole, MacroKey, SlotKind } from './types';

export interface RoleSpec {
  role: FoodRole;
  /** macro que cet aliment pilote (estimation de départ) ; absent = part du minimum */
  driver?: MacroKey;
  /** quantité fixe (légumes, fruit entier) : non ajustée par l'algorithme */
  fixed?: boolean;
  optional?: boolean;
}

export interface MealTemplate {
  id: string;
  name: string;
  roles: RoleSpec[];
}

export const TEMPLATES: Record<string, MealTemplate> = {
  pdj_sucre: {
    id: 'pdj_sucre',
    name: 'Petit-déjeuner sucré',
    roles: [
      { role: 'prot_pdj', driver: 'p' },
      { role: 'gluc_pdj', driver: 'c' },
      { role: 'fruit_pdj', fixed: true, optional: true },
      { role: 'mg_pdj', driver: 'f', optional: true },
    ],
  },
  pdj_sale: {
    id: 'pdj_sale',
    name: 'Petit-déjeuner salé',
    roles: [
      { role: 'prot_pdj_sale', driver: 'p' },
      { role: 'blanc_oeuf', driver: 'p', optional: true },
      { role: 'gluc_pdj_sale', driver: 'c' },
      { role: 'mg_pdj_sale', driver: 'f', optional: true },
    ],
  },
  repas: {
    id: 'repas',
    name: 'Protéine + féculent + légumes + matière grasse',
    roles: [
      { role: 'prot_repas', driver: 'p' },
      { role: 'fec_repas', driver: 'c' },
      { role: 'legume', fixed: true },
      { role: 'mg_repas', driver: 'f', optional: true },
    ],
  },
  collation: {
    id: 'collation',
    name: 'Protéine + glucide + oléagineux',
    roles: [
      { role: 'prot_collation', driver: 'p' },
      { role: 'gluc_collation', driver: 'c' },
      { role: 'mg_collation', driver: 'f', optional: true },
    ],
  },
  pre: {
    id: 'pre',
    name: 'Crème de riz + banane',
    roles: [{ role: 'pre_banane' }, { role: 'pre_creme_riz', driver: 'c' }],
  },
  post: {
    id: 'post',
    name: 'Compote + whey isolate',
    roles: [
      { role: 'post_proteine', driver: 'p' },
      { role: 'post_compote', driver: 'c' },
    ],
  },
  pdj_keto: {
    id: 'pdj_keto',
    name: 'Petit-déjeuner cétogène',
    roles: [
      { role: 'prot_pdj_sale', driver: 'p' },
      { role: 'blanc_oeuf', driver: 'p', optional: true },
      { role: 'mg_pdj_sale', driver: 'f' },
    ],
  },
  repas_keto: {
    id: 'repas_keto',
    name: 'Protéine + légumes + matière grasse',
    roles: [
      { role: 'prot_repas', driver: 'p' },
      { role: 'legume', fixed: true },
      { role: 'mg_repas', driver: 'f' },
    ],
  },
  collation_keto: {
    id: 'collation_keto',
    name: 'Protéine + fruits rouges + oléagineux',
    roles: [
      { role: 'prot_collation', driver: 'p' },
      { role: 'gluc_keto', driver: 'c', optional: true },
      { role: 'mg_collation', driver: 'f' },
    ],
  },
};

export function templatesForSlot(slot: SlotKind, keto: boolean): MealTemplate[] {
  const T = TEMPLATES;
  switch (slot) {
    case 'petit_dej':
      return keto ? [T.pdj_keto] : [T.pdj_sucre, T.pdj_sale];
    case 'midi':
    case 'soir':
      return keto ? [T.repas_keto] : [T.repas];
    case 'collation':
    case 'collation_libre':
      return keto ? [T.collation_keto] : [T.collation];
    case 'pre':
      return [T.pre];
    case 'post':
      return [T.post];
  }
}

/** Poids des macros dans l'objectif de chaque repas (pré : seuls les glucides comptent, etc.). */
export function mealWeights(slot: SlotKind): Record<MacroKey, number> {
  if (slot === 'pre') return { p: 0, c: 1, f: 0 };
  if (slot === 'post') return { p: 1, c: 1, f: 0 };
  return { p: 1, c: 1, f: 1 };
}

export const SLOT_LABELS: Record<SlotKind, string> = {
  petit_dej: 'Petit-déjeuner',
  midi: 'Repas du midi',
  pre: 'Collation pré-training',
  post: 'Collation post-training',
  collation: "Collation de l'après-midi",
  collation_libre: 'Collation libre',
  soir: 'Repas du soir',
};

export interface SlotPlan {
  slot: SlotKind;
  time: string;
}

export function toMinutes(hhmm: string): number {
  const m = /^(\d{1,2})[:h](\d{2})?$/.exec(hhmm.trim());
  if (!m) return 18 * 60;
  return Number(m[1]) * 60 + Number(m[2] ?? 0);
}

export function toHHMM(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}h${String(m % 60).padStart(2, '0')}`;
}

/** Structure de la journée : jour training = 6 prises, ordre adapté à l'heure d'entraînement. */
export function daySlots(dayType: DayType, keto: boolean, trainingTime: string, settings: Settings): SlotPlan[] {
  const trainingStructure = !keto && dayType !== 'rest';
  if (!trainingStructure) {
    return [
      { slot: 'petit_dej', time: '08h00' },
      { slot: 'collation_libre', time: '10h30' },
      { slot: 'midi', time: '12h30' },
      { slot: 'collation', time: '16h30' },
      { slot: 'soir', time: '20h00' },
    ];
  }
  const T = toMinutes(trainingTime);
  const pre = T - 60;
  const post = T + settings.trainingDuration;
  const windowStart = pre - 30;
  const windowEnd = post + 45;
  const base: { slot: SlotKind; t: number }[] = [
    { slot: 'petit_dej', t: 8 * 60 },
    { slot: 'midi', t: 12 * 60 + 30 },
    { slot: 'collation', t: 16 * 60 + 30 },
    { slot: 'soir', t: 20 * 60 },
  ];
  const placed = base.map((b) => {
    if (b.t > windowStart && b.t < windowEnd) return { ...b, t: b.t >= T ? post + 60 : pre - 90 };
    return b;
  });
  placed.push({ slot: 'pre', t: pre }, { slot: 'post', t: post });
  placed.sort((a, b) => a.t - b.t);
  return placed.map((p) => ({ slot: p.slot, time: toHHMM(p.t) }));
}
