/*
 * Telefon klaviaturasi ochilganda fokusdagi maydon uning ortida qolmasin.
 * Maydon fokus olgan paytda klaviatura hali chiqmagan bo'ladi: u chiqqach oyna (WebView)
 * qisqaradi (Android: adjustResize + MainActivity dagi ime padding) — har bir shunday o'lcham
 * o'zgarishidan keyin maydon ekran o'rtasiga aylantiriladi. Maydondan chiqilganda kuzatish to'xtaydi.
 */
export function keepInView(el: HTMLElement): void {
  // Klaviatura animatsiya bilan chiqadi va bir necha resize yuboradi: o'lcham barqarorlashgach aylantiriladi
  let timer: ReturnType<typeof setTimeout> | undefined;
  const scroll = () => {
    clearTimeout(timer);
    timer = setTimeout(() => el.scrollIntoView({ block: "center" }), 120);
  };
  const vv = window.visualViewport;
  window.addEventListener("resize", scroll);
  vv?.addEventListener("resize", scroll);
  el.addEventListener(
    "blur",
    () => {
      clearTimeout(timer);
      window.removeEventListener("resize", scroll);
      vv?.removeEventListener("resize", scroll);
    },
    { once: true },
  );
}
