import { t } from "../i18n";
import { priorityRank } from "../parser/task-parser";
import {
  DateRangePreset,
  DateRangeState,
  FilterState,
  ParsedTask,
  Priority,
  SortMode,
  TaskMatrixSettings,
  TaskStatusFilter,
} from "../types";
import { addDays, diffDays, formatIso, parseIso, startOfWeek, todayIso } from "../utils/date";

/** 筛选栏里状态 chips 的顺序（也是「全部」之外的全部可选值） */
export const TASK_STATUSES: readonly TaskStatusFilter[] = [
  "open",
  "to-be-started",
  "overdue",
  "completed",
  "cancelled",
];

/** 状态预设：两档快捷 + 完全放开 */
export type StatusPreset = "active-only" | "hide-cancelled" | "all";

export function statusLabel(status: TaskStatusFilter): string {
  switch (status) {
    case "open":
      return t("未开始");
    case "to-be-started":
      return t("待开始");
    case "overdue":
      return t("已逾期");
    case "completed":
      return t("已完成");
    case "cancelled":
      return t("已取消");
    case "in-progress":
      return t("进行中");
  }
}

export function priorityLabel(priority: Priority): string {
  switch (priority) {
    case Priority.Critical:
      return t("紧急");
    case Priority.Highest:
      return t("最高");
    case Priority.High:
      return t("高");
    case Priority.Medium:
      return t("中");
    case Priority.Low:
      return t("低");
    case Priority.Lowest:
      return t("最低");
    default:
      return t("无");
  }
}

export function statusPresetLabel(preset: StatusPreset): string {
  switch (preset) {
    case "active-only":
      return t("只看未完成");
    case "hide-cancelled":
      return t("隐藏已取消");
    default:
      return t("全部状态");
  }
}

export function presetToStatuses(preset: StatusPreset): TaskStatusFilter[] {
  switch (preset) {
    case "active-only":
      return ["open", "to-be-started", "overdue"];
    case "hide-cancelled":
      return TASK_STATUSES.filter((status) => status !== "cancelled");
    default:
      return [...TASK_STATUSES];
  }
}

export function detectStatusPreset(statuses: readonly TaskStatusFilter[]): StatusPreset {
  for (const preset of ["active-only", "hide-cancelled", "all"] as StatusPreset[]) {
    const expected = presetToStatuses(preset);
    if (expected.length === statuses.length && expected.every((status) => statuses.includes(status))) {
      return preset;
    }
  }
  return "all";
}

export function sortModeLabel(mode: SortMode): string {
  switch (mode) {
    case "due-asc":
      return t("截止日 ↑");
    case "due-desc":
      return t("截止日 ↓");
    case "start-asc":
      return t("开始日 ↑");
    case "priority":
      return t("优先级");
    default:
      return t("文件名");
  }
}

export const SORT_MODES: readonly SortMode[] = ["due-asc", "due-desc", "start-asc", "priority", "file"];

export function datePresetLabel(preset: DateRangePreset): string {
  switch (preset) {
    case "today":
      return t("今天");
    case "week":
      return t("本周");
    case "month":
      return t("本月");
    case "year":
      return t("本年");
    case "custom":
      return t("自定义区间");
    default:
      return t("不限");
  }
}

export const DATE_PRESETS: readonly DateRangePreset[] = ["all", "today", "week", "month", "year", "custom"];

// ────────────────────────────── 状态 ──────────────────────────────

export function emptyDateRange(): DateRangeState {
  return { preset: "all", start: null, end: null };
}

/** 「清除筛选」的落点：什么都不筛，看全部（而不是回到设置里的默认档） */
export function defaultFilterState(): FilterState {
  return {
    search: "",
    statuses: [...TASK_STATUSES],
    markers: [],
    startDate: emptyDateRange(),
    dueDate: emptyDateRange(),
  };
}

