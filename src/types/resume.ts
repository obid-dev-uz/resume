export const SCHEMA_VERSION = 21;

export type SectionKind = "text" | "timeline" | "rated" | "list" | "links" | "license" | "relatives";

export type SectionType =
  | "summary"
  | "employment"
  | "education"
  | "residence"
  | "internships"
  | "courses"
  | "projects"
  | "skills"
  | "languages"
  | "links"
  | "drivingLicense"
  | "relatives"
  | "hobbies"
  | "certificates"
  | "achievements"
  | "references"
  | "custom";

export interface ExtraField {
  id: string;
  label: string;
  value: string;
  /** src/lib/icons.ts dagi ikonka id'si; "" = ikonkasiz */
  labelIcon: string;
  valueIcon: string;
  /** Qiymat bosilganda ochiladigan havola (https://, mailto:, tel:); "" = havolasiz */
  link: string;
  /**
   * Qiymat qanday kiritiladi (v21): text — erkin matn; date — sana ("YYYY-MM-DD" yoki "YYYY");
   * gender — ro'yxatdan tanlov (FIELD_OPTIONS), "" = tanlanmagan
   */
  input: FieldInput;
}

export type FieldInput = "text" | "date" | "gender";

/*
 * Har bir bo'limda ikki xil nom bor:
 *   type  — o'zgarmas identifikator; dastur bo'limni faqat shu orqali taniydi
 *   title — foydalanuvchi ko'radigan va istalgancha o'zgartiradigan sarlavha
 * Sarlavha "Контакты" yoki "Aloqa" bo'lib qolsa ham, type "contacts" bo'lib qolaveradi.
 */

/** "Profil" maydonlarining o'zgarmas kalitlari */
export type PersonalFieldKey = "photo" | "firstName" | "lastName" | "middleName" | "jobTitle" | "summary";

export interface PersonalDetails {
  type: "personal";
  title: string;
  firstName: string;
  lastName: string;
  /** Otasining ismi: "Mardon o'g'li" (F.I.Sh. uchun) */
  middleName: string;
  jobTitle: string;
  /** Qisqacha o'zi haqida (avval alohida "Profil" bo'limi edi) */
  summary: string;
  /** true — "O'zim haqimda" ✕ bilan olib tashlangan: matn saqlanadi, formada va rezyumeda yo'q (v20) */
  summaryHidden: boolean;
  /**
   * O'zgartirilgan maydon nomlari (o'zgarmas kalit -> ko'rinadigan nom).
   * "summary" nomi rezyumeda sarlavha sifatida ham chiqadi.
   */
  fieldLabels: Partial<Record<PersonalFieldKey, string>>;
  /** Kichraytirilgan rasm, data URL (JPEG) ko'rinishida */
  photo: string;
}

/**
 * "Nom: qiymat" qatorlaridan iborat doimiy blok. Kontaktlar va "Qo'shimcha ma'lumotlar"
 * bir xil tuzilma va bir xil mantiqda ishlaydi, faqat o'zgarmas `type`i bilan farqlanadi.
 */
export interface FieldsBlock<T extends string> {
  type: T;
  title: string;
  /** true — blok olib tashlangan (✕): formada va rezyumeda yo'q, lekin qatorlar saqlanadi */
  hidden: boolean;
  items: ExtraField[];
}

/** Tug'ilgan sana, millat kabi "nom: qiymat" qatorlari (v16'gacha personal.extras edi) */
export type DetailsBlock = FieldsBlock<"details">;
export type ContactsBlock = FieldsBlock<"contacts">;
/** Harbiy xizmat, sudlanganlik kabi boshqa bloklarga sig'maydigan ma'lumotlar (v16) */
export type AdditionalBlock = FieldsBlock<"additional">;

