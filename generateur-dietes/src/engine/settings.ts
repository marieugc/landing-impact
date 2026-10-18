import type { Objective, SlotKind } from './types';

/** Réglages modifiables dans l'écran « Réglages ». */
export interface Settings {
  proteinGkg: Record<Objective, number>;
  fatGkg: number;
  fatMinGkg: number;
  /** IMC à partir duquel le poids ajusté est proposé */
  adjustedWeightBmi: number;
  /** poids ajusté = poids à IMC 25 + facteur × (poids réel − poids à IMC 25) */
  adjustedWeightFactor: number;
  refeedCarbPct: number;
  ketoCarbs: number;
  vegQty: number;
  preCarbPct: number;
  postProtein: number;
  postCarbPct: number;
  trainingDuration: number; // minutes
  trainingSplit: Partial<Record<SlotKind, number>>;
  restSplit: Partial<Record<SlotKind, number>>;
  /** coefficients d'activité Mifflin : 0-1, 2-3, 4-5, 6+ séances / semaine */
  activityFactors: [number, number, number, number];
  coachName: string;
  coachContact: string;
  pdfAdvice: string;
}

export const DEFAULT_SETTINGS: Settings = {
  proteinGkg: { perte_de_gras: 2.0, recomposition: 1.8, prise_de_masse: 1.8 },
  fatGkg: 0.9,
  fatMinGkg: 0.7,
  adjustedWeightBmi: 30,
  adjustedWeightFactor: 0.25,
  refeedCarbPct: 30,
  ketoCarbs: 30,
  vegQty: 200,
  preCarbPct: 15,
  postProtein: 25,
  postCarbPct: 10,
  trainingDuration: 75,
  trainingSplit: { petit_dej: 25, midi: 30, collation: 15, soir: 30 },
  restSplit: { petit_dej: 22, midi: 28, collation_libre: 12, collation: 13, soir: 25 },
  activityFactors: [1.375, 1.465, 1.55, 1.725],
  coachName: 'Coach Booty Flow',
  coachContact: '',
  pdfAdvice:
    "Toutes les quantités sont pesées crues / sèches (riz, pâtes, flocons, crème de riz, viande, poisson). " +
    "Bois 2 à 3 L d'eau par jour. Les légumes peuvent être variés librement. " +
    'Tu peux échanger un repas contre une de ses variantes : les macros restent équivalentes.',
};

export function mergeSettings(partial?: Partial<Settings> | null): Settings {
  if (!partial) return structuredCloneSafe(DEFAULT_SETTINGS);
  return {
    ...structuredCloneSafe(DEFAULT_SETTINGS),
    ...partial,
    proteinGkg: { ...DEFAULT_SETTINGS.proteinGkg, ...(partial.proteinGkg ?? {}) },
    trainingSplit: partial.trainingSplit ?? { ...DEFAULT_SETTINGS.trainingSplit },
    restSplit: partial.restSplit ?? { ...DEFAULT_SETTINGS.restSplit },
  };
}

function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}
