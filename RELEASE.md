# KHO Resume'ni Play Market'ga chiqarish — oddiy tilda

Bu qo'llanma ilovani birinchi marta Google Play Market'ga chiqarish uchun. Har bir qadam tartib
bilan yozilgan: bittasini tugatib, keyingisiga o'ting. Buyruqlar `frontend/` papkasi ichida
yoziladi.

---

## 0. Avval uchta so'zni tushunib olamiz

- **APK** — telefonga to'g'ridan-to'g'ri o'rnatiladigan fayl. Uni do'stingizga yuborsangiz,
  u o'rnatib oladi. `pnpm apk` shuni yasaydi. **Play Market uni qabul qilmaydi.**
- **AAB** — Play Market uchun "quti". Siz qutini Google'ga berasiz, Google undan har bir
  telefonga mos APK yasab beradi. Play Market faqat shuni oladi.
- **Kalit (keystore)** — bu ilovaning **uy kaliti**. Ilovaning har bir yangi versiyasi shu kalit
  bilan "qulflanadi". Google qarab: "Kalit o'shami? Demak, egasi o'sha odam" deydi.
  Kalitni yo'qotsangiz, yangilanish chiqara olmaysiz. Shuning uchun uni ehtiyot qiling.

---

## 1-qadam. Ilova nomini (identifikatorini) tekshiring — faqat bir marta

`src-tauri/tauri.conf.json` faylida shu qator bor:

```json
"identifier": "kho.resume",
```

Bu ilovaning **pasport raqami**. Play Market'ga birinchi marta yuklaganingizdan keyin uni
**hech qachon o'zgartirib bo'lmaydi**. Ko'pchilik o'z sayti nomini teskari yozadi
(masalan `uz.kho.resume`). Hozirgisi yoqsa, shunday qoldiring. O'zgartirmoqchi bo'lsangiz,
aynan hozir o'zgartiring.

## 2-qadam. Versiya raqamini qo'ying

O'sha faylning o'zida:

```json
"version": "1.0.0",
```

Bu ilovaning **yoshi**. Birinchi chiqish uchun `1.0.0` yaxshi. Har safar yangi versiya
yuklaganda raqam **oshishi shart**: `1.0.0` → `1.0.1` (kichik tuzatish) → `1.1.0` (yangi
imkoniyat). Aks holda Google "bu versiya menda bor-ku" deb qaytaradi.

## 3-qadam. Uy kalitini yasang — faqat bir marta

```bash
mkdir -p ~/keys
```

