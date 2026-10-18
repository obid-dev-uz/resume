import type { Resume } from "../types/resume";
import { normalizeResume } from "./normalize";

/** Rasmni kvadrat qilib qirqadi va kichraytiradi, localStorage'ni tejash uchun */
export function readPhoto(file: File, size = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Faqat rasm fayli tanlang"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas mavjud emas"));
        return;
      }
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Rasmni o'qib bo'lmadi"));
    };
    img.src = url;
  });
}

export function downloadJson(resume: Resume): void {
  const blob = new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${resume.name.replace(/[^\p{L}\p{N}\- _]/gu, "").trim() || "resume"}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Bitta rezyume yoki rezyumelar massivi bo'lgan JSON faylni o'qiydi */
export async function readResumesFromFile(file: File): Promise<Resume[]> {
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error("Fayl yaroqli JSON emas");
  }
  const list = (Array.isArray(data) ? data : [data]).map(normalizeResume);
  const resumes = list.filter((r): r is Resume => r !== null);
  if (!resumes.length) throw new Error("Faylda rezyume topilmadi");
  return resumes;
}
