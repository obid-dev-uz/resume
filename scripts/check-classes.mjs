// Bir elementdagi bir-biriga zid Tailwind klasslarini topadi (bir xil variantda bir xil CSS
// xususiyatlarini beradigan ikki klass), Tailwind CSS IntelliSense'ning "cssConflict" lint'iga
// o'xshab, lekin butun loyiha bo'yicha va loyihaning o'z `@theme`/`@custom-variant`lari bilan
// (Tailwind v4: sozlamalar `src/styles/app.css` ichida).
//
// Ishlatish: pnpm lint:classes      (zid klasslar topilsa chiqish kodi 1)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { __unstable__loadDesignSystem } from "tailwindcss";

const root = fileURLToPath(new URL("..", import.meta.url));
const appCss = join(root, "src/styles/app.css");

const design = await __unstable__loadDesignSystem(readFileSync(appCss, "utf8"), {
  base: dirname(appCss),
  loadStylesheet: async (id, base) => {
    const path = createRequire(join(base, "/")).resolve(id);
    return { path, base: dirname(path), content: readFileSync(path, "utf8") };
  },
});

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== "__tests__") yield* walk(path);
    } else if (/\.(vue|ts)$/.test(name)) {
      yield path;
    }
  }
}

/** Bitta elementga tushadigan klass ro'yxatlari: statik `class="…"` va `:class` dagi har bir satr. */
function classLists(source) {
  const lists = [];
  const lineOf = (index) => source.slice(0, index).split("\n").length;
  for (const m of source.matchAll(/(?<![:\w-])class="([^"]*)"/g)) {
    lists.push({ line: lineOf(m.index), classes: m[1] });
  }
  for (const m of source.matchAll(/:class="([^"]*)"/g)) {
    for (const s of m[1].matchAll(/'([^']*)'|`([^`$]*)`/g)) {
      lists.push({ line: lineOf(m.index), classes: s[1] ?? s[2] });
    }
  }
  return lists
    .map((l) => ({ ...l, classes: [...new Set(l.classes.split(/\s+/).filter(Boolean))] }))
    .filter((l) => l.classes.length > 1);
}

/**
 * Tailwind chiqargan CSS'ni o'qiydi: har bir deklaratsiya uchun "kontekst" (at-rule'lar + selektor,
 * klassning o'zi `&` bilan almashtirilgan) va xususiyat nomi. `@property` bloklari tashlab ketiladi.
 */
function declarations(css) {
  const out = [];
  const stack = [];
  let buf = "";
  for (const ch of css) {
    if (ch === "{") {
      stack.push(buf.trim());
      buf = "";
    } else if (ch === "}") {
      stack.pop();
      buf = "";
    } else if (ch === ";") {
      const decl = buf.trim();
      buf = "";
      const colon = decl.indexOf(":");
      if (colon > 0 && !stack.some((s) => s.startsWith("@property"))) {
        out.push({ context: stack.join(" › "), prop: decl.slice(0, colon).trim() });
      }
    } else {
      buf += ch;
    }
  }
  return out;
}

const cache = new Map();

/** Bitta klass uchun: "kontekst → saralangan xususiyatlar ro'yxati", Tailwind'ning o'zi yaratgan. */
function signature(cls) {
  if (cache.has(cls)) return cache.get(cls);
  const contexts = new Map();
  const css = design.candidatesToCss([cls])[0];
  if (css) {
    for (const { context, prop } of declarations(css)) {
      // Klassning ekranlangan selektorini `&` ga almashtiramiz — variantlar klasslar orasida teng chiqadi.
      const ctx = context.replace(/\.(?:\\.|[^\s\\:>+~,.[()])+/, "&");
      contexts.set(ctx, [...new Set([...(contexts.get(ctx) ?? []), prop])]);
    }
    for (const [ctx, props] of contexts) contexts.set(ctx, props.sort().join(","));
  }
  cache.set(cls, contexts);
  return contexts;
}

const problems = [];
const files = [join(root, "index.html"), ...walk(join(root, "src"))];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const { line, classes } of classLists(source)) {
    const sigs = classes.map(signature);
    for (let a = 0; a < classes.length; a++) {
      for (let b = a + 1; b < classes.length; b++) {
        for (const [context, props] of sigs[a]) {
          if (sigs[b].get(context) === props) {
            problems.push(`${relative(root, file)}:${line}  '${classes[a]}' va '${classes[b]}' ikkalasi ham ${props} ni beradi`);
            break;
          }
        }
      }
    }
  }
}

if (problems.length) {
  console.error(`✗ ${problems.length} juft zid Tailwind klassi:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ Zid Tailwind klasslari yo'q (${files.length} fayl, ${cache.size} klass tekshirildi)`);
