import { addDaysIso, daysInMonth, diffDaysIso, isoFromParts, parseIsoParts } from "../utils/date";

/**
 * 甘特时间轴刻度 —— 纯函数，零 DOM。
 *
 * 与 Project Master 同口径：把「日期」映射成「像素 x」，反之亦然（缩放锚点要用逆映射）。
 * 全程走 ISO 字符串 + UTC 运算，避免本地时区与 DST 让刻度错位一行。
 *
 * 设计取舍：
 * - 刻度范围按当前缩放级别向两侧各扩一个最小单位，首尾任务条不至于贴死在边缘；
 * - 两级表头（upper 粗粒度 / lower 细粒度），与常见甘特观感一致；
 * - 周起始沿用来源项目的脚本行为 = 周日（与日历视图的「每周第一天」设置无关，
 *   那是月历的排版口径，两者互不影响）。
 */

export type GanttZoom = "day" | "week" | "month" | "year";

export type ScaleUnit = "day" | "week" | "month" | "quarter" | "year";

export interface ScaleColumn {
  key: string;
  label: string;
  startIso: string;
  endIso: string;
  x: number;
  width: number;
}

export interface TimeScale {
  startIso: string;
  endIso: string;
  /** 一天的像素宽度（缩放结果） */
  dayWidth: number;
  totalWidth: number;
  upper: ScaleColumn[];
  lower: ScaleColumn[];
  /** 今天的竖线位置（不在范围内为 null） */
  todayX: number | null;
  /** 日期 → 任务条左边缘 x */
  xForDate(iso: string): number;
  /** 日期 → 任务条右边缘 x（含当天，闭区间语义） */
  endXForDate(iso: string): number;
  /** x → 日期（四舍五入到天） */
  dateForX(x: number): string;
}

/**
 * 各缩放级别的日宽（px）。
 *
 * 按一屏（约 700px）能装下多少时间来定：
 * day ≈ 3 周、week ≈ 2 个月、month ≈ 4 个月、year ≈ 1.5 年。
 * 默认档是 day（用户指定）：甘特的常态就是盯着最近这几周。
 */
export const DAY_WIDTH: Record<GanttZoom, number> = {
  day: 34,
  week: 14,
  month: 5,
  year: 1.2,
};

/** 缩放级别 → 细粒度单位（网格线/刻度线的粒度） */
const LOWER_UNIT: Record<GanttZoom, ScaleUnit> = {
  day: "day",
  week: "week",
  month: "month",
  // 再按「月」画线就太密了，退到季度；标签形如 2026-Q1
  year: "quarter",
};

/** 缩放级别 → 粗粒度单位 */
const UPPER_UNIT: Record<GanttZoom, ScaleUnit> = {
  day: "month",
  week: "month",
  month: "year",
  year: "year",
};

/** 由粗到细的阶梯：Ctrl +/- 在这条线上走 */
export const ZOOM_LADDER: readonly GanttZoom[] = ["year", "month", "week", "day"];

function quarterOf(month: number): { index: number; firstMonth: number } {
  const index = Math.floor((month - 1) / 3) + 1;
  return { index, firstMonth: (index - 1) * 3 + 1 };
}

function unitStart(iso: string, unit: ScaleUnit): string {
  const { year, month, day } = parseIsoParts(iso);
  switch (unit) {
    case "day":
      return iso;
    case "week": {
      // 周日起始
      const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
      return addDaysIso(iso, -weekday);
    }
    case "month":
      return isoFromParts(year, month, 1);
    case "quarter":
      return isoFromParts(year, quarterOf(month).firstMonth, 1);
    case "year":
      return isoFromParts(year, 1, 1);
  }
}

function unitEnd(iso: string, unit: ScaleUnit): string {
  const { year, month } = parseIsoParts(iso);
  switch (unit) {
    case "day":
      return iso;
    case "week":
      return addDaysIso(iso, 6);
    case "month":
      return isoFromParts(year, month, daysInMonth(year, month));
    case "quarter": {
      const lastMonth = quarterOf(month).firstMonth + 2;
      return isoFromParts(year, lastMonth, daysInMonth(year, lastMonth));
    }
    case "year":
      return isoFromParts(year, 12, 31);
  }
}

