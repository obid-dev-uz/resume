import {
  SCHEMA_VERSION,
  type DrivingLicenseSection,
  type ExtraField,
  type FieldInput,
  type LicenseFieldKey,
  type PersonalFieldKey,
  type RelativeFieldKey,
  type RelativeItem,
  type RelativesSection,
  type ListItem,
  type RatedItem,
  type Resume,
  type Section,
  type SectionKind,
  type SectionType,
  type TimelineFieldKey,
  type TimelineItem,
  type TimelineSection,
  type TemplateId,
  type TemplateSettings,
} from "../types/resume";
import { formatPartialDateShort } from "./format";
import { TEMPLATE_IDS } from "../templates";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export interface SectionDef {
  kind: SectionKind;
  title: string;
  /** timeline bo'limlari uchun maydon nomlari */
  labels?: { title: string; subtitle: string };
  /** timeline bo'limida "Daraja" maydoni (Ta'lim) */
  degree?: boolean;
  /** timeline bo'limida bu turga kerak bo'lmagan maydonlar (formada ko'rsatilmaydi) */
  hiddenFields?: TimelineFieldKey[];
  /** rated bo'limlari uchun daraja nomlari (1..5) */
  levels?: string[];
  /** rated: daraja tanlanishi shart — "ko'rsatilmasin" varianti yo'q, yangi element 1-darajada */
  levelRequired?: boolean;
  placeholder?: string;
  /** text bo'limlari uchun matn maydonining standart nomi */
  contentLabel?: string;
  /** Eski tur: "Bo'lim qo'shish"da ko'rsatilmaydi (ma'lumot boshqa joyga ko'chirilgan) */
  legacy?: boolean;
  /**
   * Vaqtincha o'chirilgan: "Bo'lim qo'shish"da ko'rsatilmaydi, lekin mavjud rezyumelarda
   * ishlayveradi. Qaytarish uchun shu belgini olib tashlash kifoya.
   */
  hidden?: boolean;
}

export const SECTION_DEFS: Record<SectionType, SectionDef> = {
  // Endi "Profil" ichida (personal.summary); eski JSON'ni o'qish uchun qoldirilgan
  summary: {
    kind: "text",
    title: "Profil",
    legacy: true,
    contentLabel: "O'zingiz haqingizda 2-4 gap: tajriba, kuchli tomonlar, maqsad",
  },
  employment: {
    kind: "timeline",
    title: "Ish tajribasi",
    labels: { title: "Lavozim", subtitle: "Kompaniya" },
  },
  education: {
    kind: "timeline",
    title: "Ta'lim",
    labels: { title: "Mutaxassislik", subtitle: "O'quv muassasasi" },
    degree: true,
  },
  residence: {
    kind: "timeline",
    title: "Yashash manzillari",
    labels: { title: "Shahar / viloyat", subtitle: "Manzil" },
    // Shahar asosiy maydonning o'zida — alohida "Shahar" maydoni ortiqcha
    hiddenFields: ["city"],
  },
  // Endi "Ish tajribasi" ichida; eski JSON'ni o'qish uchun qoldirilgan
  internships: {
    kind: "timeline",
    title: "Amaliyotlar",
    labels: { title: "Lavozim", subtitle: "Kompaniya" },
    legacy: true,
  },
  courses: {
    kind: "timeline",
    title: "Kurslar",
    labels: { title: "Kurs nomi", subtitle: "Tashkilot" },
  },
  projects: {
    kind: "timeline",
    title: "Loyihalar",
    labels: { title: "Loyiha nomi", subtitle: "Rol / texnologiyalar" },
  },
  skills: {
    kind: "rated",
    title: "Ko'nikmalar",
    levels: ["Trainee", "Junior", "Middle", "Senior", "Expert"],
    levelRequired: true,
  },
  languages: {
    kind: "rated",
    title: "Tillar",
    levels: ["Beginner", "Elementary", "Intermediate", "Advanced", "Native"],
    levelRequired: true,
  },
  // Endi "Kontaktlar"da; eski JSON'ni o'qish uchun qoldirilgan
  links: { kind: "links", title: "Veb-sayt va ijtimoiy tarmoqlar", legacy: true },
  drivingLicense: { kind: "license", title: "Haydovchilik guvohnomasi" },
  relatives: { kind: "relatives", title: "Yaqin qarindoshlari" },
  hobbies: { kind: "list", title: "Qiziqishlar", placeholder: "Masalan: shaxmat", hidden: true },
  certificates: { kind: "list", title: "Sertifikatlar", placeholder: "Masalan: IELTS 7.5 (2024)", hidden: true },
  achievements: { kind: "list", title: "Yutuqlar", placeholder: "Masalan: Hackathon g'olibi", hidden: true },
  references: {
    kind: "list",
    title: "Tavsiyanomalar",
    placeholder: "Ism, lavozim, kompaniya, telefon",
    hidden: true,
  },
  custom: {
    kind: "timeline",
    title: "Maxsus bo'lim",
    labels: { title: "Sarlavha", subtitle: "Qo'shimcha ma'lumot" },
    hidden: true,
  },
};

