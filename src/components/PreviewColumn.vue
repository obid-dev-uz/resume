<script setup lang="ts">
import type { Resume } from "../types/resume";
import type { PreviewModel } from "../composables/usePreviewModel";
import PreviewSection from "./PreviewSection.vue";
import PreviewBlock from "./PreviewBlock.vue";

/*
 * Bitta ustunning butun mazmuni (padding'siz). Sahifalashda har bir varaq shu mazmunni
 * "oyna" orqali ko'rsatadi — shuning uchun bu yerda faqat mazmun, joylashuv emas.
 */
defineProps<{ resume: Resume; m: PreviewModel; column: "side" | "main"; showEmptyHint?: boolean }>();
</script>

<template>
  <template v-if="column === 'side'">
    <template v-if="!m.headerOnTop.value">
      <img v-if="m.photo.value" :src="m.photo.value" class="pv-photo" alt="" />
      <h1 class="pv-name">{{ m.fullName.value || "Ism Familiya" }}</h1>
      <p v-if="m.p.value.jobTitle" class="pv-job">{{ m.p.value.jobTitle }}</p>
    </template>

    <template v-for="it in m.sideItems.value" :key="it.kind === 'block' ? it.key : it.section.id">
      <PreviewBlock
        v-if="it.kind === 'block'"
        :resume="resume"
        :settings="resume.settings.templates[m.tpl.value.id]"
        :block-key="it.key"
        place="side"
      />
      <PreviewSection v-else :section="it.section" :rows="m.tpl.value.keyValueRows" :year-only="m.tpl.value.periodYearOnly" />
    </template>
  </template>

  <template v-else>
    <!-- Formadagi tartibda ("O'zim haqimda" ham shu tartibda, matnli bo'lim sifatida) -->
    <template v-for="it in m.mainItems.value" :key="it.kind === 'block' ? it.key : it.section.id">
      <PreviewBlock
        v-if="it.kind === 'block'"
        :resume="resume"
        :settings="resume.settings.templates[m.tpl.value.id]"
        :block-key="it.key"
        place="main"
      />
      <PreviewSection v-else :section="it.section" :rows="m.tpl.value.keyValueRows" :year-only="m.tpl.value.periodYearOnly" />
    </template>
    <p v-if="showEmptyHint && m.isEmpty.value" class="pv-empty">
      Chap tomondagi formani to'ldiring, rezyume shu yerda paydo bo'ladi.
    </p>
  </template>
</template>
