import { useMemo, useRef, useState } from 'react';
import { dietToHtml, dietToText, type TextExportOptions } from '../engine/exportText';
import type { Settings } from '../engine/settings';
import { DAY_LABELS } from '../engine/targets';
import type { Diet, Student } from '../engine/types';
import { shoppingForDiet } from './ShoppingPanel';

/** Copie de la diète en texte (avec mise en forme pour Word / Google Docs) pour la mettre en page ailleurs. */
export function CopyPanel({ diet, student, settings }: { diet: Diet; student: Student; settings: Settings }) {
  const [opts, setOpts] = useState<TextExportOptions>({ macros: false, variants: true, shopping: false });
  const [copied, setCopied] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const shopping = useMemo(() => shoppingForDiet(diet), [diet]);
  const text = useMemo(() => dietToText(diet, student, settings, opts, shopping), [diet, student, settings, opts, shopping]);

  const flash = (msg: string) => {
    setCopied(msg);
    setTimeout(() => setCopied(null), 2500);
  };

  const copy = async () => {
    const html = dietToHtml(diet, student, settings, opts, shopping);
    try {
      if (window.ClipboardItem && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([text], { type: 'text/plain' }),
            'text/html': new Blob([html], { type: 'text/html' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      flash('✓ Copié ! Colle-le (Ctrl+V / Cmd+V) dans Canva, Word, Google Docs…');
    } catch {
      // navigateur qui bloque le presse-papiers : on sélectionne le texte pour une copie manuelle
      area.current?.select();
      const ok = document.execCommand?.('copy');
      flash(ok ? '✓ Copié !' : 'Texte sélectionné : fais Ctrl+C (ou Cmd+C) pour le copier.');
    }
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    a.download = `Diete_${student.firstName}_${diet.createdAt}.txt`.replace(/\s+/g, '_');
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const toggleDay = (i: number) => {
    const all = diet.days.map((_, k) => k);
    const cur = opts.days ?? all;
    const next = cur.includes(i) ? cur.filter((k) => k !== i) : [...cur, i].sort();
    setOpts({ ...opts, days: next.length === all.length ? undefined : next });
  };

  return (
    <div className="card glow">
      <h2>Copier la diète (texte)</h2>
      <p className="small muted" style={{ marginTop: -4 }}>
        Pour la mettre en page toi-même : copie le texte puis colle-le dans Canva, Word, Google Docs, Notion… Dans Word et Google Docs, les titres et
        tableaux sont conservés.
      </p>
      <div className="row" style={{ gap: 2, marginBottom: 10 }}>
        {diet.days.map((d, i) => (
          <label key={d.dayType} className={'check' + (!opts.days || opts.days.includes(i) ? ' checked' : '')}>
            <input type="checkbox" checked={!opts.days || opts.days.includes(i)} onChange={() => toggleDay(i)} />
            {DAY_LABELS[d.dayType]}
          </label>
        ))}
        <span className="faint">|</span>
        <label className={'check' + (opts.macros ? ' checked' : '')}>
          <input type="checkbox" checked={opts.macros} onChange={(e) => setOpts({ ...opts, macros: e.target.checked })} />
          Macros et kcal
        </label>
        <label className={'check' + (opts.variants ? ' checked' : '')}>
          <input type="checkbox" checked={opts.variants} onChange={(e) => setOpts({ ...opts, variants: e.target.checked })} />
          Variantes
        </label>
        <label className={'check' + (opts.shopping ? ' checked' : '')}>
          <input type="checkbox" checked={opts.shopping} onChange={(e) => setOpts({ ...opts, shopping: e.target.checked })} />
          Liste de courses
        </label>
      </div>
      <textarea ref={area} readOnly value={text} style={{ width: '100%', minHeight: 260, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 13 }} />
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn primary" onClick={copy}>
          📋 Copier le texte
        </button>
        <button className="btn" onClick={download}>
          ⬇ Télécharger en .txt
        </button>
        {copied && <span className="small" style={{ color: 'var(--good)' }}>{copied}</span>}
      </div>
    </div>
  );
}