/** Doimiy bo'limlar (o'chirib bo'lmaydi): o'zgarmas type -> standart sarlavha */
export const FIXED_BLOCK_TITLES = {
  personal: "Profil",
  details: "Shaxsiy ma'lumotlar",
  contacts: "Kontaktlar",
  additional: "Qo'shimcha ma'lumotlar",
} as const;

/** "Profil"dagi qisqacha matnning standart nomi (rezyumedagi sarlavhasi) */
export const SUMMARY_DEFAULT_LABEL = "O'zim haqimda";

/** "Profil" maydonlarining standart nomlari */
export const PERSONAL_FIELD_LABELS: Record<PersonalFieldKey, string> = {
  photo: "Rasm",
  firstName: "Ism",
  lastName: "Familiya",
  middleName: "Otasining ismi",
  jobTitle: "Lavozim (kasb)",
  summary: SUMMARY_DEFAULT_LABEL,
};

export const PERSONAL_FIELD_KEYS = Object.keys(PERSONAL_FIELD_LABELS) as PersonalFieldKey[];

/** O'zbekiston haydovchilik guvohnomasi toifalari */
export const LICENSE_CATEGORIES = [
  "A", "A1", "B", "B1", "BE", "C", "C1", "CE", "C1E", "D", "D1", "DE", "D1E", "M", "Tm", "Tb",
];

/** Tartiblanadigan doimiy bloklar ("nom: qiymat" qatorlari); qolgan kalitlar — bo'lim id'lari */
export const BLOCK_KEYS = ["details", "contacts", "additional"] as const;
export type BlockKey = (typeof BLOCK_KEYS)[number];

export function isBlockKey(key: string): key is BlockKey {
  return (BLOCK_KEYS as readonly string[]).includes(key);
}

/** "O'zim haqimda" ham tartiblanadi; matni personal.summary da */
export const SUMMARY_KEY = "summary";

/** Bo'lim bo'lmagan tartib kalitlari, standart tartibda (yangi rezyumeda shu tartibda turadi) */
const FIXED_ORDER_KEYS: string[] = [SUMMARY_KEY, ...BLOCK_KEYS];

/**
 * `order`ni rezyumega moslaydi: noma'lum va takror kalitlar olib tashlanadi, yetishmagan
 * doimiy kalitlar ("O'zim haqimda", bloklar) boshiga, yetishmagan bo'limlar oxiriga qo'shiladi.
 * v20'gacha "O'zim haqimda" tartibda yo'q edi — u eng tepaga tushadi.
 */
export function syncOrder(resume: Resume): void {
  const sectionIds = resume.sections.map((s) => s.id);
  const valid = new Set<string>([...FIXED_ORDER_KEYS, ...sectionIds]);
  const seen = new Set<string>();
  const kept = resume.order.filter((k) => valid.has(k) && !seen.has(k) && !!seen.add(k));
  resume.order = [
    ...FIXED_ORDER_KEYS.filter((k) => !seen.has(k)),
    ...kept,
    ...sectionIds.filter((id) => !seen.has(id)),
  ];
}

/** Ikki ustunli "kalit — qiymat" jadvalida chap ustun kengligi chegaralari, foizda */
export const FIELDS_SPLIT = { min: 20, max: 80, default: 50 } as const;

export function clampSplit(v: number): number {
  return Math.round(Math.min(FIELDS_SPLIT.max, Math.max(FIELDS_SPLIT.min, v)));
}

/** Yangi shablon sozlamalari (rang, shrift, ustunlar chegarasi) — har bir shablon uchun alohida nusxa */
export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
  accentColor: "#2f5d8a",
  fontFamily: "Inter, Helvetica, Arial, sans-serif",
  fieldsSplit: FIELDS_SPLIT.default,
};

export function defaultTemplateSettings(): Record<TemplateId, TemplateSettings> {
  return Object.fromEntries(TEMPLATE_IDS.map((id) => [id, { ...DEFAULT_TEMPLATE_SETTINGS }])) as Record<
    TemplateId,
    TemplateSettings
  >;
}

