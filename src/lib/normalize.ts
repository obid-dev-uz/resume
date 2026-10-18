import {
  SCHEMA_VERSION,
  type ExtraField,
  type FieldInput,
  type LinkItem,
  type ListItem,
  type RatedItem,
  type RelativeItem,
  type Resume,
  type Section,
  type SectionType,
  type TemplateId,
  type TemplateSettings,
  type TimelineItem,
} from "../types/resume";
import {
  DEFAULT_DETAIL_FIELDS,
  DEFAULT_TEMPLATE_SETTINGS,
  FIELD_OPTIONS,
  FIXED_BLOCK_TITLES,
  LICENSE_CATEGORIES,
  LICENSE_FIELD_KEYS,
  PERSONAL_FIELD_KEYS,
  RELATIVE_FIELD_KEYS,
  SECTION_DEFS,
  SUMMARY_DEFAULT_LABEL,
  TIMELINE_FIELD_KEYS,
  clampSplit,
  createExtraField,
  createResume,
  createSection,
  syncOrder,
  uid,
} from "./sections";
import { formatDate, parseDate } from "./format";
import { iconId } from "./icons";
import { sanitizeLinkInput, toHref } from "./links";
import { TEMPLATE_IDS } from "../templates";

/*
 * localStorage'dan yoki import qilingan fayldan kelgan JSON'ga ishonib bo'lmaydi:
 * u eski versiyada yozilgan, qo'lda tahrirlangan yoki chala bo'lishi mumkin.
 * Bu yerda har bir maydon tekshiriladi va yetishmaganlari standart qiymat bilan to'ldiriladi.
 */

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const id = (v: unknown): string => (typeof v === "string" && v ? v : uid());

const FIELD_INPUTS: FieldInput[] = ["text", "date", "gender"];

function extraField(v: unknown): ExtraField | null {
  if (!isObj(v)) return null;
  const input = FIELD_INPUTS.includes(v.input as FieldInput) ? (v.input as FieldInput) : "text";
  let value = str(v.value);
  // Sana — "YYYY-MM-DD"/"YYYY", tanlov — ro'yxatdagi variant; boshqasi bo'lsa tanlanmagan
  if (input === "date") value = parseDate(value) ?? "";
  const options = FIELD_OPTIONS[input];
  if (options && !options.includes(value)) value = "";
  return {
    id: id(v.id),
    label: str(v.label),
    value,
    labelIcon: iconId(v.labelIcon),
    valueIcon: iconId(v.valueIcon),
    link: input === "text" ? sanitizeLinkInput(str(v.link)) : "",
    input,
  };
}

function timelineItem(v: unknown): TimelineItem | null {
  if (!isObj(v)) return null;
  return {
    id: id(v.id),
    title: str(v.title),
    degree: str(v.degree),
    subtitle: str(v.subtitle),
    city: str(v.city),
    startDate: str(v.startDate),
    endDate: str(v.endDate),
    current: v.current === true,
    description: str(v.description),
  };
}

/** min — eng past daraja: daraja majburiy bo'limda (Ko'nikmalar, Tillar) 1, aks holda 0 ("ko'rsatilmasin") */
function ratedItem(v: unknown, min = 0): RatedItem | null {
  if (!isObj(v)) return null;
  const level = typeof v.level === "number" ? Math.round(v.level) : 0;
  return { id: id(v.id), name: str(v.name), level: Math.min(5, Math.max(min, level)) };
}

function listItem(v: unknown): ListItem | null {
  if (!isObj(v)) return null;
  return { id: id(v.id), text: str(v.text) };
}

function linkItem(v: unknown): LinkItem | null {
  if (!isObj(v)) return null;
  return { id: id(v.id), label: str(v.label), value: str(v.value) };
}

