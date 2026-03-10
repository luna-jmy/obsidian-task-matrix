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
  scanFolder: "",
  defaultView: "eisenhower",
  includeCompleted: true
};

// src/task-parser.ts
var PRIORITY_MARKERS = [
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
var TASK_PATTERN = /^[ \t]*[-*][ \t]\[( |x|X|\/|-)\][ \t]*(.*)$/u;
function extractValue(text, regex) {
  const match = text.match(regex);
  return match?.[1]?.trim();
}
function cleanDescription(raw) {
  return raw.replace(FIELD_PATTERNS.dueDate, "").replace(FIELD_PATTERNS.startDate, "").replace(FIELD_PATTERNS.scheduledDate, "").replace(FIELD_PATTERNS.doneDate, "").replace(FIELD_PATTERNS.createdDate, "").replace(FIELD_PATTERNS.recurrence, "").replace(FIELD_PATTERNS.taskIdIcon, "").replace(FIELD_PATTERNS.taskIdField, "").replace(FIELD_PATTERNS.dependsIcon, "").replace(FIELD_PATTERNS.dependsField, "").replace(/[\u{1f4c5}\u{1f6eb}\u{23f3}\u{2705}\u{2795}\u{1f504}\u{1f194}\u{26d4}\u{1f53c}\u{23eb}\u{1f53d}\u{23ec}]/gu, "").replace(/\s+/g, " ").trim();
}
function getStatus(marker) {
  const normalized = marker.toLowerCase();
  if (normalized === "x") return "completed";
  if (normalized === "-") return "cancelled";
  if (normalized === "/") return "in-progress";
  return "open";
}
function isoDateOffset(days) {
  const date = /* @__PURE__ */ new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
function computeGtdState(status, description, startDate, scheduledDate, blocked) {
  if (status === "completed" || status === "cancelled") return "Done";
  const desc = description.toLowerCase();
  if (blocked || desc.includes("#waiting") || desc.includes("#delegated") || desc.includes("#blocked")) {
    return "Waiting";
  }
  const today = isoDateOffset(0);
  if (status === "in-progress" || desc.includes("#doing") || desc.includes("#active") || desc.includes("#next") || startDate && startDate <= today || scheduledDate && scheduledDate <= today) {
    return "In Progress";
  }
  return "Inbox";
}
function computeQuadrant(priority, dueDate) {
  const isImportant = priority === "highest" /* Highest */ || priority === "high" /* High */;
  const isUrgent = Boolean(dueDate && dueDate <= isoDateOffset(3));
  if (isImportant && isUrgent) return "Q1";
  if (isImportant && !isUrgent) return "Q2";
  if (!isImportant && isUrgent) return "Q3";
  return "Q4";
}
function parseTaskLine(line, filePath, lineNumber) {
  const match = line.match(TASK_PATTERN);
  if (!match) return null;
  const status = getStatus(match[1]);
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
    quadrant
  };
}
function priorityRank(priority) {
  switch (priority) {
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
    this.refreshOpenViews();
  }
  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_MATRIX)[0];
    if (!leaf) {
      const newLeaf = this.app.workspace.getRightLeaf(false);
      if (newLeaf) {
        await newLeaf.setViewState({ type: VIEW_TYPE_TASK_MATRIX, active: true });
        leaf = newLeaf;
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
    this.refreshOpenViews();
    if (showNotice) {
      new import_obsidian.Notice(`Task Matrix refreshed: ${this.tasks.length} tasks`);
    }
  }
  refreshOpenViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_MATRIX)) {
      const view = leaf.view;
      if (view instanceof TaskMatrixView) {
        view.render();
      }
    }
  }
  shouldIncludeFile(file) {
    const folder = this.settings.scanFolder.trim().replace(/^\/+|\/+$/g, "");
    if (!folder) return true;
    return file.path === folder || file.path.startsWith(`${folder}/`);
  }
  async collectTasks() {
    const tasks = [];
    const files = this.app.vault.getMarkdownFiles().filter((file) => this.shouldIncludeFile(file));
    for (const file of files) {
      const content = await this.app.vault.cachedRead(file);
      const lines = content.split(/\r?\n/u);
      lines.forEach((line, index) => {
        const parsed = parseTaskLine(line, file.path, index + 1);
        if (!parsed) return;
        if (!this.settings.includeCompleted && (parsed.status === "completed" || parsed.status === "cancelled")) {
          return;
        }
        tasks.push(parsed);
      });
    }
    const completedIds = new Set(tasks.filter((t) => t.status === "completed").map((t) => t.taskId).filter(Boolean));
    for (const task of tasks) {
      if (task.dependsOn) {
        task.blocked = !completedIds.has(task.dependsOn);
        task.gtdState = computeGtdState(task.status, task.description, task.startDate, task.scheduledDate, task.blocked);
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
    const newStatus = task.status === "completed" ? "open" : "completed";
    const newMarker = newStatus === "completed" ? "x" : " ";
    const newLine = line.replace(/\[( |x|X|\/-)\]/, `[${newMarker}]`);
    if (newLine !== line) {
      lines[lineIndex] = newLine;
      await this.app.vault.modify(file, lines.join("\n"));
      new import_obsidian.Notice(`Task marked as ${newStatus}`);
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
    const newLine = line.replace(/\[( |x|X|\/-)\]/, "[-]");
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
    const newLine = line.replace(/\[( |x|X|\/-)\]/, "[/]");
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
  // Drag and drop: move task to different state/quadrant
  async moveTaskToGTDState(task, newState) {
    if (task.gtdState === newState) return;
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof import_obsidian.TFile)) return;
    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) return;
    let line = lines[lineIndex];
    line = line.replace(/#(waiting|delegated|blocked|doing|active|next)\b/gi, "").trim();
    let tagToAdd = "";
    switch (newState) {
      case "Waiting":
        tagToAdd = " #waiting";
        break;
      case "In Progress":
        tagToAdd = " #doing";
        break;
      case "Done":
        line = line.replace(/\[( |x|X|\/-)\]/, "[x]");
        break;
    }
    if (tagToAdd && !line.toLowerCase().includes(tagToAdd.toLowerCase())) {
      line += tagToAdd;
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
    let priorityMarker = "";
    switch (newQuadrant) {
      case "Q1":
        priorityMarker = "\u{1F53C}";
        break;
      case "Q2":
        priorityMarker = "\u{1F53C}";
        break;
      case "Q3":
        priorityMarker = "\u{1F53D}";
        break;
      case "Q4":
        priorityMarker = "\u23EC";
        break;
    }
    line = line.replace(/[🔼⏫🔽⏬]/gu, "").trim();
    if (priorityMarker) {
      const checkboxMatch = line.match(/^(\s*[-*]\s*\[[ xX/-]\]\s*)/);
      if (checkboxMatch) {
        line = line.replace(checkboxMatch[1], checkboxMatch[1] + priorityMarker + " ");
      }
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
      }
      .task-matrix-form-row textarea {
        min-height: 80px;
        resize: vertical;
      }
      .task-matrix-modal-buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 20px;
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
    this.render();
  }
  async onClose() {
    this.contentEl.empty();
  }
  render() {
    const root = this.contentEl;
    root.empty();
    root.addClass("task-matrix-view");
    const shell = root.createDiv({ cls: "task-matrix-shell" });
    this.renderHeader(shell);
    this.renderBody(shell);
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
    const search = toolbar.createEl("input", {
      type: "search",
      placeholder: "Search tasks, file paths, ids...",
      cls: "task-matrix-search"
    });
    search.value = this.searchQuery;
    search.addEventListener("input", () => {
      this.searchQuery = search.value;
      this.render();
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
    button.addEventListener("click", () => {
      this.currentView = mode;
      this.render();
    });
  }
  renderBody(parent) {
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
      this.renderList(parent, tasks);
      return;
    }
    if (this.currentView === "gtd") {
      this.renderGtd(parent, tasks);
      return;
    }
    this.renderEisenhower(parent, tasks);
  }
  renderList(parent, tasks) {
    const wrap = parent.createDiv({ cls: "task-matrix-list" });
    for (const task of tasks) {
      this.createTaskCard(wrap, task, `${task.filePath}:${task.lineNumber}`);
    }
  }
  renderGtd(parent, tasks) {
    const board = parent.createDiv({ cls: "task-matrix-board" });
    const columns = [
      { title: "Inbox", state: "Inbox" },
      { title: "In Progress", state: "In Progress" },
      { title: "Waiting", state: "Waiting" },
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
      const group = tasks.filter((task) => task.gtdState === column.state);
      this.createColumnHeader(columnEl, column.title, group.length);
      for (const task of group) {
        this.createTaskCard(columnEl, task, this.describeTask(task));
      }
    }
  }
  renderEisenhower(parent, tasks) {
    const board = parent.createDiv({ cls: "task-matrix-grid" });
    const columns = [
      { title: "Q1", quadrant: "Q1", subtitle: "Important + Urgent" },
      { title: "Q2", quadrant: "Q2", subtitle: "Important + Not urgent" },
      { title: "Q3", quadrant: "Q3", subtitle: "Urgent + Lower importance" },
      { title: "Q4", quadrant: "Q4", subtitle: "Backlog or discard" }
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
      const group = tasks.filter((task) => task.quadrant === column.quadrant && task.status !== "completed" && task.status !== "cancelled");
      this.createColumnHeader(cell, `${column.title} ${column.subtitle}`, group.length);
      for (const task of group) {
        this.createTaskCard(cell, task, this.describeTask(task));
      }
    }
  }
  createColumnHeader(parent, title, count) {
    const header = parent.createDiv({ cls: "task-matrix-column-header" });
    header.createEl("h3", { text: title });
    header.createEl("span", { text: String(count), cls: "task-matrix-count" });
  }
  createTaskCard(parent, task, metaText) {
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
    top.createEl("div", { text: task.description, cls: "task-matrix-card-title" });
    top.createEl("div", { text: this.statusBadge(task.status), cls: `task-matrix-badge status-${task.status}` });
    const chips = card.createDiv({ cls: "task-matrix-chip-row" });
    if (task.priority !== "none") {
      chips.createEl("span", { text: `Priority ${task.priority}`, cls: "task-matrix-chip" });
    }
    if (task.dueDate) {
      chips.createEl("span", { text: `Due ${task.dueDate}`, cls: "task-matrix-chip" });
    }
    if (task.dependsOn) {
      const depText = task.blocked ? `\u26D4 Depends ${task.dependsOn}` : `\u2713 Depends ${task.dependsOn}`;
      chips.createEl("span", { text: depText, cls: `task-matrix-chip${task.blocked ? " warning" : ""}` });
    }
    if (task.taskId) {
      chips.createEl("span", { text: `ID ${task.taskId}`, cls: "task-matrix-chip" });
    }
    card.createEl("div", { text: metaText, cls: "task-matrix-card-meta" });
    const actions = card.createDiv({ cls: "task-matrix-card-actions" });
    if (task.status !== "completed" && task.status !== "cancelled") {
      const completeBtn = actions.createEl("button", {
        text: "\u2713",
        cls: "task-matrix-action-btn",
        title: "Complete"
      });
      completeBtn.addEventListener("click", () => this.plugin.toggleTaskStatus(task));
      if (task.status !== "in-progress") {
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
  }
  statusBadge(status) {
    switch (status) {
      case "completed":
        return "Done";
      case "cancelled":
        return "Cancelled";
      case "in-progress":
        return "Doing";
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
  constructor(app, task, plugin) {
    super(app);
    this.task = task;
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("task-matrix-modal");
    contentEl.createEl("h2", { text: "Edit Task" });
    const form = contentEl.createDiv();
    const descRow = form.createDiv({ cls: "task-matrix-form-row" });
    descRow.createEl("label", { text: "Description" });
    const descInput = new import_obsidian.TextComponent(descRow);
    descInput.setValue(this.task.description);
    const priorityRow = form.createDiv({ cls: "task-matrix-form-row" });
    priorityRow.createEl("label", { text: "Priority" });
    const prioritySelect = new import_obsidian.DropdownComponent(priorityRow);
    prioritySelect.addOption("none", "None");
    prioritySelect.addOption("lowest", "Lowest");
    prioritySelect.addOption("low", "Low");
    prioritySelect.addOption("medium", "Medium");
    prioritySelect.addOption("high", "High");
    prioritySelect.addOption("highest", "Highest");
    prioritySelect.setValue(this.task.priority);
    const dueRow = form.createDiv({ cls: "task-matrix-form-row" });
    dueRow.createEl("label", { text: "Due Date" });
    const dueInput = new import_obsidian.TextComponent(dueRow);
    dueInput.setValue(this.task.dueDate || "");
    dueInput.setPlaceholder("YYYY-MM-DD");
    const startRow = form.createDiv({ cls: "task-matrix-form-row" });
    startRow.createEl("label", { text: "Start Date" });
    const startInput = new import_obsidian.TextComponent(startRow);
    startInput.setValue(this.task.startDate || "");
    startInput.setPlaceholder("YYYY-MM-DD");
    const idRow = form.createDiv({ cls: "task-matrix-form-row" });
    idRow.createEl("label", { text: "Task ID" });
    const idInput = new import_obsidian.TextComponent(idRow);
    idInput.setValue(this.task.taskId || "");
    const dependsRow = form.createDiv({ cls: "task-matrix-form-row" });
    dependsRow.createEl("label", { text: "Depends On" });
    const dependsInput = new import_obsidian.TextComponent(dependsRow);
    dependsInput.setValue(this.task.dependsOn || "");
    const buttons = contentEl.createDiv({ cls: "task-matrix-modal-buttons" });
    new import_obsidian.ButtonComponent(buttons).setButtonText("Cancel").onClick(() => this.close());
    new import_obsidian.ButtonComponent(buttons).setButtonText("Save").setCta().onClick(async () => {
      await this.saveTask({
        description: descInput.getValue(),
        priority: prioritySelect.getValue(),
        dueDate: dueInput.getValue() || void 0,
        startDate: startInput.getValue() || void 0,
        taskId: idInput.getValue() || void 0,
        dependsOn: dependsInput.getValue() || void 0
      });
      this.close();
    });
  }
  async saveTask(updates) {
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
      const inlineFields = restOfLine.match(/(\s*(?:📅|🛫|⏳|✅|➕|🔼|⏫|🔽|⏬|🆔|⛔|#\w+|::\s*\S+)\s*)/g) || [];
      line = prefix + updates.description + " " + inlineFields.join(" ");
    }
    if (updates.priority !== void 0) {
      line = line.replace(/[🔼⏫🔽⏬]/gu, "");
      if (updates.priority === "highest") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1\u23EB ");
      else if (updates.priority === "high") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1\u{1F53C} ");
      else if (updates.priority === "low") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1\u{1F53D} ");
      else if (updates.priority === "lowest") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1\u23EC ");
    }
    if (updates.dueDate !== void 0) {
      line = line.replace(/\s*📅\s*\d{4}-\d{2}-\d{2}/g, "");
      if (updates.dueDate) line += ` \u{1F4C5} ${updates.dueDate}`;
    }
    if (updates.startDate !== void 0) {
      line = line.replace(/\s*🛫\s*\d{4}-\d{2}-\d{2}/g, "");
      if (updates.startDate) line += ` \u{1F6EB} ${updates.startDate}`;
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
var TaskMatrixSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Task Matrix settings" });
    new import_obsidian.Setting(containerEl).setName("Scan folder").setDesc("Only index markdown files inside this vault folder. Leave empty to scan the whole vault.").addText(
      (text) => text.setPlaceholder("Projects/Tasks").setValue(this.plugin.settings.scanFolder).onChange(async (value) => {
        this.plugin.settings.scanFolder = value.trim();
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
    new import_obsidian.Setting(containerEl).setName("Include completed tasks").setDesc("Show completed and cancelled tasks in the matrix.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.includeCompleted).onChange(async (value) => {
        this.plugin.settings.includeCompleted = value;
        await this.plugin.saveSettings();
        await this.plugin.refreshTasks();
      })
    );
  }
};
