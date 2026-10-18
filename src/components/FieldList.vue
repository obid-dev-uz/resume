<script setup lang="ts">
import { nextTick, ref, type Directive } from "vue";
import type { ExtraField } from "../types/resume";
import { FIELD_OPTIONS, createExtraField } from "../lib/sections";
import DateInput from "./DateInput.vue";
import IconPicker from "./IconPicker.vue";
import LinkButton from "./LinkButton.vue";
import MoveButtons from "./MoveButtons.vue";
import { moveInList } from "../lib/move";

/*
 * "Nom: qiymat" qatorlari ro'yxati — ikonkalar, ixtiyoriy havola, tartiblash, o'chirish.
 * Kontaktlar va shaxsiy ma'lumotlardagi qo'shimcha maydonlar shu komponentdan foydalanadi.
 */
const props = defineProps<{
  items: ExtraField[];
  labelPlaceholder: string;
  valuePlaceholder: string;
  /** Qo'shish tugmasining izohi (title / ekran o'quvchi uchun); berilmasa tugma chiqmaydi */
  addLabel?: string;
  /** Qiymatga havola biriktirish tugmasi */
  withLinks?: boolean;
}>();

const list = ref<HTMLElement | null>(null);

async function add() {
  props.items.push(createExtraField());
  await nextTick();
  const labels = list.value?.querySelectorAll<HTMLInputElement>(".extra-label");
  labels?.[labels.length - 1]?.focus();
}


/**
 * Qiymat ko'p qatorli bo'lishi mumkin (Enter — yangi qator). Maydon balandligi
 * matnga qarab o'zgaradi: avval "auto" qilib, keyin to'liq balandlik (scrollHeight) beriladi.
 * WebKitGTK (Tauri, Linux) `field-sizing: content`ni bilmaydi, shuning uchun JS bilan.
 * Kenglik o'zgarsa (panel torayishi) qatorlar soni ham o'zgaradi — ResizeObserver kuzatadi.
 */
function grow(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
}

const observers = new WeakMap<HTMLTextAreaElement, ResizeObserver>();
const vAutoGrow: Directive<HTMLTextAreaElement> = {
  mounted(el) {
    let width = 0;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      grow(el);
    });
    ro.observe(el);
    observers.set(el, ro);
  },
  updated: grow,
  unmounted(el) {
    observers.get(el)?.disconnect();
  },
};

function remove(index: number) {
  props.items.splice(index, 1);
}
</script>

<template>
  <!--
    Nom va qiymat har doim yonma-yon (minimal kenglik bilan). Sig'masa ro'yxatning o'zi x bo'ylab
    aylanadi; ikonka va havola oynalari fixed (useFixedPosition), shuning uchun kesilmaydi.
  -->
  <div v-if="items.length" ref="list" class="field-list-scroll flex flex-col gap-1.5 overflow-x-auto pb-1">
    <div
      v-for="(field, i) in items"
      :key="field.id"
      class="extra-item relative min-w-fit"
    >
      <div class="extra-row">
        <div class="icon-input extra-label-box w-[38%] min-w-[256px] flex-none">
          <IconPicker v-model="field.labelIcon" />
          <!-- Takliflarsiz: na ilova ro'yxati, na brauzerning avtomatik to'ldirishi -->
          <input v-model="field.label" class="extra-label" autocomplete="off" :placeholder="labelPlaceholder" />
        </div>
        <div
          class="icon-input extra-value-box min-w-[256px] flex-1"
          :class="{ 'value-text': field.input !== 'date' && !FIELD_OPTIONS[field.input] }"
        >
          <IconPicker v-model="field.valueIcon" />
          <DateInput v-if="field.input === 'date'" v-model="field.value" class="min-w-0 flex-1" :aria-label="field.label" />
          <select v-else-if="FIELD_OPTIONS[field.input]" v-model="field.value" class="min-w-0 flex-1" :aria-label="field.label">
            <option value="">–</option>
            <option v-for="o in FIELD_OPTIONS[field.input]" :key="o" :value="o">{{ o }}</option>
          </select>
          <textarea
            v-else
            v-model="field.value"
            v-auto-grow
            class="extra-value"
            rows="1"
            wrap="off"
            :placeholder="valuePlaceholder"
          />
        </div>
        <LinkButton v-if="withLinks" :disabled="field.input !== 'text'" v-model="field.link" :label="field.label" :value="field.value" />
        <MoveButtons v-if="items.length > 1" :index="i" :count="items.length" @move="(d) => moveInList(items, i, d)" />
        <!-- Standart maydonlar (Tug'ilgan sana, Jinsi): tugmalar joyida, lekin o'chirilmaydi va havola qo'yilmaydi -->
        <button
          type="button"
          class="icon-btn danger"
          :title="field.input === 'text' ? 'O\'chirish' : 'Standart maydon — o\'chirilmaydi'"
          :disabled="field.input !== 'text'"
          @click="remove(i)"
        >
          ✕
        </button>
      </div>
    </div>
  </div>

  <button
    v-if="addLabel"
    type="button"
    class="add-btn"
    :title="addLabel"
    :aria-label="addLabel"
    @click="add"
  >
    +
  </button>
</template>
