import { Locale, translate, TranslateParams, UiLanguage } from "./translate";

export type { Locale, TranslateParams, UiLanguage } from "./translate";
export { detectLocale } from "./translate";

/**
 * 当前生效的语言。初值中文：设置还没加载完时也不该先闪一下英文。
 *
 * 与 Project Master 同一口径：界面文案一律走 `t("中文原文")`，且
 * **不要在模块顶层求值**——`const LABEL = t("…")` 会把当时的语言冻住，
 * 切换语言后这一处不会再变。常量一律写成函数或在构造时求值。
 */
let current: Locale = "zh";

export function getLocale(): Locale {
  return current;
}

/** 直接设定语言；返回是否真的变了（变了调用方要重渲染已开视图） */
export function setLocale(locale: Locale): boolean {
  if (locale === current) return false;
  current = locale;
  return true;
}

/** 把「界面语言」设置落到运行时；返回语言是否真的变了 */
export function applyLanguageSetting(setting: UiLanguage, detected: Locale): boolean {
  return setLocale(setting === "auto" ? detected : setting);
}

export function t(key: string, params?: TranslateParams): string {
  return translate(current, key, params);
}
