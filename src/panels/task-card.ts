import { App, Component, MarkdownRenderer, TFile } from "obsidian";
import { t } from "../i18n";
import { gtdColumnOf, gtdStateLabel, noteNameOf } from "../services/grouping-service";
import { priorityLabel, statusLabel } from "../services/filter-service";
import { EisenhowerQuadrant, GTDState, ParsedTask, Priority, ViewMode } from "../types";
import { todayIso } from "../utils/date";

/**
 * 单张任务卡片。
 *
 * 卡片是容器网格里的一格，所以这里只管「一张卡片长什么样」，
 * 不知道自己属于哪个容器、也不管同容器里有几张 —— 尺寸由网格统一约束，
 * 这正是容器能保持等大对称的前提。
 */
export interface TaskCardContext {
  app: App;
  /** 卡片内联 Markdown 的宿主组件，随容器重建一起卸载 */
  markdownComponent: Component;
  mode: ViewMode;
  /**
   * 底部元信息行里笔记的显示方式。
   *
   * - `path`（缺省）：完整路径 + 行号 —— GTD/矩阵，容器与笔记无关；
   * - `name`：只显示笔记名 —— 列表按文件夹分容器时，同容器里有多篇笔记要区分；
   * - `hidden`：不显示 —— 列表按笔记分容器时，容器标题就是笔记名，再写一遍是噪声。
   */
  noteMeta?: "path" | "name" | "hidden";
}

export interface TaskCardCallbacks {
  onOpen(task: ParsedTask): void;
  onToggle(task: ParsedTask): void;
  onStart(task: ParsedTask): void;
  onCancel(task: ParsedTask): void;
  onEdit(task: ParsedTask): void;
  onDelete(task: ParsedTask): void;
  onMoveGtd(task: ParsedTask, state: GTDState): void;
  onMoveQuadrant(task: ParsedTask, quadrant: EisenhowerQuadrant): void;
}

/** 拖动时携带的任务身份：容器靠它找回任务对象 */
export const TASK_DRAG_MIME = "text/tm-task-id";

const QUADRANTS: readonly EisenhowerQuadrant[] = ["Q1", "Q2", "Q3", "Q4"];

/** GTD 快捷移动：单字按钮，title 里给出完整名字 */
const GTD_QUICK_TARGETS: readonly { state: GTDState; short: string; label: string }[] = [
  { state: "Inbox", short: "收", label: t("收件箱") },
  { state: "In Progress", short: "进", label: t("进行中") },
  { state: "Waiting", short: "等", label: t("等待中") },
];

export async function renderTaskCard(
  host: HTMLElement,
  task: ParsedTask,
  context: TaskCardContext,
  callbacks: TaskCardCallbacks,
): Promise<HTMLElement> {
  const card = host.createDiv({ cls: `tm-card${task.blocked ? " tm-card--blocked" : ""}` });
  /*
   * 拖拽换容器只在有投放目标的视图里成立（GTD/矩阵）。
   * 列表容器的落点是「笔记/文件夹」，把任务拖去另一篇笔记不是移动，是改写来源 ——
   * 那是编辑的事，不该靠拖拽顺手指一下就发生。
   */
  card.draggable = context.mode !== "list";
  card.dataset.taskId = task.id;

  card.addEventListener("dragstart", (event) => {
    event.dataTransfer?.setData(TASK_DRAG_MIME, task.id);
    card.addClass("is-dragging");
  });
  card.addEventListener("dragend", () => card.removeClass("is-dragging"));
  card.addEventListener("click", (event) => {
    // 卡片按钮各自处理点击；点空白处才等于「打开这个任务」
    if ((event.target as HTMLElement).closest(".tm-card__actions")) return;
    callbacks.onOpen(task);
  });

  const head = card.createDiv({ cls: "tm-card__head" });
  const titleEl = head.createDiv({ cls: "tm-card__title" });
  const file = context.app.vault.getAbstractFileByPath(task.filePath);
  if (file instanceof TFile && task.description.length > 0) {
    // 描述按 Markdown 渲染，行内代码 / Dataview 之类才认得出来
    await MarkdownRenderer.render(
      context.app,
      task.description,
      titleEl,
      task.filePath,
      context.markdownComponent,
    );
  } else {
    titleEl.setText(task.description || t("无描述"));
  }
  head.createDiv({
    cls: `tm-badge tm-badge--${task.displayStatus}`,
    text: statusLabel(task.displayStatus),
  });

  renderChips(card, task);
  card.createDiv({ cls: "tm-card__meta", text: metaText(task, context) });

  renderActions(card, task, context, callbacks);
  return card;
}

