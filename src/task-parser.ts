import { ParsedTask, Priority, TaskStatus, GTDState, EisenhowerQuadrant } from "./types";

// Completed task IDs set for dependency checking
let completedTaskIds: Set<string> = new Set();

const PRIORITY_MARKERS: Array<[string, Priority]> = [
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

const TASK_PATTERN = /^[ \t]*[-*][ \t]\[( |x|X|\/|-)\][ \t]*(.*)$/u;

function extractValue(text: string, regex: RegExp): string | undefined {
  const match = text.match(regex);
  return match?.[1]?.trim();
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
    .replace(/[\u{1f4c5}\u{1f6eb}\u{23f3}\u{2705}\u{2795}\u{1f504}\u{1f194}\u{26d4}\u{1f53c}\u{23eb}\u{1f53d}\u{23ec}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getStatus(marker: string): TaskStatus {
  const normalized = marker.toLowerCase();
  if (normalized === "x") return "completed";
  if (normalized === "-") return "cancelled";
  if (normalized === "/") return "in-progress";
  return "open";
}

function isoDateOffset(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function computeGtdState(status: TaskStatus, description: string, startDate?: string, scheduledDate?: string, blocked?: boolean): GTDState {
  if (status === "completed" || status === "cancelled") return "Done";

  const desc = description.toLowerCase();
  if (blocked || desc.includes("#waiting") || desc.includes("#delegated") || desc.includes("#blocked")) {
    return "Waiting";
  }

  const today = isoDateOffset(0);
  if (
    status === "in-progress" ||
    desc.includes("#doing") ||
    desc.includes("#active") ||
    desc.includes("#next") ||
    (startDate && startDate <= today) ||
    (scheduledDate && scheduledDate <= today)
  ) {
    return "In Progress";
  }

  return "Inbox";
}

export function computeQuadrant(priority: Priority, dueDate?: string): EisenhowerQuadrant {
  const isImportant = priority === Priority.Highest || priority === Priority.High;
  const isUrgent = Boolean(dueDate && dueDate <= isoDateOffset(3));

  if (isImportant && isUrgent) return "Q1";
  if (isImportant && !isUrgent) return "Q2";
  if (!isImportant && isUrgent) return "Q3";
  return "Q4";
}

export function parseTaskLine(line: string, filePath: string, lineNumber: number): ParsedTask | null {
  const match = line.match(TASK_PATTERN);
  if (!match) return null;

  const status = getStatus(match[1]);
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
  const tags = Array.from(rawDescription.matchAll(/(^|\s)(#[\p{L}\p{N}_/-]+)/gu)).map((entry) => entry[2].toLowerCase());
  const description = cleanDescription(rawDescription);
  const blocked = Boolean(dependsOn);
  const gtdState = computeGtdState(status, description, startDate, scheduledDate, blocked);
  const quadrant = computeQuadrant(priority, dueDate);

  return {
    id: `${filePath}:${lineNumber}:${description}`,
    filePath,
    lineNumber,
    lineText: line,
    description,
    status,
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

function priorityRank(priority: Priority): number {
  switch (priority) {
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

export function sortTasks(tasks: ParsedTask[]): ParsedTask[] {
  return [...tasks].sort((a, b) => {
    const dueA = a.dueDate ?? "9999-99-99";
    const dueB = b.dueDate ?? "9999-99-99";
    if (dueA !== dueB) return dueA.localeCompare(dueB);

    const priorityDiff = priorityRank(b.priority) - priorityRank(a.priority);
    if (priorityDiff !== 0) return priorityDiff;

    if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath);
    return a.lineNumber - b.lineNumber;
  });
}
