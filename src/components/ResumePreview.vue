<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toRef, watch } from "vue";
import type { Resume, TemplateId } from "../types/resume";
import { usePreviewModel } from "../composables/usePreviewModel";
import { collectBreakpoints, paginate, type PageSlice } from "../lib/paginate";
import PreviewHeader from "./PreviewHeader.vue";
import PreviewColumn from "./PreviewColumn.vue";

const props = defineProps<{
  resume: Resume;
  /** Galereyadagi kichik rasm uchun: rezyumedagidan boshqa shablon bilan chizish */
  template?: TemplateId;
  /** Kichik rasm rejimi: faqat 1-varaq, sahifalash va aylantirish yo'q */
  thumbnail?: boolean;
}>();

const m = usePreviewModel(toRef(props, "resume"), toRef(props, "template"));

/** A4 o'lchamlari 96 dpi'da */
const PAGE_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = (297 * 96) / 25.4;

const container = ref<HTMLElement | null>(null);
const scale = ref(1);

/*
 * Sahifalash (Word'dagidek):
 *   1. Rezyume ko'rinmas "o'lchov varag'i"da bir marta, cheklanmagan balandlikda chiziladi.
 *   2. Har ustunda bo'linish nuqtalari (bo'lim va yozuv boshlari) o'lchanadi.
 *   3. paginate() mazmunni A4 varaqlarga taqsimlaydi.
 *   4. Har bir ko'rinadigan varaq ustun mazmunini "oyna" orqali ko'rsatadi: o'sha varaqqa
 *      tushgan oraliq [start, end) — ortig'i kesiladi. PDF ham aynan shu varaqlardan chiqadi.
 */
const measurePage = ref<HTMLElement | null>(null);
const measureSide = ref<HTMLElement | null>(null);
const measureMain = ref<HTMLElement | null>(null);

type Page = { side: PageSlice | null; main: PageSlice };
const pages = ref<Page[]>([{ side: null, main: { start: 0, end: Infinity } }]);

function px(el: Element, prop: "paddingTop" | "paddingBottom"): number {
  return parseFloat(getComputedStyle(el)[prop]) || 0;
}

/** Bitta ustun uchun varaqlar: 1-varaqda sarlavha joyi ayiriladi, keyingilarida faqat chetlar */
function sliceColumn(content: HTMLElement): PageSlice[] {
  const page = measurePage.value!;
  const column = content.parentElement!;
  const pageTop = page.getBoundingClientRect().top;
  const contentTop = content.getBoundingClientRect().top - pageTop;
  const bottomSpace = px(column, "paddingBottom") + px(page, "paddingBottom");
  const firstCap = PAGE_HEIGHT_PX - contentTop - bottomSpace;
  const nextCap = PAGE_HEIGHT_PX - px(page, "paddingTop") - px(column, "paddingTop") - bottomSpace;
  const total = content.getBoundingClientRect().height;
  return paginate(collectBreakpoints(content), total, firstCap, nextCap);
}

function measure() {
  if (props.thumbnail || !measurePage.value || !measureMain.value) return;
  // Ko'rinmas (display: none) holatda o'lchab bo'lmaydi — oldingi natija qoladi
  if (!measurePage.value.getBoundingClientRect().width) return;
  const main = sliceColumn(measureMain.value);
  const side = measureSide.value ? sliceColumn(measureSide.value) : [];
  const count = Math.max(main.length, side.length, 1);
  const empty = (slices: PageSlice[]): PageSlice => {
    const end = slices[slices.length - 1]?.end ?? 0;
    return { start: end, end };
  };
  pages.value = Array.from({ length: count }, (_, i) => ({
    main: main[i] ?? empty(main),
    side: measureSide.value ? (side[i] ?? empty(side)) : null,
  }));
}

let observer: ResizeObserver | undefined;
let raf = 0;
const scheduleMeasure = () => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(measure);
};

onMounted(() => {
  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === container.value && entry.contentRect.width > 0) {
        scale.value = Math.min(1, (entry.contentRect.width - 2) / PAGE_WIDTH_PX);
      }
    }
    scheduleMeasure();
  });
  for (const el of [container.value, measureMain.value, measureSide.value, measurePage.value]) {
    if (el) observer.observe(el);
  }
  // Chop etishdan oldin yana bir bor — ko'rinmagan holatda ochilgan bo'lsa ham
  window.addEventListener("beforeprint", measure);
  document.fonts?.ready.then(scheduleMeasure);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  cancelAnimationFrame(raf);
  window.removeEventListener("beforeprint", measure);
});

