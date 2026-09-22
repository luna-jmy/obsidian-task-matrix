import {
  ParsedTask,
  Priority,
  TaskStatusDisplay,
  GTDState,
  EisenhowerQuadrant,
  TaskMatrixSettings,
} from "../types";
import { isoDateOffset, todayIso } from "../utils/date";

const PRIORITY_MARKERS: Array<[string, Priority]> = [
  ["🔺", Priority.Critical],
  ["⏫", Priority.Highest],
  ["🔼", Priority.High],
  ["🔽", Priority.Low],
  ["⏬", Priority.Lowest],
];

const FIELD_PATTERNS = {
  dueDate: /\ud83d\udcc5\s*(\d{4}-\d{2}-\d{2})/u,
  startDate: /\ud83d\udeeb\ufe0f?\s*(\d{4}-\d{2}-\d{2})/u,
  scheduledDate: /\u23f3\s*(\d{4}-\d{2}-\d{2})/u,
  doneDate: /\u2705\s*(\d{4}-\d{2}-\d{2})/u,
  createdDate: /\u2795\s*(\d{4}-\d{2}-\d{2})/u,
  recurrence: /\ud83d\udd04\s*([^\n]+)/u,
  taskIdIcon: /\ud83c\udd94\s*([^\s#]+)/u,
  taskIdField: /\bid::\s*([^\s#]+)/iu,
  dependsIcon: /\u26d4\s*([^\s#]+)/u,
  dependsField: /\bdependsOn::\s*([^\s#]+)/iu,
};

// Task pattern: - [ ] or * [ ] followed by content
// Excludes Dataview inline fields like [field::value] by rejecting ::
const TASK_PATTERN = /^[ \t]*[-*][ \t]\[([^\]]*)\][ \t]+(.*)$/u;

/**
 * Source of the inline field tokens this plugin writes into a task line.
 * Exported so writers can locate the same tokens without re-declaring the list.
 */
export const INLINE_FIELD_TOKEN_SOURCE =
  "📅\\s*\\d{4}-\\d{2}-\\d{2}|🛫\\s*\\d{4}-\\d{2}-\\d{2}|⏳\\s*\\d{4}-\\d{2}-\\d{2}|✅\\s*\\d{4}-\\d{2}-\\d{2}|➕\\s*\\d{4}-\\d{2}-\\d{2}|🆔\\s*\\S+|⛔\\s*\\S+|🔺|⏫|🔼|🔽|⏬|#[\\p{L}\\p{N}_/-]+|\\w+::\\s*\\S+";

/**
 * GTD 列判定的可配置部分。
 *
 * 只包含**标签词汇**：这两套清单既是判定依据，也是拖拽写入的词汇（拖到「等待中」
 * 写的就是 `waitingTags[0]`）。同一份词表才不会出现「拖进去写了个没人认的标签、
 * 任务立刻又跳回原来的列」。
 *
 * 判定链条本身是固定的（见 `computeGtdState`），不设开关：例如「开始日已过算进行中」
 * 若做成开关，关掉后拖到收件箱的任务会因为开始日还在过去而落不回收件箱 ——
 * 那是功能坏掉，不是参数。
 */
export interface GtdRules {
  waitingTags: readonly string[];
  inProgressTags: readonly string[];
}

export const DEFAULT_GTD_RULES: GtdRules = {
  waitingTags: ["#waiting", "#delegated", "#blocked"],
  inProgressTags: ["#doing", "#active", "#started", "#next"],
};

/** 从设置里取出当前生效的规则；清单被清空时退回默认，以免一列都判不出来 */
export function gtdRulesOf(
  settings: Pick<TaskMatrixSettings, "gtdWaitingTags" | "gtdInProgressTags">,
): GtdRules {
  return {
    waitingTags:
      settings.gtdWaitingTags.length > 0 ? settings.gtdWaitingTags : DEFAULT_GTD_RULES.waitingTags,
    inProgressTags:
      settings.gtdInProgressTags.length > 0
        ? settings.gtdInProgressTags
        : DEFAULT_GTD_RULES.inProgressTags,
  };
}

/**
 * 描述里是否出现清单中的某个标签。
 *
 * **整词匹配**（`#waiting` 不命中 `#waiting-for-review`）：标签的边界与解析器取标签的
 * 口径一致 —— 解析出来的 `#waiting-for-review` 本来就是另一个标签，要认它就在设置里
 * 把它加进清单。条目里的 `#` 可省略。
 */
export function matchesAnyTag(description: string, tags: readonly string[]): boolean {
  return tags.some((tag) => {
    const name = tag.trim().replace(/^#+/u, "");
    if (name.length === 0) return false;
    const pattern = new RegExp(`(?:^|\\s)#${escapeRegExp(name)}(?![\\p{L}\\p{N}_/-])`, "iu");
    return pattern.test(description);
  });
}

/** 正则字面量转义（标签名里可能出现 `+`、`.` 这类字符） */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function extractValue(text: string, regex: RegExp): string | undefined {
  const match = text.match(regex);
  return match?.[1]?.trim();
}

/**
 * 标签识别：行首或空白之后的 `#…`。
 *
 * 前面必须是空白，否则 `issue#123` 这种写法会被误判成标签（与 task-writer 里
 * 剥标签的规则同源）。导出给编辑器用：那里要在描述正文里找出标签，
 * 把「正文」与「标签」在写回行时分成两半。
 */
const TAG_PATTERN = /(^|\s)(#[\p{L}\p{N}_/-]+)/gu;

/** 文本里出现过的标签（小写、带 `#`） */
export function extractTags(text: string): string[] {
  return Array.from(text.matchAll(TAG_PATTERN)).map((entry) => entry[2].toLowerCase());
}

/** 从文本里剥掉标签，只留正文（前导空白保留，收尾由调用方 trim） */
export function stripTags(text: string): string {
  return text.replace(TAG_PATTERN, "$1").replace(/[ \t]+/gu, " ").trim();
}

/** 单个标签在文本里的出现（前面必须是行首或空白，与取标签同一条边界规则） */
function tagPatternOf(tag: string): RegExp {
  const name = tag.trim().replace(/^#+/u, "").toLowerCase();
  return new RegExp(`(^|\\s)#${escapeRegExp(name)}(?![\\p{L}\\p{N}_/-])`, "giu");
}

/**
 * 往正文里加一个标签（编辑器里的 chips 用）。
 *
 * 已经在了就原样返回 —— 重复点不该在正文里堆出两个 `#工作`。
 */
export function addTagToText(text: string, tag: string): string {
  const name = tag.trim().replace(/^#+/u, "").toLowerCase();
  if (name.length === 0) return text;
  if (extractTags(text).some((entry) => entry.replace(/^#+/u, "") === name)) return text;
  const trimmed = text.trimEnd();
  return trimmed.length === 0 ? `#${name}` : `${trimmed} #${name}`;
}

/** 从正文里去掉一个标签（连它前面的分隔空白一起吃掉，避免留下双空格） */
export function removeTagFromText(text: string, tag: string): string {
  return text.replace(tagPatternOf(tag), "").replace(/\s+/gu, " ").trim();
}

function cleanDescription(raw: string): string {
  return raw
    .replace(FIELD_PATTERNS.dueDate, "")
    .replace(FIELD_PATTERNS.startDate, "")
    .replace(FIELD_PATTERNS.scheduledDate, "")
    .replace(FIELD_PATTERNS.doneDate, "")
    .replace(FIELD_PATTERNS.createdDate, "")
    .replace(FIELD_PATTERNS.recurrence, "")
    .replace(FIELD_PATTERNS.taskIdIcon, "")
    .replace(FIELD_PATTERNS.taskIdField, "")
    .replace(FIELD_PATTERNS.dependsIcon, "")
    .replace(FIELD_PATTERNS.dependsField, "")
    .replace(/[\u{1f4c5}\u{1f6eb}\u{23f3}\u{2705}\u{2795}\u{1f504}\u{1f194}\u{26d4}\u{1f53c}\u{23eb}\u{1f53d}\u{23ec}\u{1f53a}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Check if checkbox content means completed based on settings
function isCompletedCheckbox(checkboxContent: string, completionMarkers: string[]): boolean {
  const trimmed = checkboxContent.trim();
  return completionMarkers.includes(trimmed);
}

// Check if checkbox content means cancelled based on settings
function isCancelledCheckbox(checkboxContent: string, cancelledMarkers: string[]): boolean {
  const trimmed = checkboxContent.trim();
  return cancelledMarkers.includes(trimmed);
}

// Determine display status based on checkbox and dates
export function computeDisplayStatus(
  checkboxContent: string,
  completionMarkers: string[],
  cancelledMarkers: string[],
  dueDate?: string,
  startDate?: string,
): TaskStatusDisplay {
  // First check if checkbox indicates completion
  if (isCompletedCheckbox(checkboxContent, completionMarkers)) {
    return "completed";
  }

  // Check if checkbox indicates cancelled
  if (isCancelledCheckbox(checkboxContent, cancelledMarkers)) {
    return "cancelled";
  }

  const today = todayIso();

  // Check if overdue (past due date)
  if (dueDate && dueDate < today) {
    return "overdue";
  }

  // Check if has start date in the future
  if (startDate && startDate > today) {
    return "to-be-started";
  }

  // Open - no due date, or start date is today or past
  return "open";
}

export function computeGtdState(
  displayStatus: TaskStatusDisplay,
  checkboxContent: string,
  description: string,
  dueDate?: string,
  startDate?: string,
  blocked?: boolean,
  rules: GtdRules = DEFAULT_GTD_RULES,
): GTDState {
  // Completed or cancelled both go to Done
  if (displayStatus === "completed" || displayStatus === "cancelled") {
    return "Done";
  }

  const today = todayIso();

  // 等待中优先于其他一切：被依赖阻塞、或带等待类标签
  if (blocked || matchesAnyTag(description, rules.waitingTags)) {
    return "Waiting";
  }

  if (matchesAnyTag(description, rules.inProgressTags)) {
    return "In Progress";
  }

  // Check for overdue
  if (dueDate && dueDate < today) {
    return "Overdue";
  }

  // 开始日决定「已经开工 / 还没开工」：已过 = 进行中，未来 = 待开始
  // （开始日正好是今天的落回收件箱：今天开工的算「要做」，不算「在做」）
  if (startDate) {
    if (startDate < today) return "In Progress";
    if (startDate > today) return "To be Started";
  }

  return "Inbox";
}

export function computeQuadrant(
  priority: Priority,
  dueDate: string | undefined,
  urgentDaysRange: number,
): EisenhowerQuadrant {
  const isImportant = priority === Priority.Critical || priority === Priority.Highest || priority === Priority.High;
  // Urgent if overdue or due within urgentDaysRange days (default 1 = today only)
  const urgentDeadline = isoDateOffset(urgentDaysRange - 1);
  const isUrgent = Boolean(dueDate && dueDate <= urgentDeadline);

  if (isImportant && isUrgent) return "Q1";
  if (isImportant && !isUrgent) return "Q2";
  if (!isImportant && isUrgent) return "Q3";
  return "Q4";
}

export function priorityRank(priority: Priority): number {
  switch (priority) {
    case Priority.Critical:
      return 6;
    case Priority.Highest:
      return 5;
    case Priority.High:
      return 4;
    case Priority.Medium:
      return 3;
    case Priority.None:
      return 2;
    case Priority.Low:
      return 1;
    case Priority.Lowest:
      return 0;
  }
}

export function parseTaskLine(
  line: string,
  filePath: string,
  lineNumber: number,
  settings: TaskMatrixSettings,
): ParsedTask | null {
  const match = line.match(TASK_PATTERN);
  if (!match) return null;

  const checkboxContent = match[1];
  // Exclude Dataview inline fields like [field::value]
  if (checkboxContent.includes("::")) return null;

  const rawDescription = match[2];

  const priority = PRIORITY_MARKERS.find(([marker]) => rawDescription.includes(marker))?.[1] ?? Priority.None;
  const dueDate = extractValue(rawDescription, FIELD_PATTERNS.dueDate);
  const startDate = extractValue(rawDescription, FIELD_PATTERNS.startDate);
  const scheduledDate = extractValue(rawDescription, FIELD_PATTERNS.scheduledDate);
  const doneDate = extractValue(rawDescription, FIELD_PATTERNS.doneDate);
  const createdDate = extractValue(rawDescription, FIELD_PATTERNS.createdDate);
  const recurrence = extractValue(rawDescription, FIELD_PATTERNS.recurrence);
  const taskId = extractValue(rawDescription, FIELD_PATTERNS.taskIdIcon) ?? extractValue(rawDescription, FIELD_PATTERNS.taskIdField);
  const dependsOn = extractValue(rawDescription, FIELD_PATTERNS.dependsIcon) ?? extractValue(rawDescription, FIELD_PATTERNS.dependsField);
  const tags = extractTags(rawDescription);
  const description = cleanDescription(rawDescription);
  const blocked = Boolean(dependsOn);

  const displayStatus = computeDisplayStatus(checkboxContent, settings.completionMarkers, settings.cancelledMarkers, dueDate, startDate);
  const gtdState = computeGtdState(
    displayStatus,
    checkboxContent,
    description,
    dueDate,
    startDate,
    blocked,
    gtdRulesOf(settings),
  );
  const quadrant = computeQuadrant(priority, dueDate, settings.urgentDaysRange);

  return {
    id: `${filePath}:${lineNumber}:${description}`,
    filePath,
    lineNumber,
    lineText: line,
    description,
    checkboxStatus: checkboxContent,
    displayStatus,
    priority,
    dueDate,
    startDate,
    scheduledDate,
    doneDate,
    createdDate,
    recurrence,
    taskId,
    dependsOn,
    tags,
    blocked,
    gtdState,
    quadrant,
  };
}

/** Generate a short unique ID */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8);
}
