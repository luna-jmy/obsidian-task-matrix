import { t } from "../i18n";
import { GanttTask } from "../parser/gantt-parser";
import {
  folderPathOf,
  gtdColumnOf,
  gtdStateLabel,
  panelKeyForFolder,
  panelKeyForGtd,
  noteNameOf,
  panelKeyForNote,
  panelKeyForQuadrant,
  quadrantSubtitle,
} from "../services/grouping-service";
import { EisenhowerQuadrant, GanttGrouping, GTDState, ParsedTask, TaskMatrixSettings } from "../types";
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
  return {
    task,
    start,
    end,
    startFallback,
    endFallback,
    calendarDays: diffDaysIso(start, end) + 1,
  };
}

/** 分节名的人类可读文本 + 稳定的 key（key 与面板视图共用，折叠状态因此共享） */
function sectionOf(
  task: GanttTask,
  options: GanttModelOptions,
  today: string,
): { key: string; name: string } {
  switch (options.grouping) {
    case "folder": {
      const folder = folderPathOf(task.filePath, options.settings.listGroupByFolderDepth);
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
  if (parsed !== undefined) return gtdColumnOf(parsed, today);
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
