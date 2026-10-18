import Dexie, { type Table } from 'dexie';
import { DEFAULT_FOODS } from '../engine/foods';
import { mergeSettings, type Settings } from '../engine/settings';
import type { Diet, Food, Student, WeightEntry } from '../engine/types';

/** Données stockées dans le navigateur (IndexedDB), uniquement sur cet ordinateur. */
export class BootyFlowDB extends Dexie {
  students!: Table<Student, number>;
  diets!: Table<Diet, number>;
  weights!: Table<WeightEntry, number>;
  foods!: Table<Food, string>;
  settings!: Table<{ key: string; value: unknown }, string>;

  constructor(name = 'booty-flow-dietes') {
    super(name);
    this.version(1).stores({
      students: '++id, firstName, createdAt',
      diets: '++id, studentId, createdAt',
      weights: '++id, studentId, date',
      foods: 'id, name, category',
      settings: 'key',
    });
  }
}

export const db = new BootyFlowDB();

/** Au premier lancement : copie la base d'aliments par défaut. */
export async function ensureSeeded(d: BootyFlowDB = db): Promise<void> {
  const seeded = await d.settings.get('seeded');
  if (seeded) return;
  await d.transaction('rw', d.foods, d.settings, async () => {
    if ((await d.foods.count()) === 0) await d.foods.bulkPut(DEFAULT_FOODS);
    await d.settings.put({ key: 'seeded', value: true });
  });
}

export async function loadSettings(d: BootyFlowDB = db): Promise<Settings> {
  const row = await d.settings.get('settings');
  return mergeSettings((row?.value as Partial<Settings>) ?? null);
}

export async function saveSettings(s: Settings, d: BootyFlowDB = db): Promise<void> {
  await d.settings.put({ key: 'settings', value: s });
}

export async function resetFoods(d: BootyFlowDB = db): Promise<void> {
  await d.transaction('rw', d.foods, async () => {
    const customs = (await d.foods.toArray()).filter((f) => f.custom);
    await d.foods.clear();
    await d.foods.bulkPut([...DEFAULT_FOODS, ...customs]);
  });
}

/** Supprime une élève avec ses diètes et son suivi du poids. */
export async function deleteStudent(id: number, d: BootyFlowDB = db): Promise<void> {
  await d.transaction('rw', d.students, d.diets, d.weights, async () => {
    await d.diets.where('studentId').equals(id).delete();
    await d.weights.where('studentId').equals(id).delete();
    await d.students.delete(id);
  });
}

// ---------------------------------------------------------------- sauvegarde / import

export interface Backup {
  app: 'booty-flow-generateur-dietes';
  version: 1;
  exportedAt: string;
  students: Student[];
  diets: Diet[];
  weights: WeightEntry[];
  foods: Food[];
  settings: { key: string; value: unknown }[];
}

export async function exportBackup(d: BootyFlowDB = db): Promise<Backup> {
  return {
    app: 'booty-flow-generateur-dietes',
    version: 1,
    exportedAt: new Date().toISOString(),
    students: await d.students.toArray(),
    diets: await d.diets.toArray(),
    weights: await d.weights.toArray(),
    foods: await d.foods.toArray(),
    settings: await d.settings.toArray(),
  };
}

export function validateBackup(data: unknown): Backup {
  const b = data as Backup;
  if (!b || typeof b !== 'object' || b.app !== 'booty-flow-generateur-dietes') {
    throw new Error("Ce fichier n'est pas une sauvegarde du générateur de diètes Booty Flow.");
  }
  for (const k of ['students', 'diets', 'weights', 'foods', 'settings'] as const) {
    if (!Array.isArray(b[k])) throw new Error(`Sauvegarde incomplète (${k} manquant).`);
  }
  return b;
}

/** Remplace toutes les données par celles de la sauvegarde. */
export async function importBackup(data: unknown, d: BootyFlowDB = db): Promise<void> {
  const b = validateBackup(data);
  await d.transaction('rw', [d.students, d.diets, d.weights, d.foods, d.settings], async () => {
    await Promise.all([d.students.clear(), d.diets.clear(), d.weights.clear(), d.foods.clear(), d.settings.clear()]);
    await d.students.bulkPut(b.students);
    await d.diets.bulkPut(b.diets);
    await d.weights.bulkPut(b.weights);
    await d.foods.bulkPut(b.foods);
    await d.settings.bulkPut(b.settings);
  });
}
