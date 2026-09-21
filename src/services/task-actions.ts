import { App, Notice } from "obsidian";
import { t } from "../i18n";
import {
  compactLine,
  editTaskLine,
  EditResult,
  getIndent,
  setCheckboxMarker,
  setConflictTag,
  setDateField,
  setPriority,
} from "../parser/task-writer";
import { GTDState, EisenhowerQuadrant, ParsedTask, Priority, TaskMatrixSettings } from "../types";
import { todayIso } from "../utils/date";

/**
 * 任务写操作。
 *
 * 全部走 `editTaskLine`（Vault.process + 行级最小改动），并且**每次都在最新内容上
 * 重新判断**：从点击到落盘之间笔记可能已被别的插件改过，用点击那一刻的快照做决策
 * 会写错行或翻转两次。
 *
 * 这里不弹任何模态：需要用户决定的场景（日期冲突）由调用方注入 `ConflictResolver`，
 * 服务层因此可以独立测试，也不会把 UI 细节带进数据层。
 */

export type ConflictResolution = "adjust-due" | "mark-conflict" | "cancel";
export type ConflictResolver = (startDate: string, dueDate: string) => Promise<ConflictResolution>;

function notifyEditResult(result: EditResult, task: ParsedTask, message: string): void {
  if (result === "missing") {
    new Notice(t("在 {path}:{line} 找不到该任务行", { path: task.filePath, line: task.lineNumber }));
    return;
  }
  if (result === "updated") new Notice(message);
}

export function hasDateConflict(startDate?: string, dueDate?: string): boolean {
  if (!startDate || !dueDate) return false;
  return startDate > dueDate;
}

export async function toggleTaskStatus(
  app: App,
  settings: TaskMatrixSettings,
  task: ParsedTask,
): Promise<void> {
  const completionMarkers = settings.completionMarkers;
  const defaultCompleteMarker = completionMarkers[0] ?? "x";
  const trackCompletionDate = settings.trackCompletionDate;
  const today = todayIso();
  let wasCompleted = completionMarkers.includes(task.checkboxStatus.trim());

  const result = await editTaskLine(app, task, (line) => {
    // 以最新内容为准判断当前勾选状态，避免陈旧快照把它翻转两次
    const currentMarker = /\[([^\]]*)\]/u.exec(line)?.[1]?.trim() ?? "";
    wasCompleted = completionMarkers.includes(currentMarker);

    let next = setCheckboxMarker(line, wasCompleted ? " " : defaultCompleteMarker);
    if (trackCompletionDate) {
      next = wasCompleted
        ? next.replace(/\s*✅\s*\d{4}-\d{2}-\d{2}/u, "")
        : `${next} ✅ ${today}`;
    }
    return next;
  });

  notifyEditResult(result, task, wasCompleted ? t("已重新打开") : t("任务已完成"));
}

export async function cancelTask(
  app: App,
  settings: TaskMatrixSettings,
  task: ParsedTask,
): Promise<void> {
  const cancelledMarker = settings.cancelledMarkers[0] ?? "-";
  const result = await editTaskLine(app, task, (line) => setCheckboxMarker(line, cancelledMarker));
  notifyEditResult(result, task, t("任务已取消"));
}

export async function startTask(app: App, task: ParsedTask): Promise<void> {
  const today = todayIso();
  const result = await editTaskLine(app, task, (line) => {
    const withStartDate = line.includes("🛫") ? line : `${line} 🛫 ${today}`;
    return withStartDate.toLowerCase().includes("#doing") ? withStartDate : `${withStartDate} #doing`;
  });
  notifyEditResult(result, task, t("任务已开始"));
}

export async function deleteTask(app: App, task: ParsedTask): Promise<void> {
  const result = await editTaskLine(app, task, () => null);
  notifyEditResult(result, task, t("任务已删除"));
}

