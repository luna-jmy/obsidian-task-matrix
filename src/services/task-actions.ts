import { App, Notice } from "obsidian";
import { t } from "../i18n";
import { gtdRulesOf, matchesAnyTag } from "../parser/task-parser";
import {
  compactLine,
  editTaskLine,
  EditResult,
  getDateField,
  getIndent,
  removeTagToken,
  setCheckboxMarker,
  setConflictTag,
  setDateField,
  setPriority,
} from "../parser/task-writer";
import { GTDState, EisenhowerQuadrant, ParsedTask, Priority, TaskMatrixSettings } from "../types";
import { isoDateOffset, todayIso } from "../utils/date";

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

export async function startTask(
  app: App,
  settings: TaskMatrixSettings,
  task: ParsedTask,
): Promise<void> {
  const today = todayIso();
  // 与拖到「进行中」写同一个标签：两处入口写的不该是两个词
  const tag = gtdRulesOf(settings).inProgressTags[0] ?? "#doing";
  const result = await editTaskLine(app, task, (line) => {
    const withStartDate = line.includes("🛫") ? line : `${line} 🛫 ${today}`;
    return matchesAnyTag(withStartDate, [tag]) ? withStartDate : `${withStartDate} ${tag}`;
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
  const rules = gtdRulesOf(settings);
  /** 两套状态标签的全集：离开一列时要把另一列的词也摘掉 */
  const allStateTags = [...rules.waitingTags, ...rules.inProgressTags];
  const updates: Partial<Pick<ParsedTask, "startDate" | "scheduledDate" | "dueDate">> = {};
  let tagToAdd = "";
  let removeTags: string[] = [];
  let shouldComplete = false;

  /*
   * 写入的标签取自设置里的清单第一个（判定与写入共用同一份词表）：
   * 若写入一个判定不认识的标签，任务落盘后会被立刻算到别的列去 ——
   * 那正是「拖到收件箱却出现在进行中」这类问题的另一种形态。
   */
  switch (newState) {
    case "Waiting":
      tagToAdd = rules.waitingTags[0] ?? "";
      removeTags = [...rules.inProgressTags];
      break;
    case "In Progress":
      tagToAdd = rules.inProgressTags[0] ?? "";
      removeTags = [...rules.waitingTags];
      // 固定规则：进行中的任务本来就该有开始日，补今天
      updates.startDate = today;
      break;
    case "To be Started":
      removeTags = [...allStateTags];
      break;
    case "Overdue":
      updates.dueDate = today;
      removeTags = [...rules.waitingTags];
      break;
    case "Done":
      shouldComplete = true;
      removeTags = [...allStateTags];
      break;
    case "Inbox":
      removeTags = [...allStateTags];
      /*
       * 固定规则：收件箱是「还没开工」，而「开始日已过 = 进行中」是判定链里的一条。
       * 两者必须一起做 —— 不清掉开始日的话，拖进收件箱的任务会立刻被判定回进行中，
       * 看起来就是「拖了没反应」。
       */
      updates.startDate = "";
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

    // 整词删除：`#waiting` 不会把 `#waiting-for-review` 啃成 `-for-review`
    for (const tag of removeTags) {
      body = removeTagToken(body, tag);
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
  settings: TaskMatrixSettings,
  task: ParsedTask,
  newQuadrant: EisenhowerQuadrant,
): Promise<void> {
  if (task.quadrant === newQuadrant) return;

  const today = todayIso();
  /*
   * 象限由两轴决定，两轴都得按「落进去」的方向写，没有可选项：
   * - 重要性 = 优先级标记（写哪个由设置决定，且只能选所在那一侧的档位）；
   * - 紧急没有任务标记，只由「截止日落在不在紧急窗口内」决定 —— 所以紧急那一侧
   *   补今天的截止日，不紧急那一侧清掉会造成紧急的日期。
   * 少做任何一条，任务都会弹回另一格，那不是参数而是功能坏掉。
   */
  const priority = settings.quadrantPriorities[newQuadrant] ?? Priority.None;
  const urgentSide = newQuadrant === "Q1" || newQuadrant === "Q3";
  const urgentDeadline = isoDateOffset(settings.urgentDaysRange - 1);

  const result = await editTaskLine(app, task, (line) => {
    const indent = getIndent(line);
    let body = setPriority(line.slice(indent.length), priority);

    // 以行上的当前日期为准判断，不用点击那一刻的快照
    const currentDue = getDateField(body, "📅");
    if (urgentSide) {
      body = setDateField(body, "📅", today);
    } else {
      // 只清掉「会让它落进紧急窗口」的日期：窗口外的日期是用户自己排的，不该顺手删
      if (currentDue !== undefined && currentDue <= urgentDeadline) {
        body = setDateField(body, "📅", "");
      }
    }
    return compactLine(`${indent}${body}`);
  });

  if (result === "updated") new Notice(t("已移动到 {quadrant}", { quadrant: newQuadrant }));
}
