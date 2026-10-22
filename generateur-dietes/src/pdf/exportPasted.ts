import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PastedDiet } from '../engine/pasteParser';
import type { Settings } from '../engine/settings';
import { dateFr, drawFooters, drawLogoBanner, t, THEMES, type PdfLogo, type PdfTheme, type RGB } from './brand';

export interface PastedPdfInput {
  diet: PastedDiet;
  title: string;
  studentName: string;
  date: string; // AAAA-MM-JJ
  theme: PdfTheme;
  settings: Settings;
  logo: PdfLogo | null;
}

/** Met en page une diète écrite à la main (texte collé) : logo, journées, repas, aliments, notes. */
export function exportPastedPdf(input: PastedPdfInput): void {
  const { diet, theme, settings, logo } = input;
  const P = THEMES[theme];
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
  const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const para = (text: string, size = 10, color: RGB = P.muted, style: 'normal' | 'italic' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(t(text), W - 2 * M);
    ensure(lines.length * size * 0.42 + 2);
    doc.text(lines, M, y + size * 0.35);
    y += lines.length * size * 0.42 + 2;
  };
  const heading = (text: string, size: number, color: RGB) => {
    ensure(size * 0.5 + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    if (theme === 'neon') {
      doc.setTextColor(...P.accentSoft);
      doc.text(t(text), M + 0.3, y + size * 0.35 + 0.3);
    }
    doc.setTextColor(...color);
    doc.text(t(text), M, y + size * 0.35);
    y += size * 0.45 + 2;
  };

  // ---------------------------------------------------------------- en-tête
  paintBg();
  doc.setFillColor(...P.accentSoft);
  doc.rect(0, 0, W, 2.5, 'F');
  y = drawLogoBanner(doc, logo, 8);
  if (!logo) y = 16;
  const name = input.studentName.trim();
  const mainTitle = input.title.trim() || diet.title || 'Plan alimentaire';
  heading(name ? `${name} - ${mainTitle}` : mainTitle, 18, P.text);
  para(`Plan alimentaire personnalisé · le ${dateFr(input.date)}`, 10);
  for (const l of diet.intro) para(l, 10.5, P.text);
  y += 2;

  // ---------------------------------------------------------------- journées et repas
  diet.days.forEach((day, di) => {
    if (day.title || day.subtitle) {
      if (di > 0) newPage();
      heading(day.title || 'Journée', 16, P.accent);
      if (day.subtitle) para(day.subtitle, 10, P.muted, 'bold');
      y += 1;
    }
    for (const meal of day.meals) {
      const items = meal.items;
      ensure(16 + (Math.min(items.length, 10) + 1) * 7.5);
      const label = [meal.time, meal.title].filter(Boolean).join('  ·  ');
      if (label) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...P.text);
        doc.text(t(label), M, y + 4);
        y += 6;
      }
      if (items.length) {
        autoTable(doc, {
          theme: 'grid',
          startY: y,
          margin: { left: M, right: M, top: 22, bottom: 18 },
          styles: { font: 'helvetica', fontSize: 10, textColor: P.text, fillColor: P.row, lineColor: P.line, lineWidth: 0.15, cellPadding: 2 },
          headStyles: { fillColor: P.head, textColor: P.headText, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: P.rowAlt },
          head: [['Aliment', 'Quantité']],
          body: items.map((it) => {
            if (it.heading) return [{ content: t(it.name), colSpan: 2, styles: { fontStyle: 'bold', textColor: P.accent } }];
            return [t(it.alt ? `ou  ${it.name}` : it.name), t(it.qty)];
          }),
          columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 48, halign: 'right', fontStyle: 'bold' } },
          didParseCell: (data) => {
            const it = items[data.row.index];
            if (data.section === 'body' && it?.alt && data.column.index === 0) data.cell.styles.fontStyle = 'italic';
          },
          willDrawPage: (data) => {
            if (P.bg && data.pageNumber > 1) paintBg();
          },
        });
        y = lastY() + 2;
      }
      for (const n of meal.notes) para(n, 9.5, P.muted, 'italic');
      y += 3;
    }
  });

  // ---------------------------------------------------------------- conseils
  if (diet.notes.length) {
    ensure(30);
    y += 2;
    heading('Conseils', 15, P.accent);
    for (const n of diet.notes) para(`•  ${n}`, 10.5, P.text);
  }

  drawFooters(doc, P, settings, logo);
  const file = `BootyFlow_${name || 'diete'}_${input.date}.pdf`.replace(/\s+/g, '_');
  doc.save(t(file));
}
