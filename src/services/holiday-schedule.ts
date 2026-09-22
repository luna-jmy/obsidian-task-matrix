import { HolidayScheduleMap, YearHolidaySchedule } from "../types";
import {
  addDaysIso,
  daysInMonth,
  isoFromParts,
  isValidIso,
  parseIsoParts,
  todayIso,
  weekdayOfIso,
} from "../utils/date";

/**
 * 年度法定节假日排期 —— 纯函数，零 DOM（与 Project Master 同口径）。
 *
 * ── 为什么按年维护 ──────────────────────────────────────────────────
 * 国内假期表是逐年公告的，每条都是「几月几号到几月几号」+ 哪几天补班。
 * 让人在导出面板里手打 7 个日期，既啰嗦又容易漏；按年份把**区间**写一次
 * （`10-01~10-07`），导出与自绘甘特按图跨到的年份自动套用。
 *
 * ── 写法（同时接受 `MM-DD` 与完整 `YYYY-MM-DD`）─────────────────────
 * - 单日：`10-01`
 * - 区间：`10-01~10-07`（`~`、`～`、`至` 都认；逗号/空格/换行分隔多条）
 * - 跨年区间：`12-30~01-02` 自动算到次年，不必拆成两年写
 *
 * ── 与 mermaid 的衔接 ────────────────────────────────────────────
 * 展开出来的日期最终变成 `excludes <日期…>` 与 `includes <日期…>`。
 * mermaid 只认逐日的 `YYYY-MM-DD`，区间展开是插件这边做的。
 */

/** 单个区间最多展开多少天：防止用户写出 `2026-01-01~2126-01-01` 把导出撑爆 */
const MAX_RANGE_DAYS = 366;

/** 年份跨度上限，同样是防御性上限（正常不会有人排 50 年的假） */
const MAX_YEAR_SPAN = 50;

/**
 * 这套日历只读三个字段。
 *
 * 声明成窄接口而不是直接要整个设置对象：自绘甘特与导出都只关心
 * 「哪几天不上班」，与设置的其余部分无关，窄接口也让边界测试不必造一整套设置。
 */
export interface HolidayCalendarSettings {
  holidaySchedules: HolidayScheduleMap;
  /** 视图面板里的临时补充：排除日期（跨年度） */
  mermaidExcludeDates: string;
  /** 视图面板里的临时补充：调休上班日 */
  mermaidIncludeDates: string;
}

/** 去重 + 升序：ISO 字符串的字典序恰好就是时间序，所以直接 sort */
export function uniqueSorted(dates: string[]): string[] {
  return [...new Set(dates)].sort();
}

type DateResolver = (raw: string, yearOffset: number) => string | null;

/**
 * 把「逗号/空格分隔的日期或区间」展开成逐日列表。
 * 区间两端都含（`10-01~10-03` 是三天）；`end < start` 说明跨年，把终点挪到次年重解析。
 */
function expandSpecs(raw: string, resolve: DateResolver): string[] {
  const out: string[] = [];
  for (const chunk of raw.split(/[,，\n\s]+/u)) {
    const token = chunk.trim();
    if (token.length === 0) continue;

    const parts = token
      .split(/[~～至]/u)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    if (parts.length === 0 || parts.length > 2) continue;

    const start = resolve(parts[0] ?? "", 0);
    if (start === null) continue;
    const rawEnd = parts[1] ?? parts[0] ?? "";
    const end = resolve(rawEnd, 0);
    if (end === null) continue;
    // 终点早于起点 = 跨年区间（12-30~01-02）
    const resolvedEnd = end < start ? resolve(rawEnd, 1) : end;
    if (resolvedEnd === null) continue;

    let cursor = start;
    for (let i = 0; cursor <= resolvedEnd && i <= MAX_RANGE_DAYS; i += 1) {
      out.push(cursor);
      cursor = addDaysIso(cursor, 1);
    }
  }
  return out;
}

/**
 * 完整 ISO 日期清单（支持 `2026-10-01~2026-10-07`）。
 *
 * 这里不接受 `MM-DD` —— 面板里的输入是**跨年度的临时补充**，没有「当前是哪一年」
 * 这个前提可依赖；省年份的写法请写进年度排期表。
 */
export function expandIsoDateSpecs(raw: string): string[] {
  return uniqueSorted(
    expandSpecs(raw, (value, yearOffset) => (yearOffset === 0 && isValidIso(value) ? value : null)),
  );
}

/** 年度排期里的日期清单：`MM-DD` 按该年补全，也接受完整 `YYYY-MM-DD` */
export function expandYearSpecs(raw: string, year: number): string[] {
  return uniqueSorted(
    expandSpecs(raw, (value, yearOffset) => resolveYearDate(value, year + yearOffset)),
  );
}

