<script setup lang="ts">
import { computed } from "vue";
import { ICONS, iconId } from "../lib/icons";

const props = defineProps<{ name: string }>();

// Faqat ICONS dagi statik SVG chiziladi; noma'lum nom bo'sh qoladi
const svg = computed(() => ICONS[iconId(props.name)]?.svg ?? "");
</script>

<template>
  <svg
    v-if="svg"
    class="app-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="svg"
  />
</template>
