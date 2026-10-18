import { shoppingList, type ShoppingGroup } from '../engine/shopping';
import { DAY_LABELS } from '../engine/targets';
import type { DayPlan, Diet } from '../engine/types';

export function weekPlan(diet: Diet): { day: DayPlan; count: number }[] {
  const tr = diet.trainingDaysPerWeek;
  const rest = diet.restDaysPerWeek;
  return diet.days.map((d) => {
    if (d.dayType === 'rest') return { day: d, count: rest };
    if (d.dayType === 'training') {
      // un jour refeed / rebond remplace un jour training de la semaine
      const special = diet.days.some((x) => x.dayType === 'refeed' || x.dayType === 'rebond') ? 1 : 0;
      return { day: d, count: Math.max(0, tr - special) };
    }
    return { day: d, count: tr > 0 ? 1 : 0 };
  });
}

export function shoppingForDiet(diet: Diet): ShoppingGroup[] {
  return shoppingList(weekPlan(diet));
}

export function ShoppingPanel({ diet, onChange }: { diet: Diet; onChange: (training: number, rest: number) => void }) {
  const plan = weekPlan(diet);
  const groups = shoppingForDiet(diet);
  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <label className="row small muted">
          Jours training
          <input className="num-input" type="number" min={0} max={7} value={diet.trainingDaysPerWeek} onChange={(e) => onChange(Number(e.target.value), diet.restDaysPerWeek)} />
        </label>
        <label className="row small muted">
          Jours repos
          <input className="num-input" type="number" min={0} max={7} value={diet.restDaysPerWeek} onChange={(e) => onChange(diet.trainingDaysPerWeek, Number(e.target.value))} />
        </label>
        <span className="small faint">{plan.map((p) => `${p.count} × ${DAY_LABELS[p.day.dayType].toLowerCase()}`).join(' · ')} (variantes sélectionnées). Féculents en poids sec à acheter.</span>
      </div>
      {groups.length === 0 && <p className="muted">Génère d'abord la diète.</p>}
      <div className="grid grid-3">
        {groups.map((g) => (
          <div key={g.category} className="stat">
            <div className="label" style={{ marginBottom: 6 }}>
              {g.label}
            </div>
            {g.lines.map((l) => (
              <div key={l.food.id + l.food.name} className="row small" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                <span>
                  ☐ {l.food.name}
                  {l.food.weighedCooked && <span className="faint"> (poids sec)</span>}
                </span>
                <span className="muted" style={{ whiteSpace: 'nowrap' }}>
                  {l.units ? `${l.units} (${l.grams} g)` : l.grams >= 1000 ? `${(l.grams / 1000).toLocaleString('fr-FR')} kg` : `${l.grams} g`}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
