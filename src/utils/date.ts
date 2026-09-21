import { FirstDayOfWeek } from "../types";

/**
 * ISO `YYYY-MM-DD` 日期纯函数。
 *
 * 两条口径：
 * - 只做「日历上的那一天」的运算，一律走本地年月日，不用 `toISOString()`——
 *   后者按 UTC 取日，东八区晚上算出来的「今天」是明天。
 * - 比较用字典序即可，ISO 字符串的字典序就是时间序。
 */

export function formatIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** 本地日历意义上的今天 */
export function todayIso(): string {
  return formatIso(new Date());
}

/** 今天 ± N 天 */
export function isoDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatIso(date);
}

export function isValidIso(value?: string): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/u.test(value));
}

/** ISO → 本地零点的 Date；非法输入返回 null */
export function parseIso(value: string): Date | null {
  if (!isValidIso(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * 一周的起点（本地零点）。
 * `firstDay` 决定周日还是周一开头；默认按设置走。
 */
export function startOfWeek(date: Date, firstDay: FirstDayOfWeek): Date {
  const result = startOfDay(date);
  const weekday = result.getDay();
  const offset = firstDay === "sunday" ? -weekday : weekday === 0 ? -6 : 1 - weekday;
  result.setDate(result.getDate() + offset);
  return result;
}

/** 一周七天的 getDay() 顺序，跟随 firstDay 设置 */
export function weekdayOrder(firstDay: FirstDayOfWeek): number[] {
  return firstDay === "sunday" ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 0];
}

export function isWeekend(weekday: number): boolean {
  return weekday === 0 || weekday === 6;
}

/** 两个 ISO 日期相差的天数（b - a） */
export function diffDays(fromIso: string, toIso: string): number {
  const from = parseIso(fromIso);
  const to = parseIso(toIso);
  if (from === null || to === null) return 0;
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

// ────────────────────── ISO 字符串运算（甘特时间轴用） ──────────────────────

/**
 * 甘特时间轴每一步都在做「日期 ± 天数」「日期差几天」，所以单独给一组
 * **纯 ISO 字符串**版本：全程走 `Date.UTC`，不碰本地时区与 DST。
 *
 * 为什么不用上面那组 `Date` 版本：`new Date(iso)` 解析成 UTC 零点，而 `setDate()`
 * 走本地日历，负时区里来回换算会整体偏一天；刻度一旦偏移，网格线与表头标签
 * 就会错开一列（时间轴里最显眼的那种错）。
 */
export interface IsoParts {
  year: number;
  month: number;
  day: number;
}

const ISO_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/u;

export function isoFromParts(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * 拆 ISO 日期。非法输入退化为「今天」而不是抛错：调用方遍布坐标计算，
 * 为一处脏数据让整张图画不出来不划算（脏数据在解析层已经被挡掉了）。
 */
export function parseIsoParts(iso: string): IsoParts {
  const match = ISO_PREFIX.exec(iso);
  if (match === null) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  }
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addDaysIso(iso: string, days: number): string {
  const { year, month, day } = parseIsoParts(iso);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return isoFromParts(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

export function diffDaysIso(fromIso: string, toIso: string): number {
  const from = parseIsoParts(fromIso);
  const to = parseIsoParts(toIso);
  const fromUtc = Date.UTC(from.year, from.month - 1, from.day);
  const toUtc = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

/** 星期几（0 = 周日），按 UTC 基准算 */
export function weekdayOfIso(iso: string): number {
  const { year, month, day } = parseIsoParts(iso);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** 取较小者；null 视为「不存在」，所以另一个直接胜出 */
export function minIso(a: string | null, b: string | null): string | null {
  if (a === null) return b;
  if (b === null) return a;
  return a <= b ? a : b;
}

export function maxIso(a: string | null, b: string | null): string | null {
  if (a === null) return b;
  if (b === null) return a;
  return a >= b ? a : b;
}

export function monthStartIso(iso: string): string {
  const { year, month } = parseIsoParts(iso);
  return isoFromParts(year, month, 1);
}

export function monthEndIso(iso: string): string {
  const { year, month } = parseIsoParts(iso);
  return isoFromParts(year, month, daysInMonth(year, month));
}
