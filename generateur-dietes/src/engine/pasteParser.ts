/**
 * Lecture d'une diète écrite à la main (texte collé) pour la mettre en page.
 * Reconnaît : titre, journées (training / repos…), repas (petit-déjeuner, collation…),
 * aliments avec quantité (« 150 g de skyr », « riz cuit 200g », « 2 œufs »),
 * alternatives (« ou 170 g de cabillaud ») et notes.
 */

export interface PastedItem {
  name: string;
  qty: string;
  /** sous-titre dans un repas (« Porridge : … ») */
  heading?: boolean;
  /** alternative de l'aliment précédent (« ou … ») */
  alt?: boolean;
}

export interface PastedMeal {
  title: string;
  time: string;
  items: PastedItem[];
  notes: string[];
}

export interface PastedDay {
  title: string;
  subtitle: string;
  meals: PastedMeal[];
}

export interface PastedDiet {
  title: string;
  intro: string[];
  days: PastedDay[];
  notes: string[];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/[’`]/g, "'")
    .trim();

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** puces, numéros, émojis et symboles en début de ligne */
const BULLET = /^(?:[-–—•*·→>✓✔☐▪▫◦»]|\p{Extended_Pictographic}|️|\s)+/u;
const NUMBERING = /^\d{1,2}\s*[.)]\s+/;

const UNIT =
  '(?:kg|g|gr|grs|grammes?|ml|cl|l|litres?|c\\.?\\s?[aà]\\.?\\s?s\\.?|c\\.?\\s?[aà]\\.?\\s?c\\.?|cs|cc|c[aà]s|c[aà]c|(?:oe|œ)ufs?|blancs?\\s+d[e\\x27’]\\s*(?:oe|œ)ufs?|c\\.?\\s?(?:a|à)\\s?(?:soupe|cafe|café)|cuill?(?:e|è)res?\\s+(?:a|à)\\s+(?:soupe|cafe|café)|tranches?|pots?|scoops?|doses?|mesurettes?|poign(?:e|é)es?|pinc(?:e|é)es?|unit(?:e|é)s?|verres?|bols?|tasses?|sachets?|carr(?:e|é)s?|portions?|g(?:e|é)lules?|comprim(?:e|é)s?|capsules?|barres?|galettes?|biscottes?|morceaux?|filets?|steaks?|boites?|boîtes?)';
const NUM = '\\d+(?:[.,]\\d+)?(?:\\s*(?:-|à|a|/)\\s*\\d+(?:[.,]\\d+)?)?';
/** quantité en tête : « 150 g de riz », « 2 œufs », « 1/2 avocat » */
const QTY_START = new RegExp(`^(${NUM}|1/2|½|¼|¾)\\s*(${UNIT})?\\.?(?=\\s|$)\\s*(?:de\\s+|d'\\s*|d’\\s*)?(.*)$`, 'i');
/** quantité en fin : « riz basmati 150g cuit », « skyr : 150 g », « flocons (40 g) » */
const QTY_END = new RegExp(`^(.*?)[\\s:=–—-]*\\(?\\s*(${NUM})\\s*(${UNIT})\\.?\\s*\\)?\\s*\\(?\\s*((?:crus?|crues?|cuits?|cuites?|secs?|s(?:e|è)ches?|pes(?:e|é)e?s?\\s+[^\\s)]+|égoutté?e?s?)?)\\s*\\)?\\s*$`, 'i');
const NOUN_UNIT = /^(?:steaks?|filets?|barres?|galettes?|biscottes?|morceaux?|(?:oe|œ)ufs?|blancs?\s+d.*)$/i;
const WORD_NUM: Record<string, string> = { un: '1', une: '1', deux: '2', trois: '3', quatre: '4', cinq: '5', six: '6', demi: '1/2', 'demie': '1/2' };
const QTY_TIMES = /^(.*?)\s*[x×]\s*(\d+)\s*$/i;
const HAS_QTY = new RegExp(`(?:^|\\s|\\()(?:${NUM})\\s*${UNIT}\\b|^\\s*(?:${NUM}|1/2|½)\\s+\\S|[x×]\\s*\\d+\\s*$`, 'i');

const MEAL =
  /^(?:repas\s*(?:n\s*°?\s*)?\d+|petit[\s-]*d[eé]j(?:euner)?|p'?tit[\s-]*d[eé]j|breakfast|d[eé]jeuner|repas\s+(?:du\s+)?(?:midi|soir|matin)|midi|d[iî]ner|dinner|souper|soir|collation(?:s)?(?:\s+\S+){0,3}|en[\s-]?cas|snack|go[uû]ter|pr[eé][\s-]*(?:training|entra[iî]nement|workout|s[eé]ance|trainig)|post[\s-]*(?:training|entra[iî]nement|workout|s[eé]ance)|avant\s+(?:l'|le\s+|la\s+)?(?:entra[iî]nement|s[eé]ance|training|sport)|apr[eè]s\s+(?:l'|le\s+|la\s+)?(?:entra[iî]nement|s[eé]ance|training|sport)|intra[\s-]*(?:training|workout|s[eé]ance)?|matin|apr[eè]s[\s-]*midi|coucher|avant\s+(?:de\s+)?dormir|au\s+r[eé]veil|r[eé]veil|compl[eé]ments?|suppl[eé]ments?|repas\s+libre|cheat\s*meal)\b/i;
const DAY =
  /^(?:jours?|journ[eé]es?|j\s*(?:on|off)\b|(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b|training\b|repos\b|refeed\b|rebond\b|semaine\b|day\b|on\s*day|off\s*day)/i;
const NOTES = /^(?:notes?|conseils?|remarques?|important|[aà]\s+savoir|consignes?|hydratation|rappels?|infos?|informations?)\b/i;
const MACRO_LINE = /\b(?:kcal|calories?|prot[eé]ines?|glucides?|lipides?|macros?)\b|^\s*[PGLC]\s*:?\s*\d+/i;
const TIME = /\(?\b(\d{1,2})\s*(?:h|:)\s*(\d{2})?\b\)?/i;

function stripLine(l: string): { text: string; bullet: boolean } {
  const bullet = BULLET.test(l) && /^[-–—•*·→>✓✔☐▪▫◦»]/u.test(l.trim());
  const text = l.replace(BULLET, '').replace(NUMBERING, '').trim();
  return { text, bullet };
}

function tidyQty(num: string, unit: string, tail = ''): string {
  let n = num.replace(/\s*(?:-|à|a)\s*/, '-').replace(/\s+/g, '');
  let u = (unit || '').toLowerCase().replace(/\.$/, '');
  if (/^(gr|grs|grammes?)$/.test(u)) u = 'g';
  if (/^(c\.?\s?[aà]\.?\s?s\.?|cs|c[aà]s)$/.test(u) || /soupe/.test(u)) u = 'c. à soupe';
  if (/^(c\.?\s?[aà]\.?\s?c\.?|cc|c[aà]c)$/.test(u) || /caf/.test(u)) u = 'c. à café';
  if (/^(oe|œ)ufs?$/.test(u)) u = 'œufs';
  n = n.replace('.', ',');
  const q = u ? `${n} ${u}` : n;
  return clean(tail ? `${q} ${tail.toLowerCase()}` : q);
}

/** Un aliment : « 150 g de skyr » -> { name: 'Skyr', qty: '150 g' }. */
export function parseItem(raw: string): PastedItem {
  let text = clean(raw.replace(BULLET, '').replace(NUMBERING, '').replace(/[;,.]+$/, ''));
  // « une pomme », « deux œufs », « demi avocat »
  text = text.replace(/^(une?|deux|trois|quatre|cinq|six|demie?)\s+(?=\S)/i, (_w, n: string) => `${WORD_NUM[n.toLowerCase()]} `);
  let m = QTY_END.exec(text);
  if (m && m[1].trim() && !/^\d/.test(m[1].trim())) {
    return { name: cap(clean(m[1].replace(/[:=–—-]+$/, ''))), qty: tidyQty(m[2], m[3], m[4]) };
  }
  m = QTY_START.exec(text);
  if (m && !m[3] && m[2] && NOUN_UNIT.test(m[2])) return { name: cap(clean(m[2])), qty: tidyQty(m[1], '') };
  if (m && m[3]) {
    let unit = m[2] ?? '';
    // « 2 steaks hachés » : l'unité est en fait l'aliment
    if (unit && NOUN_UNIT.test(unit) && !/^(?:de|d['’])/i.test(text.slice(text.toLowerCase().indexOf(unit.toLowerCase()) + unit.length).trim())) {
      return { name: cap(clean(`${unit} ${m[3]}`)), qty: tidyQty(m[1], '') };
    }
    unit = unit ?? '';
    let name = clean(m[3]);
    let tail = '';
    const t = /\s+((?:crus?|crues?|cuits?|cuites?|secs?|s[eè]ches?)\b.*)$/i.exec(name);
    if (unit && t && t.index > 0) {
      tail = t[1];
      name = name.slice(0, t.index);
    }
    return { name: cap(name), qty: tidyQty(m[1].replace('½', '1/2').replace('¼', '1/4').replace('¾', '3/4'), unit, tail) };
  }
  m = QTY_TIMES.exec(text);
  if (m && m[1]) return { name: cap(clean(m[1])), qty: `× ${m[2]}` };
  return { name: cap(text), qty: '' };
}

const hasQty = (s: string) => HAS_QTY.test(s.trim());

/** Une ligne peut contenir plusieurs aliments (« 40 g flocons + 150 g skyr ») et des alternatives (« ou … »). */
export function parseItems(line: string): PastedItem[] {
  let text = line.trim();
  let altFirst = false;
  const ou = /^\(?\s*(?:ou|or)\b\s*:?\s*/i.exec(text);
  if (ou) {
    altFirst = true;
    text = text.slice(ou[0].length).replace(/\)\s*$/, '');
  }
  const out: PastedItem[] = [];
  // « Porridge : 50 g flocons + 200 ml lait » -> sous-titre « Porridge » puis les aliments
  const label = /^([^:\d]{2,40}?)\s*:\s*(.+)$/.exec(text);
  if (label && !hasQty(label[1]) && (/\+/.test(label[2]) || (QTY_START.exec(label[2])?.[3] ?? '') !== '')) {
    out.push({ name: cap(clean(label[1])), qty: '', heading: true });
    text = label[2];
  }
  const parts = text.split(/\s*\+\s*/).filter(Boolean);
  for (const part of parts) {
    // « 150 g poulet ou 170 g cabillaud » / « 150 g poulet / 170 g cabillaud »
    const options = part.split(/\s+(?:ou|or)\s+|\s+\/\s+/i).filter(Boolean);
    const splitOk = options.length > 1 && options.every(hasQty);
    const chunks = splitOk ? options : [part];
    chunks.forEach((c, i) => {
      // « 150 g skyr, 30 g flocons » : virgules seulement si chaque morceau a une quantité
      const sub = c.split(/\s*[,;]\s*/).filter(Boolean);
      const pieces = sub.length > 1 && sub.every(hasQty) ? sub : [c];
      pieces.forEach((p, k) => {
        const it = parseItem(p);
        if (!it.name && !it.qty) return;
        if ((i > 0 && k === 0) || (altFirst && !out.some((o) => !o.heading))) it.alt = true;
        out.push(it);
      });
    });
  }
  return out;
}

function isMealHeader(text: string): boolean {
  const n = norm(text).replace(TIME, '').replace(/^[\s:–—-]+/, '');
  return MEAL.test(n);
}

function isDayHeader(text: string): boolean {
  const n = norm(text);
  if (hasQty(text) && !MACRO_LINE.test(text)) return false;
  return DAY.test(n);
}

function splitHeader(text: string): { head: string; rest: string } {
  const i = text.search(/\s*:\s*|\s+[–—-]\s+(?=\d)/);
  if (i < 0) return { head: text, rest: '' };
  const m = /\s*:\s*|\s+[–—-]\s+/.exec(text.slice(i)) as RegExpExecArray;
  return { head: text.slice(0, i), rest: text.slice(i + m[0].length) };
}

function mealFromHeader(text: string): { meal: PastedMeal; rest: string } {
  const { head, rest } = splitHeader(text);
  let title = head;
  let time = '';
  const t = TIME.exec(title);
  if (t) {
    time = `${t[1].padStart(2, '0')}h${t[2] ?? '00'}`;
    title = title.replace(t[0], ' ');
  }
  title = clean(title.replace(/^[\s:–—-]+|[\s:–—-]+$/g, '').replace(/\(\s*\)/g, ''));
  return { meal: { title: cap(title), time, items: [], notes: [] }, rest };
}

function dayFromHeader(text: string): PastedDay {
  const { head, rest } = splitHeader(text);
  let title = head;
  let subtitle = rest;
  const par = /\(([^)]*)\)/.exec(title);
  if (par && MACRO_LINE.test(par[1])) {
    subtitle = clean(`${par[1]} ${subtitle}`);
    title = title.replace(par[0], '');
  }
  const k = /[–—-]\s*(\d[\d\s]*kcal.*)$/i.exec(title);
  if (k) {
    subtitle = clean(`${k[1]} ${subtitle}`);
    title = title.slice(0, k.index);
  }
  return { title: cap(clean(title.replace(/[\s:–—-]+$/, ''))), subtitle: clean(subtitle), meals: [] };
}

/** Lit le texte collé et renvoie la structure de la diète. */
export function parsePastedDiet(input: string): PastedDiet {
  const res: PastedDiet = { title: '', intro: [], days: [], notes: [] };
  let day: PastedDay | null = null;
  let meal: PastedMeal | null = null;
  let inNotes = false;
  let pendingAlt = false;

  const ensureDay = () => {
    if (!day) {
      day = { title: '', subtitle: '', meals: [] };
      res.days.push(day);
    }
    return day;
  };
  const ensureMeal = () => {
    if (!meal) {
      meal = { title: '', time: '', items: [], notes: [] };
      ensureDay().meals.push(meal);
    }
    return meal;
  };

  const lines = input.replace(/\r/g, '').split('\n');
  for (const rawLine of lines) {
    const { text, bullet } = stripLine(rawLine);
    if (!text) continue;
    if (/^[-=_*~.]{3,}$/.test(text)) continue; // séparateurs

    if (/^(?:ou|or)$/i.test(text)) {
      pendingAlt = true;
      continue;
    }

    // titre : première ligne sans quantité ni en-tête reconnu
    if (!res.title && !day && !meal && !inNotes && !hasQty(text) && !isMealHeader(text) && !isDayHeader(text) && !NOTES.test(norm(text))) {
      res.title = clean(text.replace(/[:\s]+$/, ''));
      continue;
    }

    if (NOTES.test(norm(text)) && !hasQty(text)) {
      inNotes = true;
      meal = null;
      const { rest } = splitHeader(text);
      if (rest) res.notes.push(rest);
      continue;
    }

    if (isDayHeader(text) && !isMealHeader(text)) {
      inNotes = false;
      meal = null;
      day = dayFromHeader(text);
      res.days.push(day);
      continue;
    }

    if (isMealHeader(text) && !(bullet && hasQty(text) && !/:/.test(text))) {
      inNotes = false;
      const { meal: m, rest } = mealFromHeader(text);
      meal = m;
      ensureDay().meals.push(m);
      if (rest) m.items.push(...parseItems(rest));
      continue;
    }

    if (inNotes) {
      res.notes.push(text);
      continue;
    }

    // ligne de macros / kcal juste sous le titre d'une journée
    if (day && !meal && MACRO_LINE.test(text)) {
      (day as PastedDay).subtitle = clean(`${(day as PastedDay).subtitle} ${text}`);
      continue;
    }
    // en-tête libre « Repas libre : », « Pendant la séance : »
    if (/:\s*$/.test(text) && !hasQty(text) && text.length < 50) {
      const { meal: m } = mealFromHeader(text);
      meal = m;
      ensureDay().meals.push(m);
      continue;
    }

    const words = text.split(/\s+/).length;
    const looksItem = hasQty(text) || bullet || /^\(?\s*(?:ou|or)\b/i.test(text) || (words <= 6 && !/[.!?]$/.test(text));
    if (!looksItem) {
      if (meal) (meal as PastedMeal).notes.push(text);
      else if (!day) res.intro.push(text);
      else ensureMeal().notes.push(text);
      continue;
    }
    if (!day && !meal && !hasQty(text) && !bullet) {
      res.intro.push(text);
      continue;
    }
    const items = parseItems(text);
    if (pendingAlt && items.length) items[0].alt = true;
    pendingAlt = false;
    ensureMeal().items.push(...items);
  }

  // journées vides retirées
  res.days = res.days.filter((d) => d.meals.length > 0 || d.subtitle);
  return res;
}

export function countItems(d: PastedDiet): number {
  return d.days.reduce((n, day) => n + day.meals.reduce((m, meal) => m + meal.items.length, 0), 0);
}
