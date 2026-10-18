import type { TemplateId } from "../types/resume";
import type { BlockKey } from "../lib/sections";

/*
 * Shablon ta'rifi: tuzilma (bir yoki ikki ustun, sarlavha qayerda) va shablonga xos
 * xatti-harakat bayroqlari. Ko'rinishi — o'sha papkadagi style.css (`.tpl-<id>` ostida).
 * Bayroq faqat o'z shablonida yoqiladi, boshqalarida o'chiq qoladi.
 */

export interface TemplateDef {
  id: TemplateId;
  name: string;
  description: string;
  /** "sidebar": ikki ustun; "single": bir ustun */
  layout: "sidebar" | "single";
  /** Ikki ustunli shablonda yon ustun qaysi tomonda */
  side?: "left" | "right";
  /** Ism va lavozim: yon ustun ichida yoki sahifa tepasida */
  header: "side" | "top";
  /** Bir ustunli, ATS dasturlari oson o'qiydigan tuzilma */
  ats: boolean;
  /** false bo'lsa rasm chiqarilmaydi (ATS shablonlarida rasm tavsiya etilmaydi) */
  photo: boolean;
  /**
   * Bir ustunli shablonda "nom: qiymat" bloklari (shaxsiy ma'lumotlar, kontaktlar...) sarlavha
   * ichida emas, asosiy ustunda o'z sarlavhasi bilan, bo'limlar orasida formadagi tartibda
   * (sarlavhada faqat rasm, ism va lavozim qoladi)
   */
  fieldsBelowHeader?: boolean;
  /**
   * Ikki ustunli shablonda yon ustun o'rniga asosiy ustunda, formadagi tartibda chiziladigan
   * "nom: qiymat" bloklari (Yon panelli: shaxsiy ma'lumotlar — ikki ustunli jadval)
   */
  mainBlocks?: BlockKey[];
  /** Profil sarlavhasi ("MA'LUMOTNOMA") hujjat nomi sifatida sarlavhaning tepasida chiqadi */
  docTitle?: boolean;
  /** Haydovchilik guvohnomasi qatorma-qator: chapda nomi, o'ngda qiymati (Yon panelli, Rasmiy) */
  keyValueRows?: boolean;
  /** Yozuvlar muddati faqat yillarda: "2021 – 2023" ("Yanvar 2021 – Fevral 2023" o'rniga) (Yon panelli) */
  periodYearOnly?: boolean;
  /** Ism tartibi: "fio" — Familiya Ism Otasining ismi (rasmiy hujjat); yo'q bo'lsa — Ism Familiya Otasining ismi */
  nameOrder?: "fio";
  /**
   * Vaqtincha yashirilgan: galereyada ko'rsatilmaydi, shu shablondagi rezyume "Yon panelli"da
   * chiziladi (tanlov va sozlamalari saqlanadi). Qaytarish uchun shu belgini olib tashlash kifoya.
   */
  hidden?: boolean;
}
