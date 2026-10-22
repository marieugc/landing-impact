import { dayTotals } from './generator';
import { formatQty, itemMacros, variantMacros } from './nutrition';
import { weighingAdvice, type Settings } from './settings';
import type { ShoppingGroup } from './shopping';
import { DAY_LABELS, OBJECTIVE_LABELS, PHASE_LABELS } from './targets';
import type { DayPlan, Diet, Macros, MealItem, Student } from './types';

/** Options du texte copié pour la mise en page (Canva, Word, Google Docs, Notion…). */
export interface TextExportOptions {
  /** indices des journées à inclure (toutes si absent) */
  days?: number[];
  macros: boolean;
  variants: boolean;
  shopping: boolean;
}

// espaces insécables remplacées par des espaces simples : le texte se colle proprement partout
const plain = (s: string) => s.replace(/[\u202f\u00a0]/g, ' ');
const n1 = (x: number) => plain((Math.round(x * 10) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
const n0 = (x: number) => plain(Math.round(x).toLocaleString('fr-FR'));

function dateFr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

const macroLine = (m: Macros) => `${n0(m.kcal)} kcal · P ${n1(m.p)} g · G ${n1(m.c)} g · L ${n1(m.f)} g`;
const itemLabel = (it: MealItem) => `${it.food.name} : ${formatQty(it)}`;
const shortItem = (it: MealItem) => `${it.food.name} ${formatQty(it)}`;

function selectedDays(diet: Diet, o: TextExportOptions): DayPlan[] {
  return diet.days.filter((_, i) => !o.days || o.days.includes(i));
}

function shoppingQty(l: ShoppingGroup['lines'][number]): string {
  if (l.units) return `${l.units} (${l.grams} g)`;
  const q = l.grams >= 1000 ? `${plain((l.grams / 1000).toLocaleString('fr-FR'))} kg` : `${l.grams} g`;
  return l.food.weighedCooked ? `${q} (poids sec)` : q;
}

/** Diète en texte brut, prête à coller et à mettre en page. */
export function dietToText(
  diet: Diet,
  student: Student,
  settings: Settings,
  o: TextExportOptions,
  shopping: ShoppingGroup[] = [],
): string {
  const L: string[] = [];
  L.push(`BOOTY FLOW — Plan alimentaire de ${student.firstName}`);
  L.push(`${diet.title} · ${dateFr(diet.createdAt)}`);
  L.push(`${OBJECTIVE_LABELS[diet.objective]} · ${PHASE_LABELS[diet.phase]} · entraînement à ${diet.trainingTime.replace(':', 'h')}`);
  if (diet.notes.trim()) L.push('', diet.notes.trim());
  L.push('', weighingAdvice(settings), settings.pdfAdvice);

  for (const day of selectedDays(diet, o)) {
    const t = day.target;
    L.push('', '', `${DAY_LABELS[day.dayType].toUpperCase()} — ${n0(t.kcalInput)} kcal`);
    if (o.macros) L.push(`Objectif : P ${t.p} g · G ${t.c} g · L ${t.f} g`);
    for (const meal of day.meals) {
      const v = meal.variants[meal.selected];
      if (!v) continue;
      L.push('', `${meal.time} · ${meal.label}`);
      for (const it of v.items) {
        const m = itemMacros(it);
        L.push(o.macros ? `- ${itemLabel(it)} (P ${n1(m.p)} · G ${n1(m.c)} · L ${n1(m.f)} · ${n0(m.kcal)} kcal)` : `- ${itemLabel(it)}`);
      }
      if (o.macros) L.push(`Total du repas : ${macroLine(variantMacros(v))}`);
      if (o.variants) {
        meal.variants.forEach((ov, vi) => {
          if (vi !== meal.selected) L.push(`Ou variante ${vi + 1} : ${ov.items.map(shortItem).join(' + ')}`);
        });
      }
    }
    if (o.macros) L.push('', `TOTAL DU JOUR : ${macroLine(dayTotals(day))}`);
  }

  if (o.shopping && shopping.length) {
    L.push('', '', 'LISTE DE COURSES DE LA SEMAINE');
    L.push(`${diet.trainingDaysPerWeek} jour(s) training et ${diet.restDaysPerWeek} jour(s) repos`);
    for (const g of shopping) {
      L.push('', g.label);
      for (const l of g.lines) L.push(`- ${l.food.name} : ${shoppingQty(l)}`);
    }
  }
  return L.join('\n') + '\n';
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Même contenu en HTML (titres + tableaux) : Word, Google Docs et Notion gardent la mise en forme au collage. */
export function dietToHtml(
  diet: Diet,
  student: Student,
  settings: Settings,
  o: TextExportOptions,
  shopping: ShoppingGroup[] = [],
): string {
  const td = 'style="border:1px solid #d9c6f5;padding:4px 8px"';
  const tdr = 'style="border:1px solid #d9c6f5;padding:4px 8px;text-align:right"';
  const th = 'style="border:1px solid #d9c6f5;padding:4px 8px;background:#7b2cbf;color:#fff;text-align:left"';
  const H: string[] = [];
  H.push(`<h1 style="color:#b026ff">Booty Flow — Plan alimentaire de ${esc(student.firstName)}</h1>`);
  H.push(`<p><strong>${esc(diet.title)}</strong> · ${dateFr(diet.createdAt)}<br>${esc(OBJECTIVE_LABELS[diet.objective])} · ${esc(PHASE_LABELS[diet.phase])} · entraînement à ${esc(diet.trainingTime.replace(':', 'h'))}</p>`);
  if (diet.notes.trim()) H.push(`<p>${esc(diet.notes.trim()).replace(/\n/g, '<br>')}</p>`);
  H.push(`<p><em>${esc(weighingAdvice(settings))} ${esc(settings.pdfAdvice)}</em></p>`);

  for (const day of selectedDays(diet, o)) {
    const t = day.target;
    H.push(`<h2 style="color:#7b2cbf">${esc(DAY_LABELS[day.dayType])} — ${n0(t.kcalInput)} kcal</h2>`);
    if (o.macros) H.push(`<p>Objectif : P ${t.p} g · G ${t.c} g · L ${t.f} g</p>`);
    for (const meal of day.meals) {
      const v = meal.variants[meal.selected];
      if (!v) continue;
      H.push(`<h3>${esc(meal.time)} · ${esc(meal.label)}</h3>`);
      const head = o.macros
        ? `<tr><th ${th}>Aliment</th><th ${th}>Quantité</th><th ${th}>Protéines</th><th ${th}>Glucides</th><th ${th}>Lipides</th><th ${th}>Kcal</th></tr>`
        : `<tr><th ${th}>Aliment</th><th ${th}>Quantité</th></tr>`;
      const rows = v.items.map((it) => {
        const m = itemMacros(it);
        const base = `<td ${td}>${esc(it.food.name)}</td><td ${td}>${esc(formatQty(it))}</td>`;
        return o.macros ? `<tr>${base}<td ${tdr}>${n1(m.p)}</td><td ${tdr}>${n1(m.c)}</td><td ${tdr}>${n1(m.f)}</td><td ${tdr}>${n0(m.kcal)}</td></tr>` : `<tr>${base}</tr>`;
      });
      if (o.macros) {
        const m = variantMacros(v);
        rows.push(`<tr><td ${td}><strong>Total du repas</strong></td><td ${td}></td><td ${tdr}><strong>${n1(m.p)}</strong></td><td ${tdr}><strong>${n1(m.c)}</strong></td><td ${tdr}><strong>${n1(m.f)}</strong></td><td ${tdr}><strong>${n0(m.kcal)}</strong></td></tr>`);
      }
      H.push(`<table style="border-collapse:collapse">${head}${rows.join('')}</table>`);
      if (o.variants) {
        const alts = meal.variants
          .map((ov, vi) => (vi === meal.selected ? '' : `<li>Variante ${vi + 1} : ${esc(ov.items.map(shortItem).join(' + '))}</li>`))
          .filter(Boolean);
        if (alts.length) H.push(`<ul>${alts.join('')}</ul>`);
      }
    }
    if (o.macros) H.push(`<p><strong>Total du jour : ${macroLine(dayTotals(day))}</strong></p>`);
  }

  if (o.shopping && shopping.length) {
    H.push(`<h2 style="color:#7b2cbf">Liste de courses de la semaine</h2>`);
    for (const g of shopping) {
      H.push(`<h3>${esc(g.label)}</h3><ul>${g.lines.map((l) => `<li>${esc(l.food.name)} : ${esc(shoppingQty(l))}</li>`).join('')}</ul>`);
    }
  }
  return H.join('\n');
}