/** Faqat ma'lum kalitlar va bo'sh bo'lmagan matnlar qoladi */
function fieldLabels<K extends string>(v: unknown, keys: readonly K[]): Partial<Record<K, string>> {
  if (!isObj(v)) return {};
  const out: Partial<Record<K, string>> = {};
  for (const key of keys) {
    const label = v[key];
    if (typeof label === "string" && label.trim()) out[key] = label;
  }
  return out;
}

function relativeItem(v: unknown): RelativeItem | null {
  if (!isObj(v)) return null;
  return {
    id: id(v.id),
    relation: str(v.relation),
    fullName: str(v.fullName),
    // v11'da faqat yil "birthYear" maydonida edi
    birthDate: str(v.birthDate) || str(v.birthYear).trim(),
    birthPlace: str(v.birthPlace),
    position: str(v.position),
    // v12'gacha ish joyi va lavozim bitta "work" maydonida edi — ishonchli ajratib bo'lmaydi,
    // shuning uchun to'liq matn ish joyiga o'tadi, lavozimni foydalanuvchi ajratib yozadi
    workplace: str(v.workplace) || str(v.work),
    address: str(v.address),
    deceased: v.deceased === true,
    // v13'gacha faqat yil "deathYear" maydonida edi — yil ham yaroqli qiymat
    deathDate: str(v.deathDate) || str(v.deathYear).trim(),
  };
}

const notNull = <T>(v: T | null): v is T => v !== null;

function section(v: unknown): Section | null {
  if (!isObj(v)) return null;
  const type = (str(v.type) in SECTION_DEFS ? v.type : "custom") as SectionType;
  const def = SECTION_DEFS[type];
  const base = { id: id(v.id), type, title: str(v.title, def.title) };
  switch (def.kind) {
    case "text":
      return {
        ...base,
        kind: "text",
        fieldLabels: fieldLabels(v.fieldLabels, ["content"] as const),
        content: str(v.content),
      };
    case "timeline":
      return {
        ...base,
        kind: "timeline",
        fieldLabels: fieldLabels(v.fieldLabels, TIMELINE_FIELD_KEYS),
        items: arr(v.items).map(timelineItem).filter(notNull),
      };
    case "rated":
      return {
        ...base,
        kind: "rated",
        items: arr(v.items)
          .map((it) => ratedItem(it, def.levelRequired ? 1 : 0))
          .filter(notNull),
      };
    case "list":
      return { ...base, kind: "list", items: arr(v.items).map(listItem).filter(notNull) };
    case "links":
      return { ...base, kind: "links", items: arr(v.items).map(linkItem).filter(notNull) };
    case "relatives":
      return {
        ...base,
        kind: "relatives",
        fieldLabels: fieldLabels(v.fieldLabels, RELATIVE_FIELD_KEYS),
        items: arr(v.items).map(relativeItem).filter(notNull),
      };
    case "license":
      return {
        ...base,
        kind: "license",
        fieldLabels: fieldLabels(v.fieldLabels, LICENSE_FIELD_KEYS),
        categories: licenseCategories(arr(v.categories).filter((c): c is string => typeof c === "string")),
        issueDate: str(v.issueDate),
        expiryDate: str(v.expiryDate),
        hasOwnCar: v.hasOwnCar === true,
        note: str(v.note),
      };
  }
}

/** Faqat ma'lum toifalar qoladi, takrorlar olib tashlanadi, tartib LICENSE_CATEGORIES bo'yicha */
function licenseCategories(values: string[]): string[] {
  const wanted = new Set(values.map((c) => c.trim().toUpperCase()));
  return LICENSE_CATEGORIES.filter((c) => wanted.has(c.toUpperCase()));
}

/*
 * v1-v4'da email, telefon, manzil, tug'ilgan sana, jins va boshqalar doimiy maydon edi.
 * v5'dan boshlab ular foydalanuvchi o'zi qo'shadigan "nom: qiymat" maydonlari.
 * Eski qiymatlar yo'qolmasligi uchun shu tartibda qo'shimcha maydonlarga aylantiriladi.
 */
