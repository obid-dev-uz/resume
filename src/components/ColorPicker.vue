<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

defineProps<{ colors: string[] }>();
const model = defineModel<string>({ required: true });

const root = ref<HTMLElement | null>(null);
const open = ref(false);

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
  document.addEventListener("pointerdown", onOutside);
  document.addEventListener("keydown", onKey);
}

function close() {
  open.value = false;
  document.removeEventListener("pointerdown", onOutside);
  document.removeEventListener("keydown", onKey);
}

function pick(color: string) {
  model.value = color;
  close();
}

onBeforeUnmount(close);
</script>

<template>
  <div ref="root" class="relative">
    <button type="button" class="btn" title="Asosiy rang" :aria-expanded="open" @click="toggle">
      <span class="size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]" :style="{ background: model }" />
      Rang
    </button>

    <div v-if="open" class="absolute top-[calc(100%+6px)] left-0 z-30 flex flex-col gap-2.5 rounded-card border border-line bg-surface p-2.5 shadow-pop">
      <div class="grid grid-cols-[repeat(4,22px)] gap-2">
        <button
          v-for="c in colors"
          :key="c"
          type="button"
          class="size-[22px] cursor-pointer rounded-full border-2 border-transparent p-0"
          :class="{ 'outline-2 outline-offset-1 outline-brand': model === c }"
          :style="{ background: c }"
          :title="c"
          @click="pick(c)"
        />
      </div>
      <label class="flex cursor-pointer items-center gap-2 text-label">
        <input v-model="model" type="color" class="size-[26px] cursor-pointer border-0 bg-transparent p-0" />
        <span>Boshqa rang</span>
      </label>
    </div>
  </div>
</template>