/**
 * 第一屏的筛选档：隐藏已取消，其余状态都铺出来。
 *
 * 旧版把「显示已完成」做成设置里的开关，现在这一点直接由筛选栏的状态 chips
 * 控制 —— 界面上看得见、随时可改，不再有一个藏在设置里的隐式口径。
 */
export function initialFilterState(): FilterState {
  return {
    search: "",
    statuses: presetToStatuses("hide-cancelled"),
    markers: [],
    startDate: emptyDateRange(),
    dueDate: emptyDateRange(),
  };
}

/**
 * 数据里真实出现过的方括号标记。
 *
 * 顺序按「用得最多」排：未勾选 → 已配置的完成标记 → 已配置的取消标记 → 其余按字母序。
 * 候选完全由数据决定，因此不会出现一排点了没反应的 chip。
 */
export function collectMarkers(
  tasks: readonly ParsedTask[],
  settings: TaskMatrixSettings,
): string[] {
  const present = new Set(tasks.map((task) => task.checkboxStatus.trim()));
  const preferred = ["", ...settings.completionMarkers, ...settings.cancelledMarkers]
    .map((marker) => marker.trim());

  const ordered: string[] = [];
  for (const marker of preferred) {
    if (present.has(marker) && !ordered.includes(marker)) ordered.push(marker);
  }
  const rest = [...present]
    .filter((marker) => !ordered.includes(marker))
    .sort((a, b) => a.localeCompare(b));

  return [...ordered, ...rest];
}

/** chip 上的显示名：标记本身太抽象，套回方括号的样子最好认 */
export function markerLabel(marker: string): string {
  return marker.length === 0 ? "[ ]" : `[${marker}]`;
}

export function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

export function hasActiveFilter(state: FilterState): boolean {
  return (
    state.search.trim().length > 0
    || detectStatusPreset(state.statuses) !== "all"
    || state.markers.length > 0
    || state.startDate.preset !== "all"
    || state.dueDate.preset !== "all"
  );
}

// ────────────────────────────── 区间解析 ──────────────────────────────

/** 预设 → 具体起止；返回 null 表示该端不限 */
export function resolveDateRange(
  range: DateRangeState,
  today: string,
): { start: string | null; end: string | null } {
  if (range.preset === "custom") return { start: range.start, end: range.end };

  const now = parseIso(today) ?? new Date();
  switch (range.preset) {
    case "today":
      return { start: today, end: today };
    case "week": {
      const start = startOfWeek(now, "monday");
      return { start: formatIso(start), end: formatIso(addDays(start, 6)) };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: formatIso(start), end: formatIso(end) };
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { start: formatIso(start), end: formatIso(end) };
    }
    default:
      return { start: null, end: null };
  }
}

function matchesRange(dateIso: string | undefined, range: DateRangeState, today: string): boolean {
  if (range.preset === "all") return true;
  // 没有这一端日期的任务：在「不限该端」时保留，否则筛掉
  if (!dateIso) return false;

  const { start, end } = resolveDateRange(range, today);
  if (start !== null && dateIso < start) return false;
  if (end !== null && dateIso > end) return false;
  return true;
}

// ────────────────────────────── 过滤与排序 ──────────────────────────────

/**
 * 应用筛选栏条件。
 *
 * 纯函数，不碰 DOM 也不读设置——设置里的「显示范围」另由
 * `applyVisibilityRanges` 处理，两者的来源不同（一个是用户当下在筛什么，
 * 一个是用户长期设的显示口径），混在一起以后没法单独解释某条任务为什么不见。
 */