```bash
keytool -genkey -v -keystore ~/keys/kho-resume-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

U sizdan bir nechta narsa so'raydi:
- **Parol** — o'ylab toping va **qog'ozga yozib qo'ying**. Ikki marta so'raladi.
- Ism, tashkilot, shahar, mamlakat (`UZ`) — shunchaki javob bering.
- Oxirida `yes` deb yozing.

Endi `~/keys/kho-resume-upload.jks` — sizning uy kalitingiz.

> **Muhim:** bu fayl va parolni boshqa joyga ham nusxalab qo'ying (fleshka, parol menejeri).
> Kompyuter buzilsa, kalit ham yo'qoladi. Kalitni **hech kimga bermang va git'ga qo'shmang**.

## 4-qadam. Kalit qayerdaligini loyihaga ayting

Shu faylni yarating: `src-tauri/gen/android/keystore.properties`

```properties
storeFile=/home/profound007/keys/kho-resume-upload.jks
storePassword=SIZNING_PAROLINGIZ
keyAlias=upload
keyPassword=SIZNING_PAROLINGIZ
```

Bu faylni git ko'rmaydi (`.gitignore` da bor), ya'ni parol hech qayerga ketmaydi. Loyiha shu
faylni topsa, release build'ni avtomatik shu kalit bilan qulflaydi.

## 5-qadam. Play Market uchun qutini (AAB) yasang

```bash
pnpm aab
```

Bir necha daqiqa kuting. Tayyor bo'lgach, fayl shu yerda turadi:

```
src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab
```

Yuklashdan oldin ilovani o'z telefoningizda sinab ko'ring:

```bash
pnpm apk
```

```bash
adb install -r apk/kho-resume-1.0.0.apk
```

Tekshiring: rezyume yaratish, tahrirlash, shablon tanlash, PDF saqlash, qorong'i rejim.

## 6-qadam. Google Play Console akkaunti oching — faqat bir marta

1. https://play.google.com/console sahifasiga kiring.
2. Dasturchi akkaunti oching. Bir martalik to'lov **25 dollar**.
3. Google shaxsingizni tasdiqlashni so'raydi (pasport). Bu bir necha kun olishi mumkin.

## 7-qadam. Play Console'da ilova yarating

**Create app** tugmasini bosing:
- **App name:** `KHO Resume`
- **Default language:** o'zingiz tanlang
- **App or game:** App
- **Free or paid:** Free (keyin pullik qilib bo'lmaydi)
- Shartlarga rozilik belgilarini qo'ying.

## 8-qadam. Ilova haqidagi so'rovnomalarni to'ldiring

Chap menyuda **Dashboard** → "Set up your app" ro'yxati chiqadi. Har birini to'ldiring:

| Bo'lim | Nima yozasiz |
|---|---|
| **Privacy policy** | Maxfiylik siyosati sahifasining havolasi (URL). Oddiy sahifa yetadi: "Ilova hech qanday ma'lumot yig'maydi, hammasi telefonda saqlanadi." Uni GitHub Pages yoki Google Sites'da bepul ochish mumkin. |
| **App access** | "All functionality is available without special access" (login yo'q) |
| **Ads** | No, ilovada reklama yo'q |
| **Content rating** | So'rovnomaga javob bering (zo'ravonlik yo'q va h.k.) → odatda "3+" chiqadi |
| **Target audience** | 18+ (yoki 16+) — bolalar uchun emas, aks holda qo'shimcha talablar chiqadi |
| **Data safety** | "No data collected", "No data shared" — rezyumelar faqat telefonda saqlanadi |
| **Government apps / Financial / Health** | No |

## 9-qadam. Do'kon sahifasini bezang (Store listing)

**Grow → Store presence → Main store listing**:
- **Short description** (80 belgigacha): masalan "Tez va chiroyli rezyume yarating, PDF qilib saqlang."
- **Full description** (4000 belgigacha): ilova nima qiladi, shablonlar, PDF, oflayn ishlashi.
- **App icon:** 512×512 PNG (`app-icon.png` dan tayyorlanadi).
- **Feature graphic:** 1024×500 rasm (reklama bannerchasi).
- **Phone screenshots:** kamida 2 ta (telefoningizdan skrinshot oling).

## 10-qadam. Avval yopiq sinovdan o'tkazing

Yangi shaxsiy akkauntlar uchun Google qoidasi: **production'ga chiqishdan oldin kamida 12 kishi
14 kun davomida yopiq sinovda (Closed testing) ilovani ishlatishi kerak.**

1. **Testing → Closed testing → Create track**.
2. **Testers:** 12+ ta Gmail manzil (do'stlar, oila) ro'yxatini qo'shing.
3. **Create new release** → 5-qadamdagi `.aab` faylni yuklang.
4. Birinchi marta so'raganda **Play App Signing**ga rozi bo'ling. Bunda Google o'zining asosiy
   kalitini saqlaydi, sizniki esa "yuklash kaliti" bo'ladi. Bu xavfsizroq: yuklash kalitini
   yo'qotsangiz, Google orqali yangisini olish mumkin.
5. **Release notes:** "Birinchi versiya".
6. **Review release → Start rollout**.
7. Sinovchilarga havola yuboring. Ular ilovani o'rnatib, 14 kun ishlatib turishsin.

Oldin o'zingiz tekshirib ko'rmoqchi bo'lsangiz, **Internal testing** (100 kishigacha, tekshiruvsiz,
darhol) ham bor. Lekin 14 kunlik qoidani faqat Closed testing hisoblaydi.

## 11-qadam. Hammaga chiqaring (Production)

14 kun o'tgach, Dashboard'da **Apply for production** tugmasi ochiladi:
1. Google bir nechta savol beradi (sinov qanday o'tdi) — javob bering.
2. Ruxsat berilgach: **Production → Create new release** → o'sha `.aab` (yoki yangisini) yuklang
   → **Start rollout to Production**.
3. Google ilovani ko'rib chiqadi: odatda 1–7 kun. Keyin ilova Play Market'da paydo bo'ladi. 🎉

---

## Keyingi yangilanishlar (har safar)

1. `src-tauri/tauri.conf.json` da versiyani oshiring (`1.0.0` → `1.0.1`).
2. Tekshiring: `npx vue-tsc --noEmit && npx vite build`.
3. `pnpm aab`
4. Play Console → **Production → Create new release** → yangi `.aab` → "nima o'zgardi" yozing →
   **Start rollout**.
5. Git'da belgi qo'ying (keyin qaysi kod qaysi versiya ekanini bilish uchun):

   ```bash
   git tag v1.0.1
   ```

## Qo'lda o'zgartirilgan generatsiya fayllari

`src-tauri/gen/android` git'da saqlanadi. `pnpm tauri android init` qayta ishga tushirilsa, ushbu
o'zgarishlar yo'qoladi — ularni qayta kiritish kerak:

| Fayl | O'zgartirish |
|---|---|
| `buildSrc/.../BuildTask.kt` | `pnpm-native` → `pnpm` |
| `app/build.gradle.kts` | `keystore.properties` orqali release imzolash |
| `app/src/main/AndroidManifest.xml`, `MainActivity.kt` | ilovaga xos sozlamalar |
| `app/src/main/java/kho/resume/PdfBridge.kt`, `app/src/main/java/android/print/PdfPrint.kt` | PDF saqlash |

## Xatolar bo'lsa

- **"You uploaded an APK or Android App Bundle that was signed in debug mode"** — 4-qadamdagi
  `keystore.properties` fayli yo'q yoki noto'g'ri joyda.
- **"Version code 1000000 has already been used"** — 2-qadam: versiyani oshiring.
- **"Keystore was tampered with, or password was incorrect"** — `keystore.properties` dagi parol xato.
