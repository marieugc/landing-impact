import { CATEGORY_LABELS } from '../engine/foods';
import { formatQty, itemMacros, stepOf, variantMacros } from '../engine/nutrition';
import type { Food, FoodCategory, MealPlan } from '../engine/types';
import { fmt0, fmt1 } from './hooks';

export interface MealCallbacks {
  onRegenerate: () => void;
  onToggleLock: () => void;
  onSelect: (vi: number) => void;
  onQty: (ii: number, qty: number) => void;
  onFood: (ii: number, food: Food) => void;
  onRemove: (ii: number) => void;
  onAdd: (food: Food) => void;
  onUnpin: () => void;
}

export function FoodSelect({ foods, value, onChange, placeholder }: { foods: Food[]; value?: string; onChange: (f: Food) => void; placeholder?: string }) {
  const byCat = new Map<FoodCategory, Food[]>();
  for (const f of foods) byCat.set(f.category, [...(byCat.get(f.category) ?? []), f]);
  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const f = foods.find((x) => x.id === e.target.value);
        if (f) onChange(f);
      }}
      style={{ width: '100%', maxWidth: 300 }}
    >
      {!value && <option value="">{placeholder ?? 'Choisir…'}</option>}
      {[...byCat.entries()].map(([cat, list]) => (
        <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
          {list
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
            .map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}

export function MealCard({ meal, foods, cb }: { meal: MealPlan; foods: Food[]; cb: MealCallbacks }) {
  const v = meal.variants[meal.selected];
  const total = v ? variantMacros(v) : null;
  const hasManual = v?.items.some((i) => i.manual);
  const fixedFoods = meal.slot === 'pre' || meal.slot === 'post';
  return (
    <div className={'card' + (meal.locked ? ' locked' : '')}>
      <div className="meal-head">
        <span className="meal-time">{meal.time}</span>
        <span className="meal-title">{meal.label}</span>
        {meal.locked && <span className="pill" style={{ color: 'var(--warn)' }}>🔒 verrouillé</span>}
        <div className="spacer" />
        {meal.variants.length > 1 && (
          <div className="row" style={{ gap: 4 }}>
            {meal.variants.map((_, vi) => (
              <button key={vi} className={'btn sm' + (vi === meal.selected ? ' on' : ' ghost')} onClick={() => cb.onSelect(vi)} disabled={meal.locked}>
                Variante {vi + 1}
              </button>
            ))}
          </div>
        )}
        <button className="btn sm" onClick={cb.onRegenerate} disabled={meal.locked} title="Nouvelles propositions équivalentes en macros">
          ↻ Régénérer ce repas
        </button>
        <button className={'btn sm' + (meal.locked ? ' on' : '')} onClick={cb.onToggleLock}>
          {meal.locked ? '🔓 Déverrouiller' : '🔒 Verrouiller'}
        </button>
      </div>
      {fixedFoods && <p className="small faint" style={{ margin: '0 0 8px' }}>Aliments imposés, seules les quantités varient.</p>}
      {meal.variants.length > 0 && meal.variants.length < 3 && !fixedFoods && (
        <p className="small faint" style={{ margin: '0 0 8px' }}>
          Seulement {meal.variants.length} variante(s) trouvée(s) : le choix d'aliments compatibles est limité par les options.
        </p>
      )}
      {v && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Aliment</th>
                <th className="n">Quantité</th>
                <th className="n">Protéines</th>
                <th className="n">Glucides</th>
                <th className="n">Lipides</th>
                <th className="n">Kcal</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {v.items.map((it, ii) => {
                const m = itemMacros(it);
                return (
                  <tr key={ii}>
                    <td>
                      {meal.locked ? (
                        it.food.name
                      ) : (
                        <FoodSelect foods={foods.some((f) => f.id === it.food.id) ? foods : [...foods, it.food]} value={it.food.id} onChange={(f) => cb.onFood(ii, f)} />
                      )}
                      {it.manual && <span className="manual small" title="Modifié à la main : le rééquilibrage n'y touche pas"> ✎</span>}
                    </td>
                    <td className="n">
                      {meal.locked ? (
                        formatQty(it)
                      ) : (
                        <span className="row" style={{ justifyContent: 'flex-end', gap: 6, flexWrap: 'nowrap' }}>
                          <input
                            className="num-input"
                            type="number"
                            min={0}
                            step={stepOf(it.food)}
                            value={it.qty}
                            onChange={(e) => cb.onQty(ii, Number(e.target.value))}
                          />
                          <span className="small muted" style={{ width: 70, textAlign: 'left' }}>
                            {it.food.unitWeight ? `${it.food.unitLabel ?? 'unité'}(s)` : it.food.weighedCooked ? 'g cuit' : it.food.cooked ? 'g cru' : 'g'}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="n">{fmt1(m.p)}</td>
                    <td className="n">{fmt1(m.c)}</td>
                    <td className="n">{fmt1(m.f)}</td>
                    <td className="n">{fmt0(m.kcal)}</td>
                    <td className="n">
                      {!meal.locked && (
                        <button className="btn sm icon ghost" title="Retirer" onClick={() => cb.onRemove(ii)}>
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {total && (
                <tr className="total">
                  <td>Total du repas</td>
                  <td />
                  <td className="n">{fmt1(total.p)}</td>
                  <td className="n">{fmt1(total.c)}</td>
                  <td className="n">{fmt1(total.f)}</td>
                  <td className="n">{fmt0(total.kcal)}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {!meal.locked && (
        <div className="row" style={{ marginTop: 10 }}>
          <div style={{ width: 300 }}>
            <FoodSelect foods={foods} onChange={cb.onAdd} placeholder="+ Ajouter un aliment…" />
          </div>
          {hasManual && (
            <button className="btn sm ghost" onClick={cb.onUnpin} title="Le rééquilibrage pourra de nouveau ajuster ces lignes">
              Libérer mes modifications
            </button>
          )}
        </div>
      )}
    </div>
  );
}
