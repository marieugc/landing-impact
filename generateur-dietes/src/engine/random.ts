/** Générateur pseudo-aléatoire reproductible (mulberry32) : même graine = même diète. */
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export function weightedPick<T>(rng: Rng, items: T[], weight: (t: T) => number): T | undefined {
  const total = items.reduce((s, t) => s + Math.max(0, weight(t)), 0);
  if (items.length === 0 || total <= 0) return undefined;
  let r = rng() * total;
  for (const t of items) {
    r -= Math.max(0, weight(t));
    if (r <= 0) return t;
  }
  return items[items.length - 1];
}
