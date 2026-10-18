import type { Resume } from "../types/resume";
import { normalizeResume } from "./normalize";

/*
 * localStorage tuzilmasi:
 *   khoresume:resume:<id>  -> bitta rezyumening to'liq JSON'i
 *   khoresume:active       -> oxirgi ochilgan rezyume id'si
 *   khoresume:ui:<nomi>    -> interfeys sozlamalari (preview ko'rinadimi, A4/JSON rejimi)
 *
 * Har bir rezyume alohida kalitda saqlanadi. Shunda bitta rezyumega yozish
 * qolganlarini qayta yozmaydi, bitta kalit buzilsa ham boshqalari saqlanib qoladi.
 */

const PREFIX = "khoresume:";
const RESUME_PREFIX = `${PREFIX}resume:`;
const ACTIVE_KEY = `${PREFIX}active`;
const UI_PREFIX = `${PREFIX}ui:`;

export class StorageError extends Error {}

function describe(e: unknown): string {
  if (e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22)) {
    return "Xotira to'ldi (localStorage limiti ~5 MB). Rasmni kichraytiring yoki keraksiz rezyumelarni o'chiring.";
  }
  return e instanceof Error ? e.message : String(e);
}

export function loadAllResumes(): Resume[] {
  const result: Resume[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(RESUME_PREFIX)) continue;
    try {
      const resume = normalizeResume(JSON.parse(localStorage.getItem(key) ?? "null"));
      if (resume) result.push(resume);
    } catch (e) {
      console.warn(`"${key}" kalitidagi ma'lumot o'qilmadi`, e);
    }
  }
  return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveResume(resume: Resume): void {
  try {
    localStorage.setItem(RESUME_PREFIX + resume.id, JSON.stringify(resume));
  } catch (e) {
    throw new StorageError(describe(e));
  }
}

export function deleteResume(id: string): void {
  localStorage.removeItem(RESUME_PREFIX + id);
  if (getActiveId() === id) setActiveId(null);
}

export function getActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveId(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

/**
 * Interfeys sozlamalari. Yo'qolsa ham zarari yo'q, shuning uchun xatolar e'tiborsiz qoldiriladi.
 * null = standart qiymat (kalit o'chiriladi).
 */
export function getUiPref(name: string): string | null {
  try {
    return localStorage.getItem(UI_PREFIX + name);
  } catch {
    return null;
  }
}

export function setUiPref(name: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(UI_PREFIX + name);
    else localStorage.setItem(UI_PREFIX + name, value);
  } catch {
    // e'tiborsiz
  }
}

/** Boshqa oyna yoki tabda rezyumelar o'zgarganini bildiradi */
export function isResumeKey(key: string | null): boolean {
  return key === null || key.startsWith(RESUME_PREFIX);
}

