/* eslint-disable */
this.require = require;
this.exports = exports;
this.module = module;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => TaskMatrixPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/types.ts
var DEFAULT_SETTINGS = {
  scanFolders: [],
  excludeFolders: [],
  defaultView: "eisenhower",
  includeCompleted: true,
  openLocation: "sidebar",
  completionMarkers: ["x", "X"],
  cancelledMarkers: ["-"],
  listGroupByFolder: false,
  listGroupByFolderDepth: 1,
  newTaskTargetPath: "",
  newTaskTargetHeading: "",
  trackCompletionDate: false,
  urgentDaysRange: 1
};

// src/task-parser.ts
var PRIORITY_MARKERS = [
  ["\u{1F53A}", "critical" /* Critical */],
  ["\u23EB", "highest" /* Highest */],
  ["\u{1F53C}", "high" /* High */],
  ["\u{1F53D}", "low" /* Low */],
  ["\u23EC", "lowest" /* Lowest */]
];
var FIELD_PATTERNS = {
  dueDate: /\ud83d\udcc5\s*(\d{4}-\d{2}-\d{2})/u,
  startDate: /\ud83d\udeeb\ufe0f?\s*(\d{4}-\d{2}-\d{2})/u,
  scheduledDate: /\u23f3\s*(\d{4}-\d{2}-\d{2})/u,
  doneDate: /\u2705\s*(\d{4}-\d{2}-\d{2})/u,
  createdDate: /\u2795\s*(\d{4}-\d{2}-\d{2})/u,
  recurrence: /\ud83d\udd04\s*([^\n]+)/u,
  taskIdIcon: /\ud83c\udd94\s*([^\s#]+)/u,
  taskIdField: /\bid::\s*([^\s#]+)/iu,
  dependsIcon: /\u26d4\s*([^\s#]+)/u,
  dependsField: /\bdependsOn::\s*([^\s#]+)/iu
};
var TASK_PATTERN = /^[ \t]*[-*][ \t]\[([^\]]*)\][ \t]+(.*)$/u;
function extractValue(text, regex) {
  const match = text.match(regex);
  return match?.[1]?.trim();
}
function cleanDescription(raw) {
  return raw.replace(FIELD_PATTERNS.dueDate, "").replace(FIELD_PATTERNS.startDate, "").replace(FIELD_PATTERNS.scheduledDate, "").replace(FIELD_PATTERNS.doneDate, "").replace(FIELD_PATTERNS.createdDate, "").replace(FIELD_PATTERNS.recurrence, "").replace(FIELD_PATTERNS.taskIdIcon, "").replace(FIELD_PATTERNS.taskIdField, "").replace(FIELD_PATTERNS.dependsIcon, "").replace(FIELD_PATTERNS.dependsField, "").replace(/[\u{1f4c5}\u{1f6eb}\u{23f3}\u{2705}\u{2795}\u{1f504}\u{1f194}\u{26d4}\u{1f53c}\u{23eb}\u{1f53d}\u{23ec}\u{1f53a}]/gu, "").replace(/\s+/g, " ").trim();
}
function isoDateOffset(days) {
  const date = /* @__PURE__ */ new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getToday() {
  return isoDateOffset(0);
}
function isCompletedCheckbox(checkboxContent, completionMarkers) {
  const trimmed = checkboxContent.trim();
  return completionMarkers.includes(trimmed);
}
function isCancelledCheckbox(checkboxContent, cancelledMarkers) {
  const trimmed = checkboxContent.trim();
  return cancelledMarkers.includes(trimmed);
}
function computeDisplayStatus(checkboxContent, completionMarkers, cancelledMarkers, dueDate, startDate) {
  if (isCompletedCheckbox(checkboxContent, completionMarkers)) {
    return "completed";
  }
  if (isCancelledCheckbox(checkboxContent, cancelledMarkers)) {
    return "cancelled";
  }
  const today = getToday();
  if (dueDate && dueDate < today) {
    return "overdue";
  }
  if (startDate && startDate > today) {
    return "to-be-started";
  }
  return "open";
}
function computeGtdState(displayStatus, checkboxContent, description, dueDate, startDate, blocked) {
  if (displayStatus === "completed" || displayStatus === "cancelled") {
    return "Done";
  }
  const desc = description.toLowerCase();
  const today = getToday();
  if (blocked || desc.includes("#waiting") || desc.includes("#delegated") || desc.includes("#blocked")) {
    return "Waiting";
  }
  if (desc.includes("#started") || desc.includes("#doing") || desc.includes("#active")) {
    return "In Progress";
  }
  if (dueDate && dueDate < today) {
    return "Overdue";
  }
  if (startDate) {
    if (startDate < today) {
      return "In Progress";
    } else if (startDate > today) {
      return "To be Started";
    }
  }
  if (desc.includes("#doing") || desc.includes("#active") || desc.includes("#next")) {
    return "In Progress";
  }
  return "Inbox";
}
function computeQuadrant(priority, dueDate, urgentDaysRange) {
  const isImportant = priority === "critical" /* Critical */ || priority === "highest" /* Highest */ || priority === "high" /* High */;
  const urgentDeadline = isoDateOffset(urgentDaysRange - 1);
  const isUrgent = Boolean(dueDate && dueDate <= urgentDeadline);
  if (isImportant && isUrgent) return "Q1";
  if (isImportant && !isUrgent) return "Q2";
  if (!isImportant && isUrgent) return "Q3";
  return "Q4";
}
function parseTaskLine(line, filePath, lineNumber, settings) {
  const match = line.match(TASK_PATTERN);
  if (!match) return null;
  const checkboxContent = match[1];
  if (checkboxContent.includes("::")) return null;
  const rawDescription = match[2];
  const priority = PRIORITY_MARKERS.find(([marker]) => rawDescription.includes(marker))?.[1] ?? "none" /* None */;
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
  const displayStatus = computeDisplayStatus(checkboxContent, settings.completionMarkers, settings.cancelledMarkers, dueDate, startDate);
  const gtdState = computeGtdState(displayStatus, checkboxContent, description, dueDate, startDate, blocked);
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
    quadrant
  };
}
function priorityRank(priority) {
  switch (priority) {
    case "critical" /* Critical */:
      return 6;
    case "highest" /* Highest */:
      return 5;
    case "high" /* High */:
      return 4;
    case "medium" /* Medium */:
      return 3;
    case "none" /* None */:
      return 2;
    case "low" /* Low */:
      return 1;
    case "lowest" /* Lowest */:
      return 0;
  }
}
function sortTasks(tasks) {
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
function generateShortId() {
  return Math.random().toString(36).substring(2, 8);
}

// src/main.ts
var VIEW_TYPE_TASK_MATRIX = "task-matrix-view";
var ICONS = {
  refresh: "\u21BB",
  list: "List",
  gtd: "GTD",
  eisenhower: "Matrix"
};
var TaskMatrixPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.tasks = [];
    this.refreshTimer = null;
  }
  async onload() {
    await this.loadSettings();
    await this.refreshTasks();
    this.registerView(
      VIEW_TYPE_TASK_MATRIX,
      (leaf) => new TaskMatrixView(leaf, this)
    );
    this.addRibbonIcon("kanban-square", "Open Task Matrix", async () => {
      await this.activateView();
    });
    this.addCommand({
      id: "open-task-matrix",
      name: "Open task matrix",
      callback: async () => {
        await this.activateView();
      }
    });
    this.addCommand({
      id: "refresh-task-matrix",
      name: "Refresh task matrix",
      callback: async () => {
        await this.refreshTasks(true);
      }
    });
    this.registerEvent(this.app.vault.on("create", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("modify", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("delete", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("rename", () => this.scheduleRefresh()));
    this.addSettingTab(new TaskMatrixSettingTab(this.app, this));
    this.addStyles();
  }
  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_TASK_MATRIX);
    this.removeStyles();
  }
  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
  }
  async saveSettings() {
    await this.saveData(this.settings);
    await this.refreshOpenViews();
  }
  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_MATRIX)[0];
    if (!leaf) {
      if (this.settings.openLocation === "tab") {
        leaf = this.app.workspace.getLeaf(true);
      } else {
        leaf = this.app.workspace.getRightLeaf(false);
      }
      if (leaf) {
        await leaf.setViewState({ type: VIEW_TYPE_TASK_MATRIX, active: true });
      }
    }
    if (leaf) {
      this.app.workspace.revealLeaf(leaf);
    }
  }
  scheduleRefresh() {
    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = window.setTimeout(() => {
      void this.refreshTasks();
      this.refreshTimer = null;
    }, 500);
  }
  async refreshTasks(showNotice = false) {
    this.tasks = await this.collectTasks();
    await this.refreshOpenViews();
    if (showNotice) {
      new import_obsidian.Notice(`Task Matrix refreshed: ${this.tasks.length} tasks`);
    }
  }
  async refreshOpenViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_MATRIX)) {
      const view = leaf.view;
      if (view instanceof TaskMatrixView) {
        await view.render();
      }
    }
  }
  shouldIncludeFile(file) {
    for (const excludeFolder of this.settings.excludeFolders) {
      const trimmed = excludeFolder.trim().replace(/^\/+|\/+$/g, "");
      if (trimmed && (file.path === trimmed || file.path.startsWith(`${trimmed}/`))) {
        return false;
      }
    }
    if (this.settings.scanFolders.length === 0) return true;
    for (const scanFolder of this.settings.scanFolders) {
      const trimmed = scanFolder.trim().replace(/^\/+|\/+$/g, "");
      if (trimmed && (file.path === trimmed || file.path.startsWith(`${trimmed}/`))) {
        return true;
      }
    }
    return false;
  }
  async collectTasks() {
    const tasks = [];
    const files = this.app.vault.getMarkdownFiles().filter((file) => this.shouldIncludeFile(file));
    for (const file of files) {
      const content = await this.app.vault.cachedRead(file);
      const lines = content.split(/\r?\n/u);
      const fileCache = this.app.metadataCache.getFileCache(file);
      const codeSections = fileCache?.sections?.filter((s) => s.type === "code") ?? [];
      const codeBlockLines = /* @__PURE__ */ new Set();
      for (const section of codeSections) {
        const startLine = section.position.start.line + 1;
        const endLine = section.position.end.line + 1;
        for (let i = startLine; i <= endLine; i++) {
          codeBlockLines.add(i);
        }
      }
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const lineNumber = index + 1;
        if (codeBlockLines.has(lineNumber)) continue;
        const parsed = parseTaskLine(line, file.path, index + 1, this.settings);
        if (!parsed) continue;
        if (!this.settings.includeCompleted && (parsed.displayStatus === "completed" || parsed.displayStatus === "cancelled")) {
          continue;
        }
        tasks.push(parsed);
      }
    }
    const completedIds = new Set(tasks.filter((t) => t.displayStatus === "completed").map((t) => t.taskId).filter(Boolean));
    for (const task of tasks) {
      if (task.dependsOn) {
        task.blocked = !completedIds.has(task.dependsOn);
        task.gtdState = computeGtdState(task.displayStatus, task.checkboxStatus, task.description, task.dueDate, task.startDate, task.blocked);
      }
    }
    return sortTasks(tasks);
  }
  // Task operations
  async toggleTaskStatus(task) {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof import_obsidian.TFile)) {
      new import_obsidian.Notice(`File not found: ${task.filePath}`);
      return;
    }
    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) {
      new import_obsidian.Notice(`Line ${task.lineNumber} not found in file`);
      return;
    }
    const line = lines[lineIndex];
    const isCompleted = this.settings.completionMarkers.includes(task.checkboxStatus.trim());
    const defaultCompleteMarker = this.settings.completionMarkers[0] ?? "x";
    const newMarker = isCompleted ? " " : defaultCompleteMarker;
    let newLine = line.replace(/\[[^\]]*\]/u, `[${newMarker}]`);
    if (!isCompleted && this.settings.trackCompletionDate) {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      newLine = `${newLine} \u2705 ${today}`;
    } else if (isCompleted && this.settings.trackCompletionDate) {
      newLine = newLine.replace(/\s*✅\s*\d{4}-\d{2}-\d{2}/u, "");
    }
    if (newLine !== line) {
      lines[lineIndex] = newLine;
      await this.app.vault.modify(file, lines.join("\n"));
      new import_obsidian.Notice(isCompleted ? "Task reopened" : "Task completed");
    }
  }
  async cancelTask(task) {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof import_obsidian.TFile)) {
      new import_obsidian.Notice(`File not found: ${task.filePath}`);
      return;
    }
    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) {
      new import_obsidian.Notice(`Line ${task.lineNumber} not found in file`);
      return;
    }
    const line = lines[lineIndex];
    const defaultCancelledMarker = this.settings.cancelledMarkers[0] ?? "-";
    const newLine = line.replace(/\[[^\]]*\]/u, `[${defaultCancelledMarker}]`);
    if (newLine !== line) {
      lines[lineIndex] = newLine;
      await this.app.vault.modify(file, lines.join("\n"));
      new import_obsidian.Notice("Task cancelled");
    }
  }
  async startTask(task) {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof import_obsidian.TFile)) {
      new import_obsidian.Notice(`File not found: ${task.filePath}`);
      return;
    }
    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) {
      new import_obsidian.Notice(`Line ${task.lineNumber} not found in file`);
      return;
    }
    const line = lines[lineIndex];
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    let newLine = line;
    if (!line.includes("\u{1F6EB}")) {
      newLine = `${line} \u{1F6EB} ${today}`;
    }
    if (!line.toLowerCase().includes("#doing")) {
      newLine = `${newLine} #doing`;
    }
    if (newLine !== line) {
      lines[lineIndex] = newLine;
      await this.app.vault.modify(file, lines.join("\n"));
      new import_obsidian.Notice("Task started");
    }
  }
  async deleteTask(task) {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof import_obsidian.TFile)) {
      new import_obsidian.Notice(`File not found: ${task.filePath}`);
      return;
    }
    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) {
      new import_obsidian.Notice(`Line ${task.lineNumber} not found in file`);
      return;
    }
    lines.splice(lineIndex, 1);
    await this.app.vault.modify(file, lines.join("\n"));
    new import_obsidian.Notice("Task deleted");
  }
  async updateTaskLine(task, newLine) {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof import_obsidian.TFile)) {
      new import_obsidian.Notice(`File not found: ${task.filePath}`);
      return;
    }
    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) {
      new import_obsidian.Notice(`Line ${task.lineNumber} not found in file`);
      return;
    }
    lines[lineIndex] = newLine;
    await this.app.vault.modify(file, lines.join("\n"));
  }
  // Check if there's a date conflict (start date > due date)
  checkDateConflict(startDate, dueDate) {
    if (!startDate || !dueDate) return false;
    return startDate > dueDate;
  }
  // Drag and drop: move task to different state/quadrant
  async moveTaskToGTDState(task, newState) {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    let updates = {};
    let tagToAdd = "";
    let removeTags = [];
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
    const effectiveStartDate = updates.startDate ?? task.startDate;
    const effectiveDueDate = updates.dueDate ?? task.dueDate;
    const hasDateConflict = this.checkDateConflict(effectiveStartDate, effectiveDueDate);
    if (hasDateConflict && updates.startDate) {
      new DateConflictModal(
        this.app,
        effectiveStartDate,
        effectiveDueDate,
        async (result) => {
          if (result.adjustDueDate) {
            updates.dueDate = today;
            new import_obsidian.Notice("Due date adjusted to today");
          } else if (result.addConflictTag) {
            new import_obsidian.Notice("Date conflict tag added");
          } else {
            return;
          }
          await this.applyGtdStateChanges(task, newState, updates, tagToAdd, removeTags, shouldComplete, result.addConflictTag);
        }
      ).open();
      return;
    }
    const noChangesNeeded = task.gtdState === newState && !updates.startDate && !updates.dueDate && !shouldComplete;
    if (noChangesNeeded) return;
    await this.applyGtdStateChanges(task, newState, updates, tagToAdd, removeTags, shouldComplete, false);
  }
  async applyGtdStateChanges(task, newState, updates, tagToAdd, removeTags, shouldComplete, addConflictTag) {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof import_obsidian.TFile)) return;
    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) return;
    let line = lines[lineIndex];
    for (const tag of removeTags) {
      const tagRegex = new RegExp(`\\s*${tag}\\b`, "gi");
      line = line.replace(tagRegex, "");
    }
    line = line.replace(/\s*#due-date-conflict\b/gi, "");
    line = line.trim();
    if (tagToAdd && !line.toLowerCase().includes(tagToAdd.toLowerCase())) {
      line += ` ${tagToAdd}`;
    }
    if (addConflictTag && !line.toLowerCase().includes("#due-date-conflict")) {
      line += " #due-date-conflict";
    }
    if (shouldComplete) {
      const defaultCompleteMarker = this.settings.completionMarkers[0] ?? "x";
      line = line.replace(/\[[^\]]*\]/u, `[${defaultCompleteMarker}]`);
    }
    if (updates.startDate !== void 0) {
      line = line.replace(/\s*🛫(?:\s*\d{4}-\d{2}-\d{2})?/gu, "");
      if (updates.startDate) {
        line += ` \u{1F6EB} ${updates.startDate}`;
      }
    }
    if (updates.dueDate !== void 0) {
      line = line.replace(/\s*📅(?:\s*\d{4}-\d{2}-\d{2})?/gu, "");
      if (updates.dueDate) {
        line += ` \u{1F4C5} ${updates.dueDate}`;
      }
    }
    lines[lineIndex] = line;
    await this.app.vault.modify(file, lines.join("\n"));
    new import_obsidian.Notice(`Moved to ${newState}`);
  }
  async moveTaskToQuadrant(task, newQuadrant) {
    if (task.quadrant === newQuadrant) return;
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof import_obsidian.TFile)) return;
    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) return;
    let line = lines[lineIndex];
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    let priorityMarker = "";
    let shouldAddDueDate = false;
    let shouldClearDueDate = false;
    switch (newQuadrant) {
      case "Q1":
        priorityMarker = "\u{1F53C}";
        shouldAddDueDate = true;
        break;
      case "Q2":
        priorityMarker = "\u{1F53C}";
        shouldClearDueDate = true;
        break;
      case "Q3":
        priorityMarker = "\u{1F53D}";
        shouldAddDueDate = true;
        break;
      case "Q4":
        priorityMarker = "\u23EC";
        shouldClearDueDate = true;
        break;
    }
    line = line.replace(/⏫|🔼|🔽|⏬/gu, "").trim();
    if (priorityMarker) {
      const checkboxMatch = line.match(/^(\s*[-*]\s*\[[ xX/-]\]\s*)/);
      if (checkboxMatch) {
        line = line.replace(checkboxMatch[1], checkboxMatch[1] + priorityMarker + " ");
      }
    }
    line = line.replace(/\s*📅(?:\s*\d{4}-\d{2}-\d{2})?/gu, "").trim();
    if (shouldAddDueDate) {
      line = line + ` \u{1F4C5} ${today}`;
    }
    lines[lineIndex] = line;
    await this.app.vault.modify(file, lines.join("\n"));
    new import_obsidian.Notice(`Moved to ${newQuadrant}`);
  }
  addStyles() {
    const styleEl = document.createElement("style");
    styleEl.id = "task-matrix-styles";
    styleEl.textContent = `
      .task-matrix-view {
        padding: 16px;
        height: 100%;
        overflow: auto;
      }
      .task-matrix-shell {
        max-width: 1400px;
        margin: 0 auto;
      }
      .task-matrix-header {
        margin-bottom: 16px;
      }
      .task-matrix-title-block {
        margin-bottom: 12px;
      }
      .task-matrix-kicker {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
        margin-bottom: 4px;
      }
      .task-matrix-title {
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 4px 0;
      }
      .task-matrix-subtitle {
        font-size: 13px;
        color: var(--text-muted);
        margin: 0;
      }
      .task-matrix-toolbar {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
        padding: 12px;
        background: var(--background-secondary);
        border-radius: 8px;
      }
      .task-matrix-search {
        flex: 1;
        min-width: 200px;
        padding: 6px 10px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        background: var(--background-primary);
        color: var(--text-normal);
      }
      .task-matrix-segmented {
        display: flex;
        gap: 4px;
      }
      .task-matrix-mode-button {
        padding: 6px 12px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
      }
      .task-matrix-mode-button.is-active {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
      }
      .task-matrix-refresh {
        padding: 6px 10px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        border-radius: 6px;
        cursor: pointer;
      }
      .task-matrix-empty {
        text-align: center;
        padding: 48px;
        color: var(--text-muted);
      }
      .task-matrix-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .task-matrix-board {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }
      .task-matrix-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
      @media (max-width: 800px) {
        .task-matrix-grid {
          grid-template-columns: 1fr;
        }
      }
      .task-matrix-column, .task-matrix-cell {
        background: var(--background-secondary);
        border-radius: 8px;
        padding: 12px;
        min-height: 200px;
      }
      .task-matrix-column-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--background-modifier-border);
      }
      .task-matrix-column-header h3 {
        font-size: 14px;
        margin: 0;
        font-weight: 600;
      }
      .task-matrix-count {
        background: var(--background-modifier-border);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
      }
      .task-matrix-header-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .task-matrix-add-btn {
        width: 24px;
        height: 24px;
        border: none;
        border-radius: 50%;
        background: var(--interactive-accent);
        color: var(--text-on-accent);
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s;
      }
      .task-matrix-add-btn:hover {
        opacity: 0.8;
      }
      .task-matrix-card {
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        padding: 10px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: box-shadow 0.2s;
        position: relative;
      }
      .task-matrix-card:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .task-matrix-card.dragging {
        opacity: 0.5;
      }
      .task-matrix-card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 6px;
      }
      .task-matrix-card-title {
        font-size: 13px;
        font-weight: 500;
        line-height: 1.4;
        flex: 1;
      }
      .task-matrix-badge {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
      }
      .task-matrix-badge.status-open {
        background: var(--background-modifier-border);
        color: var(--text-muted);
      }
      .task-matrix-badge.status-completed {
        background: #22c55e;
        color: white;
      }
      .task-matrix-badge.status-cancelled {
        background: #ef4444;
        color: white;
      }
      .task-matrix-badge.status-in-progress {
        background: #3b82f6;
        color: white;
      }
      .task-matrix-badge.status-to-be-started {
        background: #8b5cf6;
        color: white;
      }
      .task-matrix-badge.status-overdue {
        background: #dc2626;
        color: white;
      }
      /* Eisenhower Quadrant Colors */
      .task-matrix-cell[data-quadrant="Q1"] .task-matrix-column-header h3 {
        color: #dc2626;
        border-left: 3px solid #dc2626;
        padding-left: 8px;
      }
      .task-matrix-cell[data-quadrant="Q2"] .task-matrix-column-header h3 {
        color: #059669;
        border-left: 3px solid #059669;
        padding-left: 8px;
      }
      .task-matrix-cell[data-quadrant="Q3"] .task-matrix-column-header h3 {
        color: #d97706;
        border-left: 3px solid #d97706;
        padding-left: 8px;
      }
      .task-matrix-cell[data-quadrant="Q4"] .task-matrix-column-header h3 {
        color: #6b7280;
        border-left: 3px solid #6b7280;
        padding-left: 8px;
      }
      .task-matrix-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 6px;
      }
      .task-matrix-chip {
        font-size: 10px;
        padding: 2px 6px;
        background: var(--background-secondary);
        border-radius: 4px;
        color: var(--text-muted);
      }
      .task-matrix-chip.warning {
        background: #fef3c7;
        color: #92400e;
      }
      .task-matrix-chip.conflict {
        background: #fee2e2;
        color: #dc2626;
        font-weight: 600;
        border: 1px solid #fecaca;
      }
      .task-matrix-card-meta {
        font-size: 11px;
        color: var(--text-muted);
      }
      .task-matrix-card-actions {
        display: flex;
        gap: 4px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--background-modifier-border);
      }
      .task-matrix-action-btn {
        font-size: 11px;
        padding: 2px 6px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
        border-radius: 4px;
        cursor: pointer;
      }
      .task-matrix-action-btn:hover {
        background: var(--background-modifier-hover);
      }
      .task-matrix-action-btn.quadrant-move {
        min-width: 24px;
        text-align: center;
        font-weight: 600;
        padding: 2px 4px;
      }
      .task-matrix-action-separator {
        font-size: 12px;
        color: var(--text-muted);
        align-self: center;
        margin: 0 2px 0 4px;
      }
      .task-matrix-action-label {
        font-size: 11px;
        color: var(--text-muted);
        align-self: center;
        margin-right: 2px;
      }
      .task-matrix-drag-over {
        background: var(--background-modifier-hover) !important;
        border: 2px dashed var(--interactive-accent);
      }
      .task-matrix-card.blocked {
        opacity: 0.7;
        border-left: 3px solid #ef4444;
      }
      .task-matrix-modal {
        padding: 20px;
      }
      .task-matrix-modal h2 {
        margin-top: 0;
      }
      .task-matrix-form-row {
        margin-bottom: 16px;
      }
      .task-matrix-form-row label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 4px;
        color: var(--text-muted);
      }
      .task-matrix-form-row input,
      .task-matrix-form-row select,
      .task-matrix-form-row textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        background: var(--background-primary);
        color: var(--text-normal);
        min-height: 36px;
        line-height: 1.4;
      }
      .task-matrix-form-row select {
        height: 36px;
        padding: 6px 8px;
      }
      .task-matrix-form-row input[type="date"] {
        font-family: inherit;
        cursor: pointer;
      }
      .task-matrix-form-row input[type="date"]::-webkit-calendar-picker-indicator {
        filter: var(--calendar-picker-filter, none);
        cursor: pointer;
      }
      .task-matrix-form-row textarea {
        min-height: 80px;
        resize: vertical;
      }
      .task-matrix-input-row {
        display: flex;
        align-items: center;
      }
      .task-matrix-modal-buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 20px;
      }
      .task-matrix-folder-group {
        margin-bottom: 16px;
      }
      .task-matrix-folder-header {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-muted);
        padding: 8px 12px;
        background: var(--background-secondary);
        border-radius: 6px 6px 0 0;
        margin: 0 0 4px 0;
        border-bottom: 1px solid var(--background-modifier-border);
      }
      .task-matrix-folder-header.task-matrix-folder-toggle {
        width: 100%;
        text-align: left;
        border: 1px solid var(--background-modifier-border);
        cursor: pointer;
      }
      .task-matrix-folder-header.task-matrix-folder-toggle:hover {
        background: var(--background-modifier-hover);
      }
      .task-matrix-folder-content.is-collapsed {
        display: none;
      }
    `;
    document.head.appendChild(styleEl);
  }
  removeStyles() {
    const styleEl = document.getElementById("task-matrix-styles");
    if (styleEl) {
      styleEl.remove();
    }
  }
};
var TaskMatrixView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.searchQuery = "";
    this.collapsedFolderGroups = /* @__PURE__ */ new Set();
    this.shellEl = null;
    this.bodyEl = null;
    this.searchEl = null;
    this.searchDebounceTimer = null;
    this.currentView = plugin.settings.defaultView;
  }
  getViewType() {
    return VIEW_TYPE_TASK_MATRIX;
  }
  getDisplayText() {
    return "Task Matrix";
  }
  getIcon() {
    return "kanban-square";
  }
  async onOpen() {
    await this.render();
  }
  async onClose() {
    if (this.searchDebounceTimer) {
      window.clearTimeout(this.searchDebounceTimer);
    }
    this.contentEl.empty();
  }
  async render() {
    const root = this.contentEl;
    root.empty();
    root.addClass("task-matrix-view");
    this.shellEl = root.createDiv({ cls: "task-matrix-shell" });
    this.renderHeader(this.shellEl);
    await this.renderBodyContainer(this.shellEl);
  }
  async renderBodyContainer(parent) {
    if (this.bodyEl) {
      this.bodyEl.remove();
    }
    this.bodyEl = parent.createDiv({ cls: "task-matrix-body" });
    await this.renderBodyContent(this.bodyEl);
  }
  async refreshBody() {
    if (this.bodyEl) {
      this.bodyEl.empty();
      await this.renderBodyContent(this.bodyEl);
    }
  }
  get filteredTasks() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.plugin.tasks;
    return this.plugin.tasks.filter((task) => {
      return [task.description, task.filePath, task.taskId, task.dependsOn].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
    });
  }
  renderHeader(parent) {
    const header = parent.createDiv({ cls: "task-matrix-header" });
    const titleBlock = header.createDiv({ cls: "task-matrix-title-block" });
    titleBlock.createEl("div", { text: "Obsidian Task Matrix", cls: "task-matrix-kicker" });
    titleBlock.createEl("h2", { text: "Vault task dashboards", cls: "task-matrix-title" });
    titleBlock.createEl("p", {
      text: `${this.plugin.tasks.length} tasks across ${new Set(this.plugin.tasks.map((task) => task.filePath)).size} files`,
      cls: "task-matrix-subtitle"
    });
    const toolbar = header.createDiv({ cls: "task-matrix-toolbar" });
    this.searchEl = toolbar.createEl("input", {
      type: "search",
      placeholder: "Search tasks, file paths, ids...",
      cls: "task-matrix-search"
    });
    this.searchEl.value = this.searchQuery;
    this.searchEl.addEventListener("input", () => {
      this.searchQuery = this.searchEl?.value || "";
      if (this.searchDebounceTimer) {
        window.clearTimeout(this.searchDebounceTimer);
      }
      this.searchDebounceTimer = window.setTimeout(() => {
        this.refreshBody();
      }, 150);
    });
    const segmented = toolbar.createDiv({ cls: "task-matrix-segmented" });
    this.renderModeButton(segmented, "list", ICONS.list);
    this.renderModeButton(segmented, "gtd", ICONS.gtd);
    this.renderModeButton(segmented, "eisenhower", ICONS.eisenhower);
    const refreshButton = toolbar.createEl("button", {
      text: ICONS.refresh,
      cls: "task-matrix-refresh"
    });
    refreshButton.title = "Refresh task index";
    refreshButton.addEventListener("click", async () => {
      await this.plugin.refreshTasks(true);
    });
  }
  renderModeButton(parent, mode, label) {
    const button = parent.createEl("button", {
      text: label,
      cls: `task-matrix-mode-button${this.currentView === mode ? " is-active" : ""}`
    });
    button.addEventListener("click", async () => {
      this.currentView = mode;
      await this.render();
    });
  }
  async renderBodyContent(parent) {
    const tasks = this.filteredTasks;
    if (tasks.length === 0) {
      const empty = parent.createDiv({ cls: "task-matrix-empty" });
      empty.createEl("h3", { text: "No tasks found" });
      empty.createEl("p", {
        text: this.searchQuery ? "The current search did not match any tasks." : "Create markdown tasks in your vault, then refresh this view."
      });
      return;
    }
    if (this.currentView === "list") {
      await this.renderList(parent, tasks);
      return;
    }
    if (this.currentView === "gtd") {
      await this.renderGtd(parent, tasks);
      return;
    }
    await this.renderEisenhower(parent, tasks);
  }
  async renderList(parent, tasks) {
    const wrap = parent.createDiv({ cls: "task-matrix-list" });
    if (this.plugin.settings.listGroupByFolder) {
      const grouped = this.groupTasksByFolder(tasks, this.plugin.settings.listGroupByFolderDepth);
      for (const [folderPath, folderTasks] of Object.entries(grouped)) {
        const groupEl = wrap.createDiv({ cls: "task-matrix-folder-group" });
        const groupKey = folderPath || "Root";
        const toggle = groupEl.createEl("button", {
          cls: "task-matrix-folder-header task-matrix-folder-toggle"
        });
        const content = groupEl.createDiv({ cls: "task-matrix-folder-content" });
        const renderToggleLabel = () => {
          const collapsed = this.collapsedFolderGroups.has(groupKey);
          const marker = collapsed ? "\u25B8" : "\u25BE";
          toggle.setText(`${marker} ${groupKey} (${folderTasks.length})`);
          if (collapsed) {
            content.addClass("is-collapsed");
          } else {
            content.removeClass("is-collapsed");
          }
        };
        renderToggleLabel();
        toggle.addEventListener("click", () => {
          if (this.collapsedFolderGroups.has(groupKey)) {
            this.collapsedFolderGroups.delete(groupKey);
          } else {
            this.collapsedFolderGroups.add(groupKey);
          }
          renderToggleLabel();
        });
        for (const task of folderTasks) {
          await this.createTaskCard(content, task, `${task.filePath}:${task.lineNumber}`);
        }
      }
    } else {
      for (const task of tasks) {
        await this.createTaskCard(wrap, task, `${task.filePath}:${task.lineNumber}`);
      }
    }
  }
  groupTasksByFolder(tasks, depth) {
    const grouped = {};
    for (const task of tasks) {
      const folderPath = this.getFolderPath(task.filePath, depth);
      if (!grouped[folderPath]) {
        grouped[folderPath] = [];
      }
      grouped[folderPath].push(task);
    }
    return Object.keys(grouped).sort().reduce((acc, key) => {
      acc[key] = grouped[key];
      return acc;
    }, {});
  }
  getFolderPath(filePath, depth) {
    const parts = filePath.split("/");
    parts.pop();
    if (parts.length === 0) {
      return "";
    }
    const folderParts = parts.slice(0, depth);
    return folderParts.join("/");
  }
  mapTaskToGtdColumn(task, simpleFlow) {
    if (!simpleFlow) return task.gtdState;
    if (task.gtdState === "To be Started") return "Inbox";
    if (task.gtdState === "Overdue") {
      const todayIso = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const desc = task.description.toLowerCase();
      const hasActiveTag = desc.includes("#doing") || desc.includes("#active") || desc.includes("#next");
      const hasStarted = Boolean(task.startDate && task.startDate <= todayIso);
      return hasStarted || hasActiveTag ? "In Progress" : "Inbox";
    }
    return task.gtdState;
  }
  async renderGtd(parent, tasks) {
    const board = parent.createDiv({ cls: "task-matrix-board" });
    const simpleFlow = !this.plugin.settings.includeCompleted;
    const columns = simpleFlow ? [
      { title: "Inbox", state: "Inbox" },
      { title: "In Progress", state: "In Progress" },
      { title: "Waiting", state: "Waiting" }
    ] : [
      { title: "Inbox", state: "Inbox" },
      { title: "To be Started", state: "To be Started" },
      { title: "In Progress", state: "In Progress" },
      { title: "Waiting", state: "Waiting" },
      { title: "Overdue", state: "Overdue" },
      { title: "Done", state: "Done" }
    ];
    for (const column of columns) {
      const columnEl = board.createDiv({ cls: "task-matrix-column" });
      columnEl.dataset.state = column.state;
      columnEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        columnEl.addClass("task-matrix-drag-over");
      });
      columnEl.addEventListener("dragleave", () => {
        columnEl.removeClass("task-matrix-drag-over");
      });
      columnEl.addEventListener("drop", async (e) => {
        e.preventDefault();
        columnEl.removeClass("task-matrix-drag-over");
        const taskId = e.dataTransfer?.getData("text/task-id");
        if (taskId) {
          const task = this.plugin.tasks.find((t) => t.id === taskId);
          if (task) {
            await this.plugin.moveTaskToGTDState(task, column.state);
          }
        }
      });
      const group = tasks.filter((task) => this.mapTaskToGtdColumn(task, simpleFlow) === column.state);
      const getGtdDefaults = (state) => {
        const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        switch (state) {
          case "Waiting":
            return { gtdState: "Waiting" };
          case "In Progress":
            return { gtdState: "In Progress", startDate: today };
          case "Overdue":
            return { dueDate: today };
          case "Done":
            return {};
          default:
            return { gtdState: state };
        }
      };
      this.createColumnHeader(columnEl, column.title, group.length, () => {
        const defaults = getGtdDefaults(column.state);
        new TaskEditModal(this.app, null, this.plugin, defaults).open();
      });
      for (const task of group) {
        await this.createTaskCard(columnEl, task, this.describeTask(task));
      }
    }
  }
  async renderEisenhower(parent, tasks) {
    const board = parent.createDiv({ cls: "task-matrix-grid" });
    const columns = [
      { title: "Q1", quadrant: "Q1", subtitle: "Important + Urgent" },
      { title: "Q2", quadrant: "Q2", subtitle: "Important + Not urgent" },
      { title: "Q3", quadrant: "Q3", subtitle: "Urgent + Lower importance" },
      { title: "Q4", quadrant: "Q4", subtitle: "Delegated or discard" }
    ];
    for (const column of columns) {
      const cell = board.createDiv({ cls: "task-matrix-cell" });
      cell.dataset.quadrant = column.quadrant;
      cell.addEventListener("dragover", (e) => {
        e.preventDefault();
        cell.addClass("task-matrix-drag-over");
      });
      cell.addEventListener("dragleave", () => {
        cell.removeClass("task-matrix-drag-over");
      });
      cell.addEventListener("drop", async (e) => {
        e.preventDefault();
        cell.removeClass("task-matrix-drag-over");
        const taskId = e.dataTransfer?.getData("text/task-id");
        if (taskId) {
          const task = this.plugin.tasks.find((t) => t.id === taskId);
          if (task) {
            await this.plugin.moveTaskToQuadrant(task, column.quadrant);
          }
        }
      });
      const group = tasks.filter((task) => task.quadrant === column.quadrant && task.displayStatus !== "completed" && task.displayStatus !== "cancelled");
      const getQuadrantDefaults = (quadrant) => {
        const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        switch (quadrant) {
          case "Q1":
            return { priority: "high" /* High */, dueDate: today };
          case "Q2":
            return { priority: "high" /* High */ };
          case "Q3":
            return { priority: "low" /* Low */, dueDate: today };
          case "Q4":
            return { priority: "lowest" /* Lowest */ };
          default:
            return {};
        }
      };
      this.createColumnHeader(cell, `${column.title} ${column.subtitle}`, group.length, () => {
        const defaults = getQuadrantDefaults(column.quadrant);
        new TaskEditModal(this.app, null, this.plugin, defaults).open();
      });
      for (const task of group) {
        await this.createTaskCard(cell, task, this.describeTask(task));
      }
    }
  }
  createColumnHeader(parent, title, count, onAddTask) {
    const header = parent.createDiv({ cls: "task-matrix-column-header" });
    header.createEl("h3", { text: title });
    const rightSection = header.createDiv({ cls: "task-matrix-header-right" });
    if (onAddTask) {
      const addBtn = rightSection.createEl("button", {
        text: "+",
        cls: "task-matrix-add-btn",
        title: "Add task"
      });
      addBtn.addEventListener("click", onAddTask);
    }
    rightSection.createEl("span", { text: String(count), cls: "task-matrix-count" });
  }
  async createTaskCard(parent, task, metaText) {
    const card = parent.createDiv({ cls: `task-matrix-card${task.blocked ? " blocked" : ""}` });
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/task-id", task.id);
      card.addClass("dragging");
    });
    card.addEventListener("dragend", () => {
      card.removeClass("dragging");
    });
    card.addEventListener("click", async (e) => {
      if (e.target.closest(".task-matrix-action-btn")) return;
      await this.openTask(task);
    });
    const top = card.createDiv({ cls: "task-matrix-card-top" });
    const titleEl = top.createDiv({ cls: "task-matrix-card-title" });
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (file instanceof import_obsidian.TFile) {
      const markdownContent = task.description || "*No description*";
      await import_obsidian.MarkdownRenderer.render(this.app, markdownContent, titleEl, task.filePath, this);
    } else {
      titleEl.setText(task.description);
    }
    top.createEl("div", { text: this.statusBadge(task.displayStatus), cls: `task-matrix-badge status-${task.displayStatus}` });
    const chips = card.createDiv({ cls: "task-matrix-chip-row" });
    if (task.priority !== "none") {
      chips.createEl("span", { text: `Priority ${task.priority}`, cls: "task-matrix-chip" });
    }
    if (task.dueDate) {
      chips.createEl("span", { text: `Due ${task.dueDate}`, cls: "task-matrix-chip" });
    }
    if (task.startDate) {
      chips.createEl("span", { text: `Start ${task.startDate}`, cls: "task-matrix-chip" });
    }
    if (task.dependsOn) {
      const depText = task.blocked ? `\u26D4 Depends ${task.dependsOn}` : `\u2713 Depends ${task.dependsOn}`;
      chips.createEl("span", { text: depText, cls: `task-matrix-chip${task.blocked ? " warning" : ""}` });
    }
    if (task.taskId) {
      chips.createEl("span", { text: `ID ${task.taskId}`, cls: "task-matrix-chip" });
    }
    if (task.lineText.toLowerCase().includes("#due-date-conflict")) {
      chips.createEl("span", { text: "\u26A0\uFE0F Due Date Conflict", cls: "task-matrix-chip conflict" });
    }
    card.createEl("div", { text: metaText, cls: "task-matrix-card-meta" });
    const actions = card.createDiv({ cls: "task-matrix-card-actions" });
    if (task.displayStatus !== "completed") {
      const completeBtn = actions.createEl("button", {
        text: "\u2713",
        cls: "task-matrix-action-btn",
        title: "Complete"
      });
      completeBtn.addEventListener("click", () => this.plugin.toggleTaskStatus(task));
      if (!task.startDate || task.displayStatus === "to-be-started") {
        const startBtn = actions.createEl("button", {
          text: "\u25B6",
          cls: "task-matrix-action-btn",
          title: "Start"
        });
        startBtn.addEventListener("click", () => this.plugin.startTask(task));
      }
      const cancelBtn = actions.createEl("button", {
        text: "\u2715",
        cls: "task-matrix-action-btn",
        title: "Cancel"
      });
      cancelBtn.addEventListener("click", () => this.plugin.cancelTask(task));
    } else {
      const reopenBtn = actions.createEl("button", {
        text: "\u21BA",
        cls: "task-matrix-action-btn",
        title: "Reopen"
      });
      reopenBtn.addEventListener("click", () => this.plugin.toggleTaskStatus(task));
    }
    const editBtn = actions.createEl("button", {
      text: "\u270E",
      cls: "task-matrix-action-btn",
      title: "Edit"
    });
    editBtn.addEventListener("click", () => {
      new TaskEditModal(this.app, task, this.plugin).open();
    });
    const deleteBtn = actions.createEl("button", {
      text: "\u{1F5D1}",
      cls: "task-matrix-action-btn",
      title: "Delete"
    });
    deleteBtn.addEventListener("click", () => {
      if (confirm("Delete this task?")) {
        this.plugin.deleteTask(task);
      }
    });
    if (this.currentView === "eisenhower") {
      actions.createEl("span", { text: "|", cls: "task-matrix-action-separator" });
      actions.createEl("span", { text: "Move to", cls: "task-matrix-action-label" });
      const quickTargets = ["Q1", "Q2", "Q3", "Q4"].filter(
        (quadrant) => quadrant !== task.quadrant
      );
      for (const targetQuadrant of quickTargets) {
        const moveBtn = actions.createEl("button", {
          text: targetQuadrant.slice(1),
          cls: "task-matrix-action-btn quadrant-move",
          title: `Move to ${targetQuadrant}`
        });
        moveBtn.addEventListener("click", () => this.plugin.moveTaskToQuadrant(task, targetQuadrant));
      }
    }
    if (this.currentView === "gtd") {
      const simpleFlow = !this.plugin.settings.includeCompleted;
      const currentGtdColumn = this.mapTaskToGtdColumn(task, simpleFlow);
      const quickStates = ["Inbox", "In Progress", "Waiting"];
      const stateLabels = {
        Inbox: "I",
        "In Progress": "P",
        Waiting: "W"
      };
      if (quickStates.includes(currentGtdColumn)) {
        const targets = quickStates.filter((state) => state !== currentGtdColumn);
        actions.createEl("span", { text: "|", cls: "task-matrix-action-separator" });
        actions.createEl("span", { text: "Move to", cls: "task-matrix-action-label" });
        for (const targetState of targets) {
          const moveBtn = actions.createEl("button", {
            text: stateLabels[targetState],
            cls: "task-matrix-action-btn quadrant-move",
            title: `Move to ${targetState}`
          });
          moveBtn.addEventListener("click", () => this.plugin.moveTaskToGTDState(task, targetState));
        }
      }
    }
  }
  statusBadge(status) {
    switch (status) {
      case "completed":
        return "Done";
      case "cancelled":
        return "Cancelled";
      case "in-progress":
        return "Doing";
      case "to-be-started":
        return "To be Started";
      case "overdue":
        return "Overdue";
      default:
        return "Open";
    }
  }
  describeTask(task) {
    return `${task.filePath}:${task.lineNumber} \xB7 ${task.gtdState}`;
  }
  async openTask(task) {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof import_obsidian.TFile)) {
      new import_obsidian.Notice(`File not found: ${task.filePath}`);
      return;
    }
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.openFile(file);
    new import_obsidian.Notice(`Opened ${task.filePath}:${task.lineNumber}`);
  }
};
var TaskEditModal = class extends import_obsidian.Modal {
  constructor(app, task, plugin, defaultValues = {}) {
    super(app);
    this.task = task;
    this.plugin = plugin;
    this.isCreateMode = task === null;
    this.defaultValues = defaultValues;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("task-matrix-modal");
    contentEl.createEl("h2", { text: this.isCreateMode ? "Add Task" : "Edit Task" });
    const form = contentEl.createDiv();
    const description = this.isCreateMode ? "" : this.task.description;
    const priority = this.isCreateMode ? this.defaultValues.priority ?? "none" : this.task.priority;
    const dueDate = this.isCreateMode ? this.defaultValues.dueDate ?? "" : this.task.dueDate || "";
    const startDate = this.isCreateMode ? this.defaultValues.startDate ?? "" : this.task.startDate || "";
    const taskId = this.isCreateMode ? "" : this.task.taskId || "";
    const dependsOn = this.isCreateMode ? "" : this.task.dependsOn || "";
    const descRow = form.createDiv({ cls: "task-matrix-form-row" });
    descRow.createEl("label", { text: "Description" });
    const descInput = new import_obsidian.TextComponent(descRow);
    descInput.setValue(description);
    const priorityRow = form.createDiv({ cls: "task-matrix-form-row" });
    priorityRow.createEl("label", { text: "Priority" });
    const prioritySelect = new import_obsidian.DropdownComponent(priorityRow);
    prioritySelect.addOption("none", "None");
    prioritySelect.addOption("lowest", "Lowest");
    prioritySelect.addOption("low", "Low");
    prioritySelect.addOption("medium", "Medium");
    prioritySelect.addOption("high", "High");
    prioritySelect.addOption("highest", "Highest");
    prioritySelect.addOption("critical", "Critical");
    prioritySelect.setValue(priority);
    const dueRow = form.createDiv({ cls: "task-matrix-form-row" });
    dueRow.createEl("label", { text: "Due Date" });
    const dueInput = dueRow.createEl("input", {
      type: "date",
      cls: "task-matrix-date-input",
      value: dueDate
    });
    const startRow = form.createDiv({ cls: "task-matrix-form-row" });
    startRow.createEl("label", { text: "Start Date" });
    const startInput = startRow.createEl("input", {
      type: "date",
      cls: "task-matrix-date-input",
      value: startDate
    });
    const idRow = form.createDiv({ cls: "task-matrix-form-row" });
    const idLabelRow = idRow.createDiv({ cls: "task-matrix-label-row" });
    idLabelRow.createEl("label", { text: "Task ID" });
    const idInputRow = idRow.createDiv({ cls: "task-matrix-input-row" });
    const idInput = new import_obsidian.TextComponent(idInputRow);
    idInput.setValue(taskId);
    idInput.inputEl.style.flex = "1";
    const generateIdBtn = new import_obsidian.ButtonComponent(idInputRow).setButtonText("\u{1F3B2}").setTooltip("Generate random ID").onClick(() => {
      idInput.setValue(generateShortId());
    });
    generateIdBtn.buttonEl.style.marginLeft = "8px";
    const dependsRow = form.createDiv({ cls: "task-matrix-form-row" });
    dependsRow.createEl("label", { text: "Depends On" });
    const dependsSelect = new import_obsidian.DropdownComponent(dependsRow);
    dependsSelect.addOption("", "-- None --");
    const availableTasks = this.plugin.tasks.filter((t) => t.displayStatus !== "completed" && t.displayStatus !== "cancelled" && t.taskId && t.taskId !== taskId).sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
    for (const t of availableTasks) {
      const dueLabel = t.dueDate ? ` (Due: ${t.dueDate})` : "";
      const label = `${t.taskId}${dueLabel}: ${t.description.slice(0, 40)}${t.description.length > 40 ? "..." : ""}`;
      dependsSelect.addOption(t.taskId, label);
    }
    dependsSelect.setValue(dependsOn);
    const buttons = contentEl.createDiv({ cls: "task-matrix-modal-buttons" });
    new import_obsidian.ButtonComponent(buttons).setButtonText("Cancel").onClick(() => this.close());
    new import_obsidian.ButtonComponent(buttons).setButtonText(this.isCreateMode ? "Create" : "Save").setCta().onClick(async () => {
      const updates = {
        description: descInput.getValue(),
        priority: prioritySelect.getValue(),
        dueDate: dueInput.value || void 0,
        startDate: startInput.value || void 0,
        taskId: idInput.getValue() || void 0,
        dependsOn: dependsSelect.getValue() || void 0
      };
      if (updates.startDate && updates.dueDate && updates.startDate > updates.dueDate) {
        new DateConflictModal(
          this.app,
          updates.startDate,
          updates.dueDate,
          async (result) => {
            if (result.adjustDueDate) {
              const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
              updates.dueDate = today;
              new import_obsidian.Notice("Due date adjusted to today");
            } else if (result.addConflictTag) {
            } else {
              return;
            }
            if (this.isCreateMode) {
              await this.createTask(updates, result.addConflictTag);
            } else {
              await this.saveTask(updates, result.addConflictTag);
            }
            this.close();
          }
        ).open();
        return;
      }
      if (this.isCreateMode) {
        await this.createTask(updates, false);
      } else {
        await this.saveTask(updates, false);
      }
      this.close();
    });
  }
  async createTask(updates, addConflictTag = false) {
    const desc = updates.description?.trim();
    if (!desc) {
      new import_obsidian.Notice("Task description is required");
      return;
    }
    let targetFile = null;
    const { newTaskTargetPath } = this.plugin.settings;
    if (newTaskTargetPath) {
      const resolvedPath = this.resolveDateTemplate(newTaskTargetPath);
      targetFile = this.app.vault.getAbstractFileByPath(resolvedPath);
      if (!targetFile) {
        new import_obsidian.Notice(`Target note not found: ${resolvedPath}`);
        return;
      }
    } else {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile && activeFile.extension === "md") {
        targetFile = activeFile;
      } else {
        new import_obsidian.Notice("No target note configured and no active markdown file. Please configure Target note path in settings or open a markdown file.");
        return;
      }
    }
    let taskLine = `- [ ] ${desc}`;
    if (updates.priority && updates.priority !== "none") {
      const priorityEmoji = {
        critical: "\u{1F53A}",
        highest: "\u23EB",
        high: "\u{1F53C}",
        medium: "",
        low: "\u{1F53D}",
        lowest: "\u23EC"
      }[updates.priority];
      if (priorityEmoji) {
        taskLine = taskLine.replace(/^(- \[ \] )/, `$1${priorityEmoji} `);
      }
    }
    if (updates.dueDate) {
      taskLine += ` \u{1F4C5} ${updates.dueDate}`;
    }
    if (updates.startDate) {
      taskLine += ` \u{1F6EB} ${updates.startDate}`;
    }
    if (this.defaultValues.gtdState) {
      switch (this.defaultValues.gtdState) {
        case "Waiting":
          taskLine += " #waiting";
          break;
        case "In Progress":
          taskLine += " #doing";
          break;
      }
    }
    if (updates.taskId) {
      taskLine += ` \u{1F194} ${updates.taskId}`;
    }
    if (updates.dependsOn) {
      taskLine += ` \u26D4 ${updates.dependsOn}`;
    }
    if (addConflictTag) {
      taskLine += " #due-date-conflict";
    }
    const content = await this.app.vault.read(targetFile);
    const { newTaskTargetHeading } = this.plugin.settings;
    let newContent;
    if (newTaskTargetHeading) {
      const result = this.insertTaskUnderHeading(content, newTaskTargetHeading, taskLine);
      if (!result.success) {
        new import_obsidian.Notice(`Cannot add task: ${result.error}`);
        return;
      }
      newContent = result.content;
    } else {
      newContent = content.trim() + "\n" + taskLine;
    }
    await this.app.vault.modify(targetFile, newContent);
    new import_obsidian.Notice(`Task added to ${targetFile.path}`);
  }
  resolveDateTemplate(template) {
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return template.replace(/YYYY/g, String(year)).replace(/MM/g, month).replace(/DD/g, day);
  }
  insertTaskUnderHeading(content, heading, taskLine) {
    const lines = content.split(/\r?\n/u);
    const headingRegex = new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
    const headingIndex = lines.findIndex((line) => headingRegex.test(line.trim()));
    if (headingIndex === -1) {
      return { success: false, error: `Heading "${heading}" not found` };
    }
    const headingMatch = lines[headingIndex].match(/^(#{1,6})/);
    if (!headingMatch) {
      return { success: false, error: "Invalid heading format" };
    }
    const headingLevel = headingMatch[1].length;
    let insertIndex = headingIndex + 1;
    for (let i = headingIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const nextHeadingMatch = line.match(/^(#{1,6})\s/);
      if (nextHeadingMatch && nextHeadingMatch[1].length <= headingLevel) {
        break;
      }
      insertIndex = i + 1;
    }
    let lastContentIndex = insertIndex - 1;
    while (lastContentIndex > headingIndex && !lines[lastContentIndex].trim()) {
      lastContentIndex--;
    }
    lines.splice(lastContentIndex + 1, 0, taskLine);
    return { success: true, content: lines.join("\n") };
  }
  async saveTask(updates, addConflictTag = false) {
    if (!this.task) return;
    const file = this.app.vault.getAbstractFileByPath(this.task.filePath);
    if (!(file instanceof import_obsidian.TFile)) {
      new import_obsidian.Notice(`File not found: ${this.task.filePath}`);
      return;
    }
    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = this.task.lineNumber - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) {
      new import_obsidian.Notice(`Line ${this.task.lineNumber} not found in file`);
      return;
    }
    let line = lines[lineIndex];
    const checkboxMatch = line.match(/^(\s*[-*]\s*\[[ xX/-]\]\s*)/);
    if (checkboxMatch && updates.description) {
      const prefix = checkboxMatch[1];
      const restOfLine = line.substring(prefix.length);
      const inlineFields = restOfLine.match(/(\s*(?:📅\s*\d{4}-\d{2}-\d{2}|🛫\s*\d{4}-\d{2}-\d{2}|⏳\s*\d{4}-\d{2}-\d{2}|✅\s*\d{4}-\d{2}-\d{2}|➕\s*\d{4}-\d{2}-\d{2}|🔺|⏫|🔼|🔽|⏬|🆔\s*\S+|⛔\s*\S+|#\w+|::\s*\S+)\s*)/gu) || [];
      const uniqueInlineFields = inlineFields.filter((field) => {
        const trimmed = field.trim();
        if (trimmed.startsWith("#")) {
          return !updates.description.toLowerCase().includes(trimmed.toLowerCase());
        }
        return true;
      });
      line = prefix + updates.description + " " + uniqueInlineFields.join(" ");
    }
    if (updates.priority !== void 0) {
      line = line.replace(/🔺|⏫|🔼|🔽|⏬/gu, "");
      if (updates.priority === "critical") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1\u{1F53A} ");
      else if (updates.priority === "highest") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1\u23EB ");
      else if (updates.priority === "high") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1\u{1F53C} ");
      else if (updates.priority === "low") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1\u{1F53D} ");
      else if (updates.priority === "lowest") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1\u23EC ");
    }
    if (updates.dueDate !== void 0) {
      line = line.replace(/\s*📅(?:\s*\d{4}-\d{2}-\d{2})?/gu, "");
      if (updates.dueDate) line += ` \u{1F4C5} ${updates.dueDate}`;
    }
    if (updates.startDate !== void 0) {
      line = line.replace(/\s*🛫(?:\s*\d{4}-\d{2}-\d{2})?/gu, "");
      if (updates.startDate) line += ` \u{1F6EB} ${updates.startDate}`;
    }
    if (updates.createdDate !== void 0) {
      line = line.replace(/\s*➕(?:\s*\d{4}-\d{2}-\d{2})?/gu, "");
      if (updates.createdDate) line += ` \u2795 ${updates.createdDate}`;
    }
    if (updates.taskId !== void 0) {
      line = line.replace(/\s*🆔\s*\S+/g, "");
      line = line.replace(/\bid::\s*\S+/gi, "");
      if (updates.taskId) line += ` \u{1F194} ${updates.taskId}`;
    }
    if (updates.dependsOn !== void 0) {
      line = line.replace(/\s*⛔\s*\S+/g, "");
      line = line.replace(/\bdependsOn::\s*\S+/gi, "");
      if (updates.dependsOn) line += ` \u26D4 ${updates.dependsOn}`;
    }
    line = line.replace(/\s*#due-date-conflict\b/gi, "");
    if (addConflictTag) {
      line += " #due-date-conflict";
    }
    line = line.replace(/\s+/g, " ").trim();
    lines[lineIndex] = line;
    await this.app.vault.modify(file, lines.join("\n"));
    new import_obsidian.Notice("Task updated");
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};
var DateConflictModal = class extends import_obsidian.Modal {
  constructor(app, startDate, dueDate, onConfirm) {
    super(app);
    this.startDate = startDate;
    this.dueDate = dueDate;
    this.onConfirm = onConfirm;
    this.result = null;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("task-matrix-modal");
    contentEl.createEl("h2", { text: "Date Conflict Detected" });
    const message = contentEl.createEl("p");
    message.innerHTML = `Start date (<strong>${this.startDate}</strong>) is later than due date (<strong>${this.dueDate}</strong>).<br><br>Would you like to adjust the due date to today?`;
    const buttonRow = contentEl.createDiv({ cls: "task-matrix-modal-buttons" });
    new import_obsidian.ButtonComponent(buttonRow).setButtonText("No, add conflict tag").onClick(() => {
      this.result = { adjustDueDate: false, addConflictTag: true };
      this.onConfirm(this.result);
      this.close();
    });
    new import_obsidian.ButtonComponent(buttonRow).setButtonText("Yes, adjust due date").setCta().onClick(() => {
      this.result = { adjustDueDate: true, addConflictTag: false };
      this.onConfirm(this.result);
      this.close();
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    if (this.result === null) {
      this.onConfirm({ adjustDueDate: false, addConflictTag: false });
    }
  }
};
var TaskMatrixSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Task Matrix settings" });
    new import_obsidian.Setting(containerEl).setName("Scan folders").setDesc("Comma-separated list of folder paths to scan for tasks. Leave empty to scan the whole vault.").addText(
      (text) => text.setPlaceholder("Projects/Tasks, Inbox").setValue(this.plugin.settings.scanFolders.join(", ")).onChange(async (value) => {
        this.plugin.settings.scanFolders = value.split(",").map((s) => s.trim()).filter(Boolean);
        await this.plugin.saveSettings();
        await this.plugin.refreshTasks();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Default view").setDesc("Choose which dashboard opens first.").addDropdown(
      (dropdown) => dropdown.addOption("eisenhower", "Eisenhower").addOption("gtd", "GTD").addOption("list", "List").setValue(this.plugin.settings.defaultView).onChange(async (value) => {
        this.plugin.settings.defaultView = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Exclude folders").setDesc("Comma-separated list of folder paths to exclude from task scanning.").addText(
      (text) => text.setPlaceholder("Archive, Templates, Daily").setValue(this.plugin.settings.excludeFolders.join(", ")).onChange(async (value) => {
        this.plugin.settings.excludeFolders = value.split(",").map((s) => s.trim()).filter(Boolean);
        await this.plugin.saveSettings();
        await this.plugin.refreshTasks();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Open location").setDesc("Where to open the Task Matrix view.").addDropdown(
      (dropdown) => dropdown.addOption("sidebar", "Right Sidebar").addOption("tab", "New Tab").setValue(this.plugin.settings.openLocation).onChange(async (value) => {
        this.plugin.settings.openLocation = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Completion markers").setDesc("Checkbox contents that indicate a completed task (comma-separated). Default: x, X").addText(
      (text) => text.setPlaceholder("x, X, done, \u5B8C\u6210").setValue(this.plugin.settings.completionMarkers.join(", ")).onChange(async (value) => {
        this.plugin.settings.completionMarkers = value.split(",").map((s) => s.trim()).filter(Boolean);
        if (this.plugin.settings.completionMarkers.length === 0) {
          this.plugin.settings.completionMarkers = ["x", "X"];
        }
        await this.plugin.saveSettings();
        await this.plugin.refreshTasks();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Cancelled markers").setDesc("Checkbox contents that indicate a cancelled task (comma-separated). Default: -").addText(
      (text) => text.setPlaceholder("-, cancelled, skip").setValue(this.plugin.settings.cancelledMarkers.join(", ")).onChange(async (value) => {
        this.plugin.settings.cancelledMarkers = value.split(",").map((s) => s.trim()).filter(Boolean);
        if (this.plugin.settings.cancelledMarkers.length === 0) {
          this.plugin.settings.cancelledMarkers = ["-"];
        }
        await this.plugin.saveSettings();
        await this.plugin.refreshTasks();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Include completed tasks").setDesc("Show completed tasks in the matrix.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.includeCompleted).onChange(async (value) => {
        this.plugin.settings.includeCompleted = value;
        await this.plugin.saveSettings();
        await this.plugin.refreshTasks();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Track completion date").setDesc("When enabled, automatically add \u2705 yyyy-mm-dd to tasks when they are marked as completed.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.trackCompletionDate).onChange(async (value) => {
        this.plugin.settings.trackCompletionDate = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Urgent days range").setDesc("Number of days to consider a task as urgent (1-7). Default: 1 (today only). 2 = today+tomorrow, 3 = today+2 days, etc.").addSlider(
      (slider) => slider.setLimits(1, 7, 1).setValue(this.plugin.settings.urgentDaysRange).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.urgentDaysRange = value;
        await this.plugin.saveSettings();
        await this.plugin.refreshTasks();
      })
    );
    containerEl.createEl("h3", { text: "New Task Settings" });
    new import_obsidian.Setting(containerEl).setName("Target note path").setDesc("Path template for new tasks. Use YYYY, MM, DD for date substitution. Leave empty to use fallback logic.").addText(
      (text) => text.setPlaceholder("Daily/YYYY-MM-DD.md").setValue(this.plugin.settings.newTaskTargetPath).onChange(async (value) => {
        this.plugin.settings.newTaskTargetPath = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Target heading").setDesc("Insert new tasks under this heading. Leave empty to append at end of file.").addText(
      (text) => text.setPlaceholder("## \u{1F440} GTD\u4EFB\u52A1\u770B\u677F").setValue(this.plugin.settings.newTaskTargetHeading).onChange(async (value) => {
        this.plugin.settings.newTaskTargetHeading = value.trim();
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h3", { text: "List View Settings" });
    new import_obsidian.Setting(containerEl).setName("Group by folder").setDesc("Group tasks by their containing folder in list view.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.listGroupByFolder).onChange(async (value) => {
        this.plugin.settings.listGroupByFolder = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Folder grouping depth").setDesc("How many folder levels to display for grouping (1 = top level only, 2 = two levels, etc.).").addSlider(
      (slider) => slider.setLimits(1, 5, 1).setValue(this.plugin.settings.listGroupByFolderDepth).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.listGroupByFolderDepth = value;
        await this.plugin.saveSettings();
      })
    );
  }
};
