<script setup lang="ts">
import { computed, ref } from "vue";

/*
 * Maydon nomi — oddiy matndek ko'rinadi, bosib tahrirlanadi.
 * model = foydalanuvchi o'zgartirgan nom ("" = standart nom ishlatiladi).
 *
 * Tahrir paytida qiymat qoralamada turadi: maydonni butunlay o'chirib, qaytadan yozish
 * mumkin. Standart nom faqat maydondan chiqqanda va u bo'sh qolgan bo'lsa qaytadi.
 */
const props = defineProps<{ defaultLabel: string }>();
const model = defineModel<string>({ default: "" });

const editing = ref(false);
const draft = ref("");

const shown = computed(() => (editing.value ? draft.value : model.value || props.defaultLabel));

function onFocus() {
  draft.value = model.value || props.defaultLabel;
  editing.value = true;
}

function onInput(e: Event) {
  draft.value = (e.target as HTMLInputElement).value;
  // Bo'sh qoralama vaqtida rezyumeda standart nom ko'rinib turadi
  model.value = draft.value.trim();
}

function onBlur() {
  const v = draft.value.trim();
  // Bo'sh yoki standart bilan bir xil bo'lsa — o'zgartirish saqlanmaydi
  model.value = v === props.defaultLabel ? "" : v;
  editing.value = false;
}
</script>

<template>
  <!--
    Kenglik matnning aniq o'lchamiga teng: yashirin nusxa (::after, data-value) va input
    bitta grid katagida turadi. `size` atributi belgilar soniga qarab taxmin qiladi va
    matn chetga yetmaydi yoki kesiladi — shuning uchun ishlatilmaydi.
  -->
  <span class="editable-label" :data-value="shown || defaultLabel">
    <input
      class="field-label-input"
      size="1"
      :value="shown"
      :placeholder="defaultLabel"
      :title="`Maydon nomi (standart: ${defaultLabel})`"
      aria-label="Maydon nomi"
      @focus="onFocus"
      @input="onInput"
      @blur="onBlur"
      @keydown.enter="($event.target as HTMLInputElement).blur()"
    />
  </span>
</template>
