// Stillar tartibi: ilova, keyin shablonlarning umumiy asosi (styles/preview.css) va har bir
// shablonning o'z stillari — src/templates shu tartibda import qiladi
import "./styles/app.css";
import "./templates";
import { createApp } from "vue";
import { createPinia } from "pinia";
import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import App from "./App.vue";
import { router } from "./router";
import { toHref } from "./lib/links";

/*
 * Tauri oynasi tashqi havolalarni o'zi ochmaydi: rezyumedagi havola bosilsa, u tizimning
 * standart dasturida (brauzer, Telegram, pochta) ochiladi. Brauzerda odatdagidek yangi tab.
 */
if (isTauri()) {
  document.addEventListener("click", (e) => {
    const anchor = (e.target as Element | null)?.closest?.("a[href]");
    const href = anchor ? toHref(anchor.getAttribute("href") ?? "") : "";
    if (!href) return; // blob: (JSON yuklab olish) va ichki havolalar o'z holicha qoladi
    e.preventDefault();
    openUrl(href).catch((err) => console.error("Havola ochilmadi", err));
  });
}

// Pinia router guard'laridan oldin: guard store'dan foydalanadi
createApp(App).use(createPinia()).use(router).mount("#app");