function nextUnitStart(iso: string, unit: ScaleUnit): string {
  const { year, month } = parseIsoParts(iso);
  switch (unit) {
    case "day":
      return addDaysIso(iso, 1);
    case "week":
      return addDaysIso(iso, 7);
    case "month": {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      return isoFromParts(nextYear, nextMonth, 1);
    }
    case "quarter": {
      const nextMonth = quarterOf(month).firstMonth + 3;
      return nextMonth > 12 ? isoFromParts(year + 1, 1, 1) : isoFromParts(year, nextMonth, 1);
    }
    case "year":
      return isoFromParts(year + 1, 1, 1);
  }
}

function unitLabel(iso: string, unit: ScaleUnit): string {
  const { year, month, day } = parseIsoParts(iso);
  switch (unit) {
    case "day":
      return String(day);
    case "week":
      return `${month}/${day}`;
    case "month":
      return isoFromParts(year, month, 1).slice(0, 7);
    case "quarter":
      return `${year}-Q${quarterOf(month).index}`;
    case "year":
      return String(year);
  }
}

/** 生成覆盖 [from, to] 的刻度列 */
function buildColumns(
  from: string,
  to: string,
  unit: ScaleUnit,
  scaleStart: string,
  dayWidth: number,
): ScaleColumn[] {
  const columns: ScaleColumn[] = [];
  let cursor = unitStart(from, unit);
  // 上限保护：极端范围（几十年 × 日刻度）不至于把主线程卡死
  const maxColumns = 4000;

  while (cursor <= to && columns.length < maxColumns) {
    const rawStart = cursor;
    const rawEnd = unitEnd(rawStart, unit);
    /*
     * 两端都裁到刻度区间内。
     *
     * 粗粒度刻度的首/末列几乎必然越界（「从 12 月开始」的区间配上「年」刻度，
     * 首列本该从 1 月 1 日开始）。不裁的话该列会向左伸出画布，而表头是按列宽
     * **顺序流式**排布的、网格线是按 x 绝对定位的——一行里只要有一列越界，
     * 整行标签就会与下面的网格线整体错开。
     */
    const colStart = rawStart < scaleStart ? scaleStart : rawStart;
    const colEnd = rawEnd > to ? to : rawEnd;
    if (colStart <= colEnd) {
      columns.push({
        key: `${unit}:${colStart}`,
        label: unitLabel(colStart, unit),
        startIso: colStart,
        endIso: colEnd,
        x: diffDaysIso(scaleStart, colStart) * dayWidth,
        width: (diffDaysIso(colStart, colEnd) + 1) * dayWidth,
      });
    }
    cursor = nextUnitStart(rawStart, unit);
    if (rawEnd >= to) break;
  }
  return columns;
}

export function buildTimeScale(
  rangeStart: string,
  rangeEnd: string,
  zoom: GanttZoom,
  options: { today?: string | null } = {},
): TimeScale {
  const lowerUnit = LOWER_UNIT[zoom];
  const upperUnit = UPPER_UNIT[zoom];
  const dayWidth = DAY_WIDTH[zoom];

  // 调用方可能传反
  const [from, to] = rangeStart <= rangeEnd ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart];

  // 向两侧各扩一个完整细粒度单位，首尾任务条不至于贴死在边缘
  const startIso = unitStart(addDaysIso(unitStart(from, lowerUnit), -1), lowerUnit);
  const endIso = unitEnd(addDaysIso(unitEnd(unitStart(to, lowerUnit), lowerUnit), 1), lowerUnit);

  const totalDays = diffDaysIso(startIso, endIso) + 1;
  const today = options.today ?? null;
  const todayInRange = today !== null && today >= startIso && today <= endIso ? today : null;

  return {
    startIso,
    endIso,
    dayWidth,
    totalWidth: totalDays * dayWidth,
    lower: buildColumns(startIso, endIso, lowerUnit, startIso, dayWidth),
    upper: buildColumns(startIso, endIso, upperUnit, startIso, dayWidth),
    todayX: todayInRange !== null ? diffDaysIso(startIso, todayInRange) * dayWidth + dayWidth / 2 : null,
    xForDate: (iso: string) => diffDaysIso(startIso, iso) * dayWidth,
    endXForDate: (iso: string) => (diffDaysIso(startIso, iso) + 1) * dayWidth,
    dateForX: (x: number) => addDaysIso(startIso, Math.floor(x / dayWidth)),
  };
}
