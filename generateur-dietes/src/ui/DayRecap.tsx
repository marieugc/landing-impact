import { dayTotals, TOLERANCE } from '../engine/generator';
import { macroPercents } from '../engine/nutrition';
import type { DayPlan } from '../engine/types';
import { fmt0, fmt1, signed } from './hooks';

export function DayRecap({ day, onRebalance }: { day: DayPlan; onRebalance: () => void }) {
  const tot = dayTotals(day);
  const t = day.target;
  const pct = macroPercents(tot);
  const rows = [
    { label: 'Calories', got: tot.kcal, target: t.kcalInput, unit: 'kcal', tol: TOLERANCE.kcal, pct: null as number | null },
    { label: 'Protéines', got: tot.p, target: t.p, unit: 'g', tol: TOLERANCE.macro, pct: pct.p },
    { label: 'Glucides', got: tot.c, target: t.c, unit: 'g', tol: TOLERANCE.macro, pct: pct.c },
    { label: 'Lipides', got: tot.f, target: t.f, unit: 'g', tol: TOLERANCE.macro, pct: pct.f },
  ];
  return (
    <div className="card glow">
      <div className="row" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Récapitulatif du jour</h2>
        <div className="spacer" />
        <span className={'status ' + (day.ok ? 'ok' : 'ko')}>
          <span className="dot" />
          {day.ok ? 'Dans la tolérance (±20 kcal, ±3 g)' : 'Hors tolérance'}
        </span>
        {!day.ok && (
          <button className="btn primary sm" onClick={onRebalance}>
            ⚖ Rééquilibrer la journée
          </button>
        )}
      </div>
      <div className="grid grid-4">
        {rows.map((r) => {
          const gap = r.got - r.target;
          const ok = Math.abs(gap) <= r.tol;
          return (
            <div key={r.label} className="stat">
              <div className="label">{r.label}</div>
              <div className="value">
                {r.unit === 'kcal' ? fmt0(r.got) : fmt1(r.got)} <span className="small muted">{r.unit}</span>
              </div>
              <div className="sub">
                cible {fmt0(r.target)} {r.unit} ·{' '}
                <span style={{ color: ok ? 'var(--good)' : 'var(--bad)', fontWeight: 600 }}>
                  écart {signed(gap, r.unit === 'kcal' ? 0 : 1)} {ok ? '✓' : '✗'}
                </span>
                {r.pct !== null && <> · {fmt0(r.pct)} % des kcal</>}
              </div>
            </div>
          );
        })}
      </div>
      {!day.ok && day.meals.some((m) => m.locked || m.variants[m.selected]?.items.some((i) => i.manual)) && (
        <p className="small faint" style={{ marginBottom: 0 }}>
          Les lignes modifiées à la main (✎) et les repas verrouillés ne sont pas touchés par le rééquilibrage. Si la journée reste hors tolérance, réduis
          la modification ou clique sur « Libérer mes modifications » dans le repas concerné.
        </p>
      )}
    </div>
  );
}
