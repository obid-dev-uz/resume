import type {
  DrivingLicenseSection,
  RatedSection,
  Resume,
  Section,
  SectionType,
  TimelineSection,
} from "../types/resume";
import {
  createExtraField,
  createRatedItem,
  createResume,
  createSection,
  createTimelineItem,
} from "./sections";
// Rasm data URL bo'lib qo'shiladi: nusxaga ham to'liq ko'chadi (fayl manzili build'dan build'ga o'zgaradi)
// Foydalanuvchi bergan stok rasm, multfilm uslubida silliqlangan (320×320)
import DEMO_PHOTO from "../assets/demo-photo.jpg?inline";

/*
 * Namuna (demo) rezyume: har doim ro'yxatda turadi, o'chirib va tahrirlab bo'lmaydi.
 * localStorage'ga yozilmaydi — har safar shu funksiyadan yangi obyekt yasaladi, shuning uchun
 * doim asl holida qoladi. Foydalanuvchi undan nusxa olib (cloneResume) o'z rezyumesini boshlaydi.
 * Ma'lumotlar to'qima: shaxs va kompaniyalar haqiqiy emas.
 */

export const DEMO_ID = "demo";

export function isDemo(resume: Pick<Resume, "id"> | string): boolean {
  return (typeof resume === "string" ? resume : resume.id) === DEMO_ID;
}

/** Ikonka qiymat oldida turadi (valueIcon) */
function field(label: string, value: string, icon = "", link = "") {
  return { ...createExtraField(label), value, valueIcon: icon, link };
}

function timeline(
  title: string,
  subtitle: string,
  city: string,
  startDate: string,
  endDate: string,
  description: string,
  extra: { current?: boolean; degree?: string } = {},
) {
  return {
    ...createTimelineItem(),
    title,
    subtitle,
    city,
    startDate,
    endDate,
    description,
    current: extra.current ?? false,
    degree: extra.degree ?? "",
  };
}

function section<T extends Section>(type: SectionType, fill: (s: T) => void): T {
  const s = createSection(type) as T;
  fill(s);
  return s;
}