const LEGACY_FIELDS: [key: string, label: string][] = [
  ["email", "Email"],
  ["phone", "Telefon"],
  ["address", "Manzil"],
  ["postalCode", "Pochta indeksi"],
  ["city", "Shahar"],
  ["birthDate", "Tug'ilgan sana"],
  ["birthPlace", "Tug'ilgan joyi"],
  ["nationality", "Millati"],
  ["maritalStatus", "Oilaviy holati"],
  ["gender", "Jinsi"],
];

/** v2-v4'da tanlov sifatida saqlangan qiymatlarning o'qiladigan ko'rinishi */
const LEGACY_CHOICES: Record<string, Record<string, string>> = {
  maritalStatus: {
    single: "Turmush qurmagan",
    married: "Turmush qurgan",
    divorced: "Ajrashgan",
    widowed: "Beva",
  },
  gender: { male: "Erkak", female: "Ayol" },
};

function legacyExtras(personal: Obj): ExtraField[] {
  return LEGACY_FIELDS.flatMap(([key, label]) => {
    let value = str(personal[key]).trim();
    if (!value) return [];
    if (key === "birthDate") value = formatDate(value);
    value = LEGACY_CHOICES[key]?.[value] ?? value;
    return [{ id: uid(), label, value, labelIcon: "", valueIcon: "", link: "", input: "text" as const }];
  });
}

/** Bo'lim yo'q bo'lsa, `afterType` bo'limidan keyin (yoki oxiriga) qo'shiladi */
function ensureSection(resume: Resume, type: SectionType, afterType: SectionType): Section {
  const existing = resume.sections.find((s) => s.type === type);
  if (existing) return existing;
  const created = createSection(type);
  const after = resume.sections.findIndex((s) => s.type === afterType);
  resume.sections.splice(after === -1 ? resume.sections.length : after + 1, 0, created);
  return created;
}

/** v3'gacha guvohnoma qo'shimcha matn maydoni edi, v4'da alohida bo'lim */
function migrateDrivingLicense(resume: Resume): void {
  const extras = resume.details.items;
  const section = ensureSection(resume, "drivingLicense", "languages");
  const index = extras.findIndex((f) => f.label === "Haydovchilik guvohnomasi");
  if (index === -1 || section.kind !== "license") return;
  const value = extras[index].value.trim();
  extras.splice(index, 1);

  // "B, C" -> toifalar; tanilmagan so'zlar yo'qolmasligi uchun izohga yoziladi
  const tokens = value.split(/[\s,;/]+/).filter(Boolean);
  const categories = licenseCategories(tokens);
  const known = new Set(categories.map((c) => c.toUpperCase()));
  const rest = tokens.filter((t) => !known.has(t.toUpperCase()));
  section.categories = licenseCategories([...section.categories, ...categories]);
  if (rest.length && !section.note) section.note = rest.join(" ");
}

/*
 * "Shaxsiy ma'lumotlar"ning standart maydonlari (Tug'ilgan sana, Jinsi) o'chirilmaydi — har doim bor.
 * v21'gacha ular yo'q edi, hamma qiymat erkin matn edi: shu nomli matn maydoni bo'lsa — turi
 * o'zgaradi (qiymati tanilsa: "01.09.1996" -> sana, "erkak" -> "Erkak"); tanilmasa ma'lumot
 * yo'qolmasligi uchun matnligicha qoladi va standart maydon alohida qo'shiladi.
 */
function convertField(f: ExtraField, input: FieldInput): boolean {
  const value = f.value.trim();
  let next: string | null = null;
  if (input === "date") next = parseDate(value);
  else next = value ? (FIELD_OPTIONS[input]?.find((o) => o.toLowerCase() === value.toLowerCase()) ?? null) : "";
  if (next === null) return false;
  Object.assign(f, { value: next, input, link: "" });
  return true;
}

