<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { parseDate as parse } from "../lib/format";

/*
 * Sana maydoni — har doim dd/mm/yyyy ko'rinishida.
 * Brauzerning <input type="date"> formati tizim tiliga bog'liq (mm/dd/yyyy bo'lishi mumkin),
 * uni sahifadan majburlab bo'lmaydi. Shuning uchun matn maydoni + kalendar tugmasi.
 *
 * Saqlanadigan qiymat (model): "YYYY-MM-DD", faqat yil bo'lsa "YYYY", bo'sh bo'lsa "".
 */
const model = defineModel<string>({ required: true });
defineProps<{ ariaLabel?: string }>();

/** "YYYY-MM-DD" -> "DD/MM/YYYY"; "YYYY" va boshqa qiymatlar o'zgarmaydi */
function toDisplay(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
}

const text = ref(toDisplay(model.value));
const invalid = computed(() => parse(text.value) === null);

// Tashqaridan o'zgarsa (kalendar, boshqa maydon) — matn yangilanadi
watch(model, (v) => {
  if (parse(text.value) !== v) text.value = toDisplay(v);
});

function onInput() {
  const v = parse(text.value);
  if (v !== null) model.value = v; // yozish davomida to'g'ri bo'lgan zahoti saqlanadi
}

function onBlur() {
  const v = parse(text.value);
  if (v !== null) text.value = toDisplay(v); // "25.11.1962" -> "25/11/1962"
}

/* ---- Kalendar: yashirin native date input, tugma orqali ochiladi ---- */
const picker = ref<HTMLInputElement | null>(null);
const pickerValue = computed(() => (/^\d{4}-\d{2}-\d{2}$/.test(model.value) ? model.value : ""));

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
  <div class="date-field" :class="{ invalid }">
    <input
      v-model="text"
      class="date-text"
      inputmode="numeric"
      placeholder="kk/oo/yyyy"
      :aria-label="ariaLabel"
      :aria-invalid="invalid"
      :title="invalid ? 'Sana dd/mm/yyyy ko\'rinishida bo\'lishi kerak (yoki faqat yil)' : ''"
      @input="onInput"
      @blur="onBlur"
    />
    <button type="button" class="date-btn" title="Kalendardan tanlash" aria-label="Kalendardan tanlash" @click="openPicker">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    </button>
    <input
      ref="picker"
      class="date-picker-native"
      type="date"
      tabindex="-1"
      aria-hidden="true"
      :value="pickerValue"
      @change="onPick"
    />
  </div>
</template>
