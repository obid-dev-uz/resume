<script setup lang="ts">
import { ref } from "vue";
import type { PersonalDetails } from "../types/resume";
import { FIXED_BLOCK_TITLES, PERSONAL_FIELD_LABELS as L } from "../lib/sections";
import { readPhoto } from "../lib/files";
import EditableLabel from "./EditableLabel.vue";

/** Profil: rasm, ism, familiya, lavozim ("O'zim haqimda" — alohida SummaryForm kartasida) */
const props = defineProps<{ personal: PersonalDetails }>();

const fileInput = ref<HTMLInputElement | null>(null);
const photoError = ref("");
/** Sahifa ochilganda (yangilanganda) yig'ilgan holda */
const open = ref(false);

async function onPhoto(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  photoError.value = "";
  try {
    props.personal.photo = await readPhoto(file);
  } catch (err) {
    photoError.value = err instanceof Error ? err.message : String(err);
  }
}

</script>

<template>
  <section class="card">
    <header class="card-head">
      <button class="collapse-btn" type="button" :title="open ? 'Yig\'ish' : 'Ochish'" @click="open = !open">
        <span class="chev" :class="{ open }">›</span>
      </button>
      <input
        v-model="personal.title"
        class="title-input"
        aria-label="Bo'lim sarlavhasi"
        :placeholder="FIXED_BLOCK_TITLES.personal"
        @blur="personal.title = personal.title.trim() || FIXED_BLOCK_TITLES.personal"
      />
    </header>

    <div v-show="open" class="card-body">
      <div class="flex gap-3.5 phone:flex-col phone:gap-2.5">
        <div class="flex flex-col items-center gap-1 phone:items-start">
          <!-- "Ism", "Familiya" kabi tepada label; ichida faqat katta "+" -->
          <EditableLabel v-model="personal.fieldLabels.photo" :default-label="L.photo" class="self-start" />
          <div class="relative">
            <button
              type="button"
              class="h-[118px] w-[104px] cursor-pointer overflow-hidden rounded-lg border border-dashed border-line bg-surface-2 p-0 text-muted hover:border-brand hover:text-brand"
              :title="personal.photo ? 'Rasmni almashtirish' : 'Rasm tanlash'"
              :aria-label="personal.photo ? 'Rasmni almashtirish' : 'Rasm tanlash'"
              @click="fileInput?.click()"
            >
              <img v-if="personal.photo" :src="personal.photo" alt="" class="size-full object-cover" />
              <span v-else class="text-[34px] leading-none font-light" aria-hidden="true">+</span>
            </button>
            <!-- Rasm ustidagi tugma emas, yonma-yon: bosilganda fayl oynasi ochilmaydi -->
            <button
              v-if="personal.photo"
              type="button"
              class="absolute top-1 right-1 grid size-[22px] cursor-pointer place-items-center rounded-full border-0 bg-[rgba(20,24,31,0.6)] p-0 text-[11px] leading-none text-white transition-colors hover:bg-danger focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
              title="Rasmni olib tashlash"
              aria-label="Rasmni olib tashlash"
              @click="personal.photo = ''"
            >
              ✕
            </button>
          </div>
          <input ref="fileInput" type="file" accept="image/*" hidden @change="onPhoto" />
          <p v-if="photoError" class="error">{{ photoError }}</p>
        </div>

        <!--
          F.I.Sh. tartibida: Familiya, Ism, Otasining ismi; ostida Lavozim.
          Maydon nomlari bosib o'zgartiriladi (kalitlar o'zgarmaydi: lastName, firstName, middleName, jobTitle)
        -->
        <div class="grid min-w-0 flex-1 grid-cols-3 gap-x-3 gap-y-2.5 phone:grid-cols-1">
          <div class="field">
            <EditableLabel v-model="personal.fieldLabels.lastName" :default-label="L.lastName" />
            <input
              v-model="personal.lastName"
              autocomplete="family-name"
              :aria-label="personal.fieldLabels.lastName || L.lastName"
            />
          </div>
          <div class="field">
            <EditableLabel v-model="personal.fieldLabels.firstName" :default-label="L.firstName" />
            <input
              v-model="personal.firstName"
              autocomplete="given-name"
              :aria-label="personal.fieldLabels.firstName || L.firstName"
            />
          </div>
          <div class="field">
            <EditableLabel v-model="personal.fieldLabels.middleName" :default-label="L.middleName" />
            <input
              v-model="personal.middleName"
              autocomplete="additional-name"
              :aria-label="personal.fieldLabels.middleName || L.middleName"
            />
          </div>
          <div class="field col-span-3 phone:col-span-1">
            <EditableLabel v-model="personal.fieldLabels.jobTitle" :default-label="L.jobTitle" />
            <input
              v-model="personal.jobTitle"
              placeholder="Masalan: Flutter Developer"
              :aria-label="personal.fieldLabels.jobTitle || L.jobTitle"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
