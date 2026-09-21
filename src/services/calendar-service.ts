import { getLocale, t } from "../i18n";
import { ParsedTask, TaskMatrixSettings } from "../types";
import { addDays, formatIso, isWeekend, startOfWeek, todayIso, parseIso } from "../utils/date";

/**
 * 日历模式的纯计算：区间判定、条目归位、汇总。
 *
 * 日历保留自己的时间轴布局（不套容器网格），所以这里的东西不经过
 * grouping-service —— 两者服务的是两种不同的阅读方式。
 */

export type CalendarMode = "month" | "week" | "list";

export type CalendarItemType = "due" | "start" | "scheduled" | "done" | "overdue" | "process";

export interface CalendarEntry {
  task: ParsedTask;
  type: CalendarItemType;
}

export interface CalendarSummary {
  total: number;
  done: number;
  due: number;
  overdue: number;
  start: number;
  scheduled: number;
  recurrence: number;
  dailyNotes: number;
}

export function calendarItemLabel(type: CalendarItemType): string {
  switch (type) {
    case "due":
      return t("截止");
    case "start":
      return t("开始");
    case "scheduled":
      return t("计划");
    case "done":
      return t("完成");
    case "overdue":
      return t("逾期");
    default:
      return t("进行中");
  }
}

export function calendarModeLabel(mode: CalendarMode): string {
  switch (mode) {
    case "week":
      return t("周");
    case "list":
      return t("列表");
    default:
      return t("月");
  }
}

export function weekdayLabel(weekday: number): string {
  switch (weekday) {
    case 0:
      return t("周日");
    case 1:
      return t("周一");
    case 2:
      return t("周二");
    case 3:
      return t("周三");
    case 4:
      return t("周四");
    case 5:
      return t("周五");
    default:
      return t("周六");
  }
}

function localeTag(): string {
  return getLocale() === "zh" ? "zh-CN" : "en-US";
}

export function calendarTitle(
  anchor: Date,
  mode: CalendarMode,
  firstDay: TaskMatrixSettings["calendarFirstDayOfWeek"],
): string {
  const tag = localeTag();
  if (mode === "week") {
    const from = startOfWeek(anchor, firstDay);
    const to = addDays(from, 6);
    const sameYear = from.getFullYear() === to.getFullYear();
    const fromLabel = from.toLocaleDateString(tag, {
      year: sameYear ? undefined : "numeric",
      month: "short",
      day: "numeric",
    });
    const toLabel = to.toLocaleDateString(tag, { year: "numeric", month: "short", day: "numeric" });
    return `${fromLabel} – ${toLabel}`;
  }
  return anchor.toLocaleDateString(tag, { year: "numeric", month: "long" });
}

/** 日历区间判定：周档看当周，月档看当月，列表档也用当月 */
export function isInCalendarRange(
  dateIso: string | undefined,
  mode: CalendarMode,
  anchor: Date,
  firstDay: TaskMatrixSettings["calendarFirstDayOfWeek"],
): boolean {
  const check = dateIso ? parseIso(dateIso) : null;
  if (check === null) return false;
  check.setHours(0, 0, 0, 0);

  if (mode === "week") {
    const from = startOfWeek(anchor, firstDay);
    const to = addDays(from, 6);
    return check >= from && check <= to;
  }

  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  return check >= monthStart && check <= monthEnd;
}

/** 月视图要渲染的日期序列（含补白的前后月日期）；关闭周末时跳过周六周日 */
export function monthGridDates(
  anchor: Date,
  firstDay: TaskMatrixSettings["calendarFirstDayOfWeek"],
  showWeekends: boolean,
): Date[] {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const cursor = startOfWeek(monthStart, firstDay);
  const renderEnd = addDays(startOfWeek(monthEnd, firstDay), 6);

  const dates: Date[] = [];
  for (let day = new Date(cursor); day <= renderEnd; day = addDays(day, 1)) {
    if (!showWeekends && isWeekend(day.getDay())) continue;
    dates.push(new Date(day));
  }
  return dates;
}

export function weekDates(
  anchor: Date,
  firstDay: TaskMatrixSettings["calendarFirstDayOfWeek"],
  showWeekends: boolean,
): Date[] {
  const from = startOfWeek(anchor, firstDay);
  const dates: Date[] = [];
  for (let index = 0; index < 7; index += 1) {
    const day = addDays(from, index);
    if (!showWeekends && isWeekend(day.getDay())) continue;
    dates.push(day);
  }
  return dates;
}