export function createSection(type: SectionType): Section {
  const def = SECTION_DEFS[type];
  const base = { id: uid(), type, title: def.title };
  switch (def.kind) {
    case "text":
      return { ...base, kind: "text", fieldLabels: {}, content: "" };
    case "timeline":
      return { ...base, kind: "timeline", fieldLabels: {}, items: [] };
    case "rated":
      return { ...base, kind: "rated", items: [] };
    case "list":
      return { ...base, kind: "list", items: [] };
    case "links":
      return { ...base, kind: "links", items: [] };
    case "license":
      return {
        ...base,
        kind: "license",
        fieldLabels: {},
        categories: [],
        issueDate: "",
        expiryDate: "",
        hasOwnCar: false,
        note: "",
      };
    case "relatives":
      return { ...base, kind: "relatives", fieldLabels: {}, items: [] };
  }
}

export const TIMELINE_FIELD_KEYS: TimelineFieldKey[] = [
  "title",
  "degree",
  "subtitle",
  "startDate",
  "endDate",
  "city",
  "current",
  "description",
];

/** Timeline maydonining standart nomi (bo'lim turiga qarab) */
export function defaultTimelineLabel(section: TimelineSection, key: TimelineFieldKey): string {
  const def = SECTION_DEFS[section.type];
  switch (key) {
    case "title":
      return def.labels?.title ?? "Sarlavha";
    case "degree":
      return "Daraja";
    case "subtitle":
      return def.labels?.subtitle ?? "Qo'shimcha";
    case "startDate":
      return "Boshlanish";
    case "endDate":
      return "Tugash";
    case "city":
      return "Shahar";
    case "current":
      return "Hozirgacha";
    case "description":
      return "Tavsif";
  }
}

/** Maydonning ko'rinadigan nomi: foydalanuvchi o'zgartirgan bo'lsa o'sha, aks holda standart */
export function timelineLabel(section: TimelineSection, key: TimelineFieldKey): string {
  return section.fieldLabels[key]?.trim() || defaultTimelineLabel(section, key);
}

/** Rezyumedagi davr matni uchun: "May 2022 – hozirgacha" / "May 2022 – Present" */
export function currentLabel(section: TimelineSection): string {
  return section.fieldLabels.current?.trim() || "hozirgacha";
}

export function createRelativeItem(): RelativeItem {
  return {
    id: uid(),
    relation: "",
    fullName: "",
    birthDate: "",
    birthPlace: "",
    position: "",
    workplace: "",
    address: "",
    deceased: false,
    deathDate: "",
  };
}

export const LICENSE_FIELD_KEYS: LicenseFieldKey[] = ["categories", "validity", "hasOwnCar", "note"];

/** Guvohnoma maydonlarining standart nomlari (formada ham, rezyumeda ham shu nom chiqadi) */
export const LICENSE_FIELD_LABELS: Record<LicenseFieldKey, string> = {
  categories: "Toifalar",
  validity: "Amal qilish muddati",
  hasOwnCar: "Shaxsiy avtomobili bor",
  note: "Izoh",
};

export function licenseLabel(section: DrivingLicenseSection, key: LicenseFieldKey): string {
  return section.fieldLabels[key]?.trim() || LICENSE_FIELD_LABELS[key];
}

export const RELATIVE_FIELD_KEYS: RelativeFieldKey[] = [
  "relation",
  "fullName",
  "birth",
  "birthDate",
  "birthPlace",
  "position",
  "workplace",
  "deathDate",
  "deceased",
  "work",
  "address",
];

/** Jadval ustunlarining standart nomlari (rasmiy ma'lumotnoma shaklida) */
export const RELATIVE_FIELD_LABELS: Record<RelativeFieldKey, string> = {
  relation: "Qarindoshligi",
  fullName: "Familiyasi, ismi va otasining ismi",
  birth: "Tug'ilgan sanasi va joyi",
  birthDate: "Tug'ilgan sanasi",
  birthPlace: "Tug'ilgan joyi",
  position: "Lavozimi",
  workplace: "Ish joyi",
  deathDate: "Vafot etgan sanasi",
  deceased: "Vafot etgan",
  work: "Ish joyi va lavozimi",
  address: "Turar joyi",
};

export function relativeLabel(section: RelativesSection, key: RelativeFieldKey): string {
  return section.fieldLabels[key]?.trim() || RELATIVE_FIELD_LABELS[key];
}

/** Jadvaldagi "Ish joyi va lavozimi" katagi: "ISUZU, Injener texnolog" */
export function relativeWork(r: RelativeItem): string {
  return [r.workplace.trim(), r.position.trim()].filter(Boolean).join(", ");
}

/** "Qarindoshligi" maydoni uchun takliflar */
export const RELATION_SUGGESTIONS = [
  "Otasi",
  "Onasi",
  "Akasi",
  "Ukasi",
  "Opasi",
  "Singlisi",
  "Turmush o'rtog'i",
  "O'g'li",
  "Qizi",
  "Qaynotasi",
  "Qaynonasi",
];

