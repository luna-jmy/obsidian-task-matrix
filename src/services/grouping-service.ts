import { t } from "../i18n";
import {
  EisenhowerQuadrant,
  GTDState,
  PanelSpec,
  ParsedTask,
  Priority,
  TaskMatrixSettings,
  ViewMode,
} from "../types";
import { todayIso } from "../utils/date";

/**
 * 分组服务：把一批任务摊成「容器」。
 *
 * 四种模式共用同一个出口（`PanelSpec[]`），所以容器与卡片的渲染只有一份，
 * 「等宽等高」的规则也只有一处 —— 加一种视图不必再抄一遍卡片代码。
 * 日历模式不走这里（它有自己的时间轴布局，见 calendar-service）。
 */
export interface GroupingResult {
  /** 容器网格的列策略：fixed = 数量固定的 4 格等宽撑满；flow = 随数量铺 */
  grid: "fixed" | "flow";
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

export function buildPanels(
  tasks: readonly ParsedTask[],
  mode: ViewMode,
  settings: TaskMatrixSettings,
): GroupingResult {
  switch (mode) {
    case "gtd":
      return buildGtdPanels(tasks);
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

function buildListPanels(
  tasks: readonly ParsedTask[],
  settings: TaskMatrixSettings,
): GroupingResult {
  if (!settings.listGroupByFolder) {
    return {
      grid: "fixed",
      panels: [
        {
          key: "all",
          title: t("全部任务"),
          tasks: [...tasks],
        },
      ],
    };
  }

  const grouped = new Map<string, ParsedTask[]>();
  for (const task of tasks) {
    const folder = folderPathOf(task.filePath, settings.listGroupByFolderDepth);
    const bucket = grouped.get(folder);
    if (bucket === undefined) grouped.set(folder, [task]);
    else bucket.push(task);
  }

  const panels: PanelSpec[] = [...grouped.keys()]
    .sort((a, b) => a.localeCompare(b))
    .map((folder) => ({
      key: panelKeyForFolder(folder),
      title: folder === "" ? t("根目录") : folder,
      subtitle: taskCountLabel(grouped.get(folder)?.length ?? 0),
      tasks: grouped.get(folder) ?? [],
    }));

  return { grid: gridFor(panels.length), panels };
}

/**
 * 只有一个容器时用 `fixed`（auto-fit + 1fr）让它吃满整行。
 *
 * `flow` 用的是 auto-fill：它会把空轨道也建出来，孤零零一个容器只占最左侧一格、
 * 右边空一大片。这不是「对称」，是对齐失败。
 */
function gridFor(panelCount: number): "fixed" | "flow" {
  return panelCount > 1 ? "flow" : "fixed";
}

/** 取文件路径的前 depth 层文件夹；depth 为 0 或文件在根目录时返回空串 */
export function folderPathOf(filePath: string, depth: number): string {
  const parts = filePath.split("/");
  parts.pop();
  if (parts.length === 0) return "";
  return parts.slice(0, Math.max(depth, 1)).join("/");
}

// ────────────────────────────── GTD ──────────────────────────────

/**
 * 任务的 GTD 落列。
 *
 * 与原实现同一口径：「待开始」并进收件箱；「逾期」按有没有真的开工
 * （有开始日或带着 #doing/#active/#next）决定进进行中还是回收到收件箱。
 */
export function gtdColumnOf(task: ParsedTask, today: string = todayIso()): GTDState {
  if (task.gtdState === "To be Started") return "Inbox";
  if (task.gtdState !== "Overdue") return task.gtdState;

  const description = task.description.toLowerCase();
  const hasActiveTag = description.includes("#doing") || description.includes("#active") || description.includes("#next");
  const hasStarted = Boolean(task.startDate && task.startDate <= today);
  return hasStarted || hasActiveTag ? "In Progress" : "Inbox";
}

function buildGtdPanels(tasks: readonly ParsedTask[]): GroupingResult {
  const today = todayIso();
  const panels = GTD_COLUMNS.map((state): PanelSpec => {
    const columnTasks = tasks.filter((task) => {
      if (task.displayStatus === "cancelled") return false;
      // 「已完成」列只认勾选完成，不认取消 —— 取消的任务不进任何一列
      if (state === "Done") return task.displayStatus === "completed" && gtdColumnOf(task, today) === state;
      return task.displayStatus !== "completed" && gtdColumnOf(task, today) === state;
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
