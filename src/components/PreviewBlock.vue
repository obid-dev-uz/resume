<script setup lang="ts">
import { computed } from "vue";
import type { Resume, TemplateSettings } from "../types/resume";
import { FIXED_BLOCK_TITLES, type BlockKey } from "../lib/sections";
import PreviewFields from "./PreviewFields.vue";

/*
 * "Nom: qiymat" bloki (Shaxsiy ma'lumotlar, Kontaktlar, Qo'shimcha ma'lumotlar) bo'lim sifatida.
 * Yon ustunda — oddiy ro'yxat. Asosiy ustunda (Rasmiy): shaxsiy ma'lumotlar ikki ustunli jadval,
 * kontaktlar qatorma-qator (chapda nomi, o'ngda qiymati), qo'shimcha ma'lumotlar bitta ustunda.
 */
/** settings — shu shablonning o'z sozlamalari (ustunlar chegarasi shu yerda saqlanadi) */
const props = defineProps<{
  resume: Resume;
  settings: TemplateSettings;
  blockKey: BlockKey;
  place: "side" | "main";
}>();

const block = computed(() => props.resume[props.blockKey]);
</script>

<template>
  <section class="pv-section" :class="`pv-block-${blockKey}`">
    <h3 class="pv-title">{{ block.title || FIXED_BLOCK_TITLES[blockKey] }}</h3>
    <PreviewFields v-if="place === 'side'" :fields="block.items" />
    <PreviewFields
      v-else-if="blockKey === 'details'"
      v-model:split="settings.fieldsSplit"
      :fields="block.items"
      grid
    />
    <PreviewFields v-else-if="blockKey === 'contacts'" :fields="block.items" spread />
    <PreviewFields v-else :fields="block.items" stack />
  </section>
</template>
