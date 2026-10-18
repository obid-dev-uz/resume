import { computed, type Ref } from "vue";
import type { ExtraField, Resume, Section, TemplateId, TextSection } from "../types/resume";
import {
  FIXED_BLOCK_TITLES,
  SUMMARY_DEFAULT_LABEL,
  SUMMARY_KEY,
  isBlockKey,
  sectionHasContent,
  type BlockKey,
} from "../lib/sections";
import { getTemplate } from "../templates";

/*
 * Preview uchun hisoblangan ko'rinish: qaysi bo'lim qaysi ustunda, sarlavha qayerda.
 * Sahifa sarlavhasi (PreviewHeader), ustunlar (PreviewColumn) va sahifalash shu modeldan foydalanadi.
 */

/** Ikki ustunli shablonda qisqa bo'limlar (ko'nikmalar, tillar, ro'yxatlar...) yon ustunga chiqadi */
const SIDE_KINDS: Section["kind"][] = ["rated", "list", "links", "license"];

const hasValue = (fields: ExtraField[]) => fields.some((f) => f.value.trim());

/** Ustundagi bitta element: "nom: qiymat" bloki yoki bo'lim — `resume.order` tartibida */
export type ColumnItem = { kind: "block"; key: BlockKey } | { kind: "section"; section: Section };

export function usePreviewModel(resume: Ref<Resume>, templateOverride: Ref<TemplateId | undefined>) {
  const tpl = computed(() => getTemplate(templateOverride.value ?? resume.value.settings.template));
  const p = computed(() => resume.value.personal);
  /** Rasmiy hujjatda F.I.Sh. tartibida, boshqa shablonlarda "Ism Familiya Otasining ismi" */
  const fullName = computed(() => {
    const { firstName: i, lastName: f, middleName: sh } = p.value;
    const parts = tpl.value.nameOrder === "fio" ? [f, i, sh] : [i, f, sh];
    return parts.map((x) => x.trim()).filter(Boolean).join(" ");
  });

  /**
   * Hujjat nomi (Rasmiy): Profil bo'limiga yozilgan sarlavha. Standart "Profil" nomi
   * chiqarilmaydi — u formadagi bo'lim nomi, hujjat nomi emas.
   */
  const docTitle = computed(() => {
    const t = p.value.title.trim();
    return tpl.value.docTitle && t !== FIXED_BLOCK_TITLES.personal ? t : "";
  });

  const isSidebar = computed(() => tpl.value.layout === "sidebar");
  const headerOnTop = computed(() => tpl.value.header === "top");
  const photo = computed(() => (tpl.value.photo ? p.value.photo : ""));

  /** "O'zim haqimda" matni asosiy ustunning eng tepasida oddiy matnli bo'lim sifatida chiziladi */
  const summarySection = computed<TextSection | null>(() =>
    p.value.summary.trim() && !p.value.summaryHidden
      ? {
          id: "personal-summary",
          type: "summary",
          kind: "text",
          title: p.value.fieldLabels.summary || SUMMARY_DEFAULT_LABEL,
          fieldLabels: {},
          content: p.value.summary,
        }
      : null,
  );

  const hasContacts = computed(() => !resume.value.contacts.hidden && hasValue(resume.value.contacts.items));
  const hasDetails = computed(() => !resume.value.details.hidden && hasValue(resume.value.details.items));
  const hasAdditional = computed(
    () => !resume.value.additional.hidden && hasValue(resume.value.additional.items),
  );
  const blockVisible = (key: BlockKey) =>
    ({ details: hasDetails, contacts: hasContacts, additional: hasAdditional })[key].value;

  /** Bo'sh yozuvlar va bo'sh bo'limlar preview'da ko'rsatilmaydi */
  const visibleSections = computed<Section[]>(() =>
    resume.value.sections
      .map((s): Section => {
        switch (s.kind) {
          case "text":
          case "license":
            return s;
          case "timeline":
            return { ...s, items: s.items.filter((i) => i.title || i.degree || i.subtitle || i.description) };
          case "rated":
            return { ...s, items: s.items.filter((i) => i.name.trim()) };
          case "list":
            return { ...s, items: s.items.filter((i) => i.text.trim()) };
          case "links":
            return { ...s, items: s.items.filter((i) => i.value.trim()) };
          case "relatives":
            return { ...s, items: s.items.filter((i) => i.relation.trim() || i.fullName.trim()) };
        }
      })
      .filter(sectionHasContent),
  );

  const inSide = (s: Section) => isSidebar.value && SIDE_KINDS.includes(s.kind);

  /** Ko'rinadigan bloklar va bo'limlar formadagi tartibda (resume.order) */
  const orderedItems = computed<ColumnItem[]>(() => {
    const byId = new Map(visibleSections.value.map((s) => [s.id, s]));
    return resume.value.order.flatMap((key): ColumnItem[] => {
      if (isBlockKey(key)) return blockVisible(key) ? [{ kind: "block", key }] : [];
      // "O'zim haqimda" — oddiy matnli bo'lim sifatida, asosiy ustunda
      if (key === SUMMARY_KEY) return summarySection.value ? [{ kind: "section", section: summarySection.value }] : [];
      const section = byId.get(key);
      return section ? [{ kind: "section", section }] : [];
    });
  });

  /**
   * Blok qayerda chiziladi: ikki ustunlida — yon ustunda (mainBlocks'dagilari asosiy ustunda);
   * fieldsBelowHeader (Rasmiy) — asosiy ustunda bo'limlar orasida; qolgan bir ustunlilarda —
   * sarlavhada bir qatorda.
   */
  const blockIn = (key: BlockKey): "side" | "main" | "header" =>
    isSidebar.value
      ? tpl.value.mainBlocks?.includes(key) ? "main" : "side"
      : tpl.value.fieldsBelowHeader ? "main" : "header";

  const sideItems = computed(() =>
    orderedItems.value.filter((i) => (i.kind === "block" ? blockIn(i.key) === "side" : inSide(i.section))),
  );
  const mainItems = computed(() =>
    orderedItems.value.filter((i) => (i.kind === "block" ? blockIn(i.key) === "main" : !inSide(i.section))),
  );
  /** Sarlavhadagi bloklar (bir qatorli ko'rinish) — ular orasidagi tartib ham formadagidek */
  const headerBlocks = computed(() =>
    orderedItems.value.flatMap((i) => (i.kind === "block" && blockIn(i.key) === "header" ? [i.key] : [])),
  );

  const isEmpty = computed(
    () => !summarySection.value && !visibleSections.value.length && !hasContacts.value && !hasDetails.value && !hasAdditional.value,
  );

  const pageClass = computed(() => [
    `tpl-${tpl.value.id}`,
    `layout-${tpl.value.layout}`,
    { "side-right": tpl.value.side === "right" },
  ]);

  return {
    tpl,
    p,
    fullName,
    docTitle,
    isSidebar,
    headerOnTop,
    photo,
    summarySection,
    hasContacts,
    hasDetails,
    hasAdditional,
    sideItems,
    mainItems,
    headerBlocks,
    isEmpty,
    pageClass,
  };
}

export type PreviewModel = ReturnType<typeof usePreviewModel>;
