<script setup lang="ts">
import { computed, ref } from "vue";
import type { Section } from "../types/resume";
import {
  LICENSE_CATEGORIES,
  LICENSE_FIELD_LABELS as LIC,
  SECTION_DEFS,
  createListItem,
  createRatedItem,
  createTimelineItem,
  DEGREE_SUGGESTIONS,
  timelineHeading,
  createRelativeItem,
  RELATION_SUGGESTIONS,
  RELATIVE_FIELD_LABELS as REL,
  relativeWork,
  relativeLabel,
  currentLabel,
  defaultTimelineLabel,
  sectionHasContent,
  timelineLabel,
} from "../lib/sections";
import { formatPartialDateShort, formatPeriod } from "../lib/format";
import EditableLabel from "./EditableLabel.vue";
import DateInput from "./DateInput.vue";
import DateRangeInput from "./DateRangeInput.vue";
import MonthInput from "./MonthInput.vue";
import MoveButtons from "./MoveButtons.vue";
import { moveInList } from "../lib/move";

/** startOpen — endi qo'shilgan bo'lim ochiq chiqadi; sahifa yangilanganda hammasi yig'ilgan */
const props = defineProps<{ section: Section; startOpen?: boolean }>();
const emit = defineEmits<{ remove: [] }>();

const def = computed(() => SECTION_DEFS[props.section.type]);
const open = ref(props.startOpen);
/** Timeline yozuvlaridan qaysilari ochiq turgani */
const expanded = ref(new Set<string>());

function toggle(id: string) {
  if (expanded.value.has(id)) expanded.value.delete(id);
  else expanded.value.add(id);
}

function addItem() {
  const s = props.section;
  if (s.kind === "timeline") {
    const item = createTimelineItem();
    s.items.push(item);
    expanded.value.add(item.id);
  } else if (s.kind === "rated") {
    s.items.push(createRatedItem(def.value.levelRequired ? 1 : 0));
  } else if (s.kind === "list") {
    s.items.push(createListItem());
  } else if (s.kind === "relatives") {
    const item = createRelativeItem();
    s.items.push(item);
    expanded.value.add(item.id);
  }
}

/** Yozuvni bir pog'ona yuqoriga/pastga surish (↑/↓ tugmalari) — barcha ro'yxatli bo'limlar */
function moveItem(index: number, delta: -1 | 1) {
  const s = props.section;
  if ("items" in s) moveInList(s.items as unknown[], index, delta);
}

function removeItem(index: number) {
  const s = props.section;
  if (!("items" in s)) return;
  s.items.splice(index, 1);
}

function confirmRemove() {
  const s = props.section;
  if (!sectionHasContent(s) || confirm(`"${s.title}" bo'limi o'chirilsinmi?`)) emit("remove");
}
</script>

