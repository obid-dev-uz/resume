<script setup lang="ts">
/*
 * Tartiblash tugmalari: ↑ (yuqoriga) va ↓ (pastga). Qatorlar, yozuvlar va bo'lim kartalarida
 * ✕ ning chap tomonida turadi. Birinchi elementda ↑, oxirgisida ↓ bosilmaydi.
 */
defineProps<{ index: number; count: number }>();
const emit = defineEmits<{ move: [delta: -1 | 1] }>();
</script>

<template>
  <button
    type="button"
    class="icon-btn"
    title="Yuqoriga"
    aria-label="Yuqoriga surish"
    :disabled="index === 0"
    @click="emit('move', -1)"
  >
    ↑
  </button>
  <button
    type="button"
    class="icon-btn"
    title="Pastga"
    aria-label="Pastga surish"
    :disabled="index === count - 1"
    @click="emit('move', 1)"
  >
    ↓
  </button>
</template>
