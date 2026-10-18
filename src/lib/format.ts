const MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

/** "2022-05" -> "May 2022"; boshqa har qanday matn o'zgarmasdan qaytadi */
export function formatMonth(value: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!m) return value.trim();
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${m[1]}` : value;
}

/** "1998-05-14" -> "14.05.1998"; boshqa matn o'zgarmaydi */
export function formatDate(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  return m ? `${m[3]}.${m[2]}.${m[1]}` : value.trim();
}

/** "YYYY-MM" yoki "YYYY" dan faqat yil; boshqa ko'rinishdagi matn o'zgarishsiz */
function formatYear(value: string): string {
  const m = /^(\d{4})(?:-\d{2})?$/.exec(value.trim());
  return m ? m[1] : value.trim();
}

/**
 * Muddat: "Mart 2023 – hozirgacha". yearOnly (shablon bayrog'i) — faqat yillar: "2023 – hozirgacha";
 * boshlanish va tugash yili bir xil bo'lsa bitta yil ("2019").
 */
export function formatPeriod(
  start: string,
  end: string,
  current: boolean,
  currentText = "hozirgacha",
  yearOnly = false,
): string {
  const fmt = yearOnly ? formatYear : formatMonth;
  const from = fmt(start);
  const to = current ? currentText : fmt(end);
  if (yearOnly && !current && from && from === to) return from;
  if (from && to) return `${from} – ${to}`;
  return from || to;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export interface DescriptionBlock {
  type: "p" | "ul";
  lines: string[];
}

/** "- " yoki "• " bilan boshlangan qatorlar ro'yxatga aylanadi */
export function parseDescription(text: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = /^[-•*]\s+/.exec(line);
    const type = bullet ? "ul" : "p";
    const content = bullet ? line.slice(bullet[0].length) : line;
    const last = blocks[blocks.length - 1];
    if (last && last.type === type) last.lines.push(content);
    else blocks.push({ type, lines: [content] });
  }
  return blocks;
}

/**
 * Qisman sana ("1962", "1962-05", "1962-05-14") -> dd.mm.yyyy: "14.05.1962", "05.1962", "1962".
 * Boshqa matn o'zgarmaydi.
 */
/** Muddat: "01.08.2019 – 01.08.2029"; bittasi bo'lsa ham ajratuvchi qoladi ("01.08.2019 –") */
export function formatDateRange(start: string, end: string): string {
  const s = formatPartialDateShort(start);
  const e = formatPartialDateShort(end);
  return s || e ? `${s} – ${e}`.trim() : "";
}

export function formatPartialDateShort(value: string): string {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value.trim());
  if (!m) return value.trim();
  const [, year, month, day] = m;
  return [day, month, year].filter(Boolean).join(".");
}

/**
 * Yozilgan sana -> "YYYY-MM-DD" ("25.11.1962", "25/11/1962", "25 11 1962", "25111962", "1962-11-25");
 * faqat yil bo'lsa "YYYY", bo'sh bo'lsa "". Noto'g'ri yoki mavjud bo'lmagan sana (31.02) — null.
 */
export function parseDate(text: string): string | null {
  const t = text.trim();
  if (!t) return "";
  if (/^\d{4}$/.test(t)) return t;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  const m = iso
    ? [iso[0], iso[3], iso[2], iso[1]]
    : (/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{4})$/.exec(t) ?? /^(\d{2})(\d{2})(\d{4})$/.exec(t));
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