export async function moveTaskToGtdState(
  app: App,
  settings: TaskMatrixSettings,
  task: ParsedTask,
  newState: GTDState,
  resolveConflict: ConflictResolver,
): Promise<void> {
  const today = todayIso();
  const updates: Partial<Pick<ParsedTask, "startDate" | "scheduledDate" | "dueDate">> = {};
  let tagToAdd = "";
  let removeTags: string[] = [];
  let shouldComplete = false;

  switch (newState) {
    case "Waiting":
      tagToAdd = "#waiting";
      removeTags = ["#doing", "#active", "#next"];
      break;
    case "In Progress":
      tagToAdd = "#doing";
      removeTags = ["#waiting", "#delegated", "#blocked"];
      updates.startDate = today;
      break;
    case "To be Started":
      removeTags = ["#doing", "#active", "#next", "#waiting", "#delegated", "#blocked"];
      break;
    case "Overdue":
      updates.dueDate = today;
      removeTags = ["#waiting", "#delegated", "#blocked"];
      break;
    case "Done":
      shouldComplete = true;
      removeTags = ["#doing", "#active", "#next", "#waiting", "#delegated", "#blocked"];
      break;
    case "Inbox":
      removeTags = ["#doing", "#active", "#next", "#waiting", "#delegated", "#blocked"];
      break;
  }

  const effectiveStart = updates.startDate ?? task.startDate;
  const effectiveDue = updates.dueDate ?? task.dueDate;
  let addConflictTag = false;

  // 只有「这次要塞进一个开始日」才需要问；纯挪列不必打扰用户
  if (hasDateConflict(effectiveStart, effectiveDue) && updates.startDate) {
    const choice = await resolveConflict(effectiveStart!, effectiveDue!);
    if (choice === "cancel") return;
    if (choice === "adjust-due") updates.dueDate = today;
    else addConflictTag = true;
  }

  if (
    task.gtdState === newState
    && updates.startDate === undefined
    && updates.dueDate === undefined
    && !shouldComplete
    && !addConflictTag
  ) {
    return;
  }

  const completionMarker = settings.completionMarkers[0] ?? "x";
  const result = await editTaskLine(app, task, (line) => {
    // 保留缩进，嵌套任务挪列后不会跳出父级
    const indent = getIndent(line);
    let body = line.slice(indent.length);

    for (const tag of removeTags) {
      body = body.replace(new RegExp(`\\s*${tag}\\b`, "giu"), "");
    }
    body = setConflictTag(body, false);

    if (tagToAdd && !body.toLowerCase().includes(tagToAdd.toLowerCase())) {
      body += ` ${tagToAdd}`;
    }
    if (addConflictTag) body = setConflictTag(body, true);
    if (shouldComplete) body = setCheckboxMarker(body, completionMarker);
    if (updates.startDate !== undefined) body = setDateField(body, "🛫", updates.startDate);
    if (updates.dueDate !== undefined) body = setDateField(body, "📅", updates.dueDate);

    return compactLine(`${indent}${body}`);
  });

  if (result === "updated") new Notice(t("已移动到「{state}」", { state: newState }));
}

export async function moveTaskToQuadrant(
  app: App,
  task: ParsedTask,
  newQuadrant: EisenhowerQuadrant,
): Promise<void> {
  if (task.quadrant === newQuadrant) return;

  const today = todayIso();
  let priority = Priority.None;
  let shouldAddDueDate = false;

  switch (newQuadrant) {
    case "Q1":
      priority = Priority.High;
      shouldAddDueDate = true;
      break;
    case "Q2":
      priority = Priority.High;
      break;
    case "Q3":
      priority = Priority.Low;
      shouldAddDueDate = true;
      break;
    case "Q4":
      priority = Priority.Lowest;
      break;
  }

  const result = await editTaskLine(app, task, (line) => {
    const indent = getIndent(line);
    let body = setPriority(line.slice(indent.length), priority);
    // 先无条件清掉旧的截止日再加，孤儿 📅 就永远不会堆积
    body = setDateField(body, "📅", shouldAddDueDate ? today : "");
    return compactLine(`${indent}${body}`);
  });

  if (result === "updated") new Notice(t("已移动到 {quadrant}", { quadrant: newQuadrant }));
}
