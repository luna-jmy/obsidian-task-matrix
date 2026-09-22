import { t } from "../i18n";
import { GanttTask } from "../parser/gantt-parser";
import { gtdRulesOf } from "../parser/task-parser";
import {
  groupFolderOf,
  gtdColumnOf,
  gtdStateLabel,
  panelKeyForFolder,
  panelKeyForGtd,
  noteNameOf,
  panelKeyForNote,
  panelKeyForQuadrant,
  quadrantSubtitle,
} from "../services/grouping-service";
import { resolveNonWorkingDays } from "../services/holiday-schedule";
import {
  BarDurationMode,
  EisenhowerQuadrant,
  GanttGrouping,
  GTDState,
  ParsedTask,
  TaskMatrixSettings,
} from "../types";
import { addDaysIso, diffDaysIso, maxIso, minIso, monthEndIso, monthStartIso, todayIso } from "../utils/date";

/**
 * 甘特模型：把任务摊成「分节 + 行」，并算出时间轴范围。
 *
 * 纯函数、零 DOM —— 绘制全在 gantt-view.ts，分节口径全在这里。
 * 与 Project Master 同结构（sections / rows / 范围 / 跳过清单），
 * 但行的来源是任务而不是笔记，日期来自任务行的 emoji 字段而不是 frontmatter。
 */

/** 只给了单侧日期时，另一侧按这个天数补出来（并在图上标成推导值） */
const FALLBACK_DAYS = 1;

export type GanttSkipReason = "no-dates";

export interface GanttRow {
  task: GanttTask;
  start: string;
  end: string;
  /** start 是推导出来的（任务只写了截止日） */
  startFallback: boolean;
  /** end 是推导出来的（任务只写了开始日） */
  endFallback: boolean;
  /** 自然日跨度，闭区间 */
  calendarDays: number;
  /** 工作日跨度 = 自然日 − 非工作日（周末 / 法定节假日；补班日仍算工作日） */
  workdayDays: number;
  /** 条上要显示的文字；设置为「不显示」时为 null */
  durationLabel: string | null;
}

export interface GanttSection {
  key: string;
  name: string;
  rows: GanttRow[];
  collapsed: boolean;
}

export interface GanttModel {
  sections: GanttSection[];
  /** 扁平渲染顺序（分节内顺序拼接），SVG 与侧栏共用 */
  rows: GanttRow[];
  showSectionHeaders: boolean;
  rangeStart: string;
  rangeEnd: string;
  /** 有日期但被排除在外的任务（目前只有「两端都没日期」一种） */
  skipped: GanttTask[];
}

export interface GanttModelOptions {
  grouping: GanttGrouping;
  collapsedKeys: ReadonlySet<string>;
  today?: string;
  /** 筛选栏的日期区间：只扩不缩 */
  axisRange?: { start: string; end: string };
  settings: TaskMatrixSettings;
  /**
   * `文件:行号` → 面板视图解析出的任务。
   *
   * GTD/矩阵分组要的是「状态」与「象限」，那是面板解析器的产出（它认得标签、
   * 依赖、阻塞关系），甘特解析器不重复实现一遍 —— 用同一份判断，
   * 两种视图的 GTD/象限归属才是同一个答案。
   */
  parsedByLine: ReadonlyMap<string, ParsedTask>;
}

