import { invoke, isTauri } from "@tauri-apps/api/core";

/*
 * PDF (chop etish) oynasini ochish. Desktop ilovada (Tauri) Rust buyrug'i orqali: Linux'da
 * WebKitGTK window.print() da CSS'dagi `@page { margin: 0 }` ni hisobga olmaydi va varaq chetida
 * oq joy qoladi — print_page uni chetsiz A4 bilan ochadi (src-tauri/src/lib.rs). Brauzerda — window.print().
 * Android'da ishlatilmaydi: u yerda androidBridge.ts.
 */
export async function printDocument(title: string): Promise<void> {
  const previous = document.title;
  document.title = title;
  try {
    if (isTauri()) {
      // Native chop etishda beforeprint hodisasi kelmaydi: varaqlar PDF uchun oldindan o'lchanadi
      window.dispatchEvent(new Event("beforeprint"));
      await new Promise((r) => setTimeout(r, 50));
      await invoke("print_page", { title });
      window.dispatchEvent(new Event("afterprint"));
    } else {
      window.print();
    }
  } finally {
    document.title = previous;
  }
}
