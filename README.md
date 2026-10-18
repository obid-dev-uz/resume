# KHO Resume

Butunlay lokal ishlaydigan rezyume yaratish ilovasi (Vue 3 + Vite + Tauri 2).
Holat — Pinia, sahifalar — Vue Router (hash), interfeys stillari — Tailwind CSS 4.
Server yo'q: barcha ma'lumotlar qurilmaning `localStorage`'ida JSON ko'rinishida saqlanadi.

> **Loyiha qoidalari** (ma'lumotlarni yig'ish va shablonlar) — [`../CLAUDE.md`](../CLAUDE.md).
> Har bir o'zgarish shu qoidalarga mos bo'lishi kerak.

## Ishga tushirish

```bash
pnpm install
pnpm dev          # brauzerda: http://localhost:1420
pnpm tauri dev    # desktop ilova sifatida
```

## Saqlash tuzilmasi

| Kalit | Qiymat |
|---|---|
| `khoresume:resume:<id>` | Bitta rezyumening to'liq JSON'i (`src/types/resume.ts` dagi `Resume`) |
| `khoresume:active` | Oxirgi ochilgan rezyume id'si, ilova ro'yxat sahifasida ochilsa shu rezyumega o'tiladi (`src/router`) |
| `khoresume:ui:preview`, `khoresume:ui:view` | Interfeys sozlamalari: preview ko'rinadimi, A4 yoki JSON rejimi |

- Ochiq rezyumedagi har bir o'zgarish 300 ms ichida yoziladi (`src/stores/resumes.ts`).
  Oyna yopilayotganda yoki fonga o'tganda kutilayotgan o'zgarish darhol yoziladi.
- O'qilgan har bir JSON `src/lib/normalize.ts` orqali tekshiriladi, shuning uchun eski yoki chala
  ma'lumot ilovani buzmaydi. `schemaVersion` eski bo'lsa, ma'lumot yangi tuzilmaga ko'chiriladi:
  haydovchilik guvohnomasi "drivingLicense" bo'limiga; telefon, email, Telegram, LinkedIn, sayt kabi
  qatorlar (eski doimiy maydonlar va "Veb-sayt va ijtimoiy tarmoqlar" bo'limi ham) `contacts`ga;
  tug'ilgan sana, millat kabilar `details.items`ga o'tadi (v16'gacha `personal.extras` edi; v17'da
  "Profil" va "Shaxsiy ma'lumotlar" ikki alohida blokka ajratildi).
- Rasm 320×320 JPEG'ga kichraytirib saqlanadi. `localStorage` limiti taxminan 5 MB.
- Zaxira nusxa: kartadagi **JSON** tugmasi rezyumeni faylga yuklab oladi; qaytarish — yangi rezyume
  formasidagi "JSON import" (fayldagi rezyume yangi rezyume bo'lib qo'shiladi).

## Bo'lim identifikatorlari

Har bir bo'limda ikki xil nom bor: `type` — o'zgarmas identifikator (dastur bo'limni faqat shu
orqali taniydi) va `title` — foydalanuvchi o'zgartiradigan sarlavha. Sarlavha qanday bo'lmasin,
`type` o'zgarmaydi.

| `type` | Standart sarlavha | JSON'dagi joyi |
|---|---|---|
| `personal` | Profil: rasm, ism, familiya, lavozim va "O'zim haqimda" matni (`summary`, nomi `fieldLabels.summary`) | `personal` |
| `details` | Shaxsiy ma'lumotlar: tug'ilgan sana, millati kabi "nom: qiymat" qatorlari (v17; kontaktlar bilan bir xil mantiq) | `details` |
| `contacts` | Kontaktlar (✕ bilan olib tashlansa `hidden: true`: qatorlar saqlanadi, "Bo'lim qo'shish"dan qaytariladi) | `contacts` |
| `additional` | Qo'shimcha ma'lumotlar (v16; kontaktlar bilan bir xil tuzilma va mantiq) | `additional` |
| `employment` | Ish tajribasi | `sections[]` |
| `education` | Ta'lim | `sections[]` |
| `residence` | Yashash manzillari (shahar/viloyat, manzil, yillar) | `sections[]` |
| `courses`, `projects` | Kurslar, Loyihalar | `sections[]` |
| `skills`, `languages` | Ko'nikmalar, Tillar | `sections[]` |
| `drivingLicense` | Haydovchilik guvohnomasi | `sections[]` |
| `relatives` | Yaqin qarindoshlari (jadval: qarindoshligi, F.I.Sh., tug'ilgan sanasi va joyi, ish joyi, lavozimi, turar joyi; ustun nomlari `fieldLabels`da; "Vafot etgan" belgilansa oxirgi uch ustun birlashadi va "Turar joyi" matni chiqadi) | `sections[]` |
| `hobbies`, `certificates`, `achievements`, `references` | Qiziqishlar, Sertifikatlar, Yutuqlar, Tavsiyanomalar | `sections[]` |
| `custom` | Maxsus bo'lim (bir nechta bo'lishi mumkin — `id` bilan farqlanadi) | `sections[]` |

Profil doim eng tepada. "O'zim haqimda" (`summary`, v20), bloklar (`details`, `contacts`,
`additional`) va bo'limlar formada ↑/↓ bilan istalgan joyga suriladi; tartib `order` massivida
saqlanadi (v18): doimiy kalitlar va bo'limlar `id`si aralash. Olib tashlangan blok (`hidden: true`,
"O'zim haqimda" uchun `personal.summaryHidden`) tartibdagi joyini saqlaydi.