<template>
  <section class="card">
    <header class="card-head">
      <button class="collapse-btn" type="button" :title="open ? 'Yig\'ish' : 'Ochish'" @click="open = !open">
        <span class="chev" :class="{ open }">›</span>
      </button>
      <input
        v-model="section.title"
        class="title-input"
        aria-label="Bo'lim sarlavhasi"
        :placeholder="def.title"
        @blur="section.title = section.title.trim() || def.title"
      />
      <div class="flex gap-0.5">
        <!-- Bo'limni yuqoriga/pastga surish (↑/↓, ResumeEditor beradi) -->
        <slot name="move" />
        <button type="button" class="icon-btn danger" title="Bo'limni o'chirish" @click="confirmRemove">✕</button>
      </div>
    </header>

    <div v-show="open" class="card-body">
      <!-- Matnli bo'lim -->
      <div v-if="section.kind === 'text'" class="field">
        <EditableLabel v-model="section.fieldLabels.content" :default-label="def.contentLabel ?? 'Matn'" />
        <textarea
          v-model="section.content"
          rows="5"
          :aria-label="section.fieldLabels.content || def.contentLabel || 'Matn'"
        />
      </div>

      <!-- Ish, ta'lim, kurslar va h.k. -->
      <template v-else-if="section.kind === 'timeline'">
        <div class="flex flex-col gap-3">
          <div
            v-for="(item, i) in section.items"
            :key="item.id"
            class="rounded-lg border border-line"
          >
            <div class="flex items-center gap-0.5 px-1.5 py-1">
              <button type="button" class="collapse-btn min-w-0 flex-1" @click="toggle(item.id)">
                <span class="chev" :class="{ open: expanded.has(item.id) }">›</span>
                <span class="flex min-w-0 flex-col">
                  <strong class="truncate">{{ timelineHeading(item) || "(nomsiz)" }}</strong>
                  <small class="truncate text-muted">
                    {{ [item.subtitle, formatPeriod(item.startDate, item.endDate, item.current, currentLabel(section))].filter(Boolean).join(" · ") }}
                  </small>
                </span>
              </button>
              <MoveButtons v-if="section.items.length > 1" :index="i" :count="section.items.length" @move="(d) => moveItem(i, d)" />
              <button type="button" class="icon-btn danger" title="O'chirish" @click="removeItem(i)">✕</button>
            </div>

            <!-- Maydon nomlari bosib o'zgartiriladi; o'zgarish shu bo'limdagi barcha yozuvlarga tegishli -->
            <!--
              12 ustunli grid, 8/4:
                [sarlavha (mutaxassislik)] [daraja — faqat Ta'lim]
                [tashkilot / o'quv muassasasi] [shahar]
                [boshlanish] [tugash] [hozirgacha]
                [tavsif]
            -->
            <div v-if="expanded.has(item.id)" class="grid grid-cols-12 items-end gap-x-3 gap-y-2.5 px-3 pt-1 pb-3 phone:px-2 phone:pb-2.5">
              <div class="field" :class="def.degree ? 'col-span-8 phone:col-span-12' : 'col-span-12'">
                <EditableLabel v-model="section.fieldLabels.title" :default-label="defaultTimelineLabel(section, 'title')" />
                <input v-model="item.title" :aria-label="timelineLabel(section, 'title')" />
              </div>
              <div v-if="def.degree" class="field col-span-4 phone:col-span-12">
                <EditableLabel v-model="section.fieldLabels.degree" :default-label="defaultTimelineLabel(section, 'degree')" />
                <input
                  v-model="item.degree"
                  :list="`degrees-${section.id}`"
                  :aria-label="timelineLabel(section, 'degree')"
                />
              </div>

              <div class="field" :class="def.hiddenFields?.includes('city') ? 'col-span-12' : 'col-span-8 phone:col-span-12'">
                <EditableLabel v-model="section.fieldLabels.subtitle" :default-label="defaultTimelineLabel(section, 'subtitle')" />
                <input v-model="item.subtitle" :aria-label="timelineLabel(section, 'subtitle')" />
              </div>
              <div v-if="!def.hiddenFields?.includes('city')" class="field col-span-4 phone:col-span-12">
                <EditableLabel v-model="section.fieldLabels.city" :default-label="defaultTimelineLabel(section, 'city')" />
                <input v-model="item.city" :aria-label="timelineLabel(section, 'city')" />
              </div>

              <div class="field col-span-4 phone:col-span-6 [&>.date-field]:w-auto">
                <EditableLabel v-model="section.fieldLabels.startDate" :default-label="defaultTimelineLabel(section, 'startDate')" />
                <MonthInput v-model="item.startDate" :aria-label="timelineLabel(section, 'startDate')" />
              </div>
              <div class="field col-span-4 phone:col-span-6 [&>.date-field]:w-auto">
                <EditableLabel v-model="section.fieldLabels.endDate" :default-label="defaultTimelineLabel(section, 'endDate')" />
                <MonthInput
                  v-model="item.endDate"
                  :disabled="item.current"
                  :aria-label="timelineLabel(section, 'endDate')"
                />
              </div>
              <div class="check col-span-4 phone:col-span-12 phone:pt-0">
                <input v-model="item.current" type="checkbox" :aria-label="timelineLabel(section, 'current')" />
                <EditableLabel v-model="section.fieldLabels.current" :default-label="defaultTimelineLabel(section, 'current')" />
              </div>

              <div class="field col-span-12">
                <EditableLabel
                  v-model="section.fieldLabels.description"
                  :default-label="defaultTimelineLabel(section, 'description')"
                />
                <textarea v-model="item.description" rows="4" :aria-label="timelineLabel(section, 'description')" />
              </div>
            </div>
          </div>
        </div>
      </template>

      <datalist v-if="section.kind === 'timeline' && def.degree" :id="`degrees-${section.id}`">
        <option v-for="d in DEGREE_SUGGESTIONS" :key="d" :value="d" />
      </datalist>

      <!-- Ko'nikmalar, tillar -->
      <template v-else-if="section.kind === 'rated'">
        <!--
          Qatorlar ✕ yonidagi ↑/↓ tugmalari bilan tartiblanadi.
          Nom va daraja har doim yonma-yon (minimal 256px, Kontaktlar kabi); sig'masa ro'yxatning
          o'zi x bo'ylab aylanadi.
        -->
        <div class="flex flex-col gap-3 overflow-x-auto pb-1">
          <div
            v-for="(item, i) in section.items"
            :key="item.id"
            class="flex min-w-fit items-center gap-2"
          >
            <input v-model="item.name" class="min-w-[256px] flex-1" placeholder="Nomi" />
            <select v-model.number="item.level" class="w-[256px] flex-none self-stretch">
              <option v-if="!def.levelRequired" :value="0">Daraja ko'rsatilmasin</option>
              <option v-for="(label, l) in def.levels" :key="l" :value="l + 1">{{ label }}</option>
            </select>
            <MoveButtons v-if="section.items.length > 1" :index="i" :count="section.items.length" @move="(d) => moveItem(i, d)" />
            <button type="button" class="icon-btn danger" title="O'chirish" @click="removeItem(i)">✕</button>
          </div>
        </div>
      </template>

      <!-- Yaqin qarindoshlari: har bir qarindosh — yig'iladigan karta; ustun nomlari o'zgartiriladi -->
      <template v-else-if="section.kind === 'relatives'">
        <div class="flex flex-col gap-3">
          <div
            v-for="(item, i) in section.items"
            :key="item.id"
            class="rounded-lg border border-line"
          >
            <div class="flex items-center gap-0.5 px-1.5 py-1">
              <button type="button" class="collapse-btn min-w-0 flex-1" @click="toggle(item.id)">
                <span class="chev" :class="{ open: expanded.has(item.id) }">›</span>
                <span class="flex min-w-0 flex-col">
                  <strong class="truncate">{{ [item.relation, item.fullName].filter(Boolean).join(" — ") || "(nomsiz)" }}</strong>
                  <small class="truncate text-muted">
                    {{ [formatPartialDateShort(item.birthDate), item.deceased ? relativeLabel(section, "deceased").toLowerCase() : relativeWork(item)].filter(Boolean).join(" · ") }}
                  </small>
                </span>
              </button>
              <MoveButtons v-if="section.items.length > 1" :index="i" :count="section.items.length" @move="(d) => moveItem(i, d)" />
              <button type="button" class="icon-btn danger" title="O'chirish" @click="removeItem(i)">✕</button>
            </div>

            <!-- 12 ustunli grid, 4/8: sana "Qarindoshligi" bilan, joy "F.I.Sh." bilan bir chiziqda -->
            <div v-if="expanded.has(item.id)" class="grid grid-cols-12 items-end gap-x-3 gap-y-2.5 px-3 pt-1 pb-3 phone:px-2 phone:pb-2.5">
              <div class="field col-span-4 phone:col-span-12">
                <EditableLabel v-model="section.fieldLabels.relation" :default-label="REL.relation" />
                <input
                  v-model="item.relation"
                  :list="`relations-${section.id}`"
                  :aria-label="section.fieldLabels.relation || REL.relation"
                />
              </div>
              <div class="field col-span-8 phone:col-span-12">
                <EditableLabel v-model="section.fieldLabels.fullName" :default-label="REL.fullName" />
                <input v-model="item.fullName" :aria-label="section.fieldLabels.fullName || REL.fullName" />
              </div>

              <div class="field col-span-4 phone:col-span-12 [&>.date-field]:w-auto">
                <EditableLabel v-model="section.fieldLabels.birthDate" :default-label="REL.birthDate" />
                <!-- dd/mm/yyyy (yoki faqat yil), yonida kalendar -->
                <DateInput v-model="item.birthDate" :aria-label="section.fieldLabels.birthDate || REL.birthDate" />
              </div>
              <div class="field col-span-8 phone:col-span-12">
                <EditableLabel v-model="section.fieldLabels.birthPlace" :default-label="REL.birthPlace" />
                <input
                  v-model="item.birthPlace"
                  :aria-label="section.fieldLabels.birthPlace || REL.birthPlace"
                />
              </div>

              <!-- 4/8: chapda lavozim, o'ngda ish joyi (vafot etgan bo'lsa — ilgari) -->
              <div class="field col-span-4 phone:col-span-12">
                <EditableLabel v-model="section.fieldLabels.position" :default-label="REL.position" />
                <input
                  v-model="item.position"
                  :aria-label="section.fieldLabels.position || REL.position"
                />
              </div>
              <div class="field col-span-8 phone:col-span-12">
                <EditableLabel v-model="section.fieldLabels.workplace" :default-label="REL.workplace" />
                <input
                  v-model="item.workplace"
                  :aria-label="section.fieldLabels.workplace || REL.workplace"
                />
              </div>
              <div class="field col-span-12">
                <!-- Chapda "Turar joyi", o'ngda "Vafot etgan" belgisi; belgi maydonlarni almashtirmaydi -->
                <div class="flex min-h-[22px] items-center justify-between gap-2">
                  <EditableLabel v-model="section.fieldLabels.address" :default-label="REL.address" class="flex-[0_1_auto]" />
                  <!-- Katakcha belgini almashtiradi, yozuvni bosib esa nomi o'zgartiriladi -->
                  <div
                    class="flex flex-none cursor-pointer items-center gap-1.5 text-label whitespace-nowrap"
                    :class="item.deceased ? 'text-fg' : 'text-muted'"
                  >
                    <input
                      v-model="item.deceased"
                      class="m-0 cursor-pointer accent-brand"
                      type="checkbox"
                      :aria-label="section.fieldLabels.deceased || REL.deceased"
                    />
                    <EditableLabel v-model="section.fieldLabels.deceased" :default-label="REL.deceased" />
                  </div>
                </div>
                <textarea
                  v-model="item.address"
                  rows="2"
                  :aria-label="section.fieldLabels.address || REL.address"
                />
              </div>
            </div>
          </div>
        </div>
        <datalist :id="`relations-${section.id}`">
          <option v-for="r in RELATION_SUGGESTIONS" :key="r" :value="r" />
        </datalist>
      </template>

      <!-- Haydovchilik guvohnomasi -->
      <template v-else-if="section.kind === 'license'">
        <!-- Maydon nomlari bosib o'zgartiriladi; rezyumeda ham shu nomlar chiqadi -->
        <div class="field">
          <EditableLabel v-model="section.fieldLabels.categories" :default-label="LIC.categories" />
          <div class="flex flex-wrap gap-1.5">
            <label
              v-for="c in LICENSE_CATEGORIES"
              :key="c"
              class="license-cat relative min-w-[46px] cursor-pointer rounded-lg border px-2.5 py-[5px] text-center font-semibold select-none"
              :class="section.categories.includes(c) ? 'border-brand bg-brand text-white' : 'border-line bg-surface-2'"
            >
              <input v-model="section.categories" class="pointer-events-none absolute opacity-0" type="checkbox" :value="c" />
              <!-- Klaviatura fokusi ramkasi (app.css: input:focus-visible + .focus-ring) -->
              <span class="focus-ring pointer-events-none absolute -inset-px rounded-lg" aria-hidden="true" />
              {{ c }}
            </label>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-x-3 gap-y-2.5 phone:grid-cols-1">
          <div class="field">
            <EditableLabel v-model="section.fieldLabels.validity" :default-label="LIC.validity" />
            <DateRangeInput
              v-model:start="section.issueDate"
              v-model:end="section.expiryDate"
              :aria-label="section.fieldLabels.validity || LIC.validity"
            />
          </div>
          <div class="check">
            <input
              v-model="section.hasOwnCar"
              type="checkbox"
              :aria-label="section.fieldLabels.hasOwnCar || LIC.hasOwnCar"
            />
            <EditableLabel v-model="section.fieldLabels.hasOwnCar" :default-label="LIC.hasOwnCar" />
          </div>
          <div class="field col-span-2 phone:col-span-1">
            <EditableLabel v-model="section.fieldLabels.note" :default-label="LIC.note" />
            <input
              v-model="section.note"
              placeholder="Masalan: 8 yillik avariyasiz haydash tajribasi"
              :aria-label="section.fieldLabels.note || LIC.note"
            />
          </div>
        </div>
      </template>

      <!-- Oddiy ro'yxat -->
      <template v-else-if="section.kind === 'list'">
        <div class="flex flex-col gap-3">
          <div
            v-for="(item, i) in section.items"
            :key="item.id"
            class="flex items-center gap-2"
          >
            <input v-model="item.text" class="min-w-0 flex-1" :placeholder="def.placeholder" />
            <MoveButtons v-if="section.items.length > 1" :index="i" :count="section.items.length" @move="(d) => moveItem(i, d)" />
            <button type="button" class="icon-btn danger" title="O'chirish" @click="removeItem(i)">✕</button>
          </div>
        </div>
      </template>

      <button
        v-if="'items' in section"
        type="button"
        class="add-btn"
        :title="`${section.title || def.title}: yangi yozuv qo'shish`"
        :aria-label="`${section.title || def.title}: yangi yozuv qo'shish`"
        @click="addItem"
      >
        +
      </button>
    </div>
  </section>
</template>