/** 元信息行：按容器形态决定笔记显示到什么程度（见 TaskCardContext.noteMeta） */
function metaText(task: ParsedTask, context: TaskCardContext): string {
  const state = gtdStateLabel(task.gtdState);
  switch (context.noteMeta ?? "path") {
    case "hidden":
      return state;
    case "name":
      return `${noteNameOf(task.filePath)} · ${state}`;
    default:
      return `${task.filePath}:${task.lineNumber} · ${state}`;
  }
}

function renderChips(card: HTMLElement, task: ParsedTask): void {
  const chips = card.createDiv({ cls: "tm-card__chips" });
  const push = (text: string, modifier = ""): void => {
    chips.createSpan({ cls: `tm-chip tm-chip--static${modifier}`, text });
  };

  if (task.priority !== Priority.None) {
    push(t("优先级 {level}", { level: priorityLabel(task.priority) }));
  }
  if (task.dueDate) push(t("截止 {date}", { date: task.dueDate }));
  if (task.startDate) push(t("开始 {date}", { date: task.startDate }));
  if (task.taskId) push(t("ID {id}", { id: task.taskId }));
  if (task.dependsOn) {
    push(
      task.blocked ? t("被 {id} 阻塞", { id: task.dependsOn }) : t("依赖 {id} 已完成", { id: task.dependsOn }),
      task.blocked ? " tm-chip--warning" : "",
    );
  }
  if (task.lineText.toLowerCase().includes("#due-date-conflict")) {
    push(t("日期冲突"), " tm-chip--conflict");
  }
}

function renderActions(
  card: HTMLElement,
  task: ParsedTask,
  context: TaskCardContext,
  callbacks: TaskCardCallbacks,
): void {
  const actions = card.createDiv({ cls: "tm-card__actions" });

  if (task.displayStatus === "completed") {
    addAction(actions, "↺", t("重新打开"), () => callbacks.onToggle(task));
  } else {
    addAction(actions, "✓", t("完成"), () => callbacks.onToggle(task));
    if (!task.startDate || task.displayStatus === "to-be-started") {
      addAction(actions, "▶", t("开始"), () => callbacks.onStart(task));
    }
    addAction(actions, "✕", t("取消"), () => callbacks.onCancel(task));
  }
  addAction(actions, "✎", t("编辑"), () => callbacks.onEdit(task));
  addAction(actions, "🗑", t("删除"), () => callbacks.onDelete(task));

  // 快捷移动：只列「当前不在的那几个」
  const quick = quickMovesFor(task, context.mode, callbacks);
  if (quick.length === 0) return;

  actions.createSpan({ cls: "tm-card__actions-sep", text: "|" });
  actions.createSpan({ cls: "tm-card__actions-label", text: t("移动到") });
  for (const move of quick) {
    addAction(actions, move.text, move.title, move.run);
  }
}

interface QuickMove {
  text: string;
  title: string;
  run: () => void;
}

function quickMovesFor(
  task: ParsedTask,
  mode: ViewMode,
  callbacks: TaskCardCallbacks,
): QuickMove[] {
  if (mode === "eisenhower") {
    return QUADRANTS.filter((quadrant) => quadrant !== task.quadrant).map((quadrant) => ({
      text: quadrant.slice(1),
      title: t("移动到 {quadrant}", { quadrant }),
      run: () => callbacks.onMoveQuadrant(task, quadrant),
    }));
  }

  if (mode === "gtd") {
    const current = gtdColumnOf(task, todayIso());
    return GTD_QUICK_TARGETS.filter((target) => target.state !== current).map((target) => ({
      text: target.short,
      title: t("移动到「{state}」", { state: target.label }),
      run: () => callbacks.onMoveGtd(task, target.state),
    }));
  }

  return [];
}

function addAction(host: HTMLElement, text: string, title: string, onClick: () => void): void {
  const button = host.createEl("button", {
    cls: "tm-card__action tm-btn",
    text,
    // 按钮上的字是 `✎` 这类符号，读屏拿不到含义，所以 title 同时当无障碍名用
    attr: { type: "button", title, "aria-label": title },
  });
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
}
