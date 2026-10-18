import { useState } from 'react';
import { db, resetFoods } from '../db/db';
import { normalize } from '../engine/filters';
import { CATEGORY_LABELS, ROLE_LABELS, TAG_LABELS } from '../engine/foods';
import { kcalOf } from '../engine/nutrition';
import type { Food, FoodCategory, FoodRole, FoodTag } from '../engine/types';
import { fmt0, fmt1, useFoods } from './hooks';

const EMPTY: Food = { id: '', name: '', category: 'viande', p: 0, c: 0, f: 0, tags: [], roles: [], custom: true };

const PRESETS: { label: string; food: Partial<Food> }[] = [
  { label: '+ Ma whey', food: { name: 'Whey isolate (ma marque)', category: 'complement', p: 90, c: 1.5, f: 0.5, tags: ['animal', 'laitier'], roles: ['post_proteine', 'prot_collation', 'prot_pdj'], min: 10, max: 60 } },
  { label: '+ Ma crème de riz', food: { name: 'Crème de riz (ma marque)', category: 'feculent', p: 7, c: 80, f: 1, tags: [], roles: ['pre_creme_riz', 'gluc_pdj'], min: 10, max: 120 } },
  { label: '+ Ma compote', food: { name: 'Compote (ma marque)', category: 'fruit', p: 0.3, c: 12, f: 0.2, tags: [], roles: ['post_compote', 'gluc_collation'], min: 50, max: 250 } },
];

export function FoodsPage() {
  const foods = useFoods();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<FoodCategory | ''>('');
  const [edit, setEdit] = useState<Food | null>(null);

  const list = (foods ?? [])
    .filter((f) => (!cat || f.category === cat) && normalize(f.name).includes(normalize(q)))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name, 'fr'));

  const save = async (f: Food) => {
    if (!f.name.trim()) return alert('Indique un nom.');
    const id = f.id || 'perso_' + normalize(f.name).replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString(36);
    await db.foods.put({ ...f, id });
    setEdit(null);
  };

  const remove = async (f: Food) => {
    if (confirm(`Supprimer « ${f.name} » de la base ? (les diètes déjà créées ne changent pas)`)) await db.foods.delete(f.id);
  };

  return (
    <div>
      <div className="page-head">
        <h1>Aliments</h1>
        <div className="row">
          {PRESETS.map((p) => (
            <button key={p.label} className="btn sm" onClick={() => setEdit({ ...EMPTY, ...p.food })}>
              {p.label}
            </button>
          ))}
          <button className="btn primary" onClick={() => setEdit({ ...EMPTY })}>
            + Nouvel aliment
          </button>
        </div>
      </div>

      <div className="banner warn">
        <strong>⚠ À vérifier :</strong> les valeurs nutritionnelles par défaut sont reprises et arrondies de la table <strong>CIQUAL (ANSES)</strong>, pour 100 g
        pesés <strong>crus / secs</strong>. Vérifie-les sur{' '}
        <a href="https://ciqual.anses.fr" target="_blank" rel="noreferrer">
          ciqual.anses.fr
        </a>{' '}
        et adapte-les aux marques que tes élèves utilisent (étiquettes). Les kcal sont toujours recalculées avec 4 / 4 / 9.
        Les féculents restent saisis pour 100 g <strong>crus</strong> : le coefficient de cuisson (ex. riz × 2,6) sert à afficher les quantités
        en poids cuit dans les diètes. Ces coefficients sont des moyennes, à vérifier aussi.
      </div>

      {edit && <FoodEditor food={edit} onCancel={() => setEdit(null)} onSave={save} />}

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <input placeholder="🔍 Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />
          <select value={cat} onChange={(e) => setCat(e.target.value as FoodCategory | '')}>
            <option value="">Toutes les catégories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <span className="small muted">{list.length} aliment(s)</span>
          <div className="spacer" />
          <button
            className="btn sm ghost"
            onClick={async () => {
              if (confirm('Remettre les aliments par défaut ? Tes aliments personnels sont conservés, tes modifications des aliments par défaut sont perdues.'))
                await resetFoods();
            }}
          >
            Réinitialiser la base par défaut
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Aliment (100 g)</th>
                <th>Catégorie</th>
                <th className="n">Prot.</th>
                <th className="n">Gluc.</th>
                <th className="n">Lip.</th>
                <th className="n">Kcal</th>
                <th>Tags</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id}>
                  <td>
                    {f.name}
                    {f.unitWeight && <span className="small faint"> · 1 {f.unitLabel} = {f.unitWeight} g</span>}
                    {f.cooked && <span className="small faint"> · cuit = cru × {fmt1(f.cooked)}</span>}
                    {f.custom && <span className="pill neon" style={{ marginLeft: 6 }}>perso</span>}
                  </td>
                  <td className="small muted">{CATEGORY_LABELS[f.category]}</td>
                  <td className="n">{fmt1(f.p)}</td>
                  <td className="n">{fmt1(f.c)}</td>
                  <td className="n">{fmt1(f.f)}</td>
                  <td className="n">{fmt0(kcalOf(f.p, f.c, f.f))}</td>
                  <td className="small faint">{f.tags.map((t) => TAG_LABELS[t]).join(', ')}</td>
                  <td className="n" style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn sm" onClick={() => setEdit({ ...f })}>
                      Modifier
                    </button>{' '}
                    <button className="btn sm icon danger" title="Supprimer" onClick={() => remove(f)}>
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

