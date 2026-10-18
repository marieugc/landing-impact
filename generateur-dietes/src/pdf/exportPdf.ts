import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { defaultRefGrams, EQUIVALENCE_GROUPS, equivalences } from '../engine/equivalences';
import { dayTotals } from '../engine/generator';
import { formatQty, itemMacros, macroPercents, variantMacros } from '../engine/nutrition';
import { weighingAdvice, type Settings } from '../engine/settings';
import type { ShoppingGroup } from '../engine/shopping';
import { DAY_LABELS, OBJECTIVE_LABELS, PHASE_LABELS } from '../engine/targets';
import type { Diet, Food, Student } from '../engine/types';

export interface PdfOptions {
  theme: 'clair' | 'neon';
  equivalences: boolean;
  shopping: boolean;
}

type RGB = [number, number, number];

interface Palette {
  bg: RGB | null;
  text: RGB;
  muted: RGB;
  accent: RGB;
  accentSoft: RGB;
  head: RGB;
  headText: RGB;
  row: RGB;
  rowAlt: RGB;
  total: RGB;
  line: RGB;
}

const THEMES: Record<PdfOptions['theme'], Palette> = {
  clair: {
    bg: null,
    text: [30, 18, 48],
    muted: [110, 92, 135],
    accent: [123, 44, 191],
    accentSoft: [176, 38, 255],
    head: [123, 44, 191],
    headText: [255, 255, 255],
    row: [255, 255, 255],
    rowAlt: [248, 242, 255],
    total: [236, 222, 255],
    line: [220, 200, 245],
  },
  neon: {
    bg: [13, 6, 23],
    text: [243, 232, 255],
    muted: [185, 166, 211],
    accent: [199, 125, 255],
    accentSoft: [176, 38, 255],
    head: [176, 38, 255],
    headText: [255, 255, 255],
    row: [21, 11, 36],
    rowAlt: [30, 16, 51],
    total: [55, 25, 90],
    line: [70, 40, 110],
  },
};

/** Les polices standard du PDF ne couvrent pas tous les caractères : on remplace les rares cas. */
function t(s: string): string {
  return s
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'Oe')
    .replace(/[’‘]/g, "'")
    .replace(/[«»]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/…/g, '...')
    .replace(/≈/g, '~')
    .replace(/−/g, '-')
    .replace(/[^\x20-\x7E -ÿ\n]/g, '');
}

const n1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
const n0 = (x: number) => String(Math.round(x));

function dateFr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function exportDietPdf(args: {
  diet: Diet;
  student: Student;
  settings: Settings;
  foods: Food[];
  shopping: ShoppingGroup[];
  options: PdfOptions;
}): void {
  const { diet, student, settings, foods, shopping, options } = args;
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
    y = 16;
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
    margin: { left: M, right: M, top: 16, bottom: 18 },
    styles: { font: 'helvetica', fontSize: 8.8, textColor: P.text, fillColor: P.row, lineColor: P.line, lineWidth: 0.15, cellPadding: 1.6 },
    headStyles: { fillColor: P.head, textColor: P.headText, fontStyle: 'bold' as const },
    alternateRowStyles: { fillColor: P.rowAlt },
    // nouvelle page créée par un tableau trop long : on repeint le fond sombre
    willDrawPage: (data: { pageNumber: number }) => {
      if (P.bg && data.pageNumber > 1) paintBg();
    },
  };

  // ---------------------------------------------------------------- en-tête
  paintBg();
  doc.setFillColor(...P.accentSoft);
  doc.rect(0, 0, W, 2.5, 'F');
  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  if (options.theme === 'neon') {
    doc.setTextColor(120, 30, 180);
    doc.text('Booty Flow', M + 0.6, y + 0.6);
  }
  doc.setTextColor(...P.accentSoft);
  doc.text('Booty Flow', M, y);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...P.muted);
  doc.text(t('Plan alimentaire personnalisé'), M, y + 7);
  doc.setFontSize(10);
  doc.text(t(`Le ${dateFr(diet.createdAt)}`), W - M, y, { align: 'right' });
  y += 18;
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
      ensure(30);
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
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...P.muted);
    const sign = [settings.coachName, settings.coachContact].filter(Boolean).join(' · ');
    doc.text(t(`Booty Flow · ${sign}`), M, H - 8);
    doc.text(`${i} / ${pages}`, W - M, H - 8, { align: 'right' });
    doc.setFillColor(...P.accentSoft);
    doc.rect(M, H - 12, W - 2 * M, 0.3, 'F');
  }

  const file = `BootyFlow_${student.firstName}_${diet.createdAt}.pdf`.replace(/\s+/g, '_');
  doc.save(t(file));
}