/** "Daraja" maydoni uchun takliflar */
export const DEGREE_SUGGESTIONS = [
  "Bakalavr",
  "Magistr",
  "Tayanch doktorant (PhD)",
  "Fan doktori (DSc)",
  "O'rta maxsus",
  "Kollej",
  "Akademik litsey",
  "Umumiy o'rta",
];

/** Yozuv sarlavhasi rezyumeda: "Dasturiy injiniring, Bakalavr" */
export function timelineHeading(item: TimelineItem): string {
  return [item.title.trim(), item.degree.trim()].filter(Boolean).join(", ");
}

/** Bo'limda ko'rsatiladigan biror ma'lumot bormi */
export function sectionHasContent(section: Section): boolean {
  switch (section.kind) {
    case "text":
      return section.content.trim() !== "";
    case "license":
      return (
        section.categories.length > 0 ||
        section.issueDate !== "" ||
        section.expiryDate !== "" ||
        section.hasOwnCar ||
        section.note.trim() !== ""
      );
    default:
      return section.items.length > 0;
  }
}

export function createTimelineItem(): TimelineItem {
  return {
    id: uid(),
    title: "",
    degree: "",
    subtitle: "",
    city: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  };
}

export function createRatedItem(level = 0): RatedItem {
  return { id: uid(), name: "", level };
}

export function createListItem(): ListItem {
  return { id: uid(), text: "" };
}

export function createExtraField(label = "", input: FieldInput = "text"): ExtraField {
  return { id: uid(), label, value: "", labelIcon: "", valueIcon: "", link: "", input };
}

/** Tanlov maydonlarining variantlari (formada dropdown; "" — tanlanmagan, "–" bo'lib ko'rinadi) */
export const FIELD_OPTIONS: Partial<Record<FieldInput, string[]>> = {
  gender: ["Erkak", "Ayol"],
};

/** Yangi rezyumedagi "Shaxsiy ma'lumotlar" maydonlari (keyin yangilari shu ro'yxatga qo'shiladi) */
export const DEFAULT_DETAIL_FIELDS: [label: string, input: FieldInput][] = [
  ["Tug'ilgan sana", "date"],
  ["Jinsi", "gender"],
];

/** Preview'da ko'rinadigan qiymat: sana dd.mm.yyyy ko'rinishida, qolganlari o'zgarmasdan */
export function fieldDisplayValue(f: ExtraField): string {
  const value = f.value.trim();
  return f.input === "date" ? formatPartialDateShort(value) : value;
}

/**
 * Yangi rezyume: faqat Profil ko'rinadi. Qolgan hamma bloklar yashirin (✕ bilan olib tashlangandek)
 * va bo'limlar yo'q — foydalanuvchi keraklisini formadagi "Bo'lim qo'shish"dan qo'shadi.
 * Yashirin bloklar tartibdagi joyini saqlaydi; Shaxsiy ma'lumotlarning standart qatorlari tayyor turadi.
 */
export function createResume(name: string): Resume {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    personal: {
      type: "personal",
      title: FIXED_BLOCK_TITLES.personal,
      firstName: "",
      lastName: "",
      middleName: "",
      jobTitle: "",
      summary: "",
      summaryHidden: true,
      fieldLabels: {},
      photo: "",
    },
    details: {
      type: "details",
      title: FIXED_BLOCK_TITLES.details,
      hidden: true,
      items: DEFAULT_DETAIL_FIELDS.map(([label, input]) => createExtraField(label, input)),
    },
    contacts: { type: "contacts", title: FIXED_BLOCK_TITLES.contacts, hidden: true, items: [] },
    additional: { type: "additional", title: FIXED_BLOCK_TITLES.additional, hidden: true, items: [] },
    sections: [],
    order: [...FIXED_ORDER_KEYS],
    settings: {
      template: "sidebar",
      templates: defaultTemplateSettings(),
    },
  };
}

/** Rezyumening to'liq nusxasi, barcha id'lar yangilanadi */
export function cloneResume(source: Resume, name: string): Resume {
  const copy: Resume = JSON.parse(JSON.stringify(source));
  const now = new Date().toISOString();
  copy.id = uid();
  copy.name = name;
  copy.createdAt = now;
  copy.updatedAt = now;
  copy.details.items.forEach((f) => (f.id = uid()));
  copy.contacts.items.forEach((f) => (f.id = uid()));
  copy.additional.items.forEach((f) => (f.id = uid()));
  const ids = new Map<string, string>();
  copy.sections.forEach((s) => {
    ids.set(s.id, uid());
    s.id = ids.get(s.id)!;
    if ("items" in s) s.items.forEach((i) => (i.id = uid()));
  });
  copy.order = copy.order.map((k) => ids.get(k) ?? k);
  return copy;
}
