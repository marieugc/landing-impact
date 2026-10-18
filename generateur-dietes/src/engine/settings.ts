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
  /** riz, pâtes, quinoa, légumineuses… donnés en poids cuit (crème de riz et flocons restent secs) */
  cookedStarches: boolean;
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
  cookedStarches: true,
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
    "Bois 2 à 3 L d'eau par jour. Les légumes peuvent être variés librement. " +
    'Tu peux échanger un repas contre une de ses variantes : les macros restent équivalentes.',
};

/** Ancien texte par défaut (qui annonçait tout en poids cru) : remplacé automatiquement. */
const LEGACY_PDF_ADVICE =
  "Toutes les quantités sont pesées crues / sèches (riz, pâtes, flocons, crème de riz, viande, poisson). " +
  "Bois 2 à 3 L d'eau par jour. Les légumes peuvent être variés librement. " +
  'Tu peux échanger un repas contre une de ses variantes : les macros restent équivalentes.';

/** Phrase de pesée imprimée dans le PDF, selon le réglage poids cuit / cru. */
export function weighingAdvice(s: Settings): string {
  return s.cookedStarches
    ? 'Riz, pâtes, quinoa, semoule, pommes de terre et légumineuses : quantités pesées CUITES. ' +
        'Viande, poisson, crème de riz et flocons d\u2019avoine : pesés crus / secs.'
    : 'Toutes les quantités sont pesées crues / sèches (riz, pâtes, flocons, crème de riz, viande, poisson).';
}

export function mergeSettings(partial?: Partial<Settings> | null): Settings {
  if (!partial) return structuredCloneSafe(DEFAULT_SETTINGS);
  const merged = {
    ...structuredCloneSafe(DEFAULT_SETTINGS),
    ...partial,
    proteinGkg: { ...DEFAULT_SETTINGS.proteinGkg, ...(partial.proteinGkg ?? {}) },
    trainingSplit: partial.trainingSplit ?? { ...DEFAULT_SETTINGS.trainingSplit },
    restSplit: partial.restSplit ?? { ...DEFAULT_SETTINGS.restSplit },
  };
  if (merged.pdfAdvice === LEGACY_PDF_ADVICE) merged.pdfAdvice = DEFAULT_SETTINGS.pdfAdvice;
  return merged;
}

function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}
