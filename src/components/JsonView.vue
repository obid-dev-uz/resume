<script setup lang="ts">
import { computed } from "vue";
import type { Resume } from "../types/resume";
import { formatBytes } from "../lib/format";

const props = defineProps<{ resume: Resume }>();

/** Rasm (base64) juda uzun — ko'rinishda qisqartiriladi, yuklab olinganda to'liq bo'ladi */
const text = computed(() =>
  JSON.stringify(
    props.resume,
    (key, value) =>
      key === "photo" && typeof value === "string" && value.length > 80
        ? `${value.slice(0, 32)}… (${formatBytes(Math.round(value.length * 0.75))})`
        : value,
    2,
  ),
);

type TokenType = "key" | "string" | "number" | "literal" | "punct" | "space";
interface Token {
  type: TokenType;
  text: string;
}

const TOKEN_RE =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],]/g;

/** Rang berish uchun matn tokenlarga bo'linadi; v-html ishlatilmaydi, hammasi oddiy matn */
const tokens = computed<Token[]>(() => {
  const out: Token[] = [];
  let last = 0;
  for (const m of text.value.matchAll(TOKEN_RE)) {
    const index = m.index ?? 0;
    if (index > last) out.push({ type: "space", text: text.value.slice(last, index) });
    const [whole, str, colon] = m;
    if (str !== undefined) {
      out.push({ type: colon ? "key" : "string", text: str });
      if (colon) out.push({ type: "punct", text: colon });
    } else if (/^[{}[\],]$/.test(whole)) {
      out.push({ type: "punct", text: whole });
    } else if (/^(true|false|null)$/.test(whole)) {
      out.push({ type: "literal", text: whole });
    } else {
      out.push({ type: "number", text: whole });
    }
    last = index + whole.length;
  }
  if (last < text.value.length) out.push({ type: "space", text: text.value.slice(last) });
  return out;
});
</script>

<template>
  <div class="json-view min-h-0 flex-1 overflow-auto px-5 pt-4 pb-5 narrow:px-2.5 narrow:py-3">
    <p class="mt-0 mb-2.5 text-label text-muted">
      Faqat ko'rish uchun. Rasm qisqartirib ko'rsatilgan — yuklab olingan faylda to'liq bo'ladi.
    </p>
    <pre class="m-0 rounded-card border border-line bg-surface px-[18px] py-4 font-mono text-label leading-[1.55] wrap-anywhere whitespace-pre-wrap [tab-size:2]"><code><span
      v-for="(t, i) in tokens"
      :key="i"
      :class="`j-${t.type}`"
    >{{ t.text }}</span></code></pre>
  </div>
</template>
