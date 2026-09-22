import { t } from "../i18n";
import {
  EisenhowerQuadrant,
  GTDState,
  PanelSection,
  PanelSpec,
  ParsedTask,
  Priority,
  TaskMatrixSettings,
  ViewMode,
} from "../types";
import { DEFAULT_GTD_RULES, GtdRules, gtdRulesOf, matchesAnyTag } from "../parser/task-parser";
import { scanFolderOf } from "./task-index";
import { todayIso } from "../utils/date";

/**
 * 分组服务：把一批任务摊成「容器」。
 *
 * 四种模式共用同一个出口（`PanelSpec[]`），所以容器与卡片的渲染只有一份，
 * 「等宽等高」的规则也只有一处 —— 加一种视图不必再抄一遍卡片代码。
 * 日历模式不走这里（它有自己的时间轴布局，见 calendar-service）。
 */
export interface GroupingResult {
  /**
   * 容器网格的列策略。
   *
   * - `fixed`：数量固定的 4 格等宽撑满 —— GTD、矩阵；
   * - `flow`：随数量铺 —— 笔记列表（一格 = 一条笔记的容器），行高矮一档。
   */
  grid: "fixed" | "flow";
  /**
   * 分区：笔记列表开启「按文件夹分组」时出现，分区里装的是笔记容器，
   * 此时 `panels` 为空。其余模式不设这个字段。
   */
  sections?: PanelSection[];
  panels: PanelSpec[];
}

/** GTD 看板的列（顺序即展示顺序） */
const GTD_COLUMNS: readonly GTDState[] = ["Inbox", "In Progress", "Waiting", "Done"];
const QUADRANTS: readonly EisenhowerQuadrant[] = ["Q1", "Q2", "Q3", "Q4"];

export function gtdStateLabel(state: GTDState): string {
  switch (state) {
    case "Inbox":
      return t("收件箱");
    case "To be Started":
      return t("待开始");
    case "In Progress":
      return t("进行中");
    case "Waiting":
      return t("等待中");
    case "Overdue":
      return t("已逾期");
    default:
      return t("已完成");
  }
}

export function quadrantSubtitle(quadrant: EisenhowerQuadrant): string {
  switch (quadrant) {
    case "Q1":
      return t("重要且紧急");
    case "Q2":
      return t("重要不紧急");
    case "Q3":
      return t("紧急不重要");
    default:
      return t("不重要不紧急");
  }
}

export function panelKeyForGtd(state: GTDState): string {
  return `gtd:${state}`;
}

export function panelKeyForQuadrant(quadrant: EisenhowerQuadrant): string {
  return `q:${quadrant}`;
}

export function panelKeyForFolder(folder: string): string {
  return `folder:${folder}`;
}

/**
 * 按笔记分组的 key。
 *
 * 只有甘特用这一档（面板模式的容器按文件夹/状态/象限分，不会一条笔记一个容器）；
 * 前缀仍然独立，免得同名笔记之间、或与文件夹 key 撞上。
 */
export function panelKeyForNote(filePath: string): string {
  return `note:${filePath}`;
}

/** 笔记名：去掉路径与 `.md` 扩展名（列表容器与甘特分节共用同一个口径） */
export function noteNameOf(filePath: string): string {
  return filePath.slice(filePath.lastIndexOf("/") + 1).replace(/\.md$/u, "");
}

export function buildPanels(
  tasks: readonly ParsedTask[],
  mode: ViewMode,
  settings: TaskMatrixSettings,
): GroupingResult {
  switch (mode) {
    case "gtd":
      return buildGtdPanels(tasks, gtdRulesOf(settings));
    case "eisenhower":
      return buildQuadrantPanels(tasks);
    case "calendar":
      // 日历有自己的布局（calendar-service），不走容器网格；
      // 这里给一个空结果，避免调用方到处写分支。
      // 甘特更是另一块主区，压根不会走到这个函数
      return { grid: "flow", panels: [] };
    default:
      return buildListPanels(tasks, settings);
  }
}

// ────────────────────────────── 列表 ──────────────────────────────

/**
 * 笔记列表的两种形态。
 *
 * - 不按文件夹分组：**一条笔记一个容器**，里面是这个笔记的任务卡片。按笔记聚拢
 *   最贴近任务的来源，也让人一眼看出「这几件事出自同一篇记录」。
 * - 按文件夹分组：笔记容器归入**可折叠的文件夹分区**（分区是分组标题，不是容器 ——
 *   容器套容器的三层盒子只会把每格挤小）。
 *
 * 两种形态的格子都是笔记容器、都走 `flow` 网格；差别只是多不多那一层分区。
 */
function buildListPanels(
  tasks: readonly ParsedTask[],
  settings: TaskMatrixSettings,
): GroupingResult {
  if (!settings.listGroupByFolder) return buildNoteContainers(tasks);

  const byFolder = new Map<string, ParsedTask[]>();
  for (const task of tasks) {
    const folder = groupFolderOf(task.filePath, settings);
    const bucket = byFolder.get(folder);
    if (bucket === undefined) byFolder.set(folder, [task]);
    else bucket.push(task);
  }

  const sections: PanelSection[] = [...byFolder.keys()]
    .sort((a, b) => a.localeCompare(b))
    .map((folder) => ({
      key: panelKeyForFolder(folder),
      title: folder === "" ? t("根目录") : folder,
      // 分区里装的仍然是笔记容器：复用「按笔记分容器」这一份，口径不漂移
      panels: buildNoteContainers(byFolder.get(folder) ?? []).panels,
    }));

  return { grid: "flow", sections, panels: [] };
}

