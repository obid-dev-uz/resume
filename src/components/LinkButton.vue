<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { suggestLink, toHref } from "../lib/links";
import { VIEWPORT_MARGIN, useFixedPosition } from "../composables/useFixedPosition";

const props = defineProps<{
  /** Oyna sarlavhasi va taklif uchun: "Telegram" */
  label: string;
  /** Havola taklifi shu qiymatdan olinadi: "@obid_devuz" -> https://t.me/obid_devuz */
  value: string;
  /** Tugma joyida turadi, lekin bosilmaydi (Shaxsiy ma'lumotlarning standart maydonlari) */
  disabled?: boolean;
}>();
const model = defineModel<string>({ required: true });

/*
 * Oyna qatorning (`.extra-item`) ko'rinib turgan qismi markazida suzib chiqadi. Ro'yxat x bo'ylab
 * aylanadi (FieldList), shuning uchun oyna fixed — ro'yxat chegarasida kesilmaydi.
 * Tahrir qoralamada; faqat "Saqlash"da yoziladi.
 */
const POPOVER_WIDTH = 460;
const popover = useFixedPosition(() => {
  const row = root.value?.closest<HTMLElement>(".extra-item");
  if (!row) return null;
  const r = row.getBoundingClientRect();
  // Qatorning ro'yxat (scroll) va ekran ichida ko'rinib turgan qismi
  const box = row.closest<HTMLElement>(".field-list-scroll")?.getBoundingClientRect();
  const left = Math.max(r.left, box?.left ?? r.left, VIEWPORT_MARGIN);
  const right = Math.min(r.right, box?.right ?? r.right, window.innerWidth - VIEWPORT_MARGIN);
  const width = Math.min(POPOVER_WIDTH, Math.max(right - left, 0));
  return { top: `${r.top + r.height / 2}px`, left: `${left + (right - left) / 2}px`, width: `${width}px` };
});
const root = ref<HTMLElement | null>(null);
const input = ref<HTMLInputElement | null>(null);
const open = ref(false);
const draft = ref("");

const hasLink = computed(() => model.value.trim() !== "");
const draftInvalid = computed(() => draft.value.trim() !== "" && !toHref(draft.value));

function onOutside(e: PointerEvent) {
  if (!root.value?.contains(e.target as Node)) close();
}

async function show() {
  draft.value = model.value || suggestLink(props.label, props.value);
  open.value = true;
  popover.start();
  document.addEventListener("pointerdown", onOutside);
  await nextTick();
  input.value?.select();
}

function close() {
  open.value = false;
  popover.stop();
  document.removeEventListener("pointerdown", onOutside);
}

function save() {
  if (draftInvalid.value) return;
  model.value = draft.value.trim();
  close();
}

function remove() {
  model.value = "";
  close();
}

onBeforeUnmount(close);
</script>

<template>
  <div ref="root" class="link-control">
    <button
      type="button"
      class="icon-btn"
      :class="{ 'text-brand': hasLink }"
      :title="hasLink ? `Havola: ${model}` : 'Havola qo\'shish'"
      :aria-label="hasLink ? 'Havolani tahrirlash' : 'Havola qo\'shish'"
      :aria-expanded="open"
      :disabled="disabled"
      @click="open ? close() : show()"
    >
      <svg
        class="app-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        <!-- Havola yo'q: ustidan chiziq -->
        <path v-if="!hasLink" d="M3 3l18 18" />
      </svg>
    </button>

    <div
      v-if="open"
      class="link-popover fixed z-50 flex flex-col gap-2 rounded-xl border border-line bg-surface px-3.5 py-3 shadow-float"
      :style="popover.style.value"
      role="dialog"
      :aria-label="`Havola — ${label || 'maydon'}`"
      @keydown.esc.stop="close"
    >
      <p class="m-0 text-label font-semibold text-muted">Havola — {{ label || "maydon" }}</p>
      <input
        ref="input"
        v-model="draft"
        type="url"
        placeholder="https://t.me/username, mailto:..., tel:+998..."
        :class="{ invalid: draftInvalid }"
        @keydown.enter.prevent="save"
      />
      <p v-if="draftInvalid" class="error m-0">Havola https://, mailto: yoki tel: bilan boshlanishi kerak</p>
      <div class="flex items-center gap-1.5">
        <button v-if="hasLink" type="button" class="btn small danger" @click="remove">Olib tashlash</button>
        <div class="flex-1" />
        <button type="button" class="btn small ghost" @click="close">Bekor qilish</button>
        <button type="button" class="btn small primary" :disabled="draftInvalid" @click="save">Saqlash</button>
      </div>
    </div>
  </div>
</template>