function addDefaultDetailFields(resume: Resume): void {
  const items = resume.details.items;
  const missing: ExtraField[] = [];
  for (const [label, input] of DEFAULT_DETAIL_FIELDS) {
    if (items.some((f) => f.input === input)) continue;
    const same = items.find((f) => f.input === "text" && f.label.trim().toLowerCase() === label.toLowerCase());
    if (same && convertField(same, input)) continue;
    missing.push(createExtraField(label, input));
  }
  items.unshift(...missing);
}

/*
 * v6'gacha telefon, email, Telegram... shaxsiy ma'lumotlardagi qo'shimcha maydonlar edi.
 * Endi ular alohida "Kontaktlar". Qator kontakt deb hisoblanadi, agar nomi tanish bo'lsa,
 * havolasi bo'lsa yoki kontakt ikonkasi tanlangan bo'lsa. Qolganlari joyida qoladi.
 */
const CONTACT_LABEL =
  /^(e-?mail|email|pochta$|telefon|tel\b|phone|mobil|telegram|whatsapp|viber|skype|linkedin|github|gitlab|instagram|facebook|twitter|x$|youtube|behance|dribbble|veb-?sayt|website|sayt|portfolio|manzil|address|shahar|city)/i;
const CONTACT_ICONS = new Set([
  "mail", "at", "phone", "smartphone", "message", "send", "globe", "link",
  "github", "linkedin", "instagram", "mapPin",
]);

function isContact(f: ExtraField): boolean {
  return (
    CONTACT_LABEL.test(f.label.trim()) ||
    f.link.trim() !== "" ||
    CONTACT_ICONS.has(f.labelIcon) ||
    CONTACT_ICONS.has(f.valueIcon)
  );
}

function migrateContacts(resume: Resume): void {
  const d = resume.details;
  resume.contacts.items.push(...d.items.filter(isContact));
  d.items = d.items.filter((f) => !isContact(f));
}

/*
 * v9'gacha "Veb-sayt va ijtimoiy tarmoqlar" alohida bo'lim edi; endi ular "Kontaktlar"da.
 * U bo'limdagi qiymatlar rezyumeda bosiladigan edi, shuning uchun havola ham birga ko'chadi.
 * v1 dagi GitHub/LinkedIn qo'shimcha maydonlari migrateContacts orqali to'g'ridan-to'g'ri keladi.
 */
function moveLinksIntoContacts(resume: Resume): void {
  const sections = resume.sections.filter((s) => s.type === "links");
  if (!sections.length) return;
  const contacts = resume.contacts.items;
  const key = (label: string, value: string) => `${label.trim().toLowerCase()}|${value.trim().toLowerCase()}`;
  const existing = new Map(contacts.map((c) => [key(c.label, c.value), c]));
  for (const section of sections) {
    if (section.kind !== "links") continue;
    for (const item of section.items) {
      if (!item.value.trim()) continue;
      const link = sanitizeLinkInput(toHref(item.value));
      const same = existing.get(key(item.label, item.value));
      if (same) {
        // Takror qo'shilmaydi, lekin kontaktda havola bo'lmasa — shu yerdagisi o'tadi
        if (!same.link) same.link = link;
        continue;
      }
      const contact = { id: item.id, label: item.label, value: item.value, labelIcon: "", valueIcon: "", link, input: "text" as const };
      existing.set(key(item.label, item.value), contact);
      contacts.push(contact);
    }
  }
  resume.sections = resume.sections.filter((s) => s.type !== "links");
}

/*
 * v10'gacha "Amaliyotlar" alohida bo'lim edi; tuzilishi ish tajribasi bilan bir xil,
 * shuning uchun yozuvlar "Ish tajribasi" oxiriga qo'shiladi. Ish tajribasi bo'lmasa,
 * amaliyotlar turgan joyda yaratiladi.
 */
