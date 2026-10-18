import { useState } from 'react';
import { defaultRefGrams, EQUIVALENCE_GROUPS, equivalences } from '../engine/equivalences';
import type { Food, MacroKey } from '../engine/types';
import { FoodSelect } from './MealCard';

const MACRO_LABEL: Record<MacroKey, string> = { p: 'protéines', c: 'glucides', f: 'lipides' };

/** Tableau d'équivalences : même quantité de la macro principale. */
export function EquivalencesPanel({ foods }: { foods: Food[] }) {
  const [gi, setGi] = useState(0);
  const group = EQUIVALENCE_GROUPS[gi];
  const pool = foods.filter((f) => f.roles.some((r) => group.roles.includes(r)));
  const [refId, setRefId] = useState<string>(group.refId);
  const initial = (i: number) => {
    const g = EQUIVALENCE_GROUPS[i];
    const r = foods.find((f) => f.id === g.refId);
    return r ? defaultRefGrams(r, g.refGrams) : g.refGrams;
  };
  const [grams, setGrams] = useState<number>(() => initial(0));
  const ref = pool.find((f) => f.id === refId) ?? pool[0];

  const pick = (i: number) => {
    setGi(i);
    setRefId(EQUIVALENCE_GROUPS[i].refId);
    setGrams(initial(i));
  };

  return (
    <div>
      <div className="tabs">
        {EQUIVALENCE_GROUPS.map((g, i) => (
          <button key={g.title} className={'tab' + (i === gi ? ' active' : '')} onClick={() => pick(i)}>
            {g.title}
          </button>
        ))}
      </div>
      {!ref ? (
        <p className="muted">Aucun aliment compatible dans cette catégorie.</p>
      ) : (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            <input className="num-input" type="number" value={grams} onChange={(e) => setGrams(Number(e.target.value))} />
            <span>g{ref.weighedCooked ? ' cuits' : ''} de</span>
            <div style={{ width: 280 }}>
              <FoodSelect foods={pool} value={ref.id} onChange={(f) => setRefId(f.id)} />
            </div>
            <span className="muted">
              = {Math.round(((ref[group.macro] * grams) / 100) * 10) / 10} g de {MACRO_LABEL[group.macro]}, soit :
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Aliment</th>
                  <th className="n">Quantité équivalente</th>
                </tr>
              </thead>
              <tbody>
                {equivalences(ref, grams, group.macro, pool).map((e) => (
                  <tr key={e.food.id}>
                    <td>{e.food.name}</td>
                    <td className="n">
                      {e.units ? `${e.units} ${e.food.unitLabel ?? 'unité'}(s) (${e.grams} g)` : `${e.grams} g${e.food.weighedCooked ? ' cuit' : ''}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small faint">Équivalence sur la macro principale uniquement : les autres macros peuvent légèrement différer.</p>
        </>
      )}
    </div>
  );
}
