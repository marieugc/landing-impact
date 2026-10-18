import { boundsOf, foodMacros, macros, stepOf } from './nutrition';
import type { Food, MacroKey, Macros } from './types';

/**
 * Résolution des quantités par recherche locale sur des grammages arrondis.
 * On part d'une estimation, puis on essaie des pas (+/- 5 g, 1 g, 1 unité) sur un aliment
 * ou sur deux aliments à la fois, et on garde le mouvement qui réduit le plus l'écart.
 * Toutes les quantités restent arrondies à leur pas : les totaux affichés sont exactement ceux calculés.
 */

export interface SolverItem {
  food: Food;
  qty: number;
  adjustable: boolean;
  group: number;
  driver?: MacroKey;
  /** quantité d'origine (pénalité de changement en mode rééquilibrage) */
  origin?: number;
}

export interface GroupGoal {
  target: Macros;
  weights: Record<MacroKey, number>;
  /** importance globale du repas dans l'objectif */
  importance: number;
}

export interface SolveOptions {
  groups: GroupGoal[];
  /** objectif journalier (optionnel) : fortement pondéré */
  day?: { target: Macros; importance: number };
  /** pénalité par pas d'écart à la quantité d'origine */
  changePenalty?: number;
  maxIterations?: number;
}

interface Prepared {
  per: Macros; // macros par unité de quantité
  step: number;
  min: number;
  max: number;
  /** si min = 0 : quantité 0 ou au moins minUsed */
  minUsed: number;
}

function prepare(it: SolverItem): Prepared {
  const per = foodMacros(it.food, 1);
  const b = boundsOf(it.food);
  return { per, step: stepOf(it.food), min: b.min, max: b.max, minUsed: b.minUsed };
}

/** Quantité voisine (un pas au-dessus ou en dessous), en respectant les bornes ; null si impossible. */
function neighbour(p: Prepared, q: number, dir: 1 | -1): number | null {
  let n: number;
  if (dir > 0) n = q < p.minUsed ? Math.max(p.minUsed, q + p.step) : q + p.step;
  else {
    n = q - p.step;
    if (p.min === 0 && n < p.minUsed) n = 0;
  }
  if (n < p.min - 1e-9 || n > p.max + 1e-9 || Math.abs(n - q) < 1e-9) return null;
  return n;
}

const KEYS: MacroKey[] = ['p', 'c', 'f'];

function groupCost(tot: Macros, g: GroupGoal): number {
  let s = 0;
  for (const k of KEYS) {
    const d = tot[k] - g.target[k];
    s += g.weights[k] * d * d;
  }
  return s * g.importance;
}

function dayCost(tot: Macros, day: SolveOptions['day']): number {
  if (!day) return 0;
  let s = 0;
  for (const k of KEYS) {
    const d = tot[k] - day.target[k];
    // au-delà de 2 g on pénalise beaucoup plus fort : on vise large dans la tolérance de ±3 g
    s += d * d + (Math.abs(d) > 2 ? 20 * (Math.abs(d) - 2) ** 2 : 0);
  }
  const dk = (tot.kcal - day.target.kcal) / 4;
  s += dk * dk + (Math.abs(tot.kcal - day.target.kcal) > 15 ? 20 * dk * dk : 0);
  return s * day.importance;
}

/** Estimation de départ : chaque aliment « pilote » couvre ce qui manque sur sa macro. */
export function initialEstimate(items: SolverItem[], target: Macros): void {
  const prep = items.map(prepare);
  items.forEach((it, i) => {
    if (it.adjustable && it.qty === 0) it.qty = Math.max(prep[i].min, 0);
  });
  for (let pass = 0; pass < 6; pass++) {
    for (const k of KEYS) {
      items.forEach((it, i) => {
        if (!it.adjustable || it.driver !== k) return;
        const others = items.reduce((s, o, j) => (j === i ? s : s + prep[j].per[k] * o.qty), 0);
        const per = prep[i].per[k];
        if (per <= 0) return;
        const q = (target[k] - others) / per;
        it.qty = Math.min(prep[i].max, Math.max(prep[i].min, q));
        if (prep[i].min === 0 && it.qty > 0 && it.qty < prep[i].minUsed) it.qty = it.qty < prep[i].minUsed / 2 ? 0 : prep[i].minUsed;
      });
    }
  }
  items.forEach((it, i) => {
    if (!it.adjustable) return;
    const s = prep[i].step;
    it.qty = Math.min(prep[i].max, Math.max(prep[i].min, Math.round(it.qty / s) * s));
  });
}

