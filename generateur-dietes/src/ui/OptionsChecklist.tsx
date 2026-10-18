import type { DietOptions } from '../engine/types';

const CHECKS: { key: keyof DietOptions; label: string; hint?: string }[] = [
  { key: 'sansLactose', label: 'Sans lactose', hint: 'whey isolate autorisée' },
  { key: 'proteineVegetale', label: 'Protéine végétale au lieu de la whey' },
  { key: 'sansGluten', label: 'Sans gluten' },
  { key: 'vegetarien', label: 'Végétarienne' },
  { key: 'vegan', label: 'Vegan', hint: 'whey remplacée par une protéine végétale' },
  { key: 'sansPorc', label: 'Sans porc / halal' },
  { key: 'sansPoisson', label: 'Sans poisson / fruits de mer' },
  { key: 'sansOeufs', label: 'Sans œufs' },
  { key: 'sansFruitsACoque', label: 'Sans fruits à coque', hint: 'arachide incluse' },
  { key: 'antiInflammatoire', label: 'Anti-inflammatoire', hint: 'poissons gras, huile d’olive, légumes, pas de transformés' },
];

export function OptionsChecklist({ value, onChange }: { value: DietOptions; onChange: (o: DietOptions) => void }) {
  return (
    <div>
      <div className="grid grid-2" style={{ gap: 4 }}>
        {CHECKS.map((c) => (
          <label key={c.key} className={'check' + (value[c.key] ? ' checked' : '')}>
            <input type="checkbox" checked={Boolean(value[c.key])} onChange={(e) => onChange({ ...value, [c.key]: e.target.checked })} />
            <span>
              {c.label}
              {c.hint && <span className="faint small"> — {c.hint}</span>}
            </span>
          </label>
        ))}
      </div>
      <div className="grid grid-2" style={{ marginTop: 12 }}>
        <label className="field">
          Aliments refusés (séparés par des virgules)
          <textarea value={value.refuses} placeholder="ex : brocoli, saumon, avocat" onChange={(e) => onChange({ ...value, refuses: e.target.value })} />
        </label>
        <label className="field">
          Aliments préférés (le générateur les privilégie)
          <textarea value={value.preferes} placeholder="ex : poulet, patate douce, skyr" onChange={(e) => onChange({ ...value, preferes: e.target.value })} />
        </label>
      </div>
    </div>
  );
}

export function optionsSummary(o: DietOptions): string[] {
  const out = CHECKS.filter((c) => o[c.key]).map((c) => c.label);
  if (o.refuses.trim()) out.push('Refusés : ' + o.refuses.trim());
  if (o.preferes.trim()) out.push('Préférés : ' + o.preferes.trim());
  return out;
}
