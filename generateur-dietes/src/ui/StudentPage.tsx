import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db, deleteStudent, loadSettings } from '../db/db';
import { bmi, estimatedMaintenance, OBJECTIVE_LABELS, PHASE_LABELS } from '../engine/targets';
import { EMPTY_OPTIONS, type Diet, type Objective, type Phase, type Student } from '../engine/types';
import { fmt1, formatDate, todayISO } from './hooks';
import { OptionsChecklist } from './OptionsChecklist';
import { go } from './router';
import { WeightChart } from './WeightChart';

const NEW_STUDENT: Student = {
  firstName: '',
  age: 30,
  sex: 'F',
  height: 165,
  weight: 60,
  objective: 'perte_de_gras',
  phase: 'deficit',
  level: 'Intermédiaire',
  sessionsPerWeek: 4,
  trainingTime: '18:00',
  useAdjustedWeight: false,
  options: { ...EMPTY_OPTIONS },
  notes: '',
  createdAt: '',
};

export function StudentPage({ id }: { id: number | null }) {
  const stored = useLiveQuery(() => (id ? db.students.get(id) : undefined), [id]);
  const [form, setForm] = useState<Student | null>(id ? null : { ...NEW_STUDENT, options: { ...EMPTY_OPTIONS } });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (stored && !form) setForm(stored);
  }, [stored, form]);

  if (id && stored === undefined && !form) return <p className="muted">Chargement…</p>;
  if (!form) return <p className="muted">Élève introuvable.</p>;

  const set = <K extends keyof Student>(k: K, v: Student[K]) => {
    setForm({ ...form, [k]: v });
    setSaved(false);
  };

  const save = async () => {
    if (!form.firstName.trim()) {
      alert('Indique au moins le prénom.');
      return;
    }
    if (!id) {
      const newId = await db.students.add({ ...form, createdAt: todayISO() });
      await db.weights.add({ studentId: newId, date: todayISO(), weight: form.weight });
      go(`eleve/${newId}`);
    } else {
      await db.students.put({ ...form, id });
      setSaved(true);
    }
  };

  const remove = async () => {
    if (!id) return;
    if (!confirm(`Supprimer ${form.firstName}, ses diètes et son suivi du poids ? (irréversible)`)) return;
    await deleteStudent(id);
    go('');
  };

  const imc = bmi(form.weight, form.height);

  return (
    <div>
      <div className="page-head">
        <h1>{id ? form.firstName : 'Nouvelle élève'}</h1>
        <div className="row">
          <a className="btn ghost" href="#/">
            ← Mes élèves
          </a>
          {id && (
            <button className="btn danger" onClick={remove}>
              Supprimer
            </button>
          )}
          <button className="btn primary" onClick={save}>
            {id ? (saved ? '✓ Enregistré' : 'Enregistrer le profil') : 'Créer l’élève'}
          </button>
        </div>
      </div>

      {id && <DietHistory student={{ ...form, id }} />}

      <div className="card">
        <h2>Profil</h2>
        <div className="grid grid-4">
          <label className="field">
            Prénom
            <input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </label>
          <label className="field">
            Âge
            <input type="number" value={form.age} onChange={(e) => set('age', Number(e.target.value))} />
          </label>
          <label className="field">
            Sexe
            <select value={form.sex} onChange={(e) => set('sex', e.target.value as Student['sex'])}>
              <option value="F">Femme</option>
              <option value="H">Homme</option>
            </select>
          </label>
          <label className="field">
            Taille (cm)
            <input type="number" value={form.height} onChange={(e) => set('height', Number(e.target.value))} />
          </label>
          <label className="field">
            Poids (kg)
            <input type="number" step="0.1" value={form.weight} onChange={(e) => set('weight', Number(e.target.value))} />
          </label>
          <label className="field">
            Objectif
            <select value={form.objective} onChange={(e) => set('objective', e.target.value as Objective)}>
              {Object.entries(OBJECTIVE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Phase
            <select value={form.phase} onChange={(e) => set('phase', e.target.value as Phase)}>
              {Object.entries(PHASE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Niveau
            <select value={form.level} onChange={(e) => set('level', e.target.value)}>
              {['Débutante', 'Intermédiaire', 'Avancée'].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Séances / semaine
            <input type="number" min={0} max={14} value={form.sessionsPerWeek} onChange={(e) => set('sessionsPerWeek', Number(e.target.value))} />
          </label>
          <label className="field">
            Heure d'entraînement
            <input type="time" value={form.trainingTime} onChange={(e) => set('trainingTime', e.target.value)} />
          </label>
          <div className="field" style={{ justifyContent: 'flex-end' }}>
            <span className="small muted">IMC : {fmt1(imc)}</span>
            <label className="check" style={{ padding: '4px 0' }}>
              <input type="checkbox" checked={form.useAdjustedWeight} onChange={(e) => set('useAdjustedWeight', e.target.checked)} />
              Calculer sur un poids ajusté (fort surpoids)
            </label>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Options alimentaires</h2>
        <OptionsChecklist value={form.options} onChange={(o) => set('options', o)} />
      </div>

      <div className="card">
        <h2>Notes</h2>
        <textarea style={{ width: '100%' }} value={form.notes} placeholder="Blessures, préférences, contexte…" onChange={(e) => set('notes', e.target.value)} />
      </div>

      {id && <WeightTracker studentId={id} onLatest={(w) => setForm((f) => (f ? { ...f, weight: w } : f))} />}
    </div>
  );
}

function DietHistory({ student }: { student: Student & { id: number } }) {
  const diets = useLiveQuery(() => db.diets.where('studentId').equals(student.id).toArray(), [student.id]);
  const sorted = (diets ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || (b.id ?? 0) - (a.id ?? 0));

  const create = async () => {
    await db.students.put(student);
    const settings = await loadSettings();
    const last = sorted[0];
    const maint = estimatedMaintenance(student, settings);
    const kt = last?.kcalTraining ?? (student.phase === 'diet_break' || student.phase === 'maintenance' ? maint : Math.round((maint * 0.9) / 10) * 10);
    const kr = last?.kcalRest ?? (student.phase === 'diet_break' || student.phase === 'maintenance' ? maint : kt - 200);
    const diet: Diet = {
      studentId: student.id,
      createdAt: todayISO(),
      title: `Diète ${PHASE_LABELS[student.phase].toLowerCase()}`,
      phase: student.phase,
      objective: student.objective,
      weight: student.weight,
      kcalTraining: kt,
      kcalRest: kr,
      overrides: {},
      options: { ...student.options },
      trainingTime: student.trainingTime,
      days: [],
      trainingDaysPerWeek: Math.min(7, student.sessionsPerWeek),
      restDaysPerWeek: 7 - Math.min(7, student.sessionsPerWeek),
      notes: '',
    };
    const newId = await db.diets.add(diet);
    go(`eleve/${student.id}/diete/${newId}`);
  };

  const duplicate = async (d: Diet) => {
    const copy: Diet = { ...JSON.parse(JSON.stringify(d)), createdAt: todayISO(), title: d.title + ' (copie)' };
    delete copy.id;
    const newId = await db.diets.add(copy);
    go(`eleve/${student.id}/diete/${newId}`);
  };

  const remove = async (d: Diet) => {
    if (confirm(`Supprimer « ${d.title} » du ${formatDate(d.createdAt)} ?`)) await db.diets.delete(d.id!);
  };

  return (
    <div className="card glow">
      <div className="row" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Diètes</h2>
        <div className="spacer" />
        <a className="btn" href={`#/mise-en-page/${student.id}`}>
          📝 Mettre en page une diète écrite
        </a>
        <button className="btn primary" onClick={create}>
          ✨ Nouvelle diète
        </button>
      </div>
      {sorted.length === 0 && <p className="muted">Aucune diète pour l'instant. Clique sur « Nouvelle diète ».</p>}
      {sorted.map((d) => (
        <div key={d.id} className="list-item">
          <span className="pill neon">{formatDate(d.createdAt)}</span>
          <a href={`#/eleve/${student.id}/diete/${d.id}`} style={{ fontWeight: 600 }}>
            {d.title}
          </a>
          <span className="small muted">
            {d.kcalTraining} kcal training · {d.kcalRest} kcal repos · {d.weight} kg
          </span>
          <div className="spacer" />
          <button className="btn sm" onClick={() => duplicate(d)}>
            Dupliquer
          </button>
          <button className="btn sm danger" onClick={() => remove(d)}>
            Supprimer
          </button>
        </div>
      ))}
    </div>
  );
}

function WeightTracker({ studentId, onLatest }: { studentId: number; onLatest: (w: number) => void }) {
  const entries = useLiveQuery(() => db.weights.where('studentId').equals(studentId).sortBy('date'), [studentId]);
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState('');

  const add = async () => {
    const w = Number(weight.replace(',', '.'));
    if (!w || w < 20 || w > 300) return alert('Poids invalide.');
    await db.weights.add({ studentId, date, weight: w });
    const all = await db.weights.where('studentId').equals(studentId).sortBy('date');
    const latest = all[all.length - 1];
    if (latest) {
      await db.students.update(studentId, { weight: latest.weight });
      onLatest(latest.weight);
    }
    setWeight('');
  };

  const list = entries ?? [];
  const first = list[0];
  const last = list[list.length - 1];

  return (
    <div className="card">
      <h2>Suivi du poids</h2>
      <div className="row" style={{ marginBottom: 14 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input placeholder="Poids (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} style={{ width: 120 }} />
        <button className="btn primary sm" onClick={add}>
          Ajouter
        </button>
        {first && last && list.length > 1 && (
          <span className="pill neon">
            Évolution : {last.weight - first.weight > 0 ? '+' : ''}
            {fmt1(last.weight - first.weight)} kg depuis le {formatDate(first.date)}
          </span>
        )}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
        <WeightChart entries={list} />
        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th className="n">Poids</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...list].reverse().map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.date)}</td>
                  <td className="n">{fmt1(e.weight)} kg</td>
                  <td className="n">
                    <button className="btn sm icon ghost" title="Supprimer" onClick={() => db.weights.delete(e.id!)}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