export function solve(items: SolverItem[], opts: SolveOptions): SolverItem[] {
  const prep = items.map(prepare);
  const nGroups = opts.groups.length;
  const totals: Macros[] = Array.from({ length: nGroups }, () => macros(0, 0, 0));
  items.forEach((it, i) => {
    const t = totals[it.group];
    t.p += prep[i].per.p * it.qty;
    t.c += prep[i].per.c * it.qty;
    t.f += prep[i].per.f * it.qty;
  });
  totals.forEach((t) => (t.kcal = 4 * t.p + 4 * t.c + 9 * t.f));

  const penalty = opts.changePenalty ?? 0;
  const itemPenalty = (i: number, q: number) => {
    if (!penalty || items[i].origin === undefined) return 0;
    const d = (q - (items[i].origin as number)) / prep[i].step;
    return penalty * d * d;
  };

  const dayTotal = (): Macros => {
    const d = macros(0, 0, 0);
    for (const t of totals) {
      d.p += t.p;
      d.c += t.c;
      d.f += t.f;
    }
    d.kcal = 4 * d.p + 4 * d.c + 9 * d.f;
    return d;
  };

  const totalCost = () => {
    let s = 0;
    totals.forEach((t, g) => (s += groupCost(t, opts.groups[g])));
    s += dayCost(dayTotal(), opts.day);
    items.forEach((_, i) => (s += itemPenalty(i, items[i].qty)));
    return s;
  };

  const adj = items.map((_, i) => i).filter((i) => items[i].adjustable);

  const apply = (i: number, dq: number) => {
    const g = totals[items[i].group];
    const per = prep[i].per;
    g.p += per.p * dq;
    g.c += per.c * dq;
    g.f += per.f * dq;
    g.kcal = 4 * g.p + 4 * g.c + 9 * g.f;
    items[i].qty += dq;
  };

  let current = totalCost();
  const maxIt = opts.maxIterations ?? 400;
  for (let iter = 0; iter < maxIt; iter++) {
    let best = current;
    let move: [number, number, number, number] | null = null;
    const tryMove = (i: number, diDir: 1 | -1, j: number, djDir: 1 | -1) => {
      const ni = neighbour(prep[i], items[i].qty, diDir);
      if (ni === null) return;
      const di = ni - items[i].qty;
      let dj = 0;
      if (j >= 0) {
        const nj = neighbour(prep[j], items[j].qty, djDir);
        if (nj === null) return;
        dj = nj - items[j].qty;
      }
      apply(i, di);
      if (j >= 0) apply(j, dj);
      const c = totalCost();
      if (c < best - 1e-9) {
        best = c;
        move = [i, di, j, dj];
      }
      if (j >= 0) apply(j, -dj);
      apply(i, -di);
    };
    for (const i of adj) {
      tryMove(i, 1, -1, 1);
      tryMove(i, -1, -1, 1);
    }
    for (let a = 0; a < adj.length; a++) {
      for (let b = a + 1; b < adj.length; b++) {
        const i = adj[a];
        const j = adj[b];
        tryMove(i, 1, j, -1);
        tryMove(i, -1, j, 1);
        tryMove(i, 1, j, 1);
        tryMove(i, -1, j, -1);
      }
    }
    if (!move) break;
    const [i, di, j, dj] = move as [number, number, number, number];
    apply(i, di);
    if (j >= 0) apply(j, dj);
    current = best;
  }
  // nettoyage des arrondis flottants
  items.forEach((it, i) => {
    if (!it.adjustable) return;
    const s = prep[i].step;
    it.qty = Math.round(it.qty / s) * s;
  });
  return items;
}
