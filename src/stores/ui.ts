import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { getUiPref, setUiPref } from "../lib/storage";

/*
 * Interfeys sozlamalari (Pinia). Faqat ko'rinish holati — bu yerga rezyume mazmuni YOZILMAYDI.
 * Saqlanadiganlari `khoresume:ui:*` kalitlarida, qolganlari faqat shu seansda.
 */

/** O'ng ustun rejimi: A4 qog'oz ko'rinishi yoki JSON. Yuklab olish shu rejimga qarab ishlaydi */
export type ViewMode = "a4" | "json";

export const useUiStore = defineStore("ui", () => {
  /** Preview'ni yashirsa forma to'liq kenglikda; tanlov keyingi ochilishda ham saqlanadi */
  const previewVisible = ref(getUiPref("preview") !== "0");
  watch(previewVisible, (v) => setUiPref("preview", v ? null : "0"));

  const viewMode = ref<ViewMode>(getUiPref("view") === "json" ? "json" : "a4");
  watch(viewMode, (v) => setUiPref("view", v === "a4" ? null : v));

  /**
   * Tor ekranda (telefon) forma va preview yonma-yon sig'maydi — pastdagi tablar bilan almashtiriladi.
   * Saqlanmaydi, keng ekranda e'tiborga olinmaydi (app.css, max-width: 900px).
   */
  const mobileTab = ref<"edit" | "preview">("edit");

  return { previewVisible, viewMode, mobileTab };
});
