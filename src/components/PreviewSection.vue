<script setup lang="ts">
import { computed } from "vue";
import type { Section } from "../types/resume";
import {
  LICENSE_CATEGORIES,
  SECTION_DEFS,
  currentLabel,
  licenseLabel,
  relativeLabel,
  timelineHeading,
} from "../lib/sections";
import type { TimelineItem } from "../types/resume";
import { formatDateRange, formatPartialDateShort, formatPeriod, parseDescription } from "../lib/format";
import { toHref } from "../lib/links";

/**
 * rows — shablon (Rasmiy) "nom: qiymat" ma'lumotlarini qatorma-qator chizadi;
 * yearOnly — yozuvlar muddati faqat yillarda (TemplateDef.periodYearOnly)
 */
const props = defineProps<{ section: Section; rows?: boolean; yearOnly?: boolean }>();

const levels = computed(() => SECTION_DEFS[props.section.type].levels ?? []);

/**
 * Yozuvning qalin sarlavhasi va ostidagi qatori. Odatda tepada lavozim/nom, ostida tashkilot.
 * Ta'limda (daraja maydoni bor bo'limlar) teskari: tepada o'quv muassasasi va shahar,
 * ostida mutaxassislik va daraja.
 */
function entryLines(item: TimelineItem): { head: string; sub: string } {
  const place = [item.subtitle.trim(), item.city.trim()].filter(Boolean).join(", ");
  const heading = timelineHeading(item);
  return SECTION_DEFS[props.section.type].degree ? { head: place, sub: heading } : { head: heading, sub: place };
}

/** Belgilash tartibidan qat'i nazar, toifalar standart tartibda chiqadi */
const categories = computed(() => {
  const s = props.section;
  return s.kind === "license" ? LICENSE_CATEGORIES.filter((c) => s.categories.includes(c)) : [];
});
</script>