function mergeInternshipsIntoEmployment(resume: Resume): void {
  const index = resume.sections.findIndex((s) => s.type === "internships");
  if (index === -1) return;
  let employment = resume.sections.find((s) => s.type === "employment");
  if (!employment) {
    employment = createSection("employment");
    resume.sections.splice(index, 0, employment);
  }
  for (const section of resume.sections) {
    if (section.type === "internships" && section.kind === "timeline" && employment.kind === "timeline") {
      employment.items.push(...section.items);
    }
  }
  resume.sections = resume.sections.filter((s) => s.type !== "internships");
}

/** v8'gacha "Profil" alohida bo'lim edi; endi matn va sarlavhasi personal ichida */
function moveSummaryIntoPersonal(resume: Resume): void {
  const summaries = resume.sections.filter((s) => s.type === "summary");
  if (!summaries.length) return;
  const p = resume.personal;
  const texts = summaries.map((s) => (s.kind === "text" ? s.content.trim() : "")).filter(Boolean);
  if (texts.length) p.summary = [p.summary.trim(), ...texts].filter(Boolean).join("\n\n");
  // Bo'lim sarlavhasi rezyumedagi sarlavha bo'lib qoladi ("Profil", "O'zim haqimda qisqacha"...)
  const title = summaries[0].title.trim();
  if (!p.fieldLabels.summary && title && title !== SUMMARY_DEFAULT_LABEL) p.fieldLabels.summary = title;
  resume.sections = resume.sections.filter((s) => s.type !== "summary");
}

/** Bitta shablon sozlamasi; yaroqsiz qiymatlar standart qiymat bilan almashtiriladi */
function templateSettings(v: Obj): TemplateSettings {
  const d = DEFAULT_TEMPLATE_SETTINGS;
  return {
    accentColor: /^#[0-9a-f]{6}$/i.test(str(v.accentColor)) ? str(v.accentColor) : d.accentColor,
    fontFamily: str(v.fontFamily, d.fontFamily),
    fieldsSplit:
      typeof v.fieldsSplit === "number" && Number.isFinite(v.fieldsSplit) ? clampSplit(v.fieldsSplit) : d.fieldsSplit,
  };
}

/**
 * v19'gacha rang, shrift va ustunlar chegarasi rezyume uchun bitta edi (settings.accentColor...).
 * Endi har bir shablonda alohida: eski qiymatlar o'sha paytda tanlangan shablonga o'tadi
 * (rezyume avvalgidek ko'rinadi), qolgan shablonlar standart sozlamada boshlanadi.
 */
function templatesSettings(s: Obj, current: TemplateId): Record<TemplateId, TemplateSettings> {
  const saved = isObj(s.templates) ? s.templates : {};
  return Object.fromEntries(
    TEMPLATE_IDS.map((id) => {
      const own = saved[id];
      if (isObj(own)) return [id, templateSettings(own)];
      return [id, id === current && !isObj(s.templates) ? templateSettings(s) : { ...DEFAULT_TEMPLATE_SETTINGS }];
    }),
  ) as Record<TemplateId, TemplateSettings>;
}

/**
 * JSON'da `sections` massivi umuman yo'q bo'lsa (juda eski yoki chala fayl) — avvalgidek standart
 * bo'limlar qo'yiladi. Yangi rezyume (createResume) endi bo'limlarsiz boshlanadi, lekin eski
 * ma'lumotni o'qish xatti-harakati o'zgarmasligi kerak.
 */
const LEGACY_DEFAULT_SECTIONS: SectionType[] = ["employment", "education", "skills", "languages", "drivingLicense"];

