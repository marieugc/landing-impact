import { useLiveQuery } from 'dexie-react-hooks';
import { db, loadSettings } from '../db/db';
import type { Settings } from '../engine/settings';
import type { Food } from '../engine/types';

export function useFoods(): Food[] | undefined {
  return useLiveQuery(() => db.foods.toArray(), []);
}

export function useSettings(): Settings | undefined {
  return useLiveQuery(() => loadSettings(), []);
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export const fmt1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const fmt0 = (n: number) => Math.round(n).toLocaleString('fr-FR');
export const signed = (n: number, digits = 0) => {
  const r = digits ? Math.round(n * 10 ** digits) / 10 ** digits : Math.round(n);
  return (r > 0 ? '+' : r < 0 ? '−' : '±') + Math.abs(r).toLocaleString('fr-FR');
};