/** `MM-DD`（按给定年份补全）或完整 `YYYY-MM-DD`；其余一律 null */
function resolveYearDate(raw: string, year: number): string | null {
  if (isValidIso(raw)) return raw;
  const matched = /^(\d{1,2})-(\d{1,2})$/u.exec(raw);
  if (matched === null) return null;
  const month = Number(matched[1]);
  const day = Number(matched[2]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return isoFromParts(year, month, day);
}

/** 某一年度的排期 → 该年具体的放假日期 / 补班日期 */
export function expandYearSchedule(
  year: number,
  schedule: YearHolidaySchedule,
): { exclude: string[]; include: string[] } {
  return {
    exclude: expandYearSpecs(schedule.holidays, year),
    include: expandYearSpecs(schedule.makeupWorkdays, year),
  };
}

/**
 * 图覆盖的年份跨度 → 合并后的放假 / 补班日期（升序去重）。
 *
 * 「按跨度取」而不是「按当前年份取」：图里跨了年（比如 2026-12 ~ 2027-02），
 * 两头的假期都要算上，否则跨年项目会漏掉元旦。
 */
export function collectHolidayDates(
  rangeStart: string,
  rangeEnd: string,
  schedules: HolidayScheduleMap,
): { exclude: string[]; include: string[] } {
  const [from, to] = rangeStart <= rangeEnd ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart];
  const firstYear = parseIsoParts(from).year;
  const lastYear = parseIsoParts(to).year;

  const exclude: string[] = [];
  const include: string[] = [];
  for (let year = firstYear; year <= lastYear && year - firstYear <= MAX_YEAR_SPAN; year += 1) {
    const schedule = schedules[String(year)];
    if (schedule === undefined) continue;
    const expanded = expandYearSchedule(year, schedule);
    exclude.push(...expanded.exclude);
    include.push(...expanded.include);
  }
  return { exclude: uniqueSorted(exclude), include: uniqueSorted(include) };
}

/** 区间内所有周六 / 周日（升序） */
export function weekendDaysInRange(rangeStart: string, rangeEnd: string): string[] {
  const [from, to] = rangeStart <= rangeEnd ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart];
  const out: string[] = [];
  let cursor = from;
  for (let guard = 0; cursor <= to && guard <= MAX_RANGE_DAYS * MAX_YEAR_SPAN; guard += 1) {
    const weekday = weekdayOfIso(cursor);
    if (weekday === 0 || weekday === 6) out.push(cursor);
    cursor = addDaysIso(cursor, 1);
  }
  return out;
}

/**
 * 两个渲染器共用的「非周末类假期日」：年度排期 ∪ 面板上的临时补充。
 *
 * 抽出来是为了让**自绘甘特的灰色列**与**导出的 excludes/includes**出自同一份口径。
 * 否则「图上画了什么」和「导出到什么」会各自漂移，正是用户最容易被坑的那种不一致。
 */
export function resolveHolidayDates(
  rangeStart: string,
  rangeEnd: string,
  settings: HolidayCalendarSettings,
): { exclude: string[]; include: string[] } {
  const schedule = collectHolidayDates(rangeStart, rangeEnd, settings.holidaySchedules);
  return {
    exclude: uniqueSorted([
      ...schedule.exclude,
      ...expandIsoDateSpecs(settings.mermaidExcludeDates),
    ]),
    include: uniqueSorted([
      ...schedule.include,
      ...expandIsoDateSpecs(settings.mermaidIncludeDates),
    ]),
  };
}

/**
 * 最终「非工作日」清单（自绘甘特图画灰色列用）= 周末（开关打开时）∪ 节假日 − 补班日。
 *
 * 补班日无条件算工作日，能盖掉周末也能盖掉节假日 —— 与 mermaid 的 `includes`
 * 优先级完全一致（见 mermaid-export.ts 的说明），两边因此不会打架。
 */
export function resolveNonWorkingDays(
  rangeStart: string,
  rangeEnd: string,
  settings: HolidayCalendarSettings & { mermaidExcludeWeekends: boolean },
): string[] {
  const holiday = resolveHolidayDates(rangeStart, rangeEnd, settings);
  const days = new Set<string>(holiday.exclude);
  if (settings.mermaidExcludeWeekends) {
    for (const day of weekendDaysInRange(rangeStart, rangeEnd)) days.add(day);
  }
  for (const day of holiday.include) days.delete(day);
  return [...days].sort();
}

/**
 * 把升序日期列表压成连续区间。
 *
 * 画灰色列时按区间画：两天的周末 = 1 个矩形，而不是 2 个。
 * 一年 104 个周末日 → 52 个矩形，十年的极端范围也不会把节点数炸掉。
 */
export function mergeContiguousDays(days: readonly string[]): Array<{ start: string; end: string }> {
  const runs: Array<{ start: string; end: string }> = [];
  let start: string | null = null;
  let previous: string | null = null;
  for (const day of days) {
    if (start === null || previous === null) {
      start = day;
    } else if (addDaysIso(previous, 1) !== day) {
      runs.push({ start, end: previous });
      start = day;
    }
    previous = day;
  }
  if (start !== null && previous !== null) runs.push({ start, end: previous });
  return runs;
}

/** 有内容的年度排期按年份升序列出（设置页渲染用） */
export function sortedScheduleYears(schedules: HolidayScheduleMap): string[] {
  return Object.keys(schedules).sort();
}

/**
 * 「添加年份」按钮该加哪一年：还没有排期 → 今年；已有 → 最大年份 + 1。
 * 每次都从最大年往后加，是因为国内假期表就是逐年往后公告的。
 */
export function nextScheduleYear(schedules: HolidayScheduleMap, today = todayIso()): string {
  const years = sortedScheduleYears(schedules);
  if (years.length === 0) return today.slice(0, 4);
  const latest = Number(years[years.length - 1]);
  return Number.isFinite(latest) ? String(latest + 1) : today.slice(0, 4);
}