export function normalizeResume(raw: unknown): Resume | null {
  if (!isObj(raw)) return null;
  const blank = createResume("");
  const p = isObj(raw.personal) ? raw.personal : {};
  const s = isObj(raw.settings) ? raw.settings : {};
  const c = isObj(raw.contacts) ? raw.contacts : {};
  const a = isObj(raw.additional) ? raw.additional : {};
  const version = typeof raw.schemaVersion === "number" ? raw.schemaVersion : 1;
  /*
   * v16'gacha bitta "Shaxsiy ma'lumotlar" bloki bor edi: rasm, ism, lavozim, matn va
   * "nom: qiymat" qatorlari (personal.extras). v17'da ular ikkiga ajratildi: "Profil" (personal)
   * va "Shaxsiy ma'lumotlar" (details). Eski blok sarlavhasi qatorlar bilan birga ko'chadi.
   */
  const splitProfile = version < 17;
  const d = isObj(raw.details) ? raw.details : {};
  const template: TemplateId = TEMPLATE_IDS.find((t) => t === s.template) ?? "sidebar";

  const resume: Resume = {
    schemaVersion: SCHEMA_VERSION,
    id: id(raw.id),
    name: str(raw.name).trim() || "Nomsiz rezyume",
    createdAt: str(raw.createdAt, blank.createdAt),
    updatedAt: str(raw.updatedAt, blank.updatedAt),
    personal: {
      type: "personal",
      title: splitProfile ? FIXED_BLOCK_TITLES.personal : str(p.title, FIXED_BLOCK_TITLES.personal),
      firstName: str(p.firstName),
      lastName: str(p.lastName),
      middleName: str(p.middleName),
      jobTitle: str(p.jobTitle),
      summary: str(p.summary),
      summaryHidden: p.summaryHidden === true,
      fieldLabels: fieldLabels(p.fieldLabels, PERSONAL_FIELD_KEYS),
      photo: str(p.photo).startsWith("data:image/") ? str(p.photo) : "",
    },
    details: splitProfile
      ? {
          type: "details",
          title: str(p.title, FIXED_BLOCK_TITLES.details),
          hidden: false,
          items: [...legacyExtras(p), ...arr(p.extras).map(extraField).filter(notNull)],
        }
      : {
          type: "details",
          title: str(d.title, FIXED_BLOCK_TITLES.details),
          hidden: d.hidden === true,
          items: arr(d.items).map(extraField).filter(notNull),
        },
    contacts: {
      type: "contacts",
      title: str(c.title, FIXED_BLOCK_TITLES.contacts),
      hidden: c.hidden === true,
      // v6'da kontaktlar oddiy massiv edi, v7'da { type, title, items }
      items: arr(Array.isArray(raw.contacts) ? raw.contacts : c.items).map(extraField).filter(notNull),
    },
    // v16'da qo'shilgan; eski rezyumelarda bo'sh blok bo'lib paydo bo'ladi
    additional: {
      type: "additional",
      title: str(a.title, FIXED_BLOCK_TITLES.additional),
      hidden: a.hidden === true,
      items: arr(a.items).map(extraField).filter(notNull),
    },
    sections: Array.isArray(raw.sections)
      ? raw.sections.map(section).filter(notNull)
      : LEGACY_DEFAULT_SECTIONS.map(createSection),
    // v18'gacha tartib yo'q edi: bloklar tepada, bo'limlar massivdagi tartibda (syncOrder to'ldiradi)
    order: arr(raw.order).filter((k): k is string => typeof k === "string"),
    settings: { template, templates: templatesSettings(s, template) },
  };

  if (version < 4) migrateDrivingLicense(resume);
  if (version < 6) migrateContacts(resume);
  addDefaultDetailFields(resume);
  // Versiyadan qat'i nazar: "summary" bo'limi qolgan bo'lsa, u shaxsiy ma'lumotlarga ko'chadi
  moveSummaryIntoPersonal(resume);
  moveLinksIntoContacts(resume);
  mergeInternshipsIntoEmployment(resume);
  // Migratsiyalar bo'lim qo'shishi yoki olib tashlashi mumkin — tartib oxirida moslanadi
  syncOrder(resume);
  return resume;
}