Tanlangan shablon — `settings.template`. Rang, shrift va ustunlar chegarasi har bir shablonda
alohida: `settings.templates.<shablon>` (`accentColor`, `fontFamily`, `fieldsSplit`). Bir shablonda
o'zgartirilgani boshqasiga ta'sir qilmaydi (v19; oldin rezyume uchun bitta edi — eski qiymatlar
o'sha paytdagi shablonga ko'chadi).

Ish tajribasi, ta'lim kabi bo'limlardagi maydon nomlari ham o'zgartiriladi. Ular bo'limning
`fieldLabels` obyektida o'zgarmas kalitlar bilan saqlanadi: `title`, `subtitle`, `startDate`,
`endDate`, `city`, `current`, `description` (faqat o'zgartirilgan nomlar yoziladi).
"Profil" maydon nomlari `personal.fieldLabels`da saqlanadi: `photo`, `firstName`,
`lastName`, `middleName` (otasining ismi), `jobTitle`, `summary`. Haydovchilik guvohnomasi maydon nomlari — bo'limning
`fieldLabels`ida: `categories`, `validity` (amal qilish muddati: `issueDate` – `expiryDate`),
`hasOwnCar`, `note`.
v8'dan boshlab "Profil" alohida bo'lim emas: matn `personal.summary`da, nomi (rezyumedagi sarlavhasi)
`personal.fieldLabels.summary`da saqlanadi. Eski "Profil" bo'limi ochilganda avtomatik ko'chiriladi.
v9'dan boshlab "Veb-sayt va ijtimoiy tarmoqlar" bo'limi yo'q: uning qatorlari havolasi bilan
"Kontaktlar"ga (`contacts.items`) ko'chiriladi. v10'dan boshlab "Amaliyotlar" (`internships`) ham alohida
emas: yozuvlari "Ish tajribasi" (`employment`) oxiriga qo'shiladi.

## Tuzilma

```
src/
  types/resume.ts            ma'lumotlar modeli
  lib/sections.ts            bo'lim turlari va yangi obyekt yaratuvchilar
  lib/normalize.ts           JSON'ni tekshirish va to'ldirish
  lib/storage.ts             localStorage bilan ishlash
  lib/files.ts               rasm, JSON yuklab olish va import
  lib/icons.ts               maydonlar uchun ikonkalar (oflayn SVG)
  stores/resumes.ts          rezyumelar holati va autosave (Pinia)
  stores/ui.ts               interfeys sozlamalari: preview, A4/JSON, mobil tab (Pinia)
  router/index.ts            sahifalar: / (ro'yxat), /resume/:id (muharrir), /resume/:id/templates (shablonlar oynasi)
  views/                     sahifalar: ResumeListPage, ResumeEditorPage
  components/                muharrir, formalar, preview, shablonlar galereyasi
  styles/app.css             Tailwind: tokenlar (@theme), narrow/phone variantlari, UI primitivlari
  styles/preview.css         shablonlarning umumiy asosi: A4 sahifa, .pv-* elementlar, print
  templates/index.ts         shablonlar ro'yxati (TEMPLATES, getTemplate)
  templates/<id>/            bitta shablon: index.ts (TemplateDef) + style.css (.tpl-<id>)
```

## Shablonlar

Galereyada 2 ta shablon: Yon panelli va Rasmiy (rasmiy hujjat uslubi: 12 ustunli sarlavha — chapda
3×4 rasm, 9 ustunda markazda ism va lavozim). Zamonaviy, Klassik, Minimal (ATS), Vaqt chizig'i,
Ijrochi, Nafis vaqtincha yashirilgan (`hidden: true`): kodi va stillari joyida, shu shablondagi
rezyume "Yon panelli"da chiziladi. Qaytarish uchun `src/templates/<id>/index.ts` dagi
`hidden: true` olib tashlanadi.

"ATS" belgili shablonlar bir ustunli; ish beruvchilarning avtomatik saralash dasturlari ularni
yaxshiroq o'qiydi. Yangi shablon qo'shish:

1. `src/types/resume.ts` dagi `TemplateId` ga id qo'shing.
2. `src/templates/<id>/index.ts` — `TemplateDef` (bir/ikki ustun, sarlavha qayerda, bayroqlar);
   shu faylda `import "./style.css";`.
3. `src/templates/<id>/style.css` — faqat `.tpl-<id>` bilan boshlanadigan qoidalar.
4. `src/templates/index.ts` da import qilib, `TEMPLATES` ga qo'shing.
