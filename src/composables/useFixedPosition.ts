import { onBeforeUnmount, ref } from "vue";

/*
 * Ochiladigan oyna (popover) uchun ekranga nisbatan joy: `position: fixed`.
 * Oyna scroll bo'ladigan konteyner ichida turganda (masalan, FieldList — x bo'ylab aylanadi)
 * `absolute` oyna konteyner chegarasida kesilib qolardi; fixed oyna kesilmaydi.
 * Sahifa yoki konteyner aylansa, oyna tugmasi ortidan yuradi.
 *
 * Diqqat: ota elementlarda `transform` bo'lmasligi kerak — aks holda fixed ular ichida hisoblanadi.
 */
export function useFixedPosition(compute: () => Record<string, string> | null) {
  const style = ref<Record<string, string>>({});

  function update() {
    const next = compute();
    if (next) style.value = next;
  }

  function start() {
    update();
    // capture: ichki konteynerlarning scroll hodisasi ham ushlanadi
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
  }

  function stop() {
    window.removeEventListener("scroll", update, true);
    window.removeEventListener("resize", update);
  }

  onBeforeUnmount(stop);
  return { style, start, stop };
}

/** Ekran chetidan qoldiriladigan joy, px */
export const VIEWPORT_MARGIN = 8;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
