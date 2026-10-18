import type { TemplateId } from "../types/resume";
import type { TemplateDef } from "./types";
// Umumiy asos shablon stillaridan OLDIN yuklanadi: bir xil kuchli qoidada shablon ustun turadi
import "../styles/preview.css";
import sidebar from "./sidebar";
import modern from "./modern";
import classic from "./classic";
import minimal from "./minimal";
import timeline from "./timeline";
import executive from "./executive";
import elegant from "./elegant";
import rasmiy from "./rasmiy";

export type { TemplateDef } from "./types";

/*
 * Shablonlar: har biri o'z papkasida — index.ts (TemplateDef) va style.css (faqat `.tpl-<id>`).
 * Shablonlar bir-biriga bog'liq emas: birining papkasidagi o'zgarish boshqasiga ta'sir qilmaydi.
 * Yangi shablon: TemplateId'ga id, `<id>/index.ts` + `<id>/style.css`, shu ro'yxatga import.
 * Tartib — galereyadagi tartib; birinchisi yashirilgan/noma'lum shablon o'rniga ishlatiladi.
 */
export const TEMPLATES: TemplateDef[] = [sidebar, modern, classic, minimal, timeline, executive, elegant, rasmiy];

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

/** Galereyada ko'rsatiladigan shablonlar */
export const VISIBLE_TEMPLATES = TEMPLATES.filter((t) => !t.hidden);

/** Noma'lum yoki yashirilgan shablon o'rniga birinchisi ("Yon panelli") */
export function getTemplate(id: TemplateId): TemplateDef {
  const tpl = TEMPLATES.find((t) => t.id === id);
  return tpl && !tpl.hidden ? tpl : TEMPLATES[0];
}
