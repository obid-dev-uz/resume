import { defineStore } from "pinia";
import { computed, reactive, ref, watch } from "vue";
import type { Resume } from "../types/resume";
import { cloneResume, createResume, uid } from "../lib/sections";
import {
  deleteResume,
  isResumeKey,
  loadAllResumes,
  saveResume,
  setActiveId,
  StorageError,
} from "../lib/storage";
import { readResumesFromFile } from "../lib/files";
import { createDemoResume, isDemo } from "../lib/demo";

/*
 * Rezyumelar holati (Pinia). Barcha rezyumelar xotirada turadi, har biri o'z obyekti —
 * bir-biri bilan hech narsa bo'lishmaydi. Ochiq rezyumedagi har bir o'zgarish kuzatiladi va
 * 300 ms ichida o'z kalitiga yoziladi: `khoresume:resume:<id>` (src/lib/storage.ts).
 */

const AUTOSAVE_DELAY_MS = 300;

/** Saqlangan rezyumelar va namuna (demo) rezyume — u localStorage'da emas, har safar yangidan yasaladi */
function loadItems(): Resume[] {
  return [createDemoResume(), ...loadAllResumes().filter((r) => !isDemo(r))];
}

/** Oxirgi saqlangan holat (updatedAt'siz); o'zgarish bo'lmasa qayta yozilmaydi */
function snapshotOf(resume: Resume): string {
  const { updatedAt: _ignored, ...rest } = resume;
  return JSON.stringify(rest);
}

export const useResumesStore = defineStore("resumes", () => {
  const items = ref<Resume[]>(loadItems());
  const activeId = ref<string | null>(null);
  const saveStatus = reactive({
    state: "saved" as "saved" | "pending" | "error",
    savedAt: "",
    error: "",
  });

  const snapshots = new Map<string, string>();

  function resetSnapshots() {
    snapshots.clear();
    items.value.forEach((r) => snapshots.set(r.id, snapshotOf(r)));
  }
  resetSnapshots();

  const active = computed(() => items.value.find((r) => r.id === activeId.value) ?? null);
  /** Namuna doim birinchi, qolganlari oxirgi tahrir bo'yicha */
  const resumes = computed(() =>
    [...items.value].sort(
      (a, b) => Number(isDemo(b)) - Number(isDemo(a)) || b.updatedAt.localeCompare(a.updatedAt),
    ),
  );

  function persist(resume: Resume, force = false): void {
    // Namuna saqlanmaydi: shablon/rang o'zgarsa ham faqat shu sessiyada qoladi
    if (isDemo(resume)) {
      saveStatus.state = "saved";
      return;
    }
    const snapshot = snapshotOf(resume);
    if (!force && snapshots.get(resume.id) === snapshot) {
      if (saveStatus.state === "pending") saveStatus.state = "saved";
      return;
    }
    const previous = resume.updatedAt;
    resume.updatedAt = new Date().toISOString();
    try {
      saveResume(resume);
      snapshots.set(resume.id, snapshot);
      saveStatus.state = "saved";
      saveStatus.savedAt = resume.updatedAt;
      saveStatus.error = "";
    } catch (e) {
      resume.updatedAt = previous;
      saveStatus.state = "error";
      saveStatus.error = e instanceof StorageError ? e.message : String(e);
      throw e;
    }
  }

  // ---- Autosave ----

  let timer: ReturnType<typeof setTimeout> | undefined;
  let pendingId: string | null = null;

  function flush(): void {
    clearTimeout(timer);
    timer = undefined;
    const resume = items.value.find((r) => r.id === pendingId);
    pendingId = null;
    if (!resume) return;
    try {
      persist(resume);
    } catch {
      // xato saveStatus orqali ko'rsatiladi
    }
  }

  watch(
    active,
    (resume) => {
      if (!resume) return;
      if (pendingId && pendingId !== resume.id) flush();
      pendingId = resume.id;
      saveStatus.state = "pending";
      clearTimeout(timer);
      timer = setTimeout(flush, AUTOSAVE_DELAY_MS);
    },
    { deep: true },
  );

  // Oyna yopilsa yoki fonga o'tsa, kutilayotgan o'zgarish darhol yoziladi
  window.addEventListener("pagehide", flush);
  window.addEventListener("beforeunload", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });

  // Boshqa tabda o'zgarish bo'lsa, ro'yxat yangilanadi (tahrir paytida emas)
  window.addEventListener("storage", (e) => {
    if (e.storageArea !== localStorage || !isResumeKey(e.key) || activeId.value) return;
    items.value = loadItems();
    resetSnapshots();
  });

  // ---- Amallar ----

  function nextDefaultName(): string {
    const max = items.value.reduce((acc, r) => {
      const m = /^Resume (\d+)$/i.exec(r.name.trim());
      return m ? Math.max(acc, Number(m[1])) : acc;
    }, 0);
    return `Resume ${max + 1}`;
  }

  function add(resume: Resume): Resume {
    persist(resume, true);
    items.value.unshift(resume);
    return items.value[0];
  }

  function find(id: string): Resume | undefined {
    return items.value.find((r) => r.id === id);
  }

  function create(name: string): string {
    return add(createResume(name.trim() || nextDefaultName())).id;
  }

  function duplicate(id: string, name?: string): string | null {
    flush();
    const source = find(id);
    if (!source) return null;
    return add(cloneResume(source, name?.trim() || `${source.name} (nusxa)`)).id;
  }

  function rename(id: string, name: string): void {
    const resume = find(id);
    const clean = name.trim();
    if (!resume || isDemo(resume) || !clean || resume.name === clean) return;
    resume.name = clean;
    persist(resume);
  }

  function remove(id: string): void {
    if (isDemo(id)) return;
    if (pendingId === id) {
      clearTimeout(timer);
      pendingId = null;
    }
    deleteResume(id);
    snapshots.delete(id);
    items.value = items.value.filter((r) => r.id !== id);
    if (activeId.value === id) activeId.value = null;
  }

  /** Router chaqiradi (src/router): ochiq rezyume URL'dagi `id` bilan bir xil bo'ladi */
  function open(id: string): void {
    flush();
    if (!find(id)) return;
    activeId.value = id;
    setActiveId(id);
  }

  function close(): void {
    flush();
    activeId.value = null;
    setActiveId(null);
  }

  /** JSON fayldan (bitta rezyume yoki massiv) — har biri alohida rezyume bo'lib qo'shiladi */
  async function importFile(file: File): Promise<number> {
    const incoming = await readResumesFromFile(file);
    for (const resume of incoming) {
      // Mavjud rezyumeni ustidan yozmaslik uchun takroriy id almashtiriladi
      if (find(resume.id)) resume.id = uid();
      add(resume);
    }
    return incoming.length;
  }

  return {
    items,
    activeId,
    saveStatus,
    resumes,
    active,
    nextDefaultName,
    find,
    create,
    duplicate,
    rename,
    remove,
    open,
    close,
    flush,
    importFile,
  };
});
