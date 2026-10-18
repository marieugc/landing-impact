import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { BootyFlowDB, deleteStudent, ensureSeeded, exportBackup, importBackup, loadSettings } from '../src/db/db';
import { DEFAULT_FOODS } from '../src/engine/foods';
import { EMPTY_OPTIONS, type Student } from '../src/engine/types';

const student: Student = {
  firstName: 'Léa',
  age: 29,
  sex: 'F',
  height: 165,
  weight: 62,
  objective: 'perte_de_gras',
  phase: 'deficit',
  level: 'Intermédiaire',
  sessionsPerWeek: 4,
  trainingTime: '18:00',
  useAdjustedWeight: false,
  options: { ...EMPTY_OPTIONS },
  notes: '',
  createdAt: '2026-10-18',
};

describe('stockage local', () => {
  it('copie la base d’aliments au premier lancement', async () => {
    const d = new BootyFlowDB('t1');
    await ensureSeeded(d);
    expect(await d.foods.count()).toBe(DEFAULT_FOODS.length);
    expect((await loadSettings(d)).fatGkg).toBe(0.9);
  });

  it('sauvegarde puis import JSON : rien n’est perdu', async () => {
    const a = new BootyFlowDB('t2');
    await ensureSeeded(a);
    const id = await a.students.add(student);
    await a.weights.add({ studentId: id, date: '2026-10-01', weight: 63 });
    const backup = JSON.parse(JSON.stringify(await exportBackup(a)));

    const b = new BootyFlowDB('t3');
    await importBackup(backup, b);
    expect((await b.students.toArray())[0].firstName).toBe('Léa');
    expect(await b.weights.count()).toBe(1);
    expect(await b.foods.count()).toBe(DEFAULT_FOODS.length);
  });

  it('refuse un fichier qui n’est pas une sauvegarde', async () => {
    await expect(importBackup({ foo: 1 }, new BootyFlowDB('t4'))).rejects.toThrow();
  });

  it('supprimer une élève supprime ses diètes et son suivi', async () => {
    const d = new BootyFlowDB('t5');
    const id = await d.students.add(student);
    await d.weights.add({ studentId: id, date: '2026-10-01', weight: 63 });
    await deleteStudent(id, d);
    expect(await d.weights.count()).toBe(0);
    expect(await d.students.count()).toBe(0);
  });
});
