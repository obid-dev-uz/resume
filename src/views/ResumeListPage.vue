<script setup lang="ts">
import { nextTick, ref } from "vue";
import type { Resume } from "../types/resume";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useResumesStore } from "../stores/resumes";
import { formatDateTime } from "../lib/format";
import { isDemo } from "../lib/demo";
import { keepInView } from "../lib/keyboard";

const store = useResumesStore();
const { resumes } = storeToRefs(store);
const { nextDefaultName, create, duplicate, rename, remove, importFile } = store;

/** Rezyume URL orqali ochiladi; store'dagi ochiq rezyumeni router belgilaydi (src/router) */
const router = useRouter();
function open(id: string) {
  router.push({ name: "editor", params: { id } });
}

const creating = ref(false);
const newName = ref("");
const newNameInput = ref<HTMLInputElement | null>(null);
/** Xabar: import natijasi yoki xato (masalan, xotira to'lsa) */
const message = ref<{ type: "ok" | "error"; text: string } | null>(null);
const importInput = ref<HTMLInputElement | null>(null);

function report(e: unknown) {
  message.value = { type: "error", text: e instanceof Error ? e.message : String(e) };
}

async function startCreate() {
  creating.value = true;
  newName.value = "";
  await nextTick();
  newNameInput.value?.focus();
}

function confirmCreate() {
  try {
    const id = create(newName.value);
    creating.value = false;
    open(id);
  } catch (e) {
    report(e);
  }
}

/** Nom maydondan chiqqanda saqlanadi; bo'sh qolsa eski nom qaytadi */
function onRename(resume: Resume, e: Event) {
  const input = e.target as HTMLInputElement;
  try {
    rename(resume.id, input.value);
  } catch (err) {
    report(err);
  }
  input.value = resume.name;
}

/** Esc: o'zgarishni bekor qilib, maydondan chiqish */
function cancelRename(resume: Resume, e: Event) {
  const input = e.target as HTMLInputElement;
  input.value = resume.name;
  input.blur();
}

function onDuplicate(resume: Resume) {
  // Namunaning nusxasi — foydalanuvchining yangi rezyumesi: "Resume N"
  const name = prompt("Nusxa nomi:", isDemo(resume) ? nextDefaultName() : `${resume.name} (nusxa)`);
  if (name === null) return;
  try {
    duplicate(resume.id, name);
  } catch (e) {
    report(e);
  }
}

function onRemove(resume: Resume) {
  if (confirm(`"${resume.name}" butunlay o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.`)) {
    remove(resume.id);
  }
}

/** JSON fayldan rezyume qo'shish (yangi rezyume formasidan) */
async function onImport(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    const count = await importFile(file);
    creating.value = false;
    message.value = { type: "ok", text: `${count} ta rezyume import qilindi` };
  } catch (err) {
    report(err);
  }
}

function fullName(r: Resume) {
  return [r.personal.lastName, r.personal.firstName, r.personal.middleName].filter(Boolean).join(" ");
}
</script>