/** 一条笔记一个容器；容器头「+」新建的任务写回**那篇笔记**，不是设置里的默认落点 */
function buildNoteContainers(tasks: readonly ParsedTask[]): GroupingResult {
  const grouped = new Map<string, ParsedTask[]>();
  for (const task of tasks) {
    const bucket = grouped.get(task.filePath);
    if (bucket === undefined) grouped.set(task.filePath, [task]);
    else bucket.push(task);
  }

  const panels: PanelSpec[] = [...grouped.keys()]
    .sort((a, b) => a.localeCompare(b))
    .map((filePath) => ({
      key: panelKeyForNote(filePath),
      title: noteNameOf(filePath),
      tasks: grouped.get(filePath) ?? [],
      noteMeta: "hidden",
      addDefaults: { filePath },
    }));

  return { grid: "flow", panels };
}

/**
 * 任务按文件夹分组时的分组名（笔记列表的分区、甘特「按文件夹分组」的分节共用）。
 *
 * 优先返回设置里**扫描目录的原文**：用户是按那几个目录组织资料的，分组标题就该是
 * 那几个目录（`300 Resources/360 WorkMemos`），而不是被截断的一级名 ——
 * 截断后「300 Resources」下所有子目录会挤成一格，看不出东西在哪。
 *
 * 没配扫描目录（扫全库）时退回笔记自己的文件夹路径，同样不截断：
 * 根目录下的笔记返回空串。
 */
export function groupFolderOf(filePath: string, settings: TaskMatrixSettings): string {
  const scanned = scanFolderOf(filePath, settings.scanFolders);
  if (scanned !== null) return scanned;
  const slash = filePath.lastIndexOf("/");
  return slash === -1 ? "" : filePath.slice(0, slash);
}

// ────────────────────────────── GTD ──────────────────────────────

/**
 * 任务的 GTD 落列。
 *
 * 「待开始」并进收件箱；「逾期」按有没有真的开工（有开始日或带着进行中标签）
 * 决定进进行中还是回收到收件箱。判定用的标签清单来自设置（见 gtdRulesOf）。
 */
export function gtdColumnOf(
  task: ParsedTask,
  today: string = todayIso(),
  rules: GtdRules = DEFAULT_GTD_RULES,
): GTDState {
  if (task.gtdState === "To be Started") return "Inbox";
  if (task.gtdState !== "Overdue") return task.gtdState;

  const description = task.description.toLowerCase();
  const hasActiveTag = matchesAnyTag(description, rules.inProgressTags);
  const hasStarted = Boolean(task.startDate && task.startDate <= today);
  return hasStarted || hasActiveTag ? "In Progress" : "Inbox";
}

function buildGtdPanels(tasks: readonly ParsedTask[], rules: GtdRules): GroupingResult {
  const today = todayIso();
  const panels = GTD_COLUMNS.map((state): PanelSpec => {
    const columnTasks = tasks.filter((task) => {
      if (task.displayStatus === "cancelled") return false;
      // 「已完成」列只认勾选完成，不认取消 —— 取消的任务不进任何一列
      if (state === "Done") {
        return task.displayStatus === "completed" && gtdColumnOf(task, today, rules) === state;
      }
      return task.displayStatus !== "completed" && gtdColumnOf(task, today, rules) === state;
    });

    return {
      key: panelKeyForGtd(state),
      title: gtdStateLabel(state),
      subtitle: taskCountLabel(columnTasks.length),
      tasks: columnTasks,
      dropTarget: { kind: "gtd", state },
      addDefaults: gtdDefaultsFor(state, today),
    };
  });

  return { grid: "fixed", panels };
}

function gtdDefaultsFor(state: GTDState, today: string): Partial<ParsedTask> {
  switch (state) {
    case "Waiting":
      return { gtdState: "Waiting" };
    case "In Progress":
      return { gtdState: "In Progress", startDate: today };
    case "Overdue":
      return { dueDate: today };
    default:
      return { gtdState: state };
  }
}

// ────────────────────────────── 艾森豪威尔矩阵 ──────────────────────────────

function buildQuadrantPanels(tasks: readonly ParsedTask[]): GroupingResult {
  const today = todayIso();
  const panels = QUADRANTS.map((quadrant): PanelSpec => {
    const cellTasks = tasks.filter(
      (task) =>
        task.quadrant === quadrant
        && task.displayStatus !== "completed"
        && task.displayStatus !== "cancelled",
    );

    return {
      key: panelKeyForQuadrant(quadrant),
      title: quadrant,
      subtitle: quadrantSubtitle(quadrant),
      tasks: cellTasks,
      dropTarget: { kind: "quadrant", quadrant },
      addDefaults: quadrantDefaultsFor(quadrant, today),
    };
  });

  return { grid: "fixed", panels };
}

function quadrantDefaultsFor(quadrant: EisenhowerQuadrant, today: string): Partial<ParsedTask> {
  switch (quadrant) {
    case "Q1":
      return { priority: Priority.High, dueDate: today };
    case "Q2":
      return { priority: Priority.High };
    case "Q3":
      return { priority: Priority.Low, dueDate: today };
    default:
      return { priority: Priority.Lowest };
  }
}

function taskCountLabel(count: number): string {
  return t("{count} 个任务", { count });
}