function FoodEditor({ food, onSave, onCancel }: { food: Food; onSave: (f: Food) => void; onCancel: () => void }) {
  const [f, setF] = useState<Food>(food);
  const toggle = <T extends string>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const num = (v: string) => (v === '' ? 0 : Number(v.replace(',', '.')));
  return (
    <div className="card glow">
      <h2>{food.id ? 'Modifier un aliment' : 'Nouvel aliment'}</h2>
      <div className="grid grid-4">
        <label className="field" style={{ gridColumn: 'span 2' }}>
          Nom
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </label>
        <label className="field">
          Catégorie
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as FoodCategory })}>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <div className="stat">
          <div className="label">Kcal / 100 g (4 / 4 / 9)</div>
          <div className="value">{fmt0(kcalOf(f.p, f.c, f.f))}</div>
        </div>
        <label className="field">
          Protéines / 100 g
          <input type="number" step="0.1" value={f.p} onChange={(e) => setF({ ...f, p: num(e.target.value) })} />
        </label>
        <label className="field">
          Glucides / 100 g
          <input type="number" step="0.1" value={f.c} onChange={(e) => setF({ ...f, c: num(e.target.value) })} />
        </label>
        <label className="field">
          Lipides / 100 g
          <input type="number" step="0.1" value={f.f} onChange={(e) => setF({ ...f, f: num(e.target.value) })} />
        </label>
        <label className="field">
          Poids d'une unité (g) — œuf, fruit entier
          <input
            type="number"
            value={f.unitWeight ?? ''}
            placeholder="vide = au gramme"
            onChange={(e) => setF({ ...f, unitWeight: e.target.value ? Number(e.target.value) : undefined, unitLabel: f.unitLabel ?? 'unité' })}
          />
        </label>
        {f.unitWeight && (
          <label className="field">
            Nom de l'unité
            <input value={f.unitLabel ?? ''} onChange={(e) => setF({ ...f, unitLabel: e.target.value })} />
          </label>
        )}
        <label className="field">
          Coefficient cuisson (poids cuit / poids cru)
          <input
            type="number"
            step="0.1"
            value={f.cooked ?? ''}
            placeholder="vide = pesé cru / sec"
            onChange={(e) => setF({ ...f, cooked: e.target.value === '' ? undefined : num(e.target.value) })}
          />
        </label>
        <label className="field">
          Quantité min ({f.unitWeight ? 'unités' : f.cooked ? 'g cuits' : 'g'})
          <input type="number" value={f.min ?? ''} placeholder="auto" onChange={(e) => setF({ ...f, min: e.target.value === '' ? undefined : Number(e.target.value) })} />
        </label>
        <label className="field">
          Quantité max ({f.unitWeight ? 'unités' : f.cooked ? 'g cuits' : 'g'})
          <input type="number" value={f.max ?? ''} placeholder="auto" onChange={(e) => setF({ ...f, max: e.target.value === '' ? undefined : Number(e.target.value) })} />
        </label>
      </div>
      <h3 style={{ marginTop: 16 }}>Tags (pour les filtres)</h3>
      <div className="row" style={{ gap: 2 }}>
        {(Object.keys(TAG_LABELS) as FoodTag[]).map((tag) => (
          <label key={tag} className={'check' + (f.tags.includes(tag) ? ' checked' : '')}>
            <input type="checkbox" checked={f.tags.includes(tag)} onChange={() => setF({ ...f, tags: toggle(f.tags, tag) })} />
            {TAG_LABELS[tag]}
          </label>
        ))}
      </div>
      <h3 style={{ marginTop: 16 }}>Utilisable dans les repas comme…</h3>
      <div className="row" style={{ gap: 2 }}>
        {(Object.keys(ROLE_LABELS) as FoodRole[]).map((r) => (
          <label key={r} className={'check' + (f.roles.includes(r) ? ' checked' : '')}>
            <input type="checkbox" checked={f.roles.includes(r)} onChange={() => setF({ ...f, roles: toggle(f.roles, r) })} />
            {ROLE_LABELS[r]}
          </label>
        ))}
      </div>
      <p className="small faint">Un aliment sans rôle reste disponible pour les modifications manuelles, mais n'est pas proposé automatiquement.</p>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn primary" onClick={() => onSave(f)}>
          Enregistrer
        </button>
        <button className="btn ghost" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </div>
  );
}