<template>
  <div class="mx-auto max-w-[1120px] px-6 py-8 phone:px-3 phone:pt-5 phone:pb-[calc(20px+env(safe-area-inset-bottom))]">
    <p
      v-if="message"
      class="mt-0 mb-4 cursor-pointer rounded-lg px-3.5 py-2.5"
      :class="message.type === 'ok' ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'"
      @click="message = null"
    >
      {{ message.text }}
    </p>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-4 phone:grid-cols-1 phone:gap-3">
      <article
        v-for="r in resumes"
        :key="r.id"
        class="flex min-h-[250px] cursor-pointer flex-col gap-1.5 rounded-card border border-line bg-surface p-3.5 text-left hover:border-brand phone:min-h-0"
        title="Ochish"
        tabindex="0"
        @click="open(r.id)"
        @keydown.enter.self="open(r.id)"
      >
        <div
          class="relative grid h-[110px] place-items-center overflow-hidden rounded-lg text-[40px] font-bold text-white"
          :style="{ background: r.settings.templates[r.settings.template].accentColor }"
        >
          <button
            v-if="!isDemo(r)"
            type="button"
            title="O'chirish"
            aria-label="O'chirish"
            class="absolute top-1.5 right-1.5 grid size-8 cursor-pointer place-items-center border-0 bg-transparent text-base leading-none text-white hover:opacity-70"
            @click.stop="onRemove(r)"
          >
            ✕
          </button>
          <img
            v-if="r.personal.photo"
            :src="r.personal.photo"
            alt=""
            class="size-[72px] rounded-full border-3 border-[rgb(255_255_255/0.7)] object-cover"
          />
          <span v-else>{{ (r.name[0] || "?").toUpperCase() }}</span>
        </div>

        <!-- Namunani o'chirib ham, nomini o'zgartirib ham bo'lmaydi (src/lib/demo.ts) -->
        <h3 v-if="isDemo(r)" class="flex items-center gap-2 text-base">
          <span class="truncate">{{ r.name }}</span>
          <span class="flex-none rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">Namuna</span>
        </h3>
        <!-- Nom oddiy matndek ko'rinadi, bosilganda tahrirlanadi (bo'lim sarlavhasi kabi) -->
        <input
          v-else
          class="rename-input w-full cursor-text rounded-none border-0 bg-transparent p-0 text-base font-bold focus:bg-transparent"
          :value="r.name"
          aria-label="Rezyume nomi"
          title="Nomini o'zgartirish"
          @click.stop
          @focus="keepInView($event.target as HTMLElement)"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
          @keydown.esc="cancelRename(r, $event)"
          @blur="onRename(r, $event)"
        />

        <p class="m-0 text-label text-muted">
          {{ [fullName(r), r.personal.jobTitle].filter(Boolean).join(" · ") || "Hali to'ldirilmagan" }}
        </p>
        <p v-if="isDemo(r)" class="m-0 text-label text-muted">Nusxa oling va o'zingizniki qilib tahrirlang</p>
        <p v-else class="m-0 text-label text-muted">Tahrirlangan: {{ formatDateTime(r.updatedAt) }}</p>

        <div class="mt-auto flex flex-wrap gap-1 pt-1.5">
          <button
            type="button"
            title="Nusxa olish"
            aria-label="Nusxa olish"
            class="icon-btn ml-auto grid place-items-center"
            @click.stop="onDuplicate(r)"
          >
            <svg
              class="app-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
      </article>

      <!-- Yangi rezyume: ro'yxat oxirida -->
      <form
        v-if="creating"
        class="flex min-h-[250px] flex-col justify-center gap-2.5 rounded-card border border-line bg-surface p-3.5 phone:min-h-0"
        @submit.prevent="confirmCreate"
      >
        <label class="field">
          <span>Rezyume nomi</span>
          <input
            ref="newNameInput"
            @focus="keepInView($event.target as HTMLElement)"
            v-model="newName"
            :placeholder="nextDefaultName()"
            @keydown.esc="creating = false"
          />
        </label>
        <p class="m-0 text-label text-muted">Masalan: Flutter Dev, Full-Stack Dev</p>
        <!-- Telefonda tugmalar ustma-ust, har biri butun kenglikda -->
        <div class="flex flex-wrap items-center gap-2 phone:flex-col phone:items-stretch phone:[&>.btn]:ml-0 phone:[&>.btn]:justify-center">
          <button type="submit" class="btn primary">Yaratish</button>
          <button type="button" class="btn" @click="importInput?.click()">JSON import</button>
          <input ref="importInput" type="file" accept="application/json,.json" hidden @change="onImport" />
          <button type="button" class="btn ghost ml-auto" @click="creating = false">Bekor qilish</button>
        </div>
      </form>

      <button
        v-else
        type="button"
        title="Yangi rezyume"
        aria-label="Yangi rezyume"
        class="flex min-h-[250px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-line bg-surface p-3.5 text-[15px] text-muted hover:border-brand hover:text-brand phone:min-h-0"
        @click="startCreate"
      >
        <span class="text-4xl leading-none" aria-hidden="true">+</span>
      </button>
    </div>
  </div>
</template>