export interface TimelineItem {
  id: string;
  title: string;
  /** Daraja (bakalavr, magistr...) — faqat SectionDef.degree yoqilgan bo'limlarda (Ta'lim) */
  degree: string;
  subtitle: string;
  city: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface RatedItem {
  id: string;
  name: string;
  /** 0 = daraja ko'rsatilmaydi, 1..5 */
  level: number;
}

export interface ListItem {
  id: string;
  text: string;
}

/** Veb-sayt yoki ijtimoiy tarmoq: label = "GitHub", value = "github.com/aziz" */
export interface LinkItem {
  id: string;
  label: string;
  value: string;
}

interface BaseSection {
  id: string;
  type: SectionType;
  title: string;
}

export interface TextSection extends BaseSection {
  kind: "text";
  /** Matn maydonining o'zgartirilgan nomi; o'zgarmas kalit — "content" */
  fieldLabels: { content?: string };
  content: string;
}

/** Timeline yozuvidagi maydonlarning o'zgarmas kalitlari */
export type TimelineFieldKey =
  | "title"
  | "degree"
  | "subtitle"
  | "startDate"
  | "endDate"
  | "city"
  | "current"
  | "description";

export interface TimelineSection extends BaseSection {
  kind: "timeline";
  /**
   * Foydalanuvchi o'zgartirgan maydon nomlari (faqat o'zgartirilganlari saqlanadi).
   * Kalit o'zgarmaydi: "Tugash"ni "Yakun" deb atasangiz ham kalit "endDate" bo'lib qoladi.
   */
  fieldLabels: Partial<Record<TimelineFieldKey, string>>;
  items: TimelineItem[];
}

export interface RatedSection extends BaseSection {
  kind: "rated";
  items: RatedItem[];
}

export interface ListSection extends BaseSection {
  kind: "list";
  items: ListItem[];
}

export interface LinksSection extends BaseSection {
  kind: "links";
  items: LinkItem[];
}

/**
 * Haydovchilik guvohnomasi: bitta shaxsda bitta guvohnoma bo'ladi, shuning uchun
 * yozuvlar ro'yxati emas, tuzilmali maydonlar. Yangi ma'lumot kerak bo'lsa shu yerga qo'shiladi.
 */
/** Guvohnoma maydonlarining o'zgarmas kalitlari (nomlari fieldLabels'da o'zgartiriladi) */
/** "validity" — amal qilish muddati (issueDate – expiryDate) */
export type LicenseFieldKey = "categories" | "validity" | "hasOwnCar" | "note";

export interface DrivingLicenseSection extends BaseSection {
  kind: "license";
  /** O'zgartirilgan maydon nomlari (faqat o'zgartirilganlari) */
  fieldLabels: Partial<Record<LicenseFieldKey, string>>;
  /** LICENSE_CATEGORIES dagi qiymatlar: "B", "C", "BE"... */
  categories: string[];
  /**
   * Amal qilish muddati: berilgan va tugash sanalari. "YYYY-MM-DD", "YYYY-MM" (v19'gacha
   * oy tanlagichidan) yoki "YYYY"; bo'sh — "".
   */
  issueDate: string;
  expiryDate: string;
  hasOwnCar: boolean;
  note: string;
}

/** "Yaqin qarindoshlari" jadvali ustunlarining o'zgarmas kalitlari */
/** "birth" — eski (v12) umumiy ustun nomi, faqat eski JSON'ni o'qish uchun qoldirilgan */
export type RelativeFieldKey =
  | "relation"
  | "fullName"
  | "birth"
  | "birthDate"
  | "birthPlace"
  | "position"
  | "workplace"
  | "deathDate"
  | "deceased"
  | "work"
  | "address";

export interface RelativeItem {
  id: string;
  /** Otasi, Onasi, Akasi... */
  relation: string;
  fullName: string;
  /** "YYYY", "YYYY-MM" yoki "YYYY-MM-DD" — kun va oy ixtiyoriy (v11 da faqat yil: birthYear edi) */
  birthDate: string;
  birthPlace: string;
  /** Lavozimi: "Injener texnolog" */
  position: string;
  /** Ish joyi: "ISUZU" (v12'gacha lavozim bilan birga "work" maydonida edi) */
  workplace: string;
  address: string;
  deceased: boolean;
  /** Tug'ilgan sana kabi: "YYYY-MM-DD" yoki faqat yil "YYYY" (v13'gacha "deathYear" edi) */
  deathDate: string;
}

export interface RelativesSection extends BaseSection {
  kind: "relatives";
  /** O'zgartirilgan ustun nomlari (faqat o'zgartirilganlari) */
  fieldLabels: Partial<Record<RelativeFieldKey, string>>;
  items: RelativeItem[];
}

export type Section =
  | TextSection
  | TimelineSection
  | RatedSection
  | ListSection
  | LinksSection
  | DrivingLicenseSection
  | RelativesSection;

export type TemplateId =
  | "sidebar"
  | "modern"
  | "classic"
  | "minimal"
  | "timeline"
  | "executive"
  | "elegant"
  | "rasmiy";

/**
 * Bitta shablonning ko'rinish sozlamalari. Har bir shablon o'zinikini saqlaydi: bir shablonda
 * rang yoki shriftni o'zgartirish boshqa shablonga ta'sir qilmaydi (v19; oldin rezyume uchun
 * bitta umumiy edi).
 */
export interface TemplateSettings {
  accentColor: string;
  fontFamily: string;
  /**
   * Ikki ustunli "kalit — qiymat" jadvalida (Rasmiy) chap ustun kengligi, foizda (20..80).
   * Preview'dagi ajratuvchi chiziqni surib o'zgartiriladi.
   */
  fieldsSplit: number;
}

export interface ResumeSettings {
  /** Tanlangan shablon */
  template: TemplateId;
  /** Har bir shablonning o'z sozlamalari (barcha shablonlar uchun to'ldirilgan) */
  templates: Record<TemplateId, TemplateSettings>;
}

export interface Resume {
  schemaVersion: number;
  id: string;
  /** Foydalanuvchi bergan nom: "Flutter Dev", "Full-Stack Dev" ... */
  name: string;
  createdAt: string;
  updatedAt: string;
  /** Profil: rasm, ism, familiya, lavozim, "O'zim haqimda" (o'zgarmas kaliti tarixan "personal") */
  personal: PersonalDetails;
  details: DetailsBlock;
  /** Telefon, email, Telegram, LinkedIn... — shaxsiy ma'lumotlardan alohida */
  contacts: ContactsBlock;
  additional: AdditionalBlock;
  sections: Section[];
  /**
   * Formadagi (va rezyumedagi) tartib: "summary" ("O'zim haqimda", v20), "details", "contacts",
   * "additional" bloklari va bo'limlarning id'lari aralash. Profil doim eng tepada, u ro'yxatga
   * kirmaydi (v18).
   */
  order: string[];
  settings: ResumeSettings;
}
