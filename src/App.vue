<script setup lang="ts">
/*
 * Sahifalar router orqali (src/router). Har bir rezyume muharriri alohida yaratiladi (`key`):
 * bir rezyumening forma holati (ochiq bo'limlar va h.k.) boshqasiga o'tmaydi.
 * Shablonlar oynasi shu rezyumening ichki route'i — muharrir qayta yaratilmaydi.
 */
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <component :is="Component" :key="route.params.id ?? route.name" />
  </RouterView>
</template>
