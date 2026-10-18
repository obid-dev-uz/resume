<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { Resume, TemplateId } from "../types/resume";
import { VISIBLE_TEMPLATES, getTemplate } from "../templates";
import ResumePreview from "./ResumePreview.vue";

defineProps<{ resume: Resume }>();
const model = defineModel<TemplateId>({ required: true });
const emit = defineEmits<{ close: [] }>();

/** Yashirilgan shablondagi rezyume "Yon panelli"da chiziladi — galereyada ham shu belgilanadi */
const current = computed(() => getTemplate(model.value).id);

/*
 * Native <dialog>: markazda ochiladi, orqa fon xiralashadi, Esc bilan yopiladi
 * va fokus oyna ichida qoladi.
 */
const dialog = ref<HTMLDialogElement | null>(null);

onMounted(() => dialog.value?.showModal());

function choose(id: TemplateId) {
  model.value = id;
  dialog.value?.close();
}

/** Oynadan tashqariga (qorong'i fonga) bosilsa yopiladi */
function onBackdrop(e: MouseEvent) {
  if (e.target === dialog.value) dialog.value?.close();
}
</script>

<template>
  <dialog
    ref="dialog"
    class="tpl-dialog max-h-[calc(100vh-48px)] w-[min(1040px,calc(100vw-48px))] rounded-[14px] border border-line bg-surface p-0 text-fg shadow-[0_24px_64px_rgba(10,20,35,0.35)] narrow:max-h-[calc(100dvh-16px)] narrow:w-[calc(100vw-16px)]"
    aria-labelledby="tpl-dialog-title"
    @close="emit('close')"
    @click="onBackdrop"
  >
    <div class="flex min-h-0 w-full flex-col">
      <header class="flex items-start justify-between gap-4 border-b border-line px-[22px] pt-[18px] pb-3 narrow:px-4 narrow:pt-3.5 narrow:pb-2.5">
        <div>
          <h2 id="tpl-dialog-title">Shablonni tanlang</h2>
          <p class="m-0 text-label text-muted">Har bir shablon sizning ma'lumotlaringiz bilan ko'rsatilgan</p>
        </div>
        <button type="button" class="icon-btn" title="Yopish" aria-label="Yopish" @click="dialog?.close()">✕</button>
      </header>

      <div class="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-x-[18px] gap-y-[22px] overflow-y-auto px-[22px] pt-5 pb-6 narrow:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] narrow:gap-x-3 narrow:gap-y-4 narrow:px-4 narrow:pt-3.5 narrow:pb-[18px]" role="listbox" aria-label="Shablonlar">
        <button
          v-for="t in VISIBLE_TEMPLATES"
          :key="t.id"
          type="button"
          class="tpl-card flex min-w-0 cursor-pointer flex-col gap-[5px] border-0 bg-transparent p-0 text-left text-inherit focus-visible:outline-none"
          :class="{ active: current === t.id }"
          role="option"
          :aria-selected="current === t.id"
          @click="choose(t.id)"
        >
          <div class="tpl-thumb aspect-[210/297] w-full min-w-0 overflow-hidden rounded-lg border-2 border-line bg-white transition-[border-color,transform,box-shadow]">
            <ResumePreview :resume="resume" :template="t.id" thumbnail />
          </div>
          <span class="mt-1 text-sm font-semibold" :class="{ 'text-brand': current === t.id }">
            {{ t.name }}
            <b v-if="t.ats" class="ml-1 rounded-[4px] bg-ok-soft px-[5px] py-px text-[10px] text-ok" title="Bir ustunli, avtomatik saralash (ATS) dasturlari oson o'qiydi">ATS</b>
          </span>
          <small class="text-xs leading-[1.35] text-muted">{{ t.description }}</small>
        </button>
      </div>
    </div>
  </dialog>
</template>
