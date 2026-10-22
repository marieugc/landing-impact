import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { defaultRefGrams, EQUIVALENCE_GROUPS, equivalences } from '../engine/equivalences';
import { dayTotals } from '../engine/generator';
import { formatQty, itemMacros, macroPercents, variantMacros } from '../engine/nutrition';
import { weighingAdvice, type Settings } from '../engine/settings';
import type { ShoppingGroup } from '../engine/shopping';
import { DAY_LABELS, OBJECTIVE_LABELS, PHASE_LABELS } from '../engine/targets';
import type { Diet, Food, Student } from '../engine/types';
import { dateFr, drawFooters, drawLogoBanner, t, THEMES, type PdfLogo, type PdfTheme, type RGB } from './brand';

export interface PdfOptions {
  theme: PdfTheme;
  equivalences: boolean;
  shopping: boolean;
}

const n1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
const n0 = (x: number) => String(Math.round(x));

export function exportDietPdf(args: {
  diet: Diet;
  student: Student;
  settings: Settings;
  foods: Food[];
  shopping: ShoppingGroup[];
  options: PdfOptions;
  logo: PdfLogo | null;
}): void {
  const { diet, student, settings, foods, shopping, options, logo } = args;
  const P = THEMES[options.theme];
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  let y = 0;

  const paintBg = () => {
    if (P.bg) {
      doc.setFillColor(...P.bg);
      doc.rect(0, 0, W, H, 'F');
    }
  };
  const newPage = () => {
    doc.addPage();
    paintBg();
    y = 22;
  };
  const ensure = (h: number) => {
    if (y + h > H - 18) newPage();
  };
  const lastY = () => ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY ?? y) as number;

  const title = (text: string, size = 15) => {
    ensure(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    // effet de lueur : texte doublé légèrement décalé dans la teinte vive
    if (options.theme === 'neon') {
      doc.setTextColor(...P.accentSoft);
      doc.text(t(text), M + 0.3, y + 0.3);
    }
    doc.setTextColor(...P.accent);
    doc.text(t(text), M, y);
    y += size * 0.45 + 2;
  };
  const para = (text: string, size = 9.5, color: RGB = P.muted) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(t(text), W - 2 * M);
    ensure(lines.length * size * 0.42 + 2);
    doc.text(lines, M, y + size * 0.35);
    y += lines.length * size * 0.42 + 2;
  };

  const tableStyles = {
    theme: 'grid' as const,
    margin: { left: M, right: M, top: 22, bottom: 18 },
    styles: { font: 'helvetica', fontSize: 8.8, textColor: P.text, fillColor: P.row, lineColor: P.line, lineWidth: 0.15, cellPadding: 1.6 },
    headStyles: { fillColor: P.head, textColor: P.headText, fontStyle: 'bold' as const },
    alternateRowStyles: { fillColor: P.rowAlt },
    // nouvelle page créée par un tableau trop long : on repeint le fond sombre
    willDrawPage: (data: { pageNumber: number }) => {
      if (P.bg && data.pageNumber > 1) paintBg();
    },
  };

  // ---------------------------------------------------------------- en-tête (logo)
  paintBg();
  doc.setFillColor(...P.accentSoft);
  doc.rect(0, 0, W, 2.5, 'F');
  y = drawLogoBanner(doc, logo, 8);
  if (!logo) {
    y = 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(...P.accentSoft);
    doc.text('Booty Flow', M, y);
    y += 12;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...P.muted);
  doc.text(t(`Plan alimentaire personnalisé · le ${dateFr(diet.createdAt)}`), M, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...P.text);
  doc.text(t(`${student.firstName} - ${diet.title}`), M, y);
  y += 6;
  para(`${OBJECTIVE_LABELS[diet.objective]} · ${PHASE_LABELS[diet.phase]} · entraînement à ${diet.trainingTime.replace(':', 'h')}`, 10);

  if (diet.notes.trim()) {
    y += 1;
    para(diet.notes, 10.5, P.text);
  }

  // ---------------------------------------------------------------- objectifs
  y += 2;
  autoTable(doc, {
    ...tableStyles,
    startY: y,
    head: [['Journée', 'Calories', 'Protéines', 'Glucides', 'Lipides'].map(t)],
    body: diet.days.map((d) => [t(DAY_LABELS[d.dayType]), `${n0(d.target.kcalInput)} kcal`, `${d.target.p} g`, `${d.target.c} g`, `${d.target.f} g`]),
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
  });
  y = lastY() + 4;
  para(`${weighingAdvice(settings)} ${settings.pdfAdvice}`, 9);

  // ---------------------------------------------------------------- journées
  for (const day of diet.days) {
    newPage();
    title(`${DAY_LABELS[day.dayType]} - ${n0(day.target.kcalInput)} kcal`, 17);
    for (const meal of day.meals) {
      const v = meal.variants[meal.selected];
      if (!v) continue;
      // un petit tableau ne doit pas être coupé entre deux pages
      ensure(14 + (v.items.length + 2) * 7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(...P.text);
      doc.text(t(`${meal.time.replace('h', 'h')}  ·  ${meal.label}`), M, y + 3);
      y += 5;
      const tot = variantMacros(v);
      autoTable(doc, {
        ...tableStyles,
        startY: y,
        head: [['Aliment', 'Quantité', 'Protéines', 'Glucides', 'Lipides', 'Kcal'].map(t)],
        body: v.items.map((it) => {
          const m = itemMacros(it);
          return [t(it.food.name), t(formatQty(it)), n1(m.p), n1(m.c), n1(m.f), n0(m.kcal)];
        }),
        foot: [[t('Total du repas'), '', n1(tot.p), n1(tot.c), n1(tot.f), n0(tot.kcal)]],
        footStyles: { fillColor: P.total, textColor: P.text, fontStyle: 'bold' },
        showFoot: 'lastPage',
        columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 36 }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
      });
      y = lastY() + 2;
      const others = meal.variants.filter((_, i) => i !== meal.selected);
      others.forEach((ov, k) => {
        const line = ov.items.map((it) => `${it.food.name} ${formatQty(it)}`).join(' + ');
        para(`Ou variante ${k + 2} : ${line}`, 8.5);
      });
      y += 3;
    }
    const tot = dayTotals(day);
    const pc = macroPercents(tot);
    ensure(20);
    autoTable(doc, {
      ...tableStyles,
      startY: y,
      head: [['Total de la journée', 'Calories', 'Protéines', 'Glucides', 'Lipides'].map(t)],
      body: [
        [t('Total'), `${n0(tot.kcal)} kcal`, `${n1(tot.p)} g`, `${n1(tot.c)} g`, `${n1(tot.f)} g`],
        [t('Répartition des calories'), '', `${n0(pc.p)} %`, `${n0(pc.c)} %`, `${n0(pc.f)} %`],
      ],
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    });
    y = lastY() + 4;
  }

  // ---------------------------------------------------------------- équivalences
  if (options.equivalences) {
    newPage();
    title('Tableau d’équivalences', 17);
    para(`Pour varier : remplace un aliment par la quantité indiquée (même apport de la macro principale). ${weighingAdvice(settings)}`, 9);
    for (const g of EQUIVALENCE_GROUPS) {
      const pool = foods.filter((f) => f.roles.some((r) => g.roles.includes(r)));
      const ref = pool.find((f) => f.id === g.refId) ?? pool[0];
      if (!ref) continue;
      const refQty = defaultRefGrams(ref, g.refGrams);
      const eq = equivalences(ref, refQty, g.macro, pool);
      ensure(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...P.text);
      doc.text(t(`${g.title} : ${refQty} g${ref.weighedCooked ? ' cuits' : ''} de ${ref.name} =`), M, y + 3);
      y += 5;
      const half = Math.ceil(eq.length / 2);
      const rows = Array.from({ length: half }, (_, i) => {
        const a = eq[i];
        const b = eq[i + half];
        const q = (e: typeof a) => (e.units ? `${e.units} (${e.grams} g)` : `${e.grams} g${e.food.weighedCooked ? ' cuit' : ''}`);
        return [t(a.food.name), q(a), b ? t(b.food.name) : '', b ? q(b) : ''];
      });
      autoTable(doc, {
        ...tableStyles,
        startY: y,
        body: rows,
        columnStyles: { 1: { halign: 'right', cellWidth: 26 }, 3: { halign: 'right', cellWidth: 26 } },
      });
      y = lastY() + 5;
    }
  }

  // ---------------------------------------------------------------- liste de courses
  if (options.shopping && shopping.length) {
    newPage();
    title('Liste de courses de la semaine', 17);
    para(`${diet.trainingDaysPerWeek} jour(s) training et ${diet.restDaysPerWeek} jour(s) repos, quantités à acheter en poids cru / sec (féculents compris), arrondies à 10 g.`, 9);
    autoTable(doc, {
      ...tableStyles,
      startY: y,
      head: [['Rayon', 'Aliment', 'Quantité'].map(t)],
      body: shopping.flatMap((g) =>
        g.lines.map((l, i) => [
          i === 0 ? t(g.label) : '',
          t(l.food.name + (l.food.weighedCooked ? ' (poids sec)' : '')),
          l.units ? `${l.units} (${l.grams} g)` : l.grams >= 1000 ? `${(l.grams / 1000).toString().replace('.', ',')} kg` : `${l.grams} g`,
        ]),
      ),
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 2: { halign: 'right', cellWidth: 35 } },
    });
  }

  // ---------------------------------------------------------------- pied de page
  drawFooters(doc, P, settings, logo);

  const file = `BootyFlow_${student.firstName}_${diet.createdAt}.pdf`.replace(/\s+/g, '_');
  doc.save(t(file));
}
