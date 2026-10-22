import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../db/db';
import { countItems, parsePastedDiet } from '../engine/pasteParser';
import { DEFAULT_LOGO_URL, type PdfTheme } from '../pdf/brand';
import { todayISO, useSettings } from './hooks';

const DRAFT_KEY = 'bootyflow-diete-collee';

const EXEMPLE = `Diète sèche – semaine 3

Jour training (1850 kcal)
P 130 g / G 200 g / L 55 g

Petit-déjeuner (8h) :
- 150 g de skyr nature
- 40 g flocons d'avoine
- 1 banane
- 15 g amandes

Repas du midi (12h30)
Riz basmati 180 g cuit
Blanc de poulet : 130 g
Légumes verts à volonté
1 c. à soupe d'huile d'olive

Collation pré-training : 50 g crème de riz + 1 banane
Post-training : 30 g whey + 1 compote

Dîner (20h)
- 150 g cabillaud ou 120 g saumon
- 200 g patate douce cuite
- Légumes à volonté

Jour repos (1650 kcal)

Petit déj : 3 œufs + 2 tranches pain complet + 1/2 avocat
Déjeuner : 150 g dinde, 150 g quinoa cuit, 10 g huile de colza
Collation : 200 g fromage blanc 0% + 100 g fruits rouges + 10 g noix
Dîner : 150 g steak haché 5% + 250 g pommes de terre cuites

Conseils :
Boire 2 L d'eau par jour.
Pesée à jeun le lundi matin.`;

function readDraft(): { text: string; name: string; title: string } {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // navigation privée ou stockage bloqué : on repart d'un brouillon vide
  }
  return { text: '', name: '', title: '' };
}

