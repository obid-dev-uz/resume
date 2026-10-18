<script setup lang="ts">
import { computed, ref } from "vue";
import type { ExtraField } from "../types/resume";
import { toHref } from "../lib/links";
import { FIELDS_SPLIT, clampSplit, fieldDisplayValue } from "../lib/sections";
import AppIcon from "./AppIcon.vue";

/**
 * Kontaktlar yoki shaxsiy maydonlar.
 * inline — sarlavhada bir qatorda; grid — ikki ustunli jadval (qalin kalit, ostida qiymat);
 * stack — xuddi shunday, lekin bitta ustunda, butun kenglikda;
 * spread — har qator butun kenglikda: chapda kalit, o'ngda qiymat; aks holda yon ustunda ro'yxat
 */
const props = defineProps<{
  fields: ExtraField[];
  inline?: boolean;
  grid?: boolean;
  stack?: boolean;
  spread?: boolean;
  /**
   * grid'da chap ustun kengligi (foiz). Berilsa ustunlar orasidagi chiziqni sichqoncha
   * bilan surish (yoki fokusda ←/→) mumkin, ikki marta bosilsa teng bo'linadi.
   */
  split?: number;
}>();
const emit = defineEmits<{ "update:split": [value: number] }>();

const resizable = computed(() => props.grid && props.split !== undefined);
const gridStyle = computed(() => {
  if (!props.grid || props.split === undefined) return undefined;
  return {
    gridTemplateColumns: `minmax(0, ${props.split}fr) minmax(0, ${100 - props.split}fr)`,
    "--split": String(props.split),
  };
});

/*
 * Chiziq ustunlar orasidagi bo'shliq o'rtasida turadi. Sichqoncha o'rnidan foiz hisoblanadi:
 * chap ustun = (kursor − jadval chap cheti − bo'shliq/2) / (kenglik − bo'shliq).
 * getBoundingClientRect preview masshtabini (scale) ham hisobga oladi.
 */
const dragging = ref(false);

function splitAt(clientX: number, gridEl: HTMLElement) {
  const rect = gridEl.getBoundingClientRect();
  const gap = (parseFloat(getComputedStyle(gridEl).columnGap) || 0) * (rect.width / gridEl.offsetWidth);
  emit("update:split", clampSplit(((clientX - rect.left - gap / 2) / (rect.width - gap)) * 100));
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return;
  const gridEl = (e.currentTarget as HTMLElement).parentElement!;
  e.preventDefault();
  dragging.value = true;
  const move = (ev: PointerEvent) => splitAt(ev.clientX, gridEl);
  const up = () => {
    dragging.value = false;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

function onKeyDown(e: KeyboardEvent) {
  const step = e.shiftKey ? 5 : 1;
  if (e.key === "ArrowLeft") emit("update:split", clampSplit(props.split! - step));
  else if (e.key === "ArrowRight") emit("update:split", clampSplit(props.split! + step));
  else if (e.key === "Home" || e.key === "Enter") emit("update:split", FIELDS_SPLIT.default);
  else return;
  e.preventDefault();
}

const rows = computed(() =>
  props.fields
    .map((f) => ({
      id: f.id,
      label: f.label.trim(),
      value: fieldDisplayValue(f),
      labelIcon: f.labelIcon,
      valueIcon: f.valueIcon,
      href: toHref(f.link),
    }))
    .filter((r) => r.value),
);
</script>

<template>
  <p v-if="inline" class="pv-inline-contacts">
    <span v-for="r in rows" :key="r.id">
      <AppIcon :name="r.labelIcon" /><template v-if="r.label">{{ r.label }}: </template><AppIcon
        :name="r.valueIcon"
      /><a v-if="r.href" :href="r.href" target="_blank" rel="noopener noreferrer">{{ r.value }}</a><template
        v-else
      >{{ r.value }}</template>
    </span>
  </p>
  <!-- Qatorlar: [kalit] ....... [qiymat] -->
  <div v-else-if="spread" class="pv-fields-rows">
    <div v-for="r in rows" :key="r.id" class="pv-fr-item">
      <span class="pv-fg-key"><AppIcon :name="r.labelIcon" />{{ r.label }}</span>
      <span class="pv-fr-value">
        <AppIcon :name="r.valueIcon" /><a
          v-if="r.href"
          :href="r.href"
          target="_blank"
          rel="noopener noreferrer"
        >{{ r.value }}</a><template v-else>{{ r.value }}</template>
      </span>
    </div>
  </div>
  <!-- Ikki ustun: chapdan o'ngga, keyin keyingi qatorga (stack'da bitta ustun) -->
  <div
    v-else-if="grid || stack"
    class="pv-fields-grid"
    :class="{ 'pv-fields-stack': stack, resizable, dragging }"
    :style="gridStyle"
  >
    <div
      v-if="resizable"
      class="pv-split-handle no-print"
      role="separator"
      aria-orientation="vertical"
      aria-label="Ustunlar chegarasi"
      :aria-valuenow="split"
      :aria-valuemin="FIELDS_SPLIT.min"
      :aria-valuemax="FIELDS_SPLIT.max"
      tabindex="0"
      title="Surib ustunlar kengligini o'zgartiring (ikki marta bosilsa — teng)"
      @pointerdown="onPointerDown"
      @dblclick="emit('update:split', FIELDS_SPLIT.default)"
      @keydown="onKeyDown"
    />
    <div v-for="r in rows" :key="r.id" class="pv-fg-item">
      <div v-if="r.label || r.labelIcon" class="pv-fg-key"><AppIcon :name="r.labelIcon" />{{ r.label }}</div>
      <div class="pv-fg-value">
        <AppIcon :name="r.valueIcon" /><a
          v-if="r.href"
          :href="r.href"
          target="_blank"
          rel="noopener noreferrer"
        >{{ r.value }}</a><template v-else>{{ r.value }}</template>
      </div>
    </div>
  </div>
  <dl v-else class="pv-contacts">
    <template v-for="r in rows" :key="r.id">
      <dt v-if="r.label || r.labelIcon"><AppIcon :name="r.labelIcon" />{{ r.label }}</dt>
      <dd>
        <AppIcon :name="r.valueIcon" /><a
          v-if="r.href"
          :href="r.href"
          target="_blank"
          rel="noopener noreferrer"
        >{{ r.value }}</a><template v-else>{{ r.value }}</template>
      </dd>
    </template>
  </dl>
</template>