export function buildGanttModel(tasks: readonly GanttTask[], options: GanttModelOptions): GanttModel {
  const today = options.today ?? todayIso();
  const grouped = new Map<string, { name: string; tasks: GanttTask[] }>();
  const skipped: GanttTask[] = [];

  for (const task of tasks) {
    if (resolveRow(task) === null) {
      skipped.push(task);
      continue;
    }
    const { key, name } = sectionOf(task, options, today);
    const bucket = grouped.get(key);
    if (bucket === undefined) grouped.set(key, { name, tasks: [task] });
    else bucket.tasks.push(task);
  }

  const buckets = [...grouped.entries()];
  /*
   * 按笔记分组时把分节按路径排序。
   *
   * 其他档位的顺序都有语义（GTD 的列序、象限的 Q1→Q4 由调用方给的任务顺序决定），
   * 不能全局排序；而「一条笔记一个分节」没有固有顺序，不排的话分节顺序就成了
   * 「第一条任务碰巧被索引到的顺序」。文件夹分组在面板侧也是按名字排的，这里同口径。
   */
  if (options.grouping === "note") buckets.sort((a, b) => a[0].localeCompare(b[0]));

  const sections: GanttSection[] = [];
  for (const [key, bucket] of buckets) {
    const rows: GanttRow[] = [];
    for (const task of bucket.tasks) {
      const row = resolveRow(task);
      if (row !== null) rows.push(row);
    }
    sections.push({
      key,
      name: bucket.name,
      rows,
      // 「无分组」只有一个分节且没有分节头，折叠它就没法展开了 —— 直接不参与折叠
      collapsed: options.grouping !== "none" && options.collapsedKeys.has(key),
    });
  }

  // rows 是「全部行」的扁平序列：范围计算与空态判断都用它，
  // 折叠只影响绘制（layout），不该让时间轴跟着跳
  const rows = sections.flatMap((section) => section.rows);
  const range = resolveRange(rows, options, today);

  // 天数标注放在范围算出来之后：工作日口径要按「图跨到的年份」取节假日排期
  applyDurations(
    rows,
    resolveNonWorkingDays(range.rangeStart, range.rangeEnd, options.settings),
    options.settings.ganttBarDuration,
  );

  return {
    sections,
    rows,
    // 无分组时只有一个分节，分节名与内容重复，是纯噪声
    showSectionHeaders: options.grouping !== "none",
    ...range,
    skipped,
  };
}

// ────────────────────────────── 行 ──────────────────────────────

function resolveRow(task: GanttTask): GanttRow | null {
  const { startDate, dueDate } = task;

  if (startDate !== undefined && dueDate !== undefined) {
    // 起止写反了就让它们就位：宁可画成一段正常跨度，也不要一条负宽度的条
    const [start, end] = startDate <= dueDate ? [startDate, dueDate] : [dueDate, startDate];
    return withSpan(task, start, end, false, false);
  }
  if (startDate !== undefined) {
    return withSpan(task, startDate, addDaysIso(startDate, FALLBACK_DAYS), false, true);
  }
  if (dueDate !== undefined) {
    return withSpan(task, addDaysIso(dueDate, -FALLBACK_DAYS), dueDate, true, false);
  }
  return null;
}

function withSpan(
  task: GanttTask,
  start: string,
  end: string,
  startFallback: boolean,
  endFallback: boolean,
): GanttRow {
  const calendarDays = diffDaysIso(start, end) + 1;
  return {
    task,
    start,
    end,
    startFallback,
    endFallback,
    calendarDays,
    // 先按「没有非工作日」填上，随后由 applyDurations 按设置与排期覆盖
    workdayDays: calendarDays,
    durationLabel: null,
  };
}

/**
 * 算每条的自然日 / 工作日跨度，并按设置生成条上要显示的文字。
 *
 * 工作日口径**复用同一份非工作日清单**（`resolveNonWorkingDays`：周末开关 + 节假日排期
 * − 补班日），也就是图上灰色列与导出 mermaid 用的那一份 —— 「条上写几天」与「导出
 * excludes 什么」因此不会各说各话。
 *
 * 数法上不逐日遍历：非工作日清单是**升序**的，直接在区间内数它的成员即可
 * （一年也就百来条），任务跨度再大也不会退化成逐日循环。
 */
function applyDurations(
  rows: readonly GanttRow[],
  nonWorkingDays: readonly string[],
  mode: BarDurationMode,
): void {
  for (const row of rows) {
    let offDays = 0;
    for (const day of nonWorkingDays) {
      if (day < row.start) continue;
      if (day > row.end) break;
      offDays += 1;
    }
    row.workdayDays = Math.max(0, row.calendarDays - offDays);
    row.durationLabel = durationLabel(mode, row.calendarDays, row.workdayDays);
  }
}

