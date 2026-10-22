import { useEffect, useMemo, useState } from 'react';
import { db } from '../db/db';
import { compatibleFoods } from '../engine/filters';
import { estimatedMaintenance, DAY_LABELS, OBJECTIVE_LABELS, PHASE_LABELS } from '../engine/targets';
import type { DayType, Diet, Objective, Phase, Student } from '../engine/types';
import type { PdfOptions } from '../pdf/exportPdf';
import { CopyPanel } from './CopyPanel';
import { DayRecap } from './DayRecap';
import { applyTargets, clone, foodsForGeneration, generateAll, makeCtx, mealActions, regenerateOneDay, targetsFor } from './dietOps';
import { EquivalencesPanel } from './EquivalencesPanel';
import { fmt0, fmt1, formatDate, signed, useFoods, useSettings } from './hooks';
import { MealCard } from './MealCard';
import { OptionsChecklist, optionsSummary } from './OptionsChecklist';
import { shoppingForDiet, ShoppingPanel } from './ShoppingPanel';

export function DietPage({ studentId, dietId }: { studentId: number; dietId: number }) {
  const foods = useFoods();
  const settings = useSettings();
  const [student, setStudent] = useState<Student | null>(null);
  const [diet, setDiet] = useState<Diet | null>(null);
  const [missing, setMissing] = useState(false);
  const [dayIdx, setDayIdx] = useState(0);
  const [panel, setPanel] = useState<'equiv' | 'courses' | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pdf, setPdf] = useState<PdfOptions>({ theme: 'clair', equivalences: true, shopping: true });

  useEffect(() => {
    Promise.all([db.students.get(studentId), db.diets.get(dietId)]).then(([s, d]) => {
      if (!s || !d) setMissing(true);
      else {
        setStudent(s);
        setDiet(d);
      }
    });
  }, [studentId, dietId]);

  const targets = useMemo(() => (diet && student && settings ? targetsFor(diet, student, settings) : null), [diet, student, settings]);
  const allowedFoods = useMemo(
    () => (foods && diet && settings ? compatibleFoods(foodsForGeneration(foods, settings), diet.options) : []),
    [foods, diet, settings],
  );

  if (missing) return <p className="muted">Diète introuvable.</p>;
  if (!diet || !student || !settings || !foods || !targets) return <p className="muted">Chargement…</p>;

  /** Applique une modification (sur une copie), recalcule et enregistre. */
  const update = (fn: (d: Diet) => void, retarget = false) => {
    const next = clone(diet);
    fn(next);
    if (retarget) applyTargets(next, targetsFor(next, student, settings));
    setDiet(next);
    db.diets.put(next);
  };
  const updateDay = (fn: (d: Diet['days'][number]) => void) => update((d) => fn(d.days[dayIdx]));
  const ctx = () => makeCtx(diet, foods, settings);

  const generate = () => {
    setBusy(true);
    setTimeout(() => {
      update((d) => {
        const t = targetsFor(d, student, settings);
        generateAll(d, t, makeCtx(d, foods, settings));
      });
      setBusy(false);
    }, 20);
  };

  const maintenance = estimatedMaintenance({ ...student, weight: diet.weight }, settings);
  const day = diet.days[Math.min(dayIdx, diet.days.length - 1)];
  const anyDay = diet.days.length > 0;

  const setOverride = (k: 'p' | 'f', v: string) =>
    update((d) => {
      const o = { ...d.overrides };
      if (v === '') delete o[k];
      else o[k] = Number(v);
      d.overrides = o;
    }, true);
  const setCarbOverride = (dt: DayType, v: string) =>
    update((d) => {
      const c = { ...(d.overrides.c ?? {}) };
      if (v === '') delete c[dt];
      else c[dt] = Number(v);
      d.overrides = { ...d.overrides, c };
    }, true);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="small muted">
            <a href={`#/eleve/${student.id}`}>← {student.firstName}</a> · créée le {formatDate(diet.createdAt)}
          </div>
          <input
            value={diet.title}
            onChange={(e) => update((d) => (d.title = e.target.value))}
            style={{ fontSize: 24, fontWeight: 700, background: 'transparent', border: 'none', padding: '4px 0', width: 520, maxWidth: '100%' }}
          />
        </div>
        <div className="row">
          <button className="btn primary" onClick={generate} disabled={busy}>
            {busy ? 'Génération…' : anyDay ? '✨ Régénérer la diète' : '✨ Générer la diète'}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Paramètres</h2>
        <div className="grid grid-4">
          <label className="field">
            Total kcal jour training
            <input type="number" step={10} value={diet.kcalTraining} onChange={(e) => update((d) => (d.kcalTraining = Number(e.target.value)), true)} />
          </label>
          <label className="field">
            Total kcal jour repos
            <input type="number" step={10} value={diet.kcalRest} onChange={(e) => update((d) => (d.kcalRest = Number(e.target.value)), true)} />
          </label>
          <label className="field">
            Phase
            <select value={diet.phase} onChange={(e) => update((d) => (d.phase = e.target.value as Phase), true)}>
              {Object.entries(PHASE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Objectif
            <select value={diet.objective} onChange={(e) => update((d) => (d.objective = e.target.value as Objective), true)}>
              {Object.entries(OBJECTIVE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Poids pour le calcul (kg)
            <input type="number" step={0.1} value={diet.weight} onChange={(e) => update((d) => (d.weight = Number(e.target.value)), true)} />
          </label>
          <label className="field">
            Heure d'entraînement
            <input type="time" value={diet.trainingTime} onChange={(e) => update((d) => (d.trainingTime = e.target.value))} />
          </label>
          <div className="stat" style={{ gridColumn: 'span 2' }}>
            <div className="label">Maintenance estimée (Mifflin-St Jeor, indicatif)</div>
            <div className="value">{fmt0(maintenance)} kcal</div>
            <div className="sub">
              Écart training : {signed(diet.kcalTraining - maintenance)} kcal ({signed(((diet.kcalTraining - maintenance) / maintenance) * 100)} %) · repos :{' '}
              {signed(diet.kcalRest - maintenance)} kcal ({signed(((diet.kcalRest - maintenance) / maintenance) * 100)} %)
            </div>
          </div>
        </div>
        {diet.phase === 'diet_break' && (diet.kcalTraining !== maintenance || diet.kcalRest !== maintenance) && (
          <div className="row" style={{ marginTop: 10 }}>
            <span className="small muted">Diet break : calories à la maintenance.</span>
            <button className="btn sm" onClick={() => update((d) => ((d.kcalTraining = maintenance), (d.kcalRest = maintenance)), true)}>
              Mettre {maintenance} kcal
            </button>
          </div>
        )}
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn sm ghost" onClick={() => setShowOptions(!showOptions)}>
            {showOptions ? '▾' : '▸'} Options alimentaires de cette diète
          </button>
          {optionsSummary(diet.options).map((s) => (
            <span key={s} className="pill neon">
              {s}
            </span>
          ))}
          {optionsSummary(diet.options).length === 0 && <span className="small faint">aucune restriction</span>}
        </div>
        {showOptions && (
          <div style={{ marginTop: 10 }}>
            <OptionsChecklist value={diet.options} onChange={(o) => update((d) => (d.options = o))} />
            <p className="small faint">Les options s'appliquent à la prochaine génération (ou régénération d'un repas).</p>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Macros calculées</h2>
        <p className="small muted" style={{ marginTop: -4 }}>
          Protéines {settings.proteinGkg[diet.objective]} g/kg et lipides {settings.fatGkg} g/kg sur {fmt1(targets.weightRef)} kg
          {targets.adjusted ? ' (poids ajusté)' : ''}. Glucides = le reste. Tu peux modifier les cases : le reste se recalcule (vide = automatique).
        </p>
        {targets.warnings.map((w) => (
          <div key={w} className="banner warn">
            {w}
          </div>
        ))}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Journée</th>
                <th className="n">Kcal</th>
                <th className="n">Protéines (g)</th>
                <th className="n">Glucides (g)</th>
                <th className="n">Lipides (g)</th>
                <th className="n">Répartition P / G / L</th>
              </tr>
            </thead>
            <tbody>
              {targets.dayTypes.map((dt, i) => {
                const t = targets.days[dt]!;
                return (
                  <tr key={dt}>
                    <td>
                      {DAY_LABELS[dt]}
                      {t.keto && <span className="pill" style={{ marginLeft: 6 }}>cétogène</span>}
                    </td>
                    <td className="n">{fmt0(t.kcalInput)}</td>
                    <td className="n">
                      {i === 0 ? (
                        <input className="num-input" type="number" value={diet.overrides.p ?? ''} placeholder={String(t.p)} onChange={(e) => setOverride('p', e.target.value)} />
                      ) : (
                        t.p
                      )}
                    </td>
                    <td className="n">
                      <input className="num-input" type="number" value={diet.overrides.c?.[dt] ?? ''} placeholder={String(t.c)} onChange={(e) => setCarbOverride(dt, e.target.value)} />
                    </td>
                    <td className="n">
                      {i === 0 && !t.keto ? (
                        <input className="num-input" type="number" value={diet.overrides.f ?? ''} placeholder={String(t.f)} onChange={(e) => setOverride('f', e.target.value)} />
                      ) : (
                        t.f
                      )}
                    </td>
                    <td className="n muted">
                      {fmt0((t.p * 400) / t.kcal)} % / {fmt0((t.c * 400) / t.kcal)} % / {fmt0((t.f * 900) / t.kcal)} %
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(diet.overrides.p !== undefined || diet.overrides.f !== undefined || Object.keys(diet.overrides.c ?? {}).length > 0) && (
          <button className="btn sm ghost" style={{ marginTop: 8 }} onClick={() => update((d) => (d.overrides = {}), true)}>
            Revenir au calcul automatique
          </button>
        )}
        {diet.phase === 'keto' && (
          <p className="small faint">Cétogène : glucides à {settings.ketoCarbs} g, lipides = le reste. Le jour rebond reprend la répartition classique avec la structure training.</p>
        )}
      </div>

      {!anyDay && (
        <div className="card glow">
          <p style={{ margin: 0 }}>
            Vérifie les totaux caloriques puis clique sur <strong>« Générer la diète »</strong>. L'algorithme construit chaque repas, ajuste les grammages et
            recommence tant que la journée n'est pas à ±20 kcal et ±3 g de chaque macro.
          </p>
        </div>
      )}

      {anyDay && day && (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            <div className="tabs" style={{ margin: 0 }}>
              {diet.days.map((d, i) => (
                <button key={d.dayType} className={'tab' + (i === dayIdx ? ' active' : '')} onClick={() => setDayIdx(i)}>
                  {d.ok ? '🟢' : '🔴'} {DAY_LABELS[d.dayType]} · {fmt0(d.target.kcalInput)} kcal
                </button>
              ))}
            </div>
            <div className="spacer" />
            <button className="btn sm" onClick={() => update((d) => regenerateOneDay(d, dayIdx, targetsFor(d, student, settings), makeCtx(d, foods, settings)))}>
              ↻ Régénérer cette journée (sauf repas verrouillés)
            </button>
          </div>

          {day.meals.length === 0 ? (
            <div className="banner warn">La structure de cette journée a changé : clique sur « Régénérer la diète ».</div>
          ) : (
            <>
              <DayRecap day={day} onRebalance={() => updateDay((d) => mealActions.rebalance(d))} />
              {day.meals.map((meal, mi) => (
                <MealCard
                  key={meal.slot + mi}
                  meal={meal}
                  foods={allowedFoods}
                  cb={{
                    onRegenerate: () => updateDay((d) => mealActions.regenerate(d, mi, ctx())),
                    onToggleLock: () => updateDay((d) => mealActions.toggleLock(d, mi)),
                    onSelect: (vi) => updateDay((d) => mealActions.select(d, mi, vi)),
                    onQty: (ii, q) => updateDay((d) => mealActions.setQty(d, mi, ii, q)),
                    onFood: (ii, f) => updateDay((d) => mealActions.setFood(d, mi, ii, f)),
                    onRemove: (ii) => updateDay((d) => mealActions.remove(d, mi, ii)),
                    onAdd: (f) => updateDay((d) => mealActions.add(d, mi, f)),
                    onUnpin: () => updateDay((d) => mealActions.unpin(d, mi)),
                  }}
                />
              ))}
              <DayRecap day={day} onRebalance={() => updateDay((d) => mealActions.rebalance(d))} />
            </>
          )}

          <div className="card">
            <div className="row" style={{ marginBottom: panel ? 14 : 0 }}>
              <button className={'tab' + (panel === 'equiv' ? ' active' : '')} onClick={() => setPanel(panel === 'equiv' ? null : 'equiv')}>
                ⇄ Tableau d'équivalences
              </button>
              <button className={'tab' + (panel === 'courses' ? ' active' : '')} onClick={() => setPanel(panel === 'courses' ? null : 'courses')}>
                🛒 Liste de courses de la semaine
              </button>
            </div>
            {panel === 'equiv' && <EquivalencesPanel foods={allowedFoods} />}
            {panel === 'courses' && (
              <ShoppingPanel
                diet={diet}
                onChange={(tr, re) =>
                  update((d) => {
                    d.trainingDaysPerWeek = tr;
                    d.restDaysPerWeek = re;
                  })
                }
              />
            )}
          </div>

          <CopyPanel diet={diet} student={student} settings={settings} />

          <div className="card glow">
            <h2>Export PDF pour l'élève</h2>
            <div className="row">
              <label className="row small">
                Style
                <select value={pdf.theme} onChange={(e) => setPdf({ ...pdf, theme: e.target.value as PdfOptions['theme'] })}>
                  <option value="clair">Fond clair (impression)</option>
                  <option value="neon">Violet néon (fond sombre)</option>
                </select>
              </label>
              <label className="check">
                <input type="checkbox" checked={pdf.equivalences} onChange={(e) => setPdf({ ...pdf, equivalences: e.target.checked })} />
                Tableau d'équivalences
              </label>
              <label className="check">
                <input type="checkbox" checked={pdf.shopping} onChange={(e) => setPdf({ ...pdf, shopping: e.target.checked })} />
                Liste de courses
              </label>
              <div className="spacer" />
              <button
                className="btn primary"
                onClick={async () => {
                  if (diet.days.some((d) => !d.ok) && !confirm('Une journée est hors tolérance. Exporter quand même ?')) return;
                  // module PDF chargé à la demande : l'application démarre plus vite
                  const { exportDietPdf } = await import('../pdf/exportPdf');
                  exportDietPdf({ diet, student, settings, foods: allowedFoods, shopping: shoppingForDiet(diet), options: pdf });
                }}
              >
                ⬇ Télécharger le PDF
              </button>
            </div>
            <label className="field" style={{ marginTop: 12 }}>
              Message personnalisé pour l'élève (apparaît dans le PDF)
              <textarea value={diet.notes} onChange={(e) => update((d) => (d.notes = e.target.value))} placeholder="ex : Bravo pour ton mois, on garde le cap ! 💜" />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
