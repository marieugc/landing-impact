import type { jsPDF } from 'jspdf';
import defaultLogoUrl from '../assets/logo-booty-flow.jpg';
import type { Settings } from '../engine/settings';

export type RGB = [number, number, number];
export type PdfTheme = 'clair' | 'neon';

export interface Palette {
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

export const THEMES: Record<PdfTheme, Palette> = {
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
export function t(s: string): string {
  return s
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'Oe')
    .replace(/[’‘]/g, "'")
    .replace(/[«»]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/…/g, '...')
    .replace(/≈/g, '~')
    .replace(/[−×]/g, (c) => (c === '×' ? 'x' : '-'))
    .replace(/[^\x20-\x7E -ÿ\n]/g, '');
}

export function dateFr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export interface PdfLogo {
  data: string;
  /** hauteur / largeur */
  ratio: number;
}

export const DEFAULT_LOGO_URL = defaultLogoUrl;

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image illisible'));
    img.src = src;
  });
}

/**
 * Convertit une image (PNG, WebP, JPEG…) en JPEG pour le PDF, réduite à 1200 px de large.
 * Les zones transparentes sont posées sur le fond sombre de la marque.
 */
export async function imageToJpegDataUrl(src: string, maxWidth = 1200): Promise<string> {
  const img = await loadImage(src);
  const scale = Math.min(1, maxWidth / img.naturalWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.fillStyle = '#0d0617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

export async function fileToLogo(file: File): Promise<string> {
  return imageToJpegDataUrl(await readAsDataUrl(file));
}

/** Logo à imprimer : celui des réglages, sinon le logo Booty Flow Coaching. */
export async function loadLogo(settings: Settings): Promise<PdfLogo | null> {
  try {
    const data = settings.logo || (await readAsDataUrl(await (await fetch(DEFAULT_LOGO_URL)).blob()));
    const img = await loadImage(data);
    return { data, ratio: img.naturalHeight / img.naturalWidth };
  } catch {
    return null;
  }
}

/** Grand logo centré en haut de la première page ; renvoie la position sous le logo. */
export function drawLogoBanner(doc: jsPDF, logo: PdfLogo | null, y: number, width = 110): number {
  if (!logo) return y;
  const W = doc.internal.pageSize.getWidth();
  const h = width * logo.ratio;
  doc.addImage(logo.data, 'JPEG', (W - width) / 2, y, width, h);
  return y + h + 6;
}

/** Pied de page (signature, numéro) et petit logo en haut à droite des pages suivantes. */
export function drawFooters(doc: jsPDF, P: Palette, settings: Settings, logo: PdfLogo | null): void {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    if (logo && i > 1) {
      const w = 26;
      doc.addImage(logo.data, 'JPEG', W - M - w, 4, w, w * logo.ratio);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...P.muted);
    const sign = [settings.coachName, settings.coachContact].filter(Boolean).join(' · ');
    doc.text(t(`Booty Flow Coaching · ${sign}`), M, H - 8);
    doc.text(`${i} / ${pages}`, W - M, H - 8, { align: 'right' });
    doc.setFillColor(...P.accentSoft);
    doc.rect(M, H - 12, W - 2 * M, 0.3, 'F');
  }
}