export function createDemoResume(): Resume {
  const r = createResume("Frontend dasturchi");
  r.id = DEMO_ID;
  // Ro'yxatda "Tahrirlangan" sanasi o'zgarib turmasin
  r.createdAt = r.updatedAt = "2026-01-01T00:00:00.000Z";

  Object.assign(r.personal, {
    firstName: "Bolta",
    lastName: "Ketmanov",
    middleName: "",
    jobTitle: "Frontend dasturchi",
    photo: DEMO_PHOTO,
    summaryHidden: false,
    summary:
      "5 yillik tajribaga ega frontend dasturchi. Vue va TypeScript'da tez ishlaydigan, " +
      "qulay interfeyslar yarataman. Jamoada ishlashni, kodni tartibli yozishni va yangi " +
      "texnologiyalarni o'rganishni yaxshi ko'raman.",
  });

  r.details.hidden = false;
  r.details.items[0].value = "1996-04-12";
  r.details.items[1].value = "Erkak";
  r.details.items.push(field("Millati", "O'zbek"), field("Oilaviy holati", "Uylangan"));

  r.contacts.hidden = false;
  r.contacts.items = [
    field("Telegram", "@bolta_devuz", "send", "https://t.me/bolta_devuz"),
    field("Telefon", "+998 77 777 77 77", "phone", "tel:+998777777777"),
    field("GitHub", "github.com/bolta_devuz", "github", "https://github.com/bolta_devuz"),
    field("Email", "bolta_devuz@example.com", "mail", "mailto:bolta_devuz@example.com"),
    field("Manzil", "Toshkent sh., Chilonzor tumani", "mapPin"),
  ];

  const employment = section<TimelineSection>("employment", (s) => {
    s.items = [
      timeline(
        "Frontend dasturchi",
        "Raqamli Yechimlar MChJ",
        "Toshkent",
        "2023-03",
        "",
        [
          "Internet-do'kon boshqaruv paneli va mijozlar kabinetini ishlab chiqish (Vue 3, Pinia, TypeScript).",
          "- Eski jQuery kodini Vue 3 ga ko'chirdim: sahifalar yuklanishi 40% tezlashdi",
          "- Umumiy komponentlar kutubxonasini yaratdim (30+ komponent, Storybook)",
          "- REST API bilan ishlash, keshlash va xatolarni kuzatish (Sentry) ni yo'lga qo'ydim",
          "- Unit va e2e testlar (Vitest, Playwright): qamrov 20% dan 75% gacha oshdi",
          "- 3 nafar yangi dasturchiga mentorlik qildim, code review o'tkazdim",
        ].join("\n"),
        { current: true },
      ),
      timeline(
        "Kichik frontend dasturchi",
        "Web Studio Plus",
        "Toshkent",
        "2021-01",
        "2023-02",
        [
          "Mijozlar uchun korporativ saytlar, lendinglar va internet-do'konlar.",
          "- Figma maketlarini moslashuvchan (responsive) sahifalarga aylantirish",
          "- 25 dan ortiq loyihani o'z vaqtida topshirishda ishtirok etdim",
          "- Sayt tezligini optimallashtirish: Lighthouse bahosi 60 dan 95 gacha",
          "- Backend jamoasi bilan API talablarini kelishish",
        ].join("\n"),
      ),
    ];
  });

  const education = section<TimelineSection>("education", (s) => {
    s.items = [
      timeline(
        "Dasturiy injiniring",
        "Toshkentdagi Inha universiteti",
        "Toshkent",
        "2018",
        "2020",
        "",
        { degree: "Magistr" },
      ),
      timeline(
        "Kompyuter injiniringi",
        "Toshkent axborot texnologiyalari universiteti",
        "Toshkent",
        "2014",
        "2018",
        "",
        { degree: "Bakalavr" },
      ),
    ];
  });

  // Kurslar bo'limi ataylab bo'sh: formada qanday to'ldirilishini ko'rsatish uchun
  const courses = section<TimelineSection>("courses", () => {});

  const skills = section<RatedSection>("skills", (s) => {
    s.items = [
      { ...createRatedItem(4), name: "Vue.js" },
      { ...createRatedItem(4), name: "TypeScript" },
      { ...createRatedItem(3), name: "Tailwind CSS" },
      { ...createRatedItem(3), name: "REST API" },
      { ...createRatedItem(2), name: "Git" },
    ];
  });

  const languages = section<RatedSection>("languages", (s) => {
    s.items = [
      { ...createRatedItem(5), name: "O'zbek tili" },
      { ...createRatedItem(4), name: "Rus tili" },
      { ...createRatedItem(3), name: "Ingliz tili" },
    ];
  });

  const residence = section<TimelineSection>("residence", (s) => {
    s.items = [
      timeline("Toshkent shahri", "Chilonzor tumani, 9-mavze, 12-uy", "", "2014-09", "", "", { current: true }),
      timeline("Samarqand viloyati", "Urgut tumani, Navbahor mahallasi", "", "1996-04", "2014-08", ""),
    ];
  });

  const license = section<DrivingLicenseSection>("drivingLicense", (s) => {
    s.categories = ["B", "C"];
    s.fieldLabels = { validity: "Amal qilishi" };
    s.issueDate = "2019";
    s.expiryDate = "2029";
  });

  r.settings.templates.sidebar.fontFamily = "Georgia, 'Times New Roman', serif";

  r.sections = [employment, education, courses, skills, languages, residence, license];
  // Tartib: avval shaxsiy ma'lumotlar, keyin "O'zim haqimda"
  r.order = ["details", "summary", "contacts", ...r.sections.map((s) => s.id), "additional"];
  return r;
}