/** 条上的天数文字（纯函数：口径变了只改这一处，测试也只盯这一处） */
export function durationLabel(
  mode: BarDurationMode,
  calendarDays: number,
  workdayDays: number,
): string | null {
  switch (mode) {
    case "off":
      return null;
    case "workday":
      return t("{count} 工作日", { count: workdayDays });
    default:
      return t("{count} 天", { count: calendarDays });
  }
}

/** 分节名的人类可读文本 + 稳定的 key（key 与面板视图共用，折叠状态因此共享） */
function sectionOf(
  task: GanttTask,
  options: GanttModelOptions,
  today: string,
): { key: string; name: string } {
  switch (options.grouping) {
    case "folder": {
      // 与笔记列表的分区同一口径：优先用设置里的扫描目录原文（见 groupFolderOf）
      const folder = groupFolderOf(task.filePath, options.settings);
      return { key: panelKeyForFolder(folder), name: folder === "" ? t("根目录") : folder };
    }
    case "note":
      // 一条笔记 = 一个分节；key 里带完整路径，所以不同文件夹里的同名笔记不会并到一起
      return { key: panelKeyForNote(task.filePath), name: noteNameOf(task.filePath) };
    case "gtd": {
      const state = gtdColumnFor(task, options, today);
      return { key: panelKeyForGtd(state), name: gtdStateLabel(state) };
    }
    case "quadrant": {
      const quadrant = quadrantFor(task, options, today);
      return { key: panelKeyForQuadrant(quadrant), name: `${quadrant} · ${quadrantSubtitle(quadrant)}` };
    }
    default:
      return { key: "all", name: t("全部任务") };
  }
}

/**
 * 甘特任务落在 GTD 哪一列。
 *
 * 优先问面板解析器的结论（`gtdColumnOf` 认得 `#waiting` 这类标签与依赖阻塞），
 * 找不到对应行时（理论上极少）退化为「已完成 → 已完成列，其余 → 收件箱」。
 */
function gtdColumnFor(task: GanttTask, options: GanttModelOptions, today: string): GTDState {
  const parsed = options.parsedByLine.get(`${task.filePath}:${task.lineNumber}`);
  if (parsed !== undefined) return gtdColumnOf(parsed, today, gtdRulesOf(options.settings));
  return task.completed ? "Done" : "Inbox";
}

/** 同理：象限优先用面板解析器的优先级判断，退化时用「关键 + 紧急」粗判 */
function quadrantFor(task: GanttTask, options: GanttModelOptions, today: string): EisenhowerQuadrant {
  const parsed = options.parsedByLine.get(`${task.filePath}:${task.lineNumber}`);
  if (parsed !== undefined) return parsed.quadrant;

  const urgent = task.dueDate !== undefined && task.dueDate <= addDaysIso(today, options.settings.urgentDaysRange - 1);
  if (task.critical && urgent) return "Q1";
  if (task.critical) return "Q2";
  if (urgent) return "Q3";
  return "Q4";
}

// ────────────────────────────── 时间轴范围 ──────────────────────────────

/**
 * 范围 = 任务跨度 ∪ 当前月 ∪ 筛选栏区间（只扩不缩）。
 *
 * 并进「当前月」是有用的：打开甘特时视野总落在本月，而不是被某一条远期任务
 * 拽到别处；并进筛选区间则让「筛了本月」与「时间轴画本月」两件事口径一致。
 * 范围外的任务不会被丢掉——横向滚动就能找回来。
 */
function resolveRange(
  rows: readonly GanttRow[],
  options: GanttModelOptions,
  today: string,
): { rangeStart: string; rangeEnd: string } {
  let rangeStart: string | null = null;
  let rangeEnd: string | null = null;

  for (const row of rows) {
    rangeStart = minIso(rangeStart, row.start);
    rangeEnd = maxIso(rangeEnd, row.end);
  }

  rangeStart = minIso(rangeStart, monthStartIso(today));
  rangeEnd = maxIso(rangeEnd, monthEndIso(today));

  if (options.axisRange !== undefined) {
    rangeStart = minIso(rangeStart, options.axisRange.start);
    rangeEnd = maxIso(rangeEnd, options.axisRange.end);
  }

  return { rangeStart: rangeStart ?? today, rangeEnd: rangeEnd ?? today };
}
