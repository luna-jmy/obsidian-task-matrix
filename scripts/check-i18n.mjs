import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

/**
 * 校验 i18n 字典与源码的一致性。
 *
 * 中文原文就是键，漏翻只会在界面上悄悄回退成中文 —— 这种问题在测试时
 * 很难碰巧撞上，所以交给脚本扫：源码里出现的每个 `t("…")` 都必须在
 * `src/i18n/en.ts` 里有对应条目，多出来的条目也一并报出来（说明文案已被删掉）。
 *
 * 只扫真实调用：正则要求 `t(` 前面不是标识符字符，因此 `split(",")`、
 * `createEl("button")` 这类不会被误判成文案。
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src");
const i18nDir = path.join(srcDir, "i18n");
const CALL_PATTERN = /(?:^|[^\w$.])t\(\s*"((?:[^"\\]|\\.)*)"/gm;

function collectSources(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === i18nDir) continue;
      files.push(...collectSources(full));
    } else if (entry.name.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

/** 走 esbuild 载入字典，脚本因此不必依赖 ts-node 这类额外运行时 */
async function loadDictionary() {
  const outfile = path.join(root, "node_modules", ".cache", "task-matrix-i18n", "en.mjs");
  fs.mkdirSync(path.dirname(outfile), { recursive: true });
  await build({
    entryPoints: [path.join(i18nDir, "en.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile,
    logLevel: "silent",
  });
  const module = await import(`${pathToString(outfile)}?v=${Date.now()}`);
  return module.EN;
}

function pathToString(file) {
  return `file:///${file.replace(/\\/g, "/")}`;
}

const dictionary = await loadDictionary();
const used = new Map();

for (const file of collectSources(srcDir)) {
  const source = fs.readFileSync(file, "utf8");
  let match;
  while ((match = CALL_PATTERN.exec(source)) !== null) {
    const key = match[1];
    if (!used.has(key)) used.set(key, []);
    used.get(key).push(path.relative(root, file));
  }
}

const missing = [...used.keys()].filter((key) => dictionary[key] === undefined).sort();
const unused = Object.keys(dictionary).filter((key) => !used.has(key)).sort();

if (missing.length === 0 && unused.length === 0) {
  console.log(`i18n ok: ${used.size} strings, all translated`);
  process.exit(0);
}

if (missing.length > 0) {
  console.error(`i18n: ${missing.length} string(s) missing from src/i18n/en.ts`);
  for (const key of missing) {
    console.error(`  - ${key}   (${[...new Set(used.get(key))].join(", ")})`);
  }
}
if (unused.length > 0) {
  console.error(`i18n: ${unused.length} unused entry/entries in src/i18n/en.ts`);
  for (const key of unused) console.error(`  - ${key}`);
}
process.exit(1);
