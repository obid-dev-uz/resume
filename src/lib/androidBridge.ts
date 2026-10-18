/*
 * Android ilovasidagi PDF ko'prigi (src-tauri/gen/android: PdfBridge.kt, MainActivity.kt).
 * Android WebView window.print() ni qo'llamaydi — PDF'ni Kotlin tomoni yaratadi, keyin
 * Download papkasiga saqlaydi yoki "Ulashish" oynasini ochadi. Desktop va brauzerda ko'prik yo'q.
 */

export type PdfAction = "save" | "share";
export interface PdfResult {
  ok: boolean;
  action: PdfAction;
  /** save: saqlangan joy ("Download/Nom.pdf"); xatoda — sabab */
  message: string;
}

interface KhoAndroid {
  exportPdf(fileName: string, action: PdfAction): void;
}

declare global {
  interface Window {
    KhoAndroid?: KhoAndroid;
    __khoPdfDone?: (result: PdfResult) => void;
  }
}

/** Ilova Android'da (Tauri) ochilganmi — PDF uchun ko'prik bormi */
export function isAndroidApp(): boolean {
  return typeof window !== "undefined" && !!window.KhoAndroid;
}

/** PDF yaratish uzoq davom etsa ham kutiladi; javob kelmasa 60 soniyadan keyin xato */
const TIMEOUT_MS = 60_000;

export function exportPdf(fileName: string, action: PdfAction): Promise<PdfResult> {
  const bridge = window.KhoAndroid;
  if (!bridge) return Promise.resolve({ ok: false, action, message: "Android ko'prigi topilmadi" });
  return new Promise((resolve) => {
    const timer = setTimeout(() => finish({ ok: false, action, message: "PDF tayyorlash juda uzoq davom etdi" }), TIMEOUT_MS);
    function finish(result: PdfResult) {
      clearTimeout(timer);
      window.__khoPdfDone = undefined;
      resolve(result);
    }
    window.__khoPdfDone = finish;
    bridge.exportPdf(fileName, action);
  });
}