export function applyFilters(
  tasks: readonly ParsedTask[],
  state: FilterState,
  today: string = todayIso(),
): ParsedTask[] {
  const keyword = state.search.trim().toLowerCase();
  return tasks.filter((task) => {
    if (!state.statuses.includes(task.displayStatus)) return false;

    // 标记筛选看的是方括号里的原始内容（`- [x]` 的 x），与状态判定互不干扰：
    // 一个自定义标记的任务可能同时被状态判成「未开始」。
    if (state.markers.length > 0 && !state.markers.includes(task.checkboxStatus.trim())) {
      return false;
    }

    if (!matchesRange(task.startDate, state.startDate, today)) return false;
    if (!matchesRange(task.dueDate, state.dueDate, today)) return false;

    if (keyword.length > 0) {
      const haystack = [task.description, task.filePath, task.taskId, task.dependsOn]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
}

/**
 * 设置里的长期显示口径：
 * - `dueDateDisplayRange`：截止日太远的先不铺出来（逾期/已完成/已取消除外）；
 * - `hideFutureStartTasks`：开始日在 1 个月之后的先不铺出来。
 *
 * 与筛选栏分开的理由见 `applyFilters` 的注释。
 */
export function applyVisibilityRanges(
  tasks: readonly ParsedTask[],
  settings: TaskMatrixSettings,
  today: string = todayIso(),
): ParsedTask[] {
  const maxDue = settings.dueDateDisplayRange > 0 ? isoOffsetFrom(today, settings.dueDateDisplayRange * 30) : null;
  const maxStart = settings.hideFutureStartTasks ? isoOffsetFrom(today, 30) : null;
  // 完成项的体积最大（越用越多），所以也要有范围。0 表示不限制
  const completedCutoff =
    settings.completedTaskDisplayRange > 0
      ? isoOffsetFrom(today, -settings.completedTaskDisplayRange * 30)
      : null;

  return tasks.filter((task) => {
    if (task.displayStatus === "completed" && !settings.includeCompletedWithoutDueDate) {
      // 没有完成日也没有截止日的完成项，是体积最大又最没参考价值的一批
      const reference = task.doneDate ?? task.dueDate;
      if (reference === undefined) return false;
      if (completedCutoff !== null && reference < completedCutoff) return false;
    }
    if (maxDue !== null && task.dueDate && task.dueDate > maxDue) {
      const pinned = task.displayStatus === "overdue" || task.displayStatus === "completed" || task.displayStatus === "cancelled";
      if (!pinned) return false;
    }
    if (maxStart !== null && task.startDate && task.displayStatus === "to-be-started" && task.startDate > maxStart) {
      return false;
    }
    return true;
  });
}

function isoOffsetFrom(baseIso: string, days: number): string {
  const base = parseIso(baseIso);
  return base === null ? baseIso : formatIso(addDays(base, days));
}

export function sortTasks(tasks: readonly ParsedTask[], mode: SortMode): ParsedTask[] {
  const sorted = [...tasks];
  sorted.sort((a, b) => {
    switch (mode) {
      case "due-desc":
        return compareOptionalDesc(a.dueDate, b.dueDate) || compareByFile(a, b);
      case "start-asc":
        return compareOptionalAsc(a.startDate, b.startDate) || compareByFile(a, b);
      case "priority":
        return priorityRank(b.priority) - priorityRank(a.priority) || compareOptionalAsc(a.dueDate, b.dueDate) || compareByFile(a, b);
      case "file":
        return compareByFile(a, b);
      default:
        return compareOptionalAsc(a.dueDate, b.dueDate) || priorityRank(b.priority) - priorityRank(a.priority) || compareByFile(a, b);
    }
  });
  return sorted;
}

function compareOptionalAsc(a: string | undefined, b: string | undefined): number {
  if (a === b) return 0;
  if (a === undefined) return 1; // 没有日期的一律沉到最后
  if (b === undefined) return -1;
  return a.localeCompare(b);
}

function compareOptionalDesc(a: string | undefined, b: string | undefined): number {
  if (a === b) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return b.localeCompare(a);
}

function compareByFile(a: ParsedTask, b: ParsedTask): number {
  if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath);
  return a.lineNumber - b.lineNumber;
}

/** 本周剩余天数提示等场景用得到；导出给面板显示日期跨度 */
export function daysUntil(fromIso: string, toIso: string): number {
  return diffDays(fromIso, toIso);
}
