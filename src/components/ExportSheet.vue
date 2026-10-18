<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import type { PdfAction } from "../lib/androidBridge";

/*
 * Pastdan chiqadigan oyna (bottom sheet) — Android ilovasida PDF: yuklab olish yoki ulashish.
 * PDF'ni o'zi yaratmaydi: tanlovni ResumeEditor'ga qaytaradi (androidBridge.exportPdf).
 * `no-print`: PDF yaratilayotganda oyna ekranda turadi, lekin PDF'ga tushmaydi.
 */
const props = defineProps<{
  /** Rezyume nomi — sarlavhada va fayl nomida */
  name: string;
  /** PDF tayyorlanmoqda: tugmalar bosilmaydi */
  busy: boolean;
  /** Oxirgi urinish xatosi */
  error: string;
}>();
const emit = defineEmits<{ action: [action: PdfAction]; close: [] }>();

function close() {
  if (!props.busy) emit("close");
}

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") close();
}
onMounted(() => document.addEventListener("keydown", onKey));
onBeforeUnmount(() => document.removeEventListener("keydown", onKey));

const OPTION =
  "flex w-full cursor-pointer items-center gap-3.5 rounded-card border-0 bg-transparent px-3 py-3 text-left hover:bg-surface-2 disabled:cursor-default disabled:opacity-50";
</script>

<template>
  <div class="no-print fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-labelledby="export-sheet-title">
    <!-- Orqa fon: bosilsa yopiladi -->
    <div class="export-sheet-backdrop absolute inset-0 bg-[rgb(12_18_28/0.55)]" @click="close" />

    <div class="export-sheet-panel relative rounded-t-2xl bg-surface px-3 pt-2 pb-4 shadow-float">
      <!-- Tutqich chizig'i (bezak) -->
      <div class="mx-auto mb-2 h-1 w-10 rounded-full bg-line" aria-hidden="true" />
      <div class="px-3 pb-2">
        <h2 id="export-sheet-title" class="text-base font-semibold">PDF</h2>
        <p class="m-0 truncate text-label text-muted">{{ name }}.pdf</p>
      </div>

      <button type="button" :class="OPTION" :disabled="busy" @click="emit('action', 'save')">
        <svg class="app-icon size-[22px] text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="m7 10 5 5 5-5" />
          <path d="M12 15V3" />
        </svg>
        <span class="flex min-w-0 flex-col">
          <span class="font-semibold">PDF yuklab olish</span>
          <span class="text-label text-muted">Telefonning "Download" papkasiga saqlanadi</span>
        </span>
      </button>

      <button type="button" :class="OPTION" :disabled="busy" @click="emit('action', 'share')">
        <svg class="app-icon size-[22px] text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.59 13.51 6.83 3.98" />
          <path d="m15.41 6.51-6.82 3.98" />
        </svg>
        <span class="flex min-w-0 flex-col">
          <span class="font-semibold">Ulashish</span>
          <span class="text-label text-muted">Telegram, Gmail, Drive va boshqalar</span>
        </span>
      </button>

      <p v-if="busy" class="m-0 px-3 pt-2 text-label text-brand" role="status">PDF tayyorlanmoqda…</p>
      <p v-else-if="error" class="m-0 px-3 pt-2 text-label text-danger" role="alert">{{ error }}</p>

      <button
        type="button"
        class="btn mt-3 w-full justify-center"
        :disabled="busy"
        @click="close"
      >
        Bekor qilish
      </button>
    </div>
  </div>
</template>
