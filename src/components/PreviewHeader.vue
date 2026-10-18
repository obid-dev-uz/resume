<script setup lang="ts">
import type { Resume } from "../types/resume";
import type { PreviewModel } from "../composables/usePreviewModel";
import PreviewFields from "./PreviewFields.vue";

/** Sahifa tepasidagi sarlavha (faqat 1-sahifada): rasm, ism, lavozim, bir ustunlilarda kontaktlar */
defineProps<{ resume: Resume; m: PreviewModel }>();
</script>

<template>
  <header class="pv-header">
    <img v-if="m.photo.value" :src="m.photo.value" class="pv-photo" alt="" />
    <!-- pv-with-doc-title: hujjat nomi bor (Rasmiy shabloni tuzilmasi uchun; :has() eski WebView'da yo'q) -->
    <div class="pv-header-text" :class="{ 'pv-with-doc-title': m.docTitle.value }">
      <p v-if="m.docTitle.value" class="pv-doc-title">{{ m.docTitle.value }}</p>
      <h1 class="pv-name">{{ m.fullName.value || "Ism Familiya" }}</h1>
      <p v-if="m.p.value.jobTitle" class="pv-job">{{ m.p.value.jobTitle }}</p>
      <!-- Bir ustunli shablonlarda bloklar sarlavhada, qatorma-qator (formadagi tartibda) -->
      <PreviewFields v-for="key in m.headerBlocks.value" :key="key" :fields="resume[key].items" inline />
    </div>
  </header>
</template>
