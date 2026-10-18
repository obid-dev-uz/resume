/*
 * Rezyumedagi bosiladigan havolalar. Faqat https/http, mailto va tel ruxsat etiladi —
 * `javascript:`, `data:`, `file:` kabi xavfli sxemalar hech qachon href'ga tushmaydi.
 * Tauri'dagi opener plagini ham aynan shu to'rt sxemaga ruxsat beradi.
 */

const ALLOWED = /^(https?:\/\/|mailto:|tel:)/i;
/** Har qanday "sxema:" boshlanishi (javascript:, data: ...) */
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Foydalanuvchi yozgan havolani xavfsiz href'ga aylantiradi; yaroqsiz bo'lsa "".
 * Sxemasiz qiymatlar tanib olinadi: email -> mailto:, telefon -> tel:, domen -> https://
 */
export function toHref(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (ALLOWED.test(v)) return v;
  if (ANY_SCHEME.test(v)) return "";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  if (/^\+?[\d\s()-]{7,}$/.test(v)) return `tel:${v.replace(/[\s()-]/g, "")}`;
  if (/^[^\s/]+\.[^\s]+$/.test(v)) return `https://${v}`;
  return "";
}

/** Saqlash uchun: ruxsat etilmagan sxemali qiymat o'chiriladi, qolgani yozilganidek qoladi */
export function sanitizeLinkInput(raw: string): string {
  const v = raw.trim();
  return ANY_SCHEME.test(v) && !ALLOWED.test(v) ? "" : raw;
}

/** "@username" ko'rinishidagi qiymatlar uchun tarmoq manzillari */
const HANDLE_SITES: [label: RegExp, base: string][] = [
  [/telegram/i, "https://t.me/"],
  [/instagram/i, "https://instagram.com/"],
  [/github/i, "https://github.com/"],
  [/linkedin/i, "https://linkedin.com/in/"],
  [/(^x$|twitter)/i, "https://x.com/"],
  [/youtube/i, "https://youtube.com/@"],
];

/** Havola maydoni ochilganda nom va qiymatdan taxminiy havola taklif qilinadi */
export function suggestLink(label: string, value: string): string {
  const v = value.trim();
  if (!v) return "";
  const handle = /^@?([A-Za-z0-9_.-]{2,})$/.exec(v);
  // "@" bilan yozilgan yoki nuqtasiz qiymat — domen emas, foydalanuvchi nomi
  if (handle && (v.startsWith("@") || !v.includes("."))) {
    const site = HANDLE_SITES.find(([re]) => re.test(label.trim()));
    if (site) return site[1] + handle[1];
    if (v.startsWith("@")) return `https://t.me/${handle[1]}`;
  }
  return toHref(v);
}
