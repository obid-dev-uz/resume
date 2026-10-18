<script setup lang="ts">
import { ref } from "vue";
import type { FieldsBlock } from "../types/resume";
import FieldList from "./FieldList.vue";

/*
 * "Nom: qiymat" qatorlaridan iborat doimiy blok formasi: Shaxsiy ma'lumotlar, Kontaktlar,
 * Qo'shimcha ma'lumotlar.
 * Sarlavhasi tahrirlanadi; boshqa bo'limlar kabi chapdagi tutqichdan sudrab suriladi, ✕ bilan olib tashlanadi va "Bo'lim qo'shish"dan
 * qaytariladi. Qatorlar o'chirilmaydi (hidden: true), qaytarilganda avvalgidek joyida bo'ladi.
 */
const props = defineProps<{
  block: FieldsBlock<string>;
  defaultTitle: string;
  labelPlaceholder: string;
  addLabel: string;
  /** "Bo'lim qo'shish"dan endi qaytarilgan blok ochiq chiqadi; yangilanganda hammasi yig'ilgan */
  startOpen?: boolean;
}>();

const open = ref(props.startOpen);
</script>

<template>
  <section class="card">
    <header class="card-head">
      <button class="collapse-btn" type="button" :title="open ? 'Yig\'ish' : 'Ochish'" @click="open = !open">
        <span class="chev" :class="{ open }">›</span>
      </button>
      <input
        v-model="block.title"
        class="title-input"
        aria-label="Bo'lim sarlavhasi"
        :placeholder="defaultTitle"
        @blur="block.title = block.title.trim() || defaultTitle"
      />
      <div class="flex gap-0.5">
        <!-- Bo'limni yuqoriga/pastga surish (↑/↓, ResumeEditor beradi) -->
        <slot name="move" />
        <button type="button" class="icon-btn danger" title="Bo'limni olib tashlash" @click="block.hidden = true">
          ✕
        </button>
      </div>
    </header>

    <div v-show="open" class="card-body">
      <FieldList
        :items="block.items"
        :label-placeholder="labelPlaceholder"
        value-placeholder="Qiymati"
        :add-label="addLabel"
        with-links
      />
    </div>
  </section>
</template>
