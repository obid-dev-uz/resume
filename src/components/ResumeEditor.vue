<script setup lang="ts">
import { computed, nextTick, reactive, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import type { Resume, SectionType } from "../types/resume";
import {
  BLOCK_KEYS,
  FIXED_BLOCK_TITLES,
  SECTION_DEFS,
  createSection,
  SUMMARY_DEFAULT_LABEL,
  SUMMARY_KEY,
  isBlockKey,
  type BlockKey,
} from "../lib/sections";
import { downloadJson } from "../lib/files";
import { useResumesStore } from "../stores/resumes";
import { useUiStore } from "../stores/ui";
import PersonalDetailsForm from "./PersonalDetailsForm.vue";
import SummaryForm from "./SummaryForm.vue";
import FieldsBlockForm from "./FieldsBlockForm.vue";
import SectionEditor from "./SectionEditor.vue";
import MoveButtons from "./MoveButtons.vue";
import ExportSheet from "./ExportSheet.vue";
import { exportPdf, isAndroidApp, type PdfAction } from "../lib/androidBridge";
import { printDocument } from "../lib/print";
import ResumePreview from "./ResumePreview.vue";
import ColorPicker from "./ColorPicker.vue";
import { getTemplate } from "../templates";
import JsonView from "./JsonView.vue";
import { isDemo } from "../lib/demo";

const props = defineProps<{ resume: Resume }>();
const store = useResumesStore();
const { saveStatus, flush, nextDefaultName, duplicate } = store;
const route = useRoute();
const router = useRouter();

/** Ro'yxatga qaytish: router chiqishda kutilayotgan o'zgarishni yozadi va rezyumeni yopadi */
function close() {
  router.push({ name: "resumes" });
}
/** Interfeys sozlamalari (preview, A4/JSON, mobil tab) — rezyume mazmuni emas */
const ui = useUiStore();
const { previewVisible, viewMode, mobileTab } = storeToRefs(ui);
/** Namuna rezyume faqat ko'riladi: formalar o'rniga nusxa olish taklifi (src/lib/demo.ts) */
const demo = computed(() => isDemo(props.resume));

// Har bir rezyume forma tabidan ochiladi (oldin tab muharrirning o'z holati edi), namuna — preview'dan
mobileTab.value = demo.value ? "preview" : "edit";

/** Namunadan nusxa olib, darhol shu nusxani tahrirlashga ochish */
function copyDemo() {
  const name = prompt("Yangi rezyume nomi:", nextDefaultName());
  if (name === null) return;
  const id = duplicate(props.resume.id, name.trim() || nextDefaultName());
  if (id) router.push({ name: "editor", params: { id } });
}

const COLORS = ["#2f5d8a", "#1f6f5c", "#8a2f4a", "#44546a", "#b8651b", "#5b3f8c", "#222222", "#0e7490"];
const FONTS = [
  { label: "Sans (Helvetica)", value: "Inter, Helvetica, Arial, sans-serif" },
  { label: "Serif (Georgia)", value: "Georgia, 'Times New Roman', serif" },
  { label: "Trebuchet", value: "'Trebuchet MS', 'DejaVu Sans', sans-serif" },
  { label: "Verdana", value: "Verdana, 'DejaVu Sans', sans-serif" },
];

/**
 * Bir martalik bo'limlar takrorlanmaydi, "Maxsus bo'lim"ni istalgancha qo'shish mumkin.
 * Eski (legacy) va vaqtincha yashirilgan (hidden) bo'limlar taklif qilinmaydi.
 */
const addable = computed(() =>
  (Object.keys(SECTION_DEFS) as SectionType[]).filter((t) => {
    const def = SECTION_DEFS[t];
    if (def.legacy || def.hidden) return false;
    return t === "custom" || !props.resume.sections.some((s) => s.type === t);
  }),
);

/**
 * Formadagi kartalar: Profil doim tepada, qolgani — bloklar va bo'limlar `resume.order`
 * tartibida. Olib tashlangan (hidden) bloklar ro'yxatda yo'q, lekin tartibdagi joyini saqlaydi:
 * qaytarilganda o'sha joyda paydo bo'ladi.
 */
const BLOCK_FORMS: Record<
  BlockKey,
  { labelPlaceholder: string; addLabel: string }
> = {
  details: {
    labelPlaceholder: "Nomi (Tug'ilgan sana, Millati...)",
    addLabel: "Shaxsiy ma'lumot qo'shish",
  },
  contacts: {
    labelPlaceholder: "Nomi (Telefon, Email...)",
    addLabel: "Kontakt qo'shish",
  },
  additional: {
    labelPlaceholder: "Nomi (Harbiy xizmat...)",
    addLabel: "Ma'lumot qo'shish",
  },
};

const sectionById = computed(() => new Map(props.resume.sections.map((s) => [s.id, s])));
const editorKeys = computed(() =>
  props.resume.order.filter((k) => {
    if (k === SUMMARY_KEY) return !props.resume.personal.summaryHidden;
    return isBlockKey(k) ? !props.resume[k].hidden : sectionById.value.has(k);
  }),
);
const hiddenBlocks = computed(() => BLOCK_KEYS.filter((k) => props.resume[k].hidden));

/** Shu sessiyada qo'shilgan/qaytarilgan kartalar ochiq chiqadi; sahifa yangilanganda hammasi yig'ilgan */
const justAdded = reactive(new Set<string>());

function restoreSummary() {
  justAdded.add(SUMMARY_KEY);
  props.resume.personal.summaryHidden = false;
}

function restoreBlock(key: BlockKey) {
  justAdded.add(key);
  props.resume[key].hidden = false;
}

function addSection(type: SectionType) {
  const section = createSection(type);
  justAdded.add(section.id);
  props.resume.sections.push(section);
  props.resume.order.push(section.id);
}

/**
 * Karta formadagi `from` o'rnidan `to` o'rniga ko'chadi (↑/↓ tugmalari): `to`dagi ko'rinadigan kartaning
 * oldiga/ortiga (olib tashlangan bloklar hisobga olinmaydi, ular tartibdagi joyini saqlaydi).
 * `sections` massivi ham shu tartibga keltiriladi — JSON o'qilishi oson bo'lsin.
 */
function moveCard(from: number, to: number) {
  const keys = editorKeys.value;
  const key = keys[from];
  const target = keys[to];
  if (!key || !target || key === target) return;
  const order = props.resume.order;
  order.splice(order.indexOf(key), 1);
  order.splice(order.indexOf(target) + (to > from ? 1 : 0), 0, key);
  const rank = new Map(order.map((k, i) => [k, i]));
  props.resume.sections.sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
}

function removeSection(id: string) {
  const r = props.resume;
  r.sections.splice(r.sections.findIndex((s) => s.id === id), 1);
  r.order.splice(r.order.indexOf(id), 1);
}

function download() {
  if (viewMode.value === "json") exportJson();
  // Android WebView window.print() ni qo'llamaydi: pastdan oyna — yuklab olish yoki ulashish
  else if (isAndroidApp()) openPdfSheet();
  else printPdf();
}

/* ---- Android: PDF yuklab olish / ulashish (ExportSheet + androidBridge) ---- */
const pdfSheet = reactive({ open: false, busy: false, error: "" });

function openPdfSheet() {
  pdfSheet.error = "";
  pdfSheet.open = true;
}

async function runPdf(action: PdfAction) {
  pdfSheet.busy = true;
  pdfSheet.error = "";
  flush();
  // Varaqlar aynan PDF uchun qayta o'lchanadi (desktopda window.print oldidan ham shunday)
  window.dispatchEvent(new Event("beforeprint"));
  await nextTick();
  await new Promise((r) => setTimeout(r, 50));
  const title = document.title;
  document.title = props.resume.name;
  const result = await exportPdf(props.resume.name, action);
  document.title = title;
  pdfSheet.busy = false;
  if (result.ok) pdfSheet.open = false;
  else pdfSheet.error = result.message;
}

/*
 * Shablonlar oynasi — ichki route: /resume/:id/templates. URL orqali ochiladi, brauzer yoki
 * telefonning "orqaga" tugmasi uni yopadi. Tanlangan shablon rezyumening o'zida saqlanadi.
 */
const templateButton = ref<HTMLButtonElement | null>(null);

function openTemplates() {
  router.push({ name: "templates", params: { id: props.resume.id } });
}

/** Oyna yopilgach editorga qaytiladi va fokus uni ochgan tugmaga qaytadi */
async function closeTemplates() {
  if (route.name === "templates") {
    // Oyna editordan ochilgan bo'lsa tarixda orqaga, to'g'ridan-to'g'ri URL bilan ochilgan bo'lsa almashtiriladi
    const editorPath = router.resolve({ name: "editor", params: { id: props.resume.id } }).fullPath;
    if (window.history.state?.back === editorPath) router.back();
    else await router.replace(editorPath);
  }
  templateButton.value?.focus();
}
const templateName = computed(() => getTemplate(props.resume.settings.template).name);
/** Rang va shrift tanlangan shablonning o'ziga yoziladi — boshqa shablonlarga ta'sir qilmaydi */
const tplSettings = computed(() => props.resume.settings.templates[props.resume.settings.template]);

function fixName() {
  if (!props.resume.name.trim()) props.resume.name = "Nomsiz rezyume";
}

async function printPdf() {
  flush();
  try {
    await printDocument(props.resume.name);
  } catch (e) {
    alert(`PDF oynasini ochib bo'lmadi: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function exportJson() {
  flush();
  downloadJson(props.resume);
}

// Takrorlanadigan elementlarning Tailwind klasslari
const CHIP =
  "cursor-pointer rounded-full border border-line bg-surface px-[11px] py-[5px] text-[13px] hover:border-brand hover:text-brand";
/** A4 / JSON almashtirgich tugmasi */
const segClass = (on: boolean) => [
  "min-w-[52px] cursor-pointer rounded-md border-0 px-3 py-[5px] font-semibold",
  on ? "bg-surface text-brand shadow-[0_1px_3px_rgba(15,25,40,0.15)]" : "bg-transparent text-muted hover:text-fg",
];
/** Pastki mobil tab */
const tabClass = (on: boolean) => [
  "flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-card border-0 font-semibold",
  on ? "bg-brand-soft text-brand" : "bg-transparent text-muted",
];
</script>

<template>
  <div class="editor-layout flex h-full flex-col">
    <div class="editor-body" :class="[{ 'preview-hidden': !previewVisible }, `m-${mobileTab}`]">
      <!-- Chap ustun: tahrirlash. Sarlavhasi joyida turadi, forma ostida aylanadi -->
      <div class="editor-col no-print">
        <header class="flex flex-none flex-wrap items-center gap-x-2.5 gap-y-2 min-h-[58px] mx-4 mt-3 px-3 py-2 rounded-card border border-brand-line bg-head narrow:mx-2.5 narrow:mt-2 narrow:min-h-0 narrow:gap-x-2 narrow:gap-y-1.5 narrow:px-2 narrow:py-1.5">
          <!-- Rezyumelar ro'yxati (kartalar to'ri) — dashboard ikonkasi -->
          <button
            type="button"
            class="btn ghost icon-only"
            title="Rezyumelar"
            aria-label="Rezyumelar ro'yxatiga qaytish"
            @click="close"
          >
            <svg
              class="app-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
          </button>
          <input
            v-model="resume.name"
            :readonly="demo"
            class="min-w-[120px] max-w-[320px] flex-1 border-transparent bg-transparent font-semibold narrow:max-w-none"
            spellcheck="false"
            autocomplete="off"
            title="Rezyume nomi"
            placeholder="Rezyume nomi"
            @blur="fixName"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
          />
          <!-- Saqlash holati faqat xatoda ko'rinadi; telefonda ikkinchi qatorda -->
          <span
            v-if="saveStatus.state === 'error'"
            class="text-label text-danger phone:order-last phone:basis-full phone:text-xs"
            >Saqlanmadi: {{ saveStatus.error }}</span
          >
          <div class="ml-auto flex gap-2">
            <button
              type="button"
              class="btn narrow:hidden"
              :class="{ active: previewVisible }"
              :aria-pressed="previewVisible"
              :title="previewVisible ? 'Preview\'ni yashirish' : 'Preview\'ni ko\'rsatish'"
              @click="previewVisible = !previewVisible"
            >
              <svg
                class="app-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <template v-if="previewVisible">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </template>
                <template v-else>
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <path d="M2 2l20 20" />
                </template>
              </svg>
              Preview
            </button>
          </div>
        </header>

        <div v-if="demo" class="flex-1 overflow-y-auto px-4 pt-3 pb-4 narrow:p-2.5">
          <section class="card">
            <div class="card-body pt-3.5">
              <h2 class="text-base font-semibold">Bu namuna rezyume</h2>
              <p class="m-0 text-muted">
                Namunani o'zgartirib bo'lmaydi. Undan nusxa oling — nusxa sizning rezyumengiz bo'ladi,
                uni istalgancha tahrirlashingiz mumkin.
              </p>
              <button type="button" class="btn primary self-start" @click="copyDemo">Nusxa olib tahrirlash</button>
            </div>
          </section>
        </div>
        <div v-else class="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pt-3 pb-4 narrow:gap-2.5 narrow:p-2.5">
          <PersonalDetailsForm :personal="resume.personal" />
          <div class="flex flex-col gap-3 narrow:gap-2.5">
            <template v-for="(key, i) in editorKeys" :key="key">
              <SummaryForm
                v-if="key === SUMMARY_KEY"
                :personal="resume.personal"
                :start-open="justAdded.has(key)"
              >
                <template #move>
                  <MoveButtons :index="i" :count="editorKeys.length" @move="(d) => moveCard(i, i + d)" />
                </template>
              </SummaryForm>
              <FieldsBlockForm
                v-else-if="isBlockKey(key)"
                :block="resume[key]"
                :default-title="FIXED_BLOCK_TITLES[key]"
                :label-placeholder="BLOCK_FORMS[key].labelPlaceholder"
                :add-label="BLOCK_FORMS[key].addLabel"
                :start-open="justAdded.has(key)"
              >
                <template #move>
                  <MoveButtons :index="i" :count="editorKeys.length" @move="(d) => moveCard(i, i + d)" />
                </template>
              </FieldsBlockForm>
              <SectionEditor
                v-else
                :section="sectionById.get(key)!"
                :start-open="justAdded.has(key)"
                @remove="removeSection(key)"
              >
                <template #move>
                  <MoveButtons :index="i" :count="editorKeys.length" @move="(d) => moveCard(i, i + d)" />
                </template>
              </SectionEditor>
            </template>
          </div>

          <section class="card">
            <div class="card-body">
              <h2 class="text-[13px] font-semibold text-muted">Bo'lim qo'shish</h2>
              <div class="flex flex-wrap gap-1.5">
                <button v-if="resume.personal.summaryHidden" type="button" :class="CHIP" @click="restoreSummary">
                  + {{ resume.personal.fieldLabels.summary || SUMMARY_DEFAULT_LABEL }}
                </button>
                <button
                  v-for="k in hiddenBlocks"
                  :key="k"
                  type="button"
                  :class="CHIP"
                  @click="restoreBlock(k)"
                >
                  + {{ resume[k].title || FIXED_BLOCK_TITLES[k] }}
                </button>
                <button v-for="t in addable" :key="t" type="button" :class="CHIP" @click="addSection(t)">
                  + {{ SECTION_DEFS[t].title }}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- O'ng ustun: natija. Sarlavhada ko'rinish sozlamalari va yuklab olish -->
      <div class="preview-pane">
        <header class="no-print flex flex-none flex-wrap items-center gap-x-2.5 gap-y-2 min-h-[58px] mx-4 mt-3 px-3 py-2 rounded-card border border-brand-line bg-head narrow:mx-2.5 narrow:mt-2 narrow:min-h-0 narrow:gap-x-2 narrow:gap-y-1.5 narrow:px-2 narrow:py-1.5">
          <button
            ref="templateButton"
            type="button"
            class="btn narrow:min-w-0 narrow:flex-auto narrow:overflow-hidden"
            aria-haspopup="dialog"
            @click="openTemplates"
          >
            Shablon: <strong class="truncate">{{ templateName }}</strong>
          </button>
          <select v-model="tplSettings.fontFamily" class="w-auto narrow:min-w-0 narrow:flex-[1_1_120px]" title="Shrift">
            <option v-for="f in FONTS" :key="f.value" :value="f.value">{{ f.label }}</option>
          </select>
          <ColorPicker v-model="tplSettings.accentColor" :colors="COLORS" />
          <div class="ml-auto flex gap-2">
            <button
              type="button"
              class="btn primary icon-only"
              :title="viewMode === 'json' ? 'JSON faylni yuklab olish' : 'PDF yuklab olish'"
              :aria-label="viewMode === 'json' ? 'JSON faylni yuklab olish' : 'PDF yuklab olish'"
              @click="download"
            >
              <svg
                class="app-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
            </button>
            <div class="inline-flex rounded-[9px] border border-line bg-surface-2 p-[3px]" role="tablist" aria-label="Ko'rinish">
              <button
                type="button"
                role="tab"
                :aria-selected="viewMode === 'a4'"
                :class="segClass(viewMode === 'a4')"
                title="A4 qog'oz ko'rinishi"
                @click="viewMode = 'a4'"
              >A4</button>
              <button
                type="button"
                role="tab"
                :aria-selected="viewMode === 'json'"
                :class="segClass(viewMode === 'json')"
                title="JSON ko'rinishi"
                @click="viewMode = 'json'"
              >JSON</button>
            </div>
          </div>
        </header>
        <!-- Shablonlar oynasi: ichki route /resume/:id/templates (src/router) -->
        <RouterView v-slot="{ Component }">
          <component
            :is="Component"
            v-if="Component"
            v-model="resume.settings.template"
            class="no-print"
            :resume="resume"
            @close="closeTemplates"
          />
        </RouterView>
        <!--
          A4 har doim DOM'da va joylashuvi hisoblanadi (ekrandan tashqarida yashiriladi, display: none emas):
          sahifalash o'lchashga muhtoj, PDF esa JSON rejimida ham shu varaqlardan olinadi.
        -->
        <ResumePreview :class="{ 'is-offscreen': viewMode !== 'a4' }" :resume="resume" />
        <JsonView v-if="viewMode === 'json'" :resume="resume" />
      </div>
    </div>

    <!-- Faqat tor ekranda ko'rinadi: forma va preview o'rtasida almashish -->
    <nav
      class="no-print hidden flex-none gap-1.5 border-t border-line bg-surface px-2.5 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] narrow:flex"
      role="tablist"
      aria-label="Bo'lim"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="mobileTab === 'edit'"
        :class="tabClass(mobileTab === 'edit')"
        @click="mobileTab = 'edit'"
      >
        <svg class="app-icon size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        Tahrirlash
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="mobileTab === 'preview'"
        :class="tabClass(mobileTab === 'preview')"
        @click="mobileTab = 'preview'"
      >
        <svg class="app-icon size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Preview
      </button>
    </nav>

    <!-- Android: PDF yuklab olish yoki ulashish (pastdan chiqadigan oyna) -->
    <ExportSheet
      v-if="pdfSheet.open"
      :name="resume.name"
      :busy="pdfSheet.busy"
      :error="pdfSheet.error"
      @action="runPdf"
      @close="pdfSheet.open = false"
    />
  </div>
</template>
