import { kcalOf } from './nutrition';
import type { Settings } from './settings';
import type { DayTarget, DayType, MacroOverrides, Objective, Phase, Sex } from './types';

export const OBJECTIVE_LABELS: Record<Objective, string> = {
  perte_de_gras: 'Perte de gras',
  recomposition: 'Recomposition',
  prise_de_masse: 'Prise de masse',
};

export const PHASE_LABELS: Record<Phase, string> = {
  deficit: 'Déficit',
  maintenance: 'Maintenance',
  refeed: 'Refeed (+ glucides)',
  diet_break: 'Diet break',
  keto: 'Cétogène + rebonds glucidiques',
};

export const DAY_LABELS: Record<DayType, string> = {
  training: 'Jour training',
  rest: 'Jour repos',
  refeed: 'Jour refeed',
  rebond: 'Jour rebond glucidique',
};

export function bmi(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

/** Poids ajusté : poids à IMC 25 + facteur × l'excédent. */
export function adjustedWeight(weightKg: number, heightCm: number, factor: number): number {
  const h = heightCm / 100;
  const ideal = 25 * h * h;
  if (weightKg <= ideal) return weightKg;
  return ideal + factor * (weightKg - ideal);
}

/** Métabolisme de base Mifflin-St Jeor (kcal / jour). */
export function mifflinBmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'H' ? 5 : -161);
}

export function activityFactor(sessionsPerWeek: number, factors: Settings['activityFactors']): number {
  if (sessionsPerWeek <= 1) return factors[0];
  if (sessionsPerWeek <= 3) return factors[1];
  if (sessionsPerWeek <= 5) return factors[2];
  return factors[3];
}

export function estimatedMaintenance(
  p: { sex: Sex; weight: number; height: number; age: number; sessionsPerWeek: number },
  settings: Settings,
): number {
  return Math.round(mifflinBmr(p.sex, p.weight, p.height, p.age) * activityFactor(p.sessionsPerWeek, settings.activityFactors));
}

export interface TargetInput {
  weight: number;
  height: number;
  objective: Objective;
  phase: Phase;
  useAdjustedWeight: boolean;
  kcalTraining: number;
  kcalRest: number;
  overrides?: MacroOverrides;
}

export interface TargetResult {
  weightRef: number;
  adjusted: boolean;
  /** protéines et lipides de base (identiques tous les jours hors cétogène) */
  p: number;
  f: number;
  days: Partial<Record<DayType, DayTarget>>;
  dayTypes: DayType[];
  warnings: string[];
}

export function dayTypesForPhase(phase: Phase): DayType[] {
  if (phase === 'refeed') return ['training', 'rest', 'refeed'];
  if (phase === 'keto') return ['training', 'rest', 'rebond'];
  return ['training', 'rest'];
}

/**
 * Méthode Booty Flow :
 * 1. protéines = g/kg selon l'objectif (poids ajusté si coché)
 * 2. lipides = g/kg (jamais sous le minimum)
 * 3. glucides = le reste des calories (seul levier entre training et repos)
 */
export function computeTargets(input: TargetInput, settings: Settings): TargetResult {
  const warnings: string[] = [];
  const adjusted = input.useAdjustedWeight && bmi(input.weight, input.height) >= settings.adjustedWeightBmi;
  const weightRef = adjusted ? adjustedWeight(input.weight, input.height, settings.adjustedWeightFactor) : input.weight;
  if (input.useAdjustedWeight && !adjusted) {
    warnings.push(`Poids ajusté non appliqué : IMC inférieur à ${settings.adjustedWeightBmi}.`);
  }

  const o = input.overrides ?? {};
  const p = Math.round(o.p ?? settings.proteinGkg[input.objective] * weightRef);
  const fatMin = Math.round(settings.fatMinGkg * weightRef);
  let f = Math.round(o.f ?? settings.fatGkg * weightRef);
  if (f < fatMin) {
    warnings.push(`Lipides relevés au minimum de ${settings.fatMinGkg} g/kg (${fatMin} g).`);
    f = fatMin;
  }

  const dayTypes = dayTypesForPhase(input.phase);
  const days: Partial<Record<DayType, DayTarget>> = {};

  for (const dt of dayTypes) {
    const keto = input.phase === 'keto' && dt !== 'rebond';
    let kcalInput = dt === 'rest' ? input.kcalRest : input.kcalTraining;
    if (dt === 'refeed') kcalInput = Math.round(input.kcalTraining * (1 + settings.refeedCarbPct / 100));

    let dp = p;
    let df = f;
    let dc: number;
    const cOverride = o.c?.[dt];
    if (keto) {
      dc = Math.round(cOverride ?? settings.ketoCarbs);
      df = Math.round((kcalInput - 4 * dp - 4 * dc) / 9);
    } else if (cOverride !== undefined) {
      dc = Math.round(cOverride);
      kcalInput = Math.round(kcalOf(dp, dc, df));
    } else {
      dc = Math.round((kcalInput - 4 * dp - 9 * df) / 4);
    }
    if (dc < 0 || df < 0) {
      warnings.push(`${DAY_LABELS[dt]} : le total calorique est trop bas pour les protéines et lipides fixés.`);
      dc = Math.max(0, dc);
      df = Math.max(0, df);
    }
    days[dt] = { p: dp, c: dc, f: df, kcal: kcalOf(dp, dc, df), kcalInput, keto };
  }

  return { weightRef, adjusted, p, f, days, dayTypes, warnings };
}
