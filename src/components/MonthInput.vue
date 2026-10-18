<script setup lang="ts">
import { computed, ref, watch } from "vue";

/*
 * Oy va yil maydoni — har doim oo/yyyy ko'rinishida (masalan, ish boshlangan oy).
 * Brauzerning <input type="month"> faqat yil yozilgan qiymatni ("2018") ko'rsata olmaydi va
 * ko'rinishi tizim tiliga bog'liq, shuning uchun matn maydoni + kalendar tugmasi.
 * 6 ta raqam yozilsa ("052022") o'zi "05/2022" ga aylanadi.
 *
 * Saqlanadigan qiymat (model): "YYYY-MM", faqat yil bo'lsa "YYYY", bo'sh bo'lsa "".
 */
const model = defineModel<string>({ required: true });
defineProps<{ ariaLabel?: string; disabled?: boolean }>();

/** "YYYY-MM" -> "MM/YYYY"; "YYYY" va boshqa qiymatlar o'zgarmaydi */
function toDisplay(value: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  return m ? `${m[2]}/${m[1]}` : value;
}

/** Yozilgan matn -> saqlanadigan qiymat; noto'g'ri bo'lsa null */
function parse(text: string): string | null {
  const t = text.trim();
  if (!t) return "";
  if (/^\d{4}$/.test(t)) return t; // faqat yil
  const m = /^(\d{1,2})[./\-\s](\d{4})$/.exec(t) ?? /^(\d{2})(\d{4})$/.exec(t);
  if (!m) return null;
  const mo = Number(m[1]);
  return mo >= 1 && mo <= 12 ? `${m[2]}-${String(mo).padStart(2, "0")}` : null;
}

const text = ref(toDisplay(model.value));
const invalid = computed(() => parse(text.value) === null);

// Tashqaridan o'zgarsa (kalendar, boshqa maydon) — matn yangilanadi
watch(model, (v) => {
  if (parse(text.value) !== v) text.value = toDisplay(v);
});

function onInput(e: Event) {
  // "052022" -> "05/2022" (yil 20.. yoki 19.. bilan boshlansa — 4 raqamli yil bilan adashmaydi)
  if ((e as InputEvent).inputType?.startsWith("insert")) {
    const m = /^(\d{2})((?:19|20)\d{2})$/.exec(text.value.trim());
    if (m) text.value = `${m[1]}/${m[2]}`;
  }
  const v = parse(text.value);
  if (v !== null) model.value = v; // to'g'ri bo'lgan zahoti saqlanadi
}

function onBlur() {
  const v = parse(text.value);
  if (v !== null) text.value = toDisplay(v); // "5.2022" -> "05/2022"
}

/* ---- Kalendar: yashirin native month input, tugma orqali ochiladi ---- */
const picker = ref<HTMLInputElement | null>(null);
const pickerValue = computed(() => (/^\d{4}-\d{2}$/.test(model.value) ? model.value : ""));

function openPicker() {
  const el = picker.value;
  if (!el) return;
  try {
    el.showPicker();
  } catch {
    el.focus();
    el.click();
  }
}

function onPick(e: Event) {
  const v = (e.target as HTMLInputElement).value;
  if (!v) return;
  model.value = v;
  text.value = toDisplay(v);
}
</script>

<template>
  <div class="date-field" :class="{ invalid: invalid && !disabled }">
    <input
      v-model="text"
      class="date-text"
      inputmode="numeric"
      placeholder="oo/yyyy"
      :disabled="disabled"
      :aria-label="ariaLabel"
      :aria-invalid="invalid"
      :title="invalid ? 'Sana oo/yyyy ko\'rinishida bo\'lishi kerak (yoki faqat yil)' : ''"
      @input="onInput"
      @blur="onBlur"
    />
    <button
      type="button"
      class="date-btn"
      title="Kalendardan tanlash"
      aria-label="Kalendardan tanlash"
      :disabled="disabled"
      @click="openPicker"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    </button>
    <input
      ref="picker"
      class="date-picker-native"
      type="month"
      tabindex="-1"
      aria-hidden="true"
      :value="pickerValue"
      @change="onPick"
    />
  </div>
</template>