/** Coller une diète écrite à la main : elle est mise en page avec le logo, en PDF. */
export function PastePage({ studentId }: { studentId: number | null }) {
  const settings = useSettings();
  const students = useLiveQuery(() => db.students.toArray(), []);
  const [draft, setDraft] = useState(readDraft);
  const [date, setDate] = useState(todayISO());
  const [theme, setTheme] = useState<PdfTheme>('clair');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    db.students.get(studentId).then((s) => s && setDraft((d) => ({ ...d, name: s.firstName })));
  }, [studentId]);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // brouillon non sauvegardé : sans conséquence
    }
  }, [draft]);

  const parsed = useMemo(() => parsePastedDiet(draft.text), [draft.text]);
  const nbItems = countItems(parsed);
  const nbMeals = parsed.days.reduce((n, d) => n + d.meals.length, 0);
  const title = draft.title.trim() || parsed.title || 'Plan alimentaire';
  const logoSrc = settings?.logo || DEFAULT_LOGO_URL;

  const exportPdf = async () => {
    if (!settings) return;
    setBusy(true);
    try {
      const [{ exportPastedPdf }, { loadLogo }] = await Promise.all([import('../pdf/exportPasted'), import('../pdf/brand')]);
      exportPastedPdf({ diet: parsed, title, studentName: draft.name, date, theme, settings, logo: await loadLogo(settings) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Mettre en page une diète</h1>
        <a className="btn ghost" href="#/reglages">
          🖼️ Changer mon logo
        </a>
      </div>
      <div className="banner info">
        Colle le texte d'une diète que tu as écrite (Notes, Word, WhatsApp…). Le logiciel reconnaît les journées, les repas, les aliments et leurs
        quantités, puis la met en page avec ton logo. Tu n'as rien à reformater : un repas par titre, un aliment par ligne ou séparés par « + ».
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="grid grid-2">
            <label className="field">
              Prénom de l'élève
              <input list="eleves" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="ex : Julie" />
              <datalist id="eleves">
                {(students ?? []).map((s) => (
                  <option key={s.id} value={s.firstName} />
                ))}
              </datalist>
            </label>
            <label className="field">
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>
          <label className="field" style={{ marginTop: 10 }}>
            Titre (sinon la première ligne du texte)
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={parsed.title || 'Plan alimentaire'} />
          </label>
          <label className="field" style={{ marginTop: 10 }}>
            Texte de la diète
            <textarea
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              spellCheck={false}
              placeholder={EXEMPLE}
              style={{ width: '100%', minHeight: 460, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 13 }}
            />
          </label>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn sm ghost" onClick={() => setDraft({ ...draft, text: EXEMPLE })}>
              Voir un exemple
            </button>
            <button className="btn sm ghost" onClick={() => confirm('Effacer le texte ?') && setDraft({ text: '', name: '', title: '' })}>
              Effacer
            </button>
          </div>
        </div>

        <div>
          <div className="card glow">
            <div className="row">
              <span className="small muted">
                {parsed.days.filter((d) => d.title).length || (nbMeals ? 1 : 0)} journée(s) · {nbMeals} repas · {nbItems} aliment(s)
              </span>
              <div className="spacer" />
              <select value={theme} onChange={(e) => setTheme(e.target.value as PdfTheme)}>
                <option value="clair">Fond clair (impression)</option>
                <option value="neon">Violet néon (fond sombre)</option>
              </select>
              <button className="btn primary" onClick={exportPdf} disabled={!nbItems || busy}>
                {busy ? 'Création…' : '⬇ Télécharger le PDF'}
              </button>
            </div>
          </div>

          {!draft.text.trim() ? (
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>
                L'aperçu apparaît ici dès que tu colles ton texte. Clique sur « Voir un exemple » pour essayer.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <img src={logoSrc} alt="Logo" style={{ width: '100%', display: 'block' }} />
              <div style={{ padding: '16px 20px' }}>
                <h2 style={{ marginBottom: 2 }}>{draft.name.trim() ? `${draft.name.trim()} — ${title}` : title}</h2>
                {parsed.intro.map((l, i) => (
                  <p key={i} className="small" style={{ margin: '4px 0' }}>
                    {l}
                  </p>
                ))}
                {nbItems === 0 && (
                  <div className="banner warn" style={{ marginTop: 10 }}>
                    Aucun aliment reconnu pour l'instant. Écris un aliment par ligne avec sa quantité (ex : « 150 g de skyr » ou « riz 180 g cuit »).
                  </div>
                )}
                {parsed.days.map((day, di) => (
                  <div key={di} style={{ marginTop: 14 }}>
                    {(day.title || day.subtitle) && (
                      <div style={{ marginBottom: 8 }}>
                        <h3 style={{ margin: 0, color: 'var(--neon-soft)', fontSize: 18 }}>{day.title || 'Journée'}</h3>
                        {day.subtitle && <span className="pill neon">{day.subtitle}</span>}
                      </div>
                    )}
                    {day.meals.map((meal, mi) => (
                      <div key={mi} className="stat" style={{ marginBottom: 10 }}>
                        {(meal.title || meal.time) && (
                          <div className="row" style={{ marginBottom: 6 }}>
                            {meal.time && <span className="meal-time">{meal.time}</span>}
                            <strong>{meal.title}</strong>
                          </div>
                        )}
                        <table>
                          <tbody>
                            {meal.items.map((it, ii) =>
                              it.heading ? (
                                <tr key={ii}>
                                  <td colSpan={2} style={{ color: 'var(--neon-soft)', fontWeight: 700 }}>
                                    {it.name}
                                  </td>
                                </tr>
                              ) : (
                                <tr key={ii}>
                                  <td style={it.alt ? { fontStyle: 'italic' } : undefined}>
                                    {it.alt && <span className="faint">ou </span>}
                                    {it.name}
                                  </td>
                                  <td className="n" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {it.qty || <span className="faint">—</span>}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                        {meal.notes.map((n, k) => (
                          <p key={k} className="small muted" style={{ margin: '6px 0 0', fontStyle: 'italic' }}>
                            {n}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
                {parsed.notes.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <h3 style={{ color: 'var(--neon-soft)' }}>Conseils</h3>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {parsed.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          <p className="small faint">Si une ligne est mal rangée, corrige-la dans le texte : l'aperçu se met à jour tout de suite.</p>
        </div>
      </div>
    </div>
  );
}
