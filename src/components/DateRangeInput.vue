<script setup lang="ts">
import { computed, ref, watch } from "vue";

/*
 * Ikki sana bitta maydonda: "kk/oo/yyyy – kk/oo/yyyy" (masalan, guvohnomaning amal qilish muddati).
 * Har bir qism to'liq sana, oy/yil yoki faqat yil bo'lishi mumkin.
 * 8 ta raqam yozilsa o'zi "01/08/2019 – " ga aylanadi, keyingi 8 tasi ham shunday — ajratuvchilarni
 * yozish shart emas. Kalendar tugmasi kursor turgan qism uchun ochiladi (chapda — boshlanish,
 * "–" dan keyin — tugash).
 *
 * Saqlanadigan qiymatlar (start, end): "YYYY-MM-DD", "YYYY-MM", "YYYY" yoki "".
 */
const start = defineModel<string>("start", { required: true });
const end = defineModel<string>("end", { required: true });
defineProps<{ ariaLabel?: string }>();

const SEP = " – ";

/** "YYYY-MM-DD" -> "DD/MM/YYYY", "YYYY-MM" -> "MM/YYYY", "YYYY" o'zgarmaydi */
function partToDisplay(v: string): string {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(v);
  if (!m) return v;
  return [m[3], m[2], m[1]].filter(Boolean).join("/");
}

/** Bitta qism -> saqlanadigan qiymat; noto'g'ri bo'lsa null */
function parsePart(text: string): string | null {
  const t = text.trim();
  if (!t) return "";
  if (/^\d{4}$/.test(t)) return t;
  const my = /^(\d{1,2})[./\-\s](\d{4})$/.exec(t);
  if (my) {
    const mo = Number(my[1]);
    return mo >= 1 && mo <= 12 ? `${my[2]}-${String(mo).padStart(2, "0")}` : null;
  }
  const m = /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{4})$/.exec(t) ?? /^(\d{2})(\d{2})(\d{4})$/.exec(t);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Matnni ikki qismga bo'ladi: "–", "—" yoki bo'sh joy bilan o'ralgan "-" */
function split(text: string): [string, string] {
  const parts = text.split(/\s*[–—]\s*|\s+-\s+/);
  return [parts[0] ?? "", parts.slice(1).join(" ")];
}

function parse(text: string): [string, string] | null {
  const [a, b] = split(text);
  const s = parsePart(a);
  const e = parsePart(b);
  return s === null || e === null ? null : [s, e];
}

function toDisplay(s: string, e: string): string {
  if (!s && !e) return "";
  return `${partToDisplay(s)}${SEP}${partToDisplay(e)}`.trim();
}

const text = ref(toDisplay(start.value, end.value));
const invalid = computed(() => parse(text.value) === null);

// Tashqaridan o'zgarsa (kalendar, boshqa maydon) — matn yangilanadi
watch([start, end], ([s, e]) => {
  const p = parse(text.value);
  if (!p || p[0] !== s || p[1] !== e) text.value = toDisplay(s, e);
});

/** 8 ta raqam -> "dd/mm/yyyy"; birinchi sana tugasa ajratuvchi o'zi qo'shiladi */
function autoFormat(t: string): string {
  const digits = /^(\d{2})(\d{2})(\d{4})$/;
  // Birdaniga qo'yilgan (paste) 9..16 raqam: birinchi 8 tasi — boshlanish, qolgani — tugash
  const pasted = /^(\d{8})(\d{1,8})$/.exec(t.trim());
  if (pasted) t = `${pasted[1]}${SEP}${pasted[2]}`;
  const [a, b] = split(t);
  const hasSep = /[–—]|\s-\s/.test(t);
  const fa = a.trim().replace(digits, "$1/$2/$3");
  if (!hasSep) return /^\d{2}\/\d{2}\/\d{4}$/.test(fa) && fa !== a.trim() ? fa + SEP : t;
  return `${fa}${SEP}${b.trim().replace(digits, "$1/$2/$3")}`;
}

function onInput(e: Event) {
  if ((e as InputEvent).inputType?.startsWith("insert")) {
    const f = autoFormat(text.value);
    if (f !== text.value) text.value = f;
  }
  const p = parse(text.value);
  if (p) [start.value, end.value] = p; // to'g'ri bo'lgan zahoti saqlanadi
}

function onBlur() {
  const p = parse(text.value);
  if (p) text.value = toDisplay(p[0], p[1]);
}

/* ---- Kalendar: yashirin native date input; kursor qaysi qismda bo'lsa, o'shani tanlaydi ---- */
const input = ref<HTMLInputElement | null>(null);
const picker = ref<HTMLInputElement | null>(null);
const target = ref<"start" | "end">("start");
let caret = -1;

function rememberCaret() {
  caret = input.value?.selectionStart ?? -1;
}

const pickerValue = computed(() => {
  const v = target.value === "start" ? start.value : end.value;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
});

function openPicker() {
  const sepAt = text.value.search(/[–—]/);
  if (caret >= 0 && sepAt >= 0) target.value = caret > sepAt ? "end" : "start";
  else target.value = start.value ? "end" : "start";
  const el = picker.value;
  if (!el) return;
  el.value = pickerValue.value;
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
  if (target.value === "start") start.value = v;
  else end.value = v;
  text.value = toDisplay(start.value, end.value);
}
</script>

<template>
  <div class="date-field date-range" :class="{ invalid }">
    <input
      ref="input"
      v-model="text"
      class="date-text"
      inputmode="numeric"
      placeholder="kk/oo/yyyy – kk/oo/yyyy"
      :aria-label="ariaLabel"
      :aria-invalid="invalid"
      :title="invalid ? 'Ikki sana: kk/oo/yyyy – kk/oo/yyyy (oy/yil yoki faqat yil ham bo\'ladi)' : ''"
      @input="onInput"
      @blur="onBlur"
      @keyup="rememberCaret"
      @click="rememberCaret"
    />
    <button
      type="button"
      class="date-btn"
      title="Kalendardan tanlash (kursor turgan sana uchun)"
      aria-label="Kalendardan tanlash"
      @mousedown="rememberCaret"
      @click="openPicker"
    >
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
      @change="onPick"
    />
  </div>
</template>
