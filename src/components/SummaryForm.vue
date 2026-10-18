<script setup lang="ts">
import { computed, ref } from "vue";
import type { PersonalDetails } from "../types/resume";
import { SUMMARY_DEFAULT_LABEL } from "../lib/sections";

/*
 * "O'zim haqimda" — alohida karta: boshqa bo'limlar kabi chapdagi tutqichdan sudrab suriladi, ✕ bilan olib
 * tashlanadi (matn o'chmaydi, summaryHidden) va "Bo'lim qo'shish"dan qaytariladi. Ma'lumot joyi o'zgarmagan:
 * matn personal.summary da, sarlavhasi (rezyumedagi bo'lim nomi ham) personal.fieldLabels.summary da.
 */
const props = defineProps<{
  personal: PersonalDetails;
  /** "Bo'lim qo'shish"dan endi qaytarilgan bo'lsa ochiq chiqadi */
  startOpen?: boolean;
}>();

/** Standart nom bilan bir xil yoki bo'sh bo'lsa hech narsa saqlanmaydi (fieldLabels faqat o'zgarganlar) */
const title = computed({
  get: () => props.personal.fieldLabels.summary ?? SUMMARY_DEFAULT_LABEL,
  set: (v: string) => {
    props.personal.fieldLabels.summary = v;
  },
});

function onTitleBlur() {
  const t = props.personal.fieldLabels.summary?.trim();
  if (!t || t === SUMMARY_DEFAULT_LABEL) delete props.personal.fieldLabels.summary;
  else props.personal.fieldLabels.summary = t;
}

/** Sahifa ochilganda (yangilanganda) yig'ilgan holda */
const open = ref(props.startOpen);
</script>

<template>
  <section class="card">
    <header class="card-head">
      <button class="collapse-btn" type="button" :title="open ? 'Yig\'ish' : 'Ochish'" @click="open = !open">
        <span class="chev" :class="{ open }">›</span>
      </button>
      <!-- Bo'sh qoldirilsa standart nom qaytadi -->
      <input
        v-model="title"
        class="title-input"
        aria-label="Bo'lim sarlavhasi"
        :placeholder="SUMMARY_DEFAULT_LABEL"
        @blur="onTitleBlur"
      />
      <div class="flex gap-0.5">
        <!-- Bo'limni yuqoriga/pastga surish (↑/↓, ResumeEditor beradi) -->
        <slot name="move" />
        <button
          type="button"
          class="icon-btn danger"
          title="Bo'limni olib tashlash"
          @click="personal.summaryHidden = true"
        >
          ✕
        </button>
      </div>
    </header>

    <div v-show="open" class="card-body">
      <textarea
        v-model="personal.summary"
        rows="5"
        :aria-label="personal.fieldLabels.summary || SUMMARY_DEFAULT_LABEL"
      />
    </div>
  </section>
</template>
