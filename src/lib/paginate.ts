/*
 * Word'dagidek sahifalash: ustun mazmuni A4 varaqlarga bo'linadi.
 *
 * Qoidalar:
 *   - faqat "bo'linish nuqtalari"da kesiladi: bo'lim boshi va har bir yozuv boshi —
 *     yozuv o'rtasidan hech qachon bo'linmaydi;
 *   - bo'lim sarlavhasi birinchi yozuvi bilan birga ko'chadi (sarlavhadan keyin nuqta yo'q) —
 *     sahifa oxirida yolg'iz sarlavha qolmaydi;
 *   - bitta yozuv butun varaqdan uzun bo'lsa (juda kam holat), u majburan kesiladi.
 */

/** Mazmun oralig'i [start, end) px'da, ustun mazmuni boshidan hisoblanganda */
export type PageSlice = { start: number; end: number };

/** Yozuvlar orasida bo'lish mumkin bo'lgan elementlar (birinchi yozuvdan keyingilari) */
export const BREAK_SELECTOR = [
  ".pv-section",
  ".pv-entry ~ .pv-entry",
  ".pv-rated ~ .pv-rated",
  ".pv-list > li ~ li",
  // Qarindoshlar jadvali qatorlari: qator o'rtasidan bo'linmaydi
  ".pv-rel tbody tr ~ tr",
  // "Nom: qiymat" bloklari: ikki ustunli jadvalda 2-qatordan (3-katakdan), qolganlarida 2-qatordan
  ".pv-fields-grid:not(.pv-fields-stack) > .pv-fg-item ~ .pv-fg-item ~ .pv-fg-item",
  ".pv-fields-stack > .pv-fg-item ~ .pv-fg-item",
  ".pv-fr-item ~ .pv-fr-item",
].join(", ");

/** Ustun mazmuni ichidagi bo'linish nuqtalari (px, mazmun boshidan) */
export function collectBreakpoints(content: HTMLElement): number[] {
  const top = content.getBoundingClientRect().top;
  const points = [...content.querySelectorAll<HTMLElement>(BREAK_SELECTOR)].map(
    (el) => el.getBoundingClientRect().top - top,
  );
  return [...new Set(points.map((p) => Math.round(p * 10) / 10))].filter((p) => p > 0).sort((a, b) => a - b);
}

/**
 * @param total     ustun mazmunining to'liq balandligi
 * @param firstCap  1-varaqda mazmun uchun joy (sarlavha va chetlar ayirilgan)
 * @param nextCap   keyingi varaqlarda mazmun uchun joy
 */
export function paginate(breakpoints: number[], total: number, firstCap: number, nextCap: number): PageSlice[] {
  const pages: PageSlice[] = [];
  let start = 0;
  let cap = firstCap;
  // 0.5 px — yaxlitlash xatosi bo'sh varaq yaratmasin
  while (total - start > cap + 0.5 && pages.length < 50) {
    const limit = start + cap;
    let cut = -1;
    for (const b of breakpoints) {
      if (b > start + 1 && b <= limit) cut = b;
    }
    if (cut < 0) cut = limit; // yozuv varaqdan uzun — majburiy kesish
    pages.push({ start, end: cut });
    start = cut;
    cap = nextCap;
  }
  pages.push({ start, end: total });
  return pages;
}