<template>
  <section class="pv-section" :class="`pv-kind-${section.kind}`">
    <h3 class="pv-title">{{ section.title || SECTION_DEFS[section.type].title }}</h3>

    <div v-if="section.kind === 'text'" class="pv-desc">
      <template v-for="(block, b) in parseDescription(section.content)" :key="b">
        <ul v-if="block.type === 'ul'">
          <li v-for="(line, l) in block.lines" :key="l">{{ line }}</li>
        </ul>
        <p v-else v-for="(line, l) in block.lines" :key="l">{{ line }}</p>
      </template>
    </div>

    <template v-else-if="section.kind === 'timeline'">
      <div v-for="item in section.items" :key="item.id" class="pv-entry">
        <div class="pv-entry-head">
          <strong>{{ entryLines(item).head }}</strong>
          <span class="pv-period">{{ formatPeriod(item.startDate, item.endDate, item.current, currentLabel(section), yearOnly) }}</span>
        </div>
        <div v-if="entryLines(item).sub" class="pv-sub">{{ entryLines(item).sub }}</div>
        <div v-if="item.description" class="pv-desc">
          <template v-for="(block, b) in parseDescription(item.description)" :key="b">
            <ul v-if="block.type === 'ul'">
              <li v-for="(line, l) in block.lines" :key="l">{{ line }}</li>
            </ul>
            <p v-else v-for="(line, l) in block.lines" :key="l">{{ line }}</p>
          </template>
        </div>
      </div>
    </template>

    <template v-else-if="section.kind === 'rated'">
      <div v-for="item in section.items" :key="item.id" class="pv-rated">
        <span class="pv-rated-name">{{ item.name }}</span>
        <span v-if="item.level" class="pv-level" :title="levels[item.level - 1]">
          <i v-for="n in 5" :key="n" :class="{ on: n <= item.level }" />
        </span>
        <!-- Matnli daraja: ATS shablonlarida nuqtalar o'rniga ko'rsatiladi -->
        <span v-if="item.level" class="pv-level-text">{{ levels[item.level - 1] }}</span>
      </div>
    </template>

    <dl v-else-if="section.kind === 'links'" class="pv-links">
      <template v-for="item in section.items" :key="item.id">
        <dt v-if="item.label">{{ item.label }}</dt>
        <dd>
          <a v-if="toHref(item.value)" :href="toHref(item.value)" target="_blank" rel="noopener noreferrer">{{
            item.value
          }}</a>
          <template v-else>{{ item.value }}</template>
        </dd>
      </template>
    </dl>

    <!-- Qatorlar: [nomi] ....... [qiymati]; izoh butun kenglikda -->
    <div v-else-if="section.kind === 'license' && rows" class="pv-fields-rows">
      <div v-if="categories.length" class="pv-fr-item">
        <span class="pv-fg-key">{{ licenseLabel(section, "categories") }}</span>
        <span class="pv-fr-value">{{ categories.join(", ") }}</span>
      </div>
      <div v-if="section.issueDate || section.expiryDate" class="pv-fr-item">
        <span class="pv-fg-key">{{ licenseLabel(section, "validity") }}</span>
        <span class="pv-fr-value">{{ formatDateRange(section.issueDate, section.expiryDate) }}</span>
      </div>
      <!-- Belgilangan bo'lsa ✓, belgilanmagan bo'lsa qator umuman chiqmaydi -->
      <div v-if="section.hasOwnCar" class="pv-fr-item">
        <span class="pv-fg-key">{{ licenseLabel(section, "hasOwnCar") }}</span>
        <span class="pv-fr-value pv-check" aria-label="ha">✓</span>
      </div>
      <p v-if="section.note.trim()" class="pv-fr-note">{{ section.note }}</p>
    </div>

    <dl v-else-if="section.kind === 'license'" class="pv-links">
      <template v-if="categories.length">
        <dt>{{ licenseLabel(section, "categories") }}</dt>
        <dd>{{ categories.join(", ") }}</dd>
      </template>
      <template v-if="section.issueDate || section.expiryDate">
        <dt>{{ licenseLabel(section, "validity") }}</dt>
        <dd>{{ formatDateRange(section.issueDate, section.expiryDate) }}</dd>
      </template>
      <dd v-if="section.hasOwnCar"><span class="pv-check" aria-hidden="true">✓</span> {{ licenseLabel(section, "hasOwnCar") }}</dd>
      <dd v-if="section.note.trim()">{{ section.note }}</dd>
    </dl>

    <!-- Rasmiy ma'lumotnoma shaklidagi jadval -->
    <table v-else-if="section.kind === 'relatives'" class="pv-rel">
      <thead>
        <tr>
          <th>{{ relativeLabel(section, "relation") }}</th>
          <th>{{ relativeLabel(section, "fullName") }}</th>
          <th>{{ relativeLabel(section, "birthDate") }}</th>
          <th>{{ relativeLabel(section, "birthPlace") }}</th>
          <th>{{ relativeLabel(section, "workplace") }}</th>
          <th>{{ relativeLabel(section, "position") }}</th>
          <th>{{ relativeLabel(section, "address") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in section.items" :key="r.id">
          <th scope="row">{{ r.relation }}</th>
          <td>{{ r.fullName }}</td>
          <td>{{ formatPartialDateShort(r.birthDate) }}</td>
          <td>{{ r.birthPlace }}</td>
          <!-- Vafot etgan: ish joyi, lavozimi va turar joyi bitta katak — "Turar joyi" matni -->
          <td v-if="r.deceased" colspan="3">{{ r.address }}</td>
          <template v-else>
            <td>{{ r.workplace }}</td>
            <td>{{ r.position }}</td>
            <td>{{ r.address }}</td>
          </template>
        </tr>
      </tbody>
    </table>

    <ul v-else-if="section.kind === 'list'" class="pv-list">
      <li v-for="item in section.items" :key="item.id">{{ item.text }}</li>
    </ul>
  </section>
</template>
