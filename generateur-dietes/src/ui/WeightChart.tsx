import { useRef, useState } from 'react';
import type { WeightEntry } from '../engine/types';
import { fmt1, formatDate } from './hooks';

const W = 640;
const H = 240;
const PAD = { l: 44, r: 16, t: 14, b: 28 };

/** Courbe d'évolution du poids (une seule série : le titre de la carte la nomme). */
export function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  if (entries.length === 0) return <p className="muted">Ajoute une première pesée pour voir la courbe.</p>;

  const times = entries.map((e) => new Date(e.date).getTime());
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const ws = entries.map((e) => e.weight);
  let lo = Math.floor(Math.min(...ws) - 1);
  let hi = Math.ceil(Math.max(...ws) + 1);
  if (hi - lo < 4) {
    lo -= 1;
    hi += 1;
  }
  const x = (t: number) => PAD.l + (t1 === t0 ? (W - PAD.l - PAD.r) / 2 : ((t - t0) / (t1 - t0)) * (W - PAD.l - PAD.r));
  const y = (w: number) => PAD.t + (1 - (w - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const pts = entries.map((e, i) => ({ x: x(times[i]), y: y(e.weight), e }));
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);

  const onMove = (ev: React.MouseEvent) => {
    const svg = ref.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const mx = ((ev.clientX - r.left) / r.width) * W;
    let best = 0;
    pts.forEach((p, i) => Math.abs(p.x - mx) < Math.abs(pts[best].x - mx) && (best = i));
    setHover(best);
  };

  const h = hover !== null ? pts[hover] : null;
  return (
    <div style={{ position: 'relative' }}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label="Évolution du poids">
        <defs>
          <linearGradient id="wfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#B026FF" stopOpacity="0.28" />
            <stop offset="1" stopColor="#B026FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="rgba(199,125,255,0.10)" />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#8a76a8">
              {fmt1(t)}
            </text>
          </g>
        ))}
        <text x={PAD.l} y={H - 8} fontSize="11" fill="#8a76a8">
          {formatDate(entries[0].date)}
        </text>
        {entries.length > 1 && (
          <text x={W - PAD.r} y={H - 8} fontSize="11" fill="#8a76a8" textAnchor="end">
            {formatDate(entries[entries.length - 1].date)}
          </text>
        )}
        {pts.length > 1 && (
          <path d={`M${pts[0].x},${H - PAD.b} ` + pts.map((p) => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${H - PAD.b} Z`} fill="url(#wfill)" />
        )}
        <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#C77DFF" strokeWidth="2" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(176,38,255,0.8))' }} />
        {h && <line x1={h.x} x2={h.x} y1={PAD.t} y2={H - PAD.b} stroke="rgba(199,125,255,0.4)" strokeDasharray="3 3" />}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hover === i ? 6 : 4} fill="#C77DFF" stroke="#150b24" strokeWidth="2" />
        ))}
      </svg>
      {h && (
        <div className="chart-tooltip" style={{ left: `${(h.x / W) * 100}%`, top: `${(h.y / H) * 100}%` }}>
          <strong>{fmt1(h.e.weight)} kg</strong> <span className="muted">· {formatDate(h.e.date)}</span>
        </div>
      )}
    </div>
  );
}