export function monthDates(anchor: Date): Date[] {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const dates: Date[] = [];
  for (let day = new Date(monthStart); day <= monthEnd; day = addDays(day, 1)) {
    dates.push(new Date(day));
  }
  return dates;
}

/** 日记笔记的日期从文件名里取：`.../2026-09-21.md` */
export function extractDailyNoteDate(filePath: string): string | undefined {
  return /(\d{4}-\d{2}-\d{2})/u.exec(filePath)?.[1];
}

/**
 * 任务在日历上的落位。
 *
 * 完成项只落一次：优先完成日，没有就退回截止日；其余按截止/开始/计划三种入库，
 * 逾期项额外标到今天。开始日与截止日同一天时不重复落两条。
 */
export function collectCalendarItems(
  tasks: readonly ParsedTask[],
  options: { showInProcessTasks: boolean },
): Record<string, CalendarEntry[]> {
  const byDate: Record<string, CalendarEntry[]> = {};
  const today = todayIso();

  const push = (dateKey: string, task: ParsedTask, type: CalendarItemType): void => {
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push({ task, type });
  };

  for (const task of tasks) {
    if (task.displayStatus === "completed") {
      if (task.doneDate) push(task.doneDate, task, "done");
      else if (task.dueDate) push(task.dueDate, task, "done");
      continue;
    }

    /*
     * 已过期的任务，在它自己那个截止日上也标「逾期」而不是「截止」。
     *
     * 那天确实是它的截止日，但读者在第 12 格上需要的信息是「这天有一件事烂尾了」；
     * 写「截止」会让人以为还没到期，尤其和「今天」那格的红色「逾期」摆在一起时自相矛盾。
     */
    if (task.dueDate) {
      push(task.dueDate, task, task.displayStatus === "overdue" ? "overdue" : "due");
    }
    if (task.startDate && task.startDate !== task.dueDate) push(task.startDate, task, "start");
    if (task.scheduledDate) push(task.scheduledDate, task, "scheduled");
    if (task.displayStatus === "overdue" && task.dueDate && task.dueDate < today) {
      push(today, task, "overdue");
    }

    // 起止之间的每一天：只标注中间那些天，两端已有各自的条目
    if (
      options.showInProcessTasks
      && task.displayStatus !== "cancelled"
      && task.startDate
      && task.dueDate
      && task.startDate < task.dueDate
    ) {
      const start = parseIso(task.startDate);
      if (start !== null) {
        for (let day = addDays(start, 1); formatIso(day) < task.dueDate; day = addDays(day, 1)) {
          push(formatIso(day), task, "process");
        }
      }
    }
  }

  return byDate;
}

/** 汇总：只统计落在当前日历区间内的任务 */
export function buildCalendarSummary(
  tasks: readonly ParsedTask[],
  mode: CalendarMode,
  anchor: Date,
  settings: TaskMatrixSettings,
): CalendarSummary {
  const today = todayIso();
  const inScope = (dateIso?: string): boolean =>
    isInCalendarRange(dateIso, mode, anchor, settings.calendarFirstDayOfWeek);

  const scoped = tasks.filter((task) =>
    [task.dueDate, task.startDate, task.scheduledDate, task.doneDate, extractDailyNoteDate(task.filePath)]
      .some((date) => inScope(date)));

  const unique = new Map(scoped.map((task) => [task.id, task]));
  const values = [...unique.values()];

  const isDone = (task: ParsedTask): boolean => settings.completionMarkers.includes(task.checkboxStatus.trim());
  const isCancelled = (task: ParsedTask): boolean => settings.cancelledMarkers.includes(task.checkboxStatus.trim());
  const active = values.filter(
    (task) =>
      !isDone(task)
      && !isCancelled(task)
      && task.displayStatus !== "completed"
      && task.displayStatus !== "cancelled",
  );

  return {
    total: values.length,
    done: values.filter((task) => task.displayStatus === "completed").length,
    due: active.filter((task) => Boolean(task.dueDate) && inScope(task.dueDate)).length,
    overdue: active.filter((task) => task.displayStatus === "overdue" && Boolean(task.dueDate) && task.dueDate! < today).length,
    start: active.filter((task) => Boolean(task.startDate) && inScope(task.startDate)).length,
    scheduled: active.filter((task) => Boolean(task.scheduledDate) && inScope(task.scheduledDate)).length,
    recurrence: active.filter((task) => Boolean(task.recurrence)).length,
    dailyNotes: values.filter((task) => {
      const dailyDate = extractDailyNoteDate(task.filePath);
      return Boolean(dailyDate && inScope(dailyDate) && !task.dueDate && !task.startDate && !task.scheduledDate);
    }).length,
  };
}
