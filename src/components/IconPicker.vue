<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { VIEWPORT_MARGIN, clamp, useFixedPosition } from "../composables/useFixedPosition";
import { ICONS, ICON_IDS } from "../lib/icons";
import AppIcon from "./AppIcon.vue";

const model = defineModel<string>({ required: true });

const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLElement | null>(null);
const open = ref(false);

/** Panel tugma ostida, chap chetidan; ekrandan chiqib ketmaydi (FieldList scroll bo'lsa ham kesilmaydi) */
const POPOVER_WIDTH = 262;
const popover = useFixedPosition(() => {
  const r = trigger.value?.getBoundingClientRect();
  if (!r) return null;
  const width = Math.min(POPOVER_WIDTH, window.innerWidth - 2 * VIEWPORT_MARGIN);
  const left = clamp(r.left, VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
  return { top: `${r.bottom + 6}px`, left: `${left}px`, width: `${width}px` };
});

function onOutside(e: PointerEvent) {
  if (!root.value?.contains(e.target as Node)) close();
}

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") close();
}

function toggle() {
  if (open.value) {
    close();
    return;
  }
  open.value = true;
  popover.start();
  document.addEventListener("pointerdown", onOutside);
  document.addEventListener("keydown", onKey);
}

function close() {
  open.value = false;
  popover.stop();
  document.removeEventListener("pointerdown", onOutside);
  document.removeEventListener("keydown", onKey);
}

function pick(id: string) {
  model.value = id;
  close();
}

onBeforeUnmount(close);

/** Tanlangan variant (ikonka yoki "Ikonkasiz") */
const ACTIVE = "border-brand bg-brand-soft text-brand";
</script>

<template>
  <div ref="root" class="icon-picker" :class="{ open }">
    <button
      ref="trigger"
      type="button"
      class="grid size-7 cursor-pointer place-items-center rounded-md bg-transparent p-0"
      :class="model ? 'border border-transparent text-fg hover:border-line hover:bg-surface' : 'border border-dashed border-line text-muted hover:bg-surface'"
      :title="model ? `Ikonka: ${ICONS[model]?.label ?? model}` : 'Ikonka qo\'shish'"
      aria-label="Ikonka tanlash"
      :aria-expanded="open"
      @click="toggle"
    >
      <AppIcon v-if="model" :name="model" />
      <span v-else class="text-[15px] leading-none">+</span>
    </button>

    <div v-if="open" class="fixed z-50 rounded-card border border-line bg-surface p-2 shadow-pop" :style="popover.style.value" role="listbox">
      <button
        type="button"
        class="mb-1.5 w-full cursor-pointer rounded-md border p-[5px] text-label"
        :class="!model ? ACTIVE : 'border-line bg-surface-2'"
        @click="pick('')"
      >
        Ikonkasiz
      </button>
      <div class="grid grid-cols-7 gap-1">
        <button
          v-for="id in ICON_IDS"
          :key="id"
          type="button"
          class="grid aspect-square cursor-pointer place-items-center rounded-md border p-0"
          :class="model === id ? ACTIVE : 'border-transparent bg-transparent hover:border-line hover:bg-surface-2'"
          :title="ICONS[id].label"
          role="option"
          :aria-selected="model === id"
          @click="pick(id)"
        >
          <AppIcon :name="id" />
        </button>
      </div>
    </div>
  </div>
</template>