// Shablon almashsa ustunlar DOM'da qayta yaratiladi — kuzatuv ham yangilanadi
watch(
  () => [m.tpl.value.id, m.isSidebar.value],
  async () => {
    await nextTick();
    for (const el of [measureMain.value, measureSide.value]) if (el) observer?.observe(el);
    scheduleMeasure();
  },
);

/** Ko'rsatilayotgan shablonning o'z sozlamalari (galereyada har bir eskiz — o'zinikida) */
const tplSettings = computed(() => props.resume.settings.templates[m.tpl.value.id]);

const pageStyle = computed(() => ({
  "--accent": tplSettings.value.accentColor,
  "--scale": String(scale.value),
  fontFamily: tplSettings.value.fontFamily,
}));
const measureStyle = computed(() => ({ ...pageStyle.value, "--scale": "1" }));

/** Varaqdagi ustun oynasi: faqat [start, end) oralig'i ko'rinadi */
function windowStyle(slice: PageSlice) {
  return { height: `${Math.max(0, slice.end - slice.start)}px` };
}
function shiftStyle(slice: PageSlice) {
  return { transform: `translateY(${-slice.start}px)` };
}
</script>

<template>
  <div ref="container" class="preview-scroll" :class="{ 'preview-thumb': thumbnail }">
    <!-- Kichik rasm: bitta varaq, sahifalashsiz -->
    <article v-if="thumbnail" class="page" :class="m.pageClass.value" :style="pageStyle">
      <PreviewHeader v-if="m.headerOnTop.value" :resume="resume" :m="m" />
      <div class="pv-body">
        <aside v-if="m.isSidebar.value" class="pv-side">
          <PreviewColumn :resume="resume" :m="m" column="side" />
        </aside>
        <main class="pv-main">
          <PreviewColumn :resume="resume" :m="m" column="main" />
        </main>
      </div>
    </article>

    <template v-else>
      <!-- O'lchov varag'i: ko'rinmaydi, balandligi cheklanmagan -->
      <article ref="measurePage" class="page page-measure" :class="m.pageClass.value" :style="measureStyle" aria-hidden="true">
        <PreviewHeader v-if="m.headerOnTop.value" :resume="resume" :m="m" />
        <div class="pv-body">
          <aside v-if="m.isSidebar.value" class="pv-side">
            <div ref="measureSide" class="pv-flow"><PreviewColumn :resume="resume" :m="m" column="side" /></div>
          </aside>
          <main class="pv-main">
            <div ref="measureMain" class="pv-flow">
              <PreviewColumn :resume="resume" :m="m" column="main" show-empty-hint />
            </div>
          </main>
        </div>
      </article>

      <!--
        Ko'rinadigan A4 varaqlar. Varaq `zoom` bilan emas, `transform: scale()` bilan kichraytiriladi
        (preview.css, .page-frame): zoom'da qatorlar boshqacha yaxlitlanib mazmun o'lchov varag'idan
        bir necha px siljiydi va varaq chegarasi matn o'rtasiga tushardi. transform joylashuvni
        o'zgartirmaydi — varaq o'lchov varag'i bilan piksel-pikselgacha bir xil.
      -->
      <div class="pages" :style="{ '--scale': String(scale) }">
        <div v-for="(pg, i) in pages" :key="i" class="page-frame">
          <article
            class="page page-sheet"
            :class="m.pageClass.value"
            :style="pageStyle"
          >
            <PreviewHeader v-if="m.headerOnTop.value && i === 0" :resume="resume" :m="m" />
            <div class="pv-body">
              <aside v-if="m.isSidebar.value && pg.side" class="pv-side">
                <div class="pv-window" :style="windowStyle(pg.side)">
                  <div class="pv-flow" :style="shiftStyle(pg.side)">
                    <PreviewColumn :resume="resume" :m="m" column="side" />
                  </div>
                </div>
              </aside>
              <main class="pv-main">
                <div class="pv-window" :style="windowStyle(pg.main)">
                  <div class="pv-flow" :style="shiftStyle(pg.main)">
                    <PreviewColumn :resume="resume" :m="m" column="main" show-empty-hint />
                  </div>
                </div>
              </main>
            </div>
            <span v-if="pages.length > 1" class="pv-page-no" aria-hidden="true">{{ i + 1 }} / {{ pages.length }}</span>
          </article>
        </div>
      </div>
    </template>
  </div>
</template>
