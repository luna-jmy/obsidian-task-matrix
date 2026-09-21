import { EN } from "./en";

/** 界面语言。中文是原文基准，因此中文侧不需要字典。 */
export type Locale = "zh" | "en";

/** 设置里的语言选项：auto 跟随宿主界面语言 */
export type UiLanguage = "auto" | Locale;

export type TranslateParams = Record<string, string | number>;

/**
 * 探测宿主界面语言。
 *
 * 传进来的应当是 `moment.locale()`——Obsidian 会把界面语言同步给 moment，
 * 这是插件能拿到的最接近「用户当前语言」的信号。
 */
export function detectLocale(hostLocale: string): Locale {
  return hostLocale.toLowerCase().startsWith("zh") ? "zh" : "en";
}

/** 把 `{name}` 占位符替换成 params 里的值；没有对应参数的占位符原样留着 */
function fillParams(text: string, params?: TranslateParams): string {
  if (params === undefined) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * 纯函数翻译：中文原文即键，英文查字典，查不到时回退到中文原文。
 *
 * 回退而不是抛错是有意的：漏翻一条文案不该让整个界面崩掉，
 * 漏掉的键由 `scripts/check-i18n.mjs` 在构建前统一揪出来。
 */
export function translate(locale: Locale, key: string, params?: TranslateParams): string {
  const text = locale === "en" ? (EN[key] ?? key) : key;
  return fillParams(text, params);
}
