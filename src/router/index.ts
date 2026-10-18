import { createRouter, createWebHashHistory, START_LOCATION } from "vue-router";
import { useResumesStore } from "../stores/resumes";
import { getActiveId } from "../lib/storage";
import ResumeListPage from "../views/ResumeListPage.vue";
import ResumeEditorPage from "../views/ResumeEditorPage.vue";
import TemplateGallery from "../components/TemplateGallery.vue";

/*
 * Sahifalar. Hash tarix: Tauri ilovani fayldan ochadi, `#/resume/<id>` har qanday holatda ishlaydi.
 *   /                        rezyumelar ro'yxati
 *   /resume/:id              muharrir va preview
 *   /resume/:id/templates    shablonlar oynasi (muharrir ustida)
 */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "resumes", component: ResumeListPage },
    {
      path: "/resume/:id",
      name: "editor",
      component: ResumeEditorPage,
      children: [{ path: "templates", name: "templates", component: TemplateGallery }],
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

/** URL'dagi rezyume id'si (muharrir yoki shablonlar oynasi ochiq bo'lsa) */
function resumeIdOf(params: Record<string, string | string[]>): string | null {
  const id = params.id;
  return typeof id === "string" ? id : null;
}

router.beforeEach((to, from) => {
  const store = useResumesStore();

  // Ilova ro'yxat sahifasida ochilsa, oxirgi ochilgan rezyume davom ettiriladi (khoresume:active)
  if (from === START_LOCATION && to.name === "resumes") {
    const last = getActiveId();
    if (last && store.find(last)) return { name: "editor", params: { id: last } };
  }

  const id = resumeIdOf(to.params);
  if (id) {
    // O'chirilgan yoki noma'lum rezyume — ro'yxatga
    if (!store.find(id)) return { name: "resumes", replace: true };
    // Boshqa rezyumeni ochishdan oldin joriysining kutilayotgan o'zgarishi yoziladi (open ichida)
    if (store.activeId !== id) store.open(id);
  } else if (store.activeId) {
    store.close();
  }
});
