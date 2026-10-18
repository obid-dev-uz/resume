<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useResumesStore } from "../stores/resumes";
import ResumeEditor from "../components/ResumeEditor.vue";

/*
 * /resume/:id — ochiq rezyume. Qaysi rezyume ochiqligini router belgilaydi (src/router):
 * URL'dagi `id` store'da ochiladi, muharrirga faqat shu rezyume beriladi.
 */
const { active } = storeToRefs(useResumesStore());
</script>

<template>
  <ResumeEditor v-if="active" :resume="active" />
</template>
