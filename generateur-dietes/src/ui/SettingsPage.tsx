import { useEffect, useState } from 'react';
import { saveSettings } from '../db/db';
import { DEFAULT_SETTINGS, type Settings } from '../engine/settings';
import { OBJECTIVE_LABELS } from '../engine/targets';
import { SLOT_LABELS } from '../engine/templates';
import type { Objective, SlotKind } from '../engine/types';
import { useSettings } from './hooks';

export function SettingsPage() {
  const stored = useSettings();
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (stored && !s) setS(stored);
  }, [stored, s]);
  if (!s) return <p className="muted">Chargement…</p>;

  const set = (patch: Partial<Settings>) => {
    setS({ ...s, ...patch });
    setSaved(false);
  };
  const num = (v: string) => Number(v.replace(',', '.'));
  const save = async () => {
    if (s.fatGkg < s.fatMinGkg) return alert(`Les lipides ne peuvent pas être sous ${s.fatMinGkg} g/kg.`);
    await saveSettings(s);
    setSaved(true);
  };

  const splitEditor = (key: 'trainingSplit' | 'restSplit', slots: SlotKind[]) => {
    const total = slots.reduce((acc, k) => acc + (s[key][k] ?? 0), 0);
    return (
      <div className="grid grid-3">
        {slots.map((k) => (
          <label key={k} className="field">
            {SLOT_LABELS[k]} (%)
            <input type="number" value={s[key][k] ?? 0} onChange={(e) => set({ [key]: { ...s[key], [k]: num(e.target.value) } } as Partial<Settings>)} />
          </label>
        ))}
        <div className="stat">
          <div className="label">Total</div>
          <div className="value" style={{ color: total === 100 ? 'var(--good)' : 'var(--warn)' }}>
            {total} %
          </div>
          <div className="sub">{total === 100 ? 'parfait' : 'sera ramené à 100 %'}</div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-head">
        <h1>Réglages</h1>
        <div className="row">
          <button className="btn ghost" onClick={() => confirm('Revenir aux réglages par défaut ?') && set(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)))}>
            Valeurs par défaut
          </button>
          <button className="btn primary" onClick={save}>
            {saved ? '✓ Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Protéines (socle fixe, g / kg de poids de corps)</h2>
        <div className="grid grid-3">
          {(Object.keys(OBJECTIVE_LABELS) as Objective[]).map((o) => (
            <label key={o} className="field">
              {OBJECTIVE_LABELS[o]}
              <input type="number" step="0.1" value={s.proteinGkg[o]} onChange={(e) => set({ proteinGkg: { ...s.proteinGkg, [o]: num(e.target.value) } })} />
            </label>
          ))}
          <label className="field">
            Poids ajusté proposé à partir d'un IMC de
            <input type="number" value={s.adjustedWeightBmi} onChange={(e) => set({ adjustedWeightBmi: num(e.target.value) })} />
          </label>
          <label className="field">
            Poids ajusté = poids à IMC 25 + … × excédent
            <input type="number" step="0.05" value={s.adjustedWeightFactor} onChange={(e) => set({ adjustedWeightFactor: num(e.target.value) })} />
          </label>
        </div>
      </div>

      <div className="card">
        <h2>Lipides et phases</h2>
        <div className="grid grid-4">
          <label className="field">
            Lipides par défaut (g/kg, 0,8 à 1)
            <input type="number" step="0.05" value={s.fatGkg} onChange={(e) => set({ fatGkg: num(e.target.value) })} />
          </label>
          <label className="field">
            Plancher lipides (g/kg)
            <input type="number" step="0.05" value={s.fatMinGkg} onChange={(e) => set({ fatMinGkg: num(e.target.value) })} />
          </label>
          <label className="field">
            Refeed : + % de calories (en glucides)
            <input type="number" value={s.refeedCarbPct} onChange={(e) => set({ refeedCarbPct: num(e.target.value) })} />
          </label>
          <label className="field">
            Cétogène : glucides (g / jour)
            <input type="number" value={s.ketoCarbs} onChange={(e) => set({ ketoCarbs: num(e.target.value) })} />
          </label>
        </div>
      </div>

      <div className="card">
        <h2>Structure des repas</h2>
        <div className="grid grid-4">
          <label className="field">
            Pré-training : % des glucides du jour
            <input type="number" value={s.preCarbPct} onChange={(e) => set({ preCarbPct: num(e.target.value) })} />
          </label>
          <label className="field">
            Post-training : protéines (g)
            <input type="number" value={s.postProtein} onChange={(e) => set({ postProtein: num(e.target.value) })} />
          </label>
          <label className="field">
            Post-training : % des glucides du jour
            <input type="number" value={s.postCarbPct} onChange={(e) => set({ postCarbPct: num(e.target.value) })} />
          </label>
          <label className="field">
            Durée de séance (min)
            <input type="number" value={s.trainingDuration} onChange={(e) => set({ trainingDuration: num(e.target.value) })} />
          </label>
          <label className="check" style={{ gridColumn: 'span 2', alignSelf: 'end' }}>
            <input type="checkbox" checked={s.cookedStarches} onChange={(e) => set({ cookedStarches: e.target.checked })} />
            <span>
              Féculents et légumineuses en <strong>poids cuit</strong>
              <span className="faint small"> — riz, pâtes, quinoa, pommes de terre, lentilles… (crème de riz et flocons restent secs)</span>
            </span>
          </label>
          <label className="field">
            Légumes par repas (g)
            <input type="number" step="10" value={s.vegQty} onChange={(e) => set({ vegQty: num(e.target.value) })} />
          </label>
        </div>
        <h3 style={{ marginTop: 16 }}>Jour training : répartition du reste entre les repas</h3>
        {splitEditor('trainingSplit', ['petit_dej', 'midi', 'collation', 'soir'])}
        <h3 style={{ marginTop: 16 }}>Jour repos (et cétogène) : répartition entre les repas</h3>
        {splitEditor('restSplit', ['petit_dej', 'collation_libre', 'midi', 'collation', 'soir'])}
      </div>

      <div className="card">
        <h2>Maintenance estimée (Mifflin-St Jeor)</h2>
        <div className="grid grid-4">
          {['0 à 1 séance', '2 à 3 séances', '4 à 5 séances', '6 séances et +'].map((label, i) => (
            <label key={label} className="field">
              Coefficient {label}
              <input
                type="number"
                step="0.005"
                value={s.activityFactors[i]}
                onChange={(e) => {
                  const a = [...s.activityFactors] as Settings['activityFactors'];
                  a[i] = num(e.target.value);
                  set({ activityFactors: a });
                }}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>PDF</h2>
        <div className="grid grid-2">
          <label className="field">
            Nom affiché (bas de page)
            <input value={s.coachName} onChange={(e) => set({ coachName: e.target.value })} />
          </label>
          <label className="field">
            Contact (Instagram, e-mail…)
            <input value={s.coachContact} onChange={(e) => set({ coachContact: e.target.value })} placeholder="@bootyflow" />
          </label>
        </div>
        <label className="field" style={{ marginTop: 12 }}>
          Conseils imprimés en première page
          <textarea value={s.pdfAdvice} onChange={(e) => set({ pdfAdvice: e.target.value })} />
        </label>
      </div>
    </div>
  );
}
