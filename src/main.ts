import {
  App,
  ItemView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  WorkspaceLeaf,
  Modal,
  TextComponent,
  ToggleComponent,
  DropdownComponent,
  ButtonComponent,
  MarkdownRenderer,
} from "obsidian";
import { DEFAULT_SETTINGS, ParsedTask, TaskMatrixSettings, ViewMode, Priority } from "./types";
import { parseTaskLine, sortTasks, computeGtdState, computeQuadrant, generateShortId } from "./task-parser";

const VIEW_TYPE_TASK_MATRIX = "task-matrix-view";
const ICONS = {
  refresh: "↻",
  list: "List",
  gtd: "GTD",
  eisenhower: "Matrix",
  calendar: "Calendar",
};

type DateFilterOperator =
  | "any"
  | "not-on"
  | "on"
  | "before"
  | "on-or-before"
  | "after"
  | "on-or-after"
  | "is-empty"
  | "is-not-empty";

type DateFilterConfig = {
  operator: DateFilterOperator;
  value: string;
};

export default class TaskMatrixPlugin extends Plugin {
  settings: TaskMatrixSettings = DEFAULT_SETTINGS;
  tasks: ParsedTask[] = [];
  private refreshTimer: number | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    await this.refreshTasks();

    this.registerView(
      VIEW_TYPE_TASK_MATRIX,
      (leaf) => new TaskMatrixView(leaf, this),
    );

    this.addRibbonIcon("kanban-square", "Open Task Matrix", async () => {
      await this.activateView();
    });

    this.addCommand({
      id: "open-task-matrix",
      name: "Open task matrix",
      callback: async () => {
        await this.activateView();
      },
    });

    this.addCommand({
      id: "refresh-task-matrix",
      name: "Refresh task matrix",
      callback: async () => {
        await this.refreshTasks(true);
      },
    });

    this.registerEvent(this.app.vault.on("create", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("modify", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("delete", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("rename", () => this.scheduleRefresh()));

    this.addSettingTab(new TaskMatrixSettingTab(this.app, this));

    // Add CSS
    this.addStyles();
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_TASK_MATRIX);
    this.removeStyles();
  }

  async loadSettings(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    await this.refreshOpenViews();
  }

  async activateView(): Promise<void> {
    let leaf: WorkspaceLeaf | null = this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_MATRIX)[0];
    if (!leaf) {
      // Create new leaf based on settings
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

  scheduleRefresh(): void {
    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = window.setTimeout(() => {
      void this.refreshTasks();
      this.refreshTimer = null;
    }, 500);
  }

  async refreshTasks(showNotice = false): Promise<void> {
    this.tasks = await this.collectTasks();
    await this.refreshOpenViews();
    if (showNotice) {
      new Notice(`Task Matrix refreshed: ${this.tasks.length} tasks`);
    }
  }

  private async refreshOpenViews(): Promise<void> {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_MATRIX)) {
      const view = leaf.view;
      if (view instanceof TaskMatrixView) {
        await view.render();
      }
    }
  }

  private shouldIncludeFile(file: TFile): boolean {
    // Check excluded folders first
    for (const excludeFolder of this.settings.excludeFolders) {
      const trimmed = excludeFolder.trim().replace(/^\/+|\/+$/g, "");
      if (trimmed && (file.path === trimmed || file.path.startsWith(`${trimmed}/`))) {
        return false;
      }
    }

    // Check scan folders (if none specified, include all)
    if (this.settings.scanFolders.length === 0) return true;

    for (const scanFolder of this.settings.scanFolders) {
      const trimmed = scanFolder.trim().replace(/^\/+|\/+$/g, "");
      if (trimmed && (file.path === trimmed || file.path.startsWith(`${trimmed}/`))) {
        return true;
      }
    }
    return false;
  }

  async collectTasks(options?: { ignoreIncludeCompleted?: boolean }): Promise<ParsedTask[]> {
    const tasks: ParsedTask[] = [];
    const files = this.app.vault.getMarkdownFiles().filter((file) => this.shouldIncludeFile(file));

    for (const file of files) {
      const content = await this.app.vault.cachedRead(file);
      const lines = content.split(/\r?\n/u);
      let currentHeading: string | undefined;

      // Use Obsidian's metadata cache to get code block sections
      const fileCache = this.app.metadataCache.getFileCache(file);
      const codeSections = fileCache?.sections?.filter(s => s.type === 'code') ?? [];

      // Build a set of line numbers that are inside code blocks
      const codeBlockLines = new Set<number>();
      for (const section of codeSections) {
        // Section positions are 0-indexed, convert to 1-indexed line numbers
        const startLine = section.position.start.line + 1;
        const endLine = section.position.end.line + 1;
        for (let i = startLine; i <= endLine; i++) {
          codeBlockLines.add(i);
        }
      }

      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const lineNumber = index + 1;

        // Skip tasks inside code blocks (using Obsidian's metadata)
        if (codeBlockLines.has(lineNumber)) continue;

        const headingMatch = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/u);
        if (headingMatch) {
          currentHeading = headingMatch[1].trim();
        }

        const parsed = parseTaskLine(line, file.path, index + 1, this.settings);
        if (!parsed) continue;
        parsed.sectionHeading = currentHeading;
        // Filter out completed and cancelled tasks if setting is disabled
        if (!options?.ignoreIncludeCompleted && !this.settings.includeCompleted && (parsed.displayStatus === "completed" || parsed.displayStatus === "cancelled")) {
          continue;
        }
        tasks.push(parsed);
      }
    }

    // Update blocked status based on current task list
    const completedIds = new Set(tasks.filter(t => t.displayStatus === "completed").map(t => t.taskId).filter(Boolean));
    for (const task of tasks) {
      if (task.dependsOn) {
        task.blocked = !completedIds.has(task.dependsOn);
        // Recompute GTD state with updated blocked status
        task.gtdState = computeGtdState(task.displayStatus, task.checkboxStatus, task.description, task.dueDate, task.startDate, task.blocked);
      }
    }

    return sortTasks(tasks);
  }

  // Task operations
  async toggleTaskStatus(task: ParsedTask): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) {
      new Notice(`File not found: ${task.filePath}`);
      return;
    }

    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      new Notice(`Line ${task.lineNumber} not found in file`);
      return;
    }

    const line = lines[lineIndex];
    const isCompleted = this.settings.completionMarkers.includes(task.checkboxStatus.trim());
    const defaultCompleteMarker = this.settings.completionMarkers[0] ?? "x";
    const newMarker = isCompleted ? " " : defaultCompleteMarker;
    let newLine = line.replace(/\[[^\]]*\]/u, `[${newMarker}]`);

    // Add or remove completion date
    if (!isCompleted && this.settings.trackCompletionDate) {
      // Task is being completed - add completion date
      const today = new Date().toISOString().split("T")[0];
      newLine = `${newLine} ✅ ${today}`;
    } else if (isCompleted && this.settings.trackCompletionDate) {
      // Task is being reopened - remove completion date
      newLine = newLine.replace(/\s*✅\s*\d{4}-\d{2}-\d{2}/u, "");
    }

    if (newLine !== line) {
      lines[lineIndex] = newLine;
      await this.app.vault.modify(file, lines.join("\n"));
      new Notice(isCompleted ? "Task reopened" : "Task completed");
    }
  }

  async cancelTask(task: ParsedTask): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) {
      new Notice(`File not found: ${task.filePath}`);
      return;
    }

    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      new Notice(`Line ${task.lineNumber} not found in file`);
      return;
    }

    const line = lines[lineIndex];
    const defaultCancelledMarker = this.settings.cancelledMarkers[0] ?? "-";
    const newLine = line.replace(/\[[^\]]*\]/u, `[${defaultCancelledMarker}]`);

    if (newLine !== line) {
      lines[lineIndex] = newLine;
      await this.app.vault.modify(file, lines.join("\n"));
      new Notice("Task cancelled");
    }
  }

  async startTask(task: ParsedTask): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) {
      new Notice(`File not found: ${task.filePath}`);
      return;
    }

    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      new Notice(`Line ${task.lineNumber} not found in file`);
      return;
    }

    const line = lines[lineIndex];
    const today = new Date().toISOString().slice(0, 10);

    // Add start date emoji if not present
    let newLine = line;
    if (!line.includes("🛫")) {
      newLine = `${line} 🛫 ${today}`;
    }

    // Also add #doing tag if not present
    if (!line.toLowerCase().includes("#doing")) {
      newLine = `${newLine} #doing`;
    }

    if (newLine !== line) {
      lines[lineIndex] = newLine;
      await this.app.vault.modify(file, lines.join("\n"));
      new Notice("Task started");
    }
  }

  async deleteTask(task: ParsedTask): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) {
      new Notice(`File not found: ${task.filePath}`);
      return;
    }

    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      new Notice(`Line ${task.lineNumber} not found in file`);
      return;
    }

    lines.splice(lineIndex, 1);
    await this.app.vault.modify(file, lines.join("\n"));
    new Notice("Task deleted");
  }

  async updateTaskLine(task: ParsedTask, newLine: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) {
      new Notice(`File not found: ${task.filePath}`);
      return;
    }

    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      new Notice(`Line ${task.lineNumber} not found in file`);
      return;
    }

    lines[lineIndex] = newLine;
    await this.app.vault.modify(file, lines.join("\n"));
  }

  // Check if there's a date conflict (start date > due date)
  private checkDateConflict(startDate: string | undefined, dueDate: string | undefined): boolean {
    if (!startDate || !dueDate) return false;
    return startDate > dueDate;
  }

  // Drag and drop: move task to different state/quadrant
  async moveTaskToGTDState(task: ParsedTask, newState: ParsedTask["gtdState"]): Promise<void> {
    // Determine what changes are needed for this GTD state transition
    const today = new Date().toISOString().slice(0, 10);
    let updates: Partial<Pick<ParsedTask, "startDate" | "scheduledDate" | "dueDate">> = {};
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

    // Check for date conflict when setting start date
    const effectiveStartDate = updates.startDate ?? task.startDate;
    const effectiveDueDate = updates.dueDate ?? task.dueDate;
    const hasDateConflict = this.checkDateConflict(effectiveStartDate, effectiveDueDate);

    // If there's a conflict and we're setting start date, show modal
    if (hasDateConflict && updates.startDate) {
      new DateConflictModal(
        this.app,
        effectiveStartDate!,
        effectiveDueDate!,
        async (result) => {
          if (result.adjustDueDate) {
            updates.dueDate = today;
            new Notice("Due date adjusted to today");
          } else if (result.addConflictTag) {
            // Will add conflict tag below
            new Notice("Date conflict tag added");
          } else {
            // User cancelled, abort the move
            return;
          }
          await this.applyGtdStateChanges(task, newState, updates, tagToAdd, removeTags, shouldComplete, result.addConflictTag);
        }
      ).open();
      return;
    }

    // If no actual changes needed and state is the same, return early
    const noChangesNeeded = task.gtdState === newState &&
      !updates.startDate &&
      !updates.dueDate &&
      !shouldComplete;
    if (noChangesNeeded) return;

    await this.applyGtdStateChanges(task, newState, updates, tagToAdd, removeTags, shouldComplete, false);
  }

  private async applyGtdStateChanges(
    task: ParsedTask,
    newState: ParsedTask["gtdState"],
    updates: Partial<Pick<ParsedTask, "startDate" | "scheduledDate" | "dueDate">>,
    tagToAdd: string,
    removeTags: string[],
    shouldComplete: boolean,
    addConflictTag: boolean
  ): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) return;

    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) return;

    let line = lines[lineIndex];

    // Remove old GTD tags
    for (const tag of removeTags) {
      const tagRegex = new RegExp(`\\s*${tag}\\b`, "gi");
      line = line.replace(tagRegex, "");
    }
    // Also remove conflict tag if present
    line = line.replace(/\s*#due-date-conflict\b/gi, "");
    line = line.trim();

    // Add appropriate tag for new state
    if (tagToAdd && !line.toLowerCase().includes(tagToAdd.toLowerCase())) {
      line += ` ${tagToAdd}`;
    }

    // Add conflict tag if needed
    if (addConflictTag && !line.toLowerCase().includes("#due-date-conflict")) {
      line += " #due-date-conflict";
    }

    // Mark as completed if needed
    if (shouldComplete) {
      const defaultCompleteMarker = this.settings.completionMarkers[0] ?? "x";
      line = line.replace(/\[[^\]]*\]/u, `[${defaultCompleteMarker}]`);
    }

    // Update start date if needed
    if (updates.startDate !== undefined) {
      // Remove existing start date (emoji and date)
      line = line.replace(/\s*🛫(?:\s*\d{4}-\d{2}-\d{2})?/gu, "");
      if (updates.startDate) {
        line += ` 🛫 ${updates.startDate}`;
      }
    }

    // Update due date if needed
    if (updates.dueDate !== undefined) {
      line = line.replace(/\s*📅(?:\s*\d{4}-\d{2}-\d{2})?/gu, "");
      if (updates.dueDate) {
        line += ` 📅 ${updates.dueDate}`;
      }
    }

    lines[lineIndex] = line;
    await this.app.vault.modify(file, lines.join("\n"));
    new Notice(`Moved to ${newState}`);
  }

  async moveTaskToQuadrant(task: ParsedTask, newQuadrant: ParsedTask["quadrant"]): Promise<void> {
    if (task.quadrant === newQuadrant) return;

    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) return;

    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) return;

    let line = lines[lineIndex];
    const today = new Date().toISOString().slice(0, 10);

    // Update priority and due date based on quadrant
    let priorityMarker = "";
    let shouldAddDueDate = false;
    let shouldClearDueDate = false;

    switch (newQuadrant) {
      case "Q1":
        priorityMarker = "🔼"; // High priority
        shouldAddDueDate = true;
        break;
      case "Q2":
        priorityMarker = "🔼"; // High priority
        shouldClearDueDate = true;
        break;
      case "Q3":
        priorityMarker = "🔽"; // Low priority
        shouldAddDueDate = true;
        break;
      case "Q4":
        priorityMarker = "⏬"; // Lowest priority
        shouldClearDueDate = true;
        break;
    }

    // Remove existing priority markers (use alternation instead of character class for emoji)
    line = line.replace(/⏫|🔼|🔽|⏬/gu, "").trim();

    // Add new priority marker after checkbox
    if (priorityMarker) {
      const checkboxMatch = line.match(/^(\s*[-*]\s*\[[ xX/-]\]\s*)/);
      if (checkboxMatch) {
        line = line.replace(checkboxMatch[1], checkboxMatch[1] + priorityMarker + " ");
      }
    }

    // Handle due date based on quadrant
    // Always remove any existing due date emoji (with or without date) first to avoid duplicates
    line = line.replace(/\s*📅(?:\s*\d{4}-\d{2}-\d{2})?/gu, "").trim();
    if (shouldAddDueDate) {
      line = line + ` 📅 ${today}`;
    }

    lines[lineIndex] = line;
    await this.app.vault.modify(file, lines.join("\n"));
    new Notice(`Moved to ${newQuadrant}`);
  }

  private addStyles(): void {
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
        width: 100%;
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
        width: 100%;
        box-sizing: border-box;
      }
      .task-matrix-segmented {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      .task-matrix-filter-wrap {
        position: relative;
      }
      .task-matrix-filter-btn {
        padding: 6px 10px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        border-radius: 6px;
        cursor: pointer;
        min-height: 34px;
      }
      .task-matrix-filter-btn.is-active {
        background: var(--background-modifier-hover);
        border-color: var(--interactive-accent);
      }
      .task-matrix-filter-panel {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        z-index: 20;
        width: min(360px, 90vw);
        padding: 12px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 8px;
        background: var(--background-primary);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
      }
      .task-matrix-filter-panel[hidden] {
        display: none;
      }
      .task-matrix-filter-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .task-matrix-filter-row {
        display: grid;
        grid-template-columns: 88px 1fr 1fr;
        gap: 8px;
        align-items: center;
      }
      .task-matrix-filter-row label {
        font-size: 12px;
        color: var(--text-muted);
        font-weight: 600;
      }
      .task-matrix-filter-row select,
      .task-matrix-filter-row input {
        width: 100%;
        min-height: 34px;
        padding: 6px 8px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        background: var(--background-secondary);
        color: var(--text-normal);
        box-sizing: border-box;
      }
      .task-matrix-filter-row input:disabled {
        background: var(--background-modifier-hover);
        color: var(--text-faint);
        border-color: var(--background-modifier-border);
        cursor: not-allowed;
        opacity: 0.75;
      }
      .task-matrix-filter-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
      }
      .task-matrix-filter-clear {
        padding: 6px 10px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        background: var(--background-secondary);
        color: var(--text-normal);
        cursor: pointer;
      }
      .task-matrix-mode-button {
        padding: 6px 12px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        min-height: 34px;
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
        min-height: 34px;
      }
      .task-matrix-empty {
        text-align: center;
        padding: 48px;
        color: var(--text-muted);
      }
      .task-matrix-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .task-matrix-list-toolbar {
        display: flex;
        justify-content: flex-end;
      }
      .task-matrix-list-toggle-all {
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        border-radius: 6px;
        padding: 6px 10px;
        cursor: pointer;
      }
      .task-matrix-board {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
        align-items: start;
      }
      .task-matrix-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
      .task-calendar {
        background: var(--background-secondary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 8px;
        padding: 12px;
      }
      .task-calendar-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 10px;
        flex-wrap: wrap;
      }
      .task-calendar-segmented {
        display: flex;
        gap: 4px;
      }
      .task-calendar-mode-btn,
      .task-calendar-nav-btn {
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        border-radius: 6px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 12px;
      }
      .task-calendar-mode-btn.active {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
      }
      .task-calendar-nav {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .task-calendar-summary-wrap {
        position: relative;
      }
      .task-calendar-summary-popup {
        position: absolute;
        right: 0;
        top: calc(100% + 6px);
        z-index: 15;
        min-width: 180px;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 8px;
        padding: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
      }
      .task-calendar-summary-popup[hidden] {
        display: none;
      }
      .task-calendar-summary-popup ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .task-calendar-summary-popup li {
        font-size: 12px;
        color: var(--text-normal);
      }
      .task-calendar-title {
        min-width: 130px;
        text-align: center;
        font-size: 13px;
        font-weight: 600;
      }
      .task-calendar-month {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
      }
      .task-calendar-heads,
      .task-calendar-month-grid {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 6px;
        min-width: 0;
      }
      .task-calendar-head {
        font-size: 11px;
        color: var(--text-muted);
        text-align: center;
      }
      .task-calendar-head.weekend {
        color: var(--interactive-accent);
      }
      .task-calendar-day {
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        border-radius: 6px;
        min-height: 110px;
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .task-calendar-day.weekend-day {
        background: var(--background-modifier-active-hover);
      }
      .task-calendar-day.weekend-day .task-calendar-date {
        color: var(--interactive-accent);
      }
      .task-calendar-day.outside {
        opacity: 0.45;
      }
      .task-calendar-day.today {
        border: 2px solid var(--interactive-accent);
        background: var(--background-modifier-active-hover);
      }
      .task-calendar-day.weekend-day.today {
        background: color-mix(in srgb, var(--interactive-accent) 14%, var(--background-primary));
      }
      .task-calendar-day.today .task-calendar-date {
        color: var(--interactive-accent);
      }
      .task-calendar-date {
        font-size: 11px;
        font-weight: 600;
      }
      .task-calendar-items {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .task-calendar-item {
        display: block;
        padding: 2px 4px;
        border-radius: 4px;
        font-size: 10px;
        line-height: 1.35;
        color: var(--text-normal);
        background: var(--background-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .task-calendar-item.type-due { border-left: 2px solid #f59e0b; }
      .task-calendar-item.type-start { border-left: 2px solid #3b82f6; }
      .task-calendar-item.type-scheduled { border-left: 2px solid #8b5cf6; }
      .task-calendar-item.type-done { border-left: 2px solid #22c55e; }
      .task-calendar-item.type-overdue { border-left: 2px solid #ef4444; }
      .task-calendar-item.type-process { border-left: 2px solid #0ea5e9; }
      .task-calendar-week {
        display: grid;
        grid-template-columns: repeat(5, minmax(160px, 1fr));
        gap: 8px;
        overflow-x: auto;
      }
      .task-calendar-week-split {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .task-calendar-week-main {
        grid-template-columns: repeat(5, minmax(160px, 1fr));
      }
      .task-calendar-week-compact {
        grid-template-columns: repeat(5, minmax(160px, 1fr));
      }
      .task-calendar-weekend {
        display: grid;
        grid-template-columns: repeat(2, minmax(160px, 1fr));
        gap: 8px;
      }
      .task-calendar-day.week-day {
        min-height: 180px;
      }
      .task-calendar-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .task-calendar-list-day {
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        overflow: hidden;
        background: var(--background-primary);
      }
      .task-calendar-list-day.today {
        border-color: var(--interactive-accent);
        background: var(--background-modifier-active-hover);
      }
      .task-calendar-list-day.today > summary {
        color: var(--interactive-accent);
        font-weight: 700;
      }
      .task-calendar-list-day > summary {
        cursor: pointer;
        list-style: none;
        padding: 8px 10px;
        font-size: 12px;
        color: var(--text-muted);
        border-bottom: 1px solid var(--background-modifier-border);
      }
      .task-calendar-list-content {
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      @media (max-width: 800px) {
        .task-matrix-view {
          padding: 10px;
        }
        .task-matrix-header {
          margin-bottom: 12px;
        }
        .task-matrix-title {
          font-size: 20px;
        }
        .task-matrix-subtitle {
          font-size: 12px;
        }
        .task-matrix-toolbar {
          align-items: stretch;
          gap: 10px;
          padding: 10px;
        }
        .task-matrix-search {
          min-width: 0;
        }
        .task-matrix-segmented {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          width: 100%;
        }
        .task-matrix-filter-wrap {
          width: 100%;
        }
        .task-matrix-filter-btn {
          width: 100%;
          min-height: 38px;
        }
        .task-matrix-mode-button,
        .task-matrix-refresh {
          width: 100%;
          min-height: 38px;
        }
        .task-matrix-filter-panel {
          position: static;
          width: 100%;
          margin-top: 8px;
        }
        .task-matrix-filter-row {
          grid-template-columns: 1fr;
        }
        .task-matrix-board {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 6px;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
        }
        .task-matrix-column {
          min-width: min(84vw, 320px);
          flex: 0 0 min(84vw, 320px);
          scroll-snap-align: start;
        }
        .task-matrix-grid {
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .task-matrix-cell {
          min-height: 0;
        }
        .task-matrix-cell.is-mobile-collapsible .task-matrix-collapse-indicator {
          display: inline-flex;
        }
        .task-matrix-cell.is-mobile-collapsible .task-matrix-column-header {
          margin-bottom: 0;
        }
        .task-matrix-cell.is-mobile-collapsible:not(.is-collapsed) .task-matrix-column-header {
          margin-bottom: 12px;
        }
        .task-matrix-card {
          padding: 12px;
        }
        .task-matrix-card-top {
          flex-direction: column;
        }
        .task-matrix-badge {
          align-self: flex-start;
        }
        .task-matrix-card-actions {
          gap: 6px;
        }
        .task-matrix-action-btn {
          min-height: 32px;
        }
        .task-calendar-toolbar {
          align-items: stretch;
        }
        .task-calendar-segmented,
        .task-calendar-nav {
          width: 100%;
        }
        .task-calendar-segmented {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .task-calendar-nav {
          flex-wrap: wrap;
          justify-content: space-between;
        }
        .task-calendar-title {
          order: -1;
          width: 100%;
          min-width: 0;
          text-align: left;
        }
        .task-calendar-summary-wrap {
          margin-left: auto;
        }
        .task-calendar-month {
          overflow-x: auto;
          padding-bottom: 4px;
          -webkit-overflow-scrolling: touch;
        }
        .task-calendar-heads,
        .task-calendar-month-grid {
          min-width: 560px;
        }
        .task-calendar-week,
        .task-calendar-week-main,
        .task-calendar-week-compact,
        .task-calendar-weekend {
          display: flex;
          overflow-x: auto;
          width: 100%;
          padding-bottom: 4px;
          -webkit-overflow-scrolling: touch;
        }
        .task-calendar-week .task-calendar-day,
        .task-calendar-weekend .task-calendar-day {
          min-width: min(78vw, 240px);
          flex: 0 0 min(78vw, 240px);
        }
        .task-calendar-day {
          min-height: auto;
        }
        .task-calendar-summary-popup {
          right: 0;
          left: auto;
          max-width: min(88vw, 260px);
        }
        .task-matrix-modal {
          padding: 16px;
        }
        .task-matrix-input-row {
          align-items: stretch;
        }
        .task-matrix-input-row > * {
          width: 100%;
        }
        .task-matrix-modal-buttons {
          justify-content: stretch;
        }
        .task-matrix-modal-buttons button {
          flex: 1 1 100%;
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
        gap: 8px;
        flex-wrap: wrap;
      }
      .task-matrix-column-header h3 {
        font-size: 14px;
        margin: 0;
        font-weight: 600;
        min-width: 0;
      }
      .task-matrix-column-header.is-collapsible {
        cursor: pointer;
      }
      .task-matrix-column-title {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .task-matrix-collapse-indicator {
        display: none;
        font-size: 12px;
        color: var(--text-muted);
        flex: 0 0 auto;
      }
      .task-matrix-cell-body.is-collapsed {
        display: none;
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
        min-width: 0;
      }
      .task-matrix-card-title p {
        margin: 0;
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
        word-break: break-word;
      }
      .task-matrix-card-actions {
        display: flex;
        gap: 4px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--background-modifier-border);
        flex-wrap: wrap;
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
        gap: 8px;
        flex-wrap: wrap;
      }
      .task-matrix-modal-buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 20px;
        flex-wrap: wrap;
      }
      .task-matrix-folder-group {
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        overflow: hidden;
        background: var(--background-primary);
      }
      .task-matrix-folder-header {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);
        padding: 8px 10px;
        background: var(--background-primary);
        margin: 0;
        border-bottom: 1px solid var(--background-modifier-border);
      }
      .task-matrix-folder-header.task-matrix-folder-toggle {
        width: 100%;
        text-align: left;
        border: none;
        cursor: pointer;
      }
      .task-matrix-folder-header.task-matrix-folder-toggle:hover {
        background: var(--background-modifier-hover);
      }
      .task-matrix-folder-content {
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .task-matrix-folder-content.is-collapsed {
        display: none;
      }
    `;
    document.head.appendChild(styleEl);
  }

  private removeStyles(): void {
    const styleEl = document.getElementById("task-matrix-styles");
    if (styleEl) {
      styleEl.remove();
    }
  }
}

class TaskMatrixView extends ItemView {
  private currentView: ViewMode;
  private calendarMode: "month" | "week" | "list" = "month";
  private calendarDate = new Date();
  private calendarSummaryOpen = false;
  private searchQuery = "";
  private dateFiltersOpen = false;
  private startDateFilter: DateFilterConfig = { operator: "any", value: "" };
  private dueDateFilter: DateFilterConfig = { operator: "any", value: "" };
  private collapsedMatrixQuadrants = new Set<ParsedTask["quadrant"]>();
  private collapsedFolderGroups = new Set<string>();
  private shellEl: HTMLElement | null = null;
  private bodyEl: HTMLElement | null = null;
  private searchEl: HTMLInputElement | null = null;
  private searchDebounceTimer: number | null = null;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: TaskMatrixPlugin) {
    super(leaf);
    this.currentView = plugin.settings.defaultView;
  }

  getViewType(): string {
    return VIEW_TYPE_TASK_MATRIX;
  }

  getDisplayText(): string {
    return "Task Matrix";
  }

  getIcon(): string {
    return "kanban-square";
  }

  async onOpen(): Promise<void> {
    await this.render();
  }

  async onClose(): Promise<void> {
    if (this.searchDebounceTimer) {
      window.clearTimeout(this.searchDebounceTimer);
    }
    this.contentEl.empty();
  }

  async render(): Promise<void> {
    const root = this.contentEl;
    root.empty();
    root.addClass("task-matrix-view");

    this.shellEl = root.createDiv({ cls: "task-matrix-shell" });
    this.renderHeader(this.shellEl);
    await this.renderBodyContainer(this.shellEl);
  }

  private async renderBodyContainer(parent: HTMLElement): Promise<void> {
    // Remove old body if exists
    if (this.bodyEl) {
      this.bodyEl.remove();
    }
    this.bodyEl = parent.createDiv({ cls: "task-matrix-body" });
    await this.renderBodyContent(this.bodyEl);
  }

  private async refreshBody(): Promise<void> {
    if (this.bodyEl) {
      this.bodyEl.empty();
      await this.renderBodyContent(this.bodyEl);
    }
  }

  private get filteredTasks(): ParsedTask[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.plugin.tasks;
    return this.plugin.tasks.filter((task) => {
      const matchesQuery = [task.description, task.filePath, task.taskId, task.dependsOn]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      return matchesQuery;
    });
  }

  private get visibleTasks(): ParsedTask[] {
    return this.filteredTasks.filter((task) => {
      return this.matchesDateFilter(task.startDate, this.startDateFilter)
        && this.matchesDateFilter(task.dueDate, this.dueDateFilter);
    });
  }

  private matchesDateFilter(dateValue: string | undefined, filter: DateFilterConfig): boolean {
    switch (filter.operator) {
      case "any":
        return true;
      case "is-empty":
        return !dateValue;
      case "is-not-empty":
        return Boolean(dateValue);
      default:
        if (!dateValue || !filter.value) return true;
        switch (filter.operator) {
          case "not-on":
            return dateValue !== filter.value;
          case "on":
            return dateValue === filter.value;
          case "before":
            return dateValue < filter.value;
          case "on-or-before":
            return dateValue <= filter.value;
          case "after":
            return dateValue > filter.value;
          case "on-or-after":
            return dateValue >= filter.value;
          default:
            return true;
        }
    }
  }

  private usesDateValue(operator: DateFilterOperator): boolean {
    return !["any", "is-empty", "is-not-empty"].includes(operator);
  }

  private isMobileLayout(): boolean {
    return window.matchMedia("(max-width: 800px)").matches;
  }

  private getActiveDateFilterCount(): number {
    let count = 0;
    if (this.startDateFilter.operator !== "any") count++;
    if (this.dueDateFilter.operator !== "any") count++;
    return count;
  }

  private renderHeader(parent: HTMLElement): void {
    const header = parent.createDiv({ cls: "task-matrix-header" });
    const titleBlock = header.createDiv({ cls: "task-matrix-title-block" });
    titleBlock.createEl("div", { text: "Obsidian Task Matrix", cls: "task-matrix-kicker" });
    titleBlock.createEl("h2", { text: "Vault task dashboards", cls: "task-matrix-title" });
    titleBlock.createEl("p", {
      text: `${this.plugin.tasks.length} tasks across ${new Set(this.plugin.tasks.map((task) => task.filePath)).size} files`,
      cls: "task-matrix-subtitle",
    });

    const toolbar = header.createDiv({ cls: "task-matrix-toolbar" });
    this.searchEl = toolbar.createEl("input", {
      type: "search",
      placeholder: "Search tasks, file paths, ids...",
      cls: "task-matrix-search",
    });
    this.searchEl.value = this.searchQuery;
    this.searchEl.addEventListener("input", () => {
      this.searchQuery = this.searchEl?.value || "";
      // Debounce body refresh to allow continuous typing
      if (this.searchDebounceTimer) {
        window.clearTimeout(this.searchDebounceTimer);
      }
      this.searchDebounceTimer = window.setTimeout(() => {
        this.refreshBody();
      }, 150);
    });

    const filterWrap = toolbar.createDiv({ cls: "task-matrix-filter-wrap" });
    const activeDateFilterCount = this.getActiveDateFilterCount();
    const filterButton = filterWrap.createEl("button", {
      text: activeDateFilterCount > 0 ? `Date Filters (${activeDateFilterCount})` : "Date Filters",
      cls: `task-matrix-filter-btn${activeDateFilterCount > 0 ? " is-active" : ""}`,
    });
    const updateFilterButtonState = (): void => {
      const count = this.getActiveDateFilterCount();
      filterButton.setText(count > 0 ? `Date Filters (${count})` : "Date Filters");
      filterButton.toggleClass("is-active", count > 0);
    };
    filterButton.addEventListener("click", () => {
      this.dateFiltersOpen = !this.dateFiltersOpen;
      if (this.dateFiltersOpen) {
        filterPanel.removeAttribute("hidden");
      } else {
        filterPanel.setAttribute("hidden", "hidden");
      }
    });

    const filterPanel = filterWrap.createDiv({ cls: "task-matrix-filter-panel" });
    if (!this.dateFiltersOpen) {
      filterPanel.setAttribute("hidden", "hidden");
    }
    const filterGroup = filterPanel.createDiv({ cls: "task-matrix-filter-group" });

    const renderDateFilterRow = (
      label: string,
      filter: DateFilterConfig,
      onChange: (next: DateFilterConfig) => void
    ): void => {
      const row = filterGroup.createDiv({ cls: "task-matrix-filter-row" });
      row.createEl("label", { text: label });

      const selectEl = row.createEl("select");
      const options: Array<{ value: DateFilterOperator; label: string }> = [
        { value: "any", label: "Any" },
        { value: "not-on", label: "Not on" },
        { value: "on", label: "On" },
        { value: "before", label: "Before" },
        { value: "on-or-before", label: "On or before" },
        { value: "after", label: "After" },
        { value: "on-or-after", label: "On or after" },
        { value: "is-empty", label: "Is empty" },
        { value: "is-not-empty", label: "Is not empty" },
      ];
      for (const option of options) {
        selectEl.createEl("option", { value: option.value, text: option.label });
      }
      selectEl.value = filter.operator;

      const dateInput = row.createEl("input", { type: "date" });
      dateInput.value = filter.value;
      const syncDateInputState = (): void => {
        const needsDate = this.usesDateValue(selectEl.value as DateFilterOperator);
        dateInput.disabled = !needsDate;
        if (!needsDate) {
          dateInput.value = "";
        }
      };
      syncDateInputState();

      const updateFilter = (): void => {
        const operator = selectEl.value as DateFilterOperator;
        const value = this.usesDateValue(operator) ? dateInput.value : "";
        onChange({ operator, value });
        updateFilterButtonState();
        void this.refreshBody();
      };

      selectEl.addEventListener("change", () => {
        syncDateInputState();
        updateFilter();
      });
      dateInput.addEventListener("change", updateFilter);
    };

    renderDateFilterRow("Start date", this.startDateFilter, (next) => {
      this.startDateFilter = next;
    });
    renderDateFilterRow("Due date", this.dueDateFilter, (next) => {
      this.dueDateFilter = next;
    });

    const filterActions = filterPanel.createDiv({ cls: "task-matrix-filter-actions" });
    const clearButton = filterActions.createEl("button", {
      text: "Clear filters",
      cls: "task-matrix-filter-clear",
    });
    clearButton.addEventListener("click", async () => {
      this.startDateFilter = { operator: "any", value: "" };
      this.dueDateFilter = { operator: "any", value: "" };
      this.dateFiltersOpen = false;
      updateFilterButtonState();
      await this.render();
    });

    const segmented = toolbar.createDiv({ cls: "task-matrix-segmented" });
    this.renderModeButton(segmented, "list", ICONS.list);
    this.renderModeButton(segmented, "gtd", ICONS.gtd);
    this.renderModeButton(segmented, "eisenhower", ICONS.eisenhower);
    this.renderModeButton(segmented, "calendar", ICONS.calendar);

    const refreshButton = toolbar.createEl("button", {
      text: ICONS.refresh,
      cls: "task-matrix-refresh",
    });
    refreshButton.title = "Refresh task index";
    refreshButton.addEventListener("click", async () => {
      await this.plugin.refreshTasks(true);
    });
  }

  private renderModeButton(parent: HTMLElement, mode: ViewMode, label: string): void {
    const button = parent.createEl("button", {
      text: label,
      cls: `task-matrix-mode-button${this.currentView === mode ? " is-active" : ""}`,
    });
    button.addEventListener("click", async () => {
      this.currentView = mode;
      await this.render();
    });
  }

  private async renderBodyContent(parent: HTMLElement): Promise<void> {
    const tasks = this.visibleTasks;
    if (tasks.length === 0) {
      const empty = parent.createDiv({ cls: "task-matrix-empty" });
      empty.createEl("h3", { text: "No tasks found" });
      empty.createEl("p", {
        text: this.searchQuery || this.getActiveDateFilterCount() > 0
          ? "The current search or date filters did not match any tasks."
          : "Create markdown tasks in your vault, then refresh this view.",
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

    if (this.currentView === "calendar") {
      await this.renderCalendar(parent, tasks);
      return;
    }

    await this.renderEisenhower(parent, tasks);
  }

  private async renderList(parent: HTMLElement, tasks: ParsedTask[]): Promise<void> {
    const wrap = parent.createDiv({ cls: "task-matrix-list" });

    if (this.plugin.settings.listGroupByFolder) {
      // Group tasks by folder
      const grouped = this.groupTasksByFolder(tasks, this.plugin.settings.listGroupByFolderDepth);
      const groupEntries = Object.entries(grouped);
      const listToolbar = wrap.createDiv({ cls: "task-matrix-list-toolbar" });
      const toggleAllButton = listToolbar.createEl("button", { cls: "task-matrix-list-toggle-all" });
      const updateToggleAllButton = (): void => {
        const allCollapsed = groupEntries.length > 0 && groupEntries.every(([folderPath]) => {
          const groupKey = folderPath || "Root";
          return this.collapsedFolderGroups.has(groupKey);
        });
        toggleAllButton.setText(allCollapsed ? "Expand all" : "Collapse all");
      };
      updateToggleAllButton();
      toggleAllButton.addEventListener("click", async () => {
        const allCollapsed = groupEntries.length > 0 && groupEntries.every(([folderPath]) => {
          const groupKey = folderPath || "Root";
          return this.collapsedFolderGroups.has(groupKey);
        });
        if (allCollapsed) {
          this.collapsedFolderGroups.clear();
        } else {
          this.collapsedFolderGroups = new Set(groupEntries.map(([folderPath]) => folderPath || "Root"));
        }
        await this.refreshBody();
      });

      for (const [folderPath, folderTasks] of groupEntries) {
        const groupEl = wrap.createDiv({ cls: "task-matrix-folder-group" });
        const groupKey = folderPath || "Root";
        const toggle = groupEl.createEl("button", {
          cls: "task-matrix-folder-header task-matrix-folder-toggle",
        });
        const content = groupEl.createDiv({ cls: "task-matrix-folder-content" });
        const renderToggleLabel = (): void => {
          const collapsed = this.collapsedFolderGroups.has(groupKey);
          const marker = collapsed ? "▸" : "▾";
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
          updateToggleAllButton();
        });

        for (const task of folderTasks) {
          await this.createTaskCard(content, task, `${task.filePath}:${task.lineNumber}`);
        }
      }
    } else {
      // Flat list
      const flatGroup = wrap.createDiv({ cls: "task-matrix-folder-group" });
      flatGroup.createDiv({ cls: "task-matrix-folder-header", text: `All tasks (${tasks.length})` });
      const flatContent = flatGroup.createDiv({ cls: "task-matrix-folder-content" });
      for (const task of tasks) {
        await this.createTaskCard(flatContent, task, `${task.filePath}:${task.lineNumber}`);
      }
    }
  }

  private groupTasksByFolder(tasks: ParsedTask[], depth: number): Record<string, ParsedTask[]> {
    const grouped: Record<string, ParsedTask[]> = {};

    for (const task of tasks) {
      const folderPath = this.getFolderPath(task.filePath, depth);
      if (!grouped[folderPath]) {
        grouped[folderPath] = [];
      }
      grouped[folderPath].push(task);
    }

    // Sort folder keys alphabetically
    return Object.keys(grouped)
      .sort()
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {} as Record<string, ParsedTask[]>);
  }

  private getFolderPath(filePath: string, depth: number): string {
    const parts = filePath.split("/");
    // Remove filename
    parts.pop();

    if (parts.length === 0) {
      return "";
    }

    // Take only up to depth levels
    const folderParts = parts.slice(0, depth);
    return folderParts.join("/");
  }

  private mapTaskToGtdColumn(task: ParsedTask, simpleFlow: boolean): ParsedTask["gtdState"] {
    if (!simpleFlow) return task.gtdState;
    if (task.gtdState === "To be Started") return "Inbox";
    if (task.gtdState === "Overdue") {
      const todayIso = new Date().toISOString().slice(0, 10);
      const desc = task.description.toLowerCase();
      const hasActiveTag = desc.includes("#doing") || desc.includes("#active") || desc.includes("#next");
      const hasStarted = Boolean(task.startDate && task.startDate <= todayIso);
      return hasStarted || hasActiveTag ? "In Progress" : "Inbox";
    }
    return task.gtdState;
  }

  private async renderGtd(parent: HTMLElement, tasks: ParsedTask[]): Promise<void> {
    const board = parent.createDiv({ cls: "task-matrix-board" });
    const simpleFlow = !this.plugin.settings.includeCompleted;
    const columns: Array<{ title: string; state: ParsedTask["gtdState"] }> = simpleFlow
      ? [
          { title: "Inbox", state: "Inbox" },
          { title: "In Progress", state: "In Progress" },
          { title: "Waiting", state: "Waiting" },
        ]
      : [
          { title: "Inbox", state: "Inbox" },
          { title: "To be Started", state: "To be Started" },
          { title: "In Progress", state: "In Progress" },
          { title: "Waiting", state: "Waiting" },
          { title: "Overdue", state: "Overdue" },
          { title: "Done", state: "Done" },
        ];

    for (const column of columns) {
      const columnEl = board.createDiv({ cls: "task-matrix-column" });
      columnEl.dataset.state = column.state;

      // Drag and drop handlers
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

      // Define default values based on GTD state
      const getGtdDefaults = (state: ParsedTask["gtdState"]): Partial<ParsedTask> => {
        const today = new Date().toISOString().slice(0, 10);
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

  private async renderCalendar(parent: HTMLElement, tasks: ParsedTask[]): Promise<void> {
    const wrap = parent.createDiv({ cls: "task-calendar" });
    const toolbar = wrap.createDiv({ cls: "task-calendar-toolbar" });
    const modes = toolbar.createDiv({ cls: "task-calendar-segmented" });
    const listBtn = modes.createEl("button", { text: "List", cls: `task-calendar-mode-btn${this.calendarMode === "list" ? " active" : ""}` });
    const monthBtn = modes.createEl("button", { text: "Month", cls: `task-calendar-mode-btn${this.calendarMode === "month" ? " active" : ""}` });
    const weekBtn = modes.createEl("button", { text: "Week", cls: `task-calendar-mode-btn${this.calendarMode === "week" ? " active" : ""}` });
    listBtn.addEventListener("click", async () => { this.calendarMode = "list"; await this.render(); });
    monthBtn.addEventListener("click", async () => { this.calendarMode = "month"; await this.render(); });
    weekBtn.addEventListener("click", async () => { this.calendarMode = "week"; await this.render(); });

    const nav = toolbar.createDiv({ cls: "task-calendar-nav" });
    const prevBtn = nav.createEl("button", { text: "←", cls: "task-calendar-nav-btn" });
    const titleEl = nav.createEl("div", { cls: "task-calendar-title" });
    const todayBtn = nav.createEl("button", { text: "Today", cls: "task-calendar-nav-btn" });
    const nextBtn = nav.createEl("button", { text: "→", cls: "task-calendar-nav-btn" });
    const summaryWrap = nav.createDiv({ cls: "task-calendar-summary-wrap" });
    const summaryBtn = summaryWrap.createEl("button", { text: "Summary", cls: "task-calendar-nav-btn" });
    const summaryPopup = summaryWrap.createDiv({ cls: "task-calendar-summary-popup" });
    if (!this.calendarSummaryOpen) summaryPopup.setAttribute("hidden", "hidden");

    const allItems = this.collectCalendarItems(tasks);
    const todayIso = this.toCalendarIso(new Date());
    const summaryTasks = this.plugin.settings.includeCompleted
      ? tasks
      : await this.plugin.collectTasks({ ignoreIncludeCompleted: true });
    const summary = this.buildCalendarSummary(summaryTasks, todayIso);
    const summaryList = summaryPopup.createEl("ul");
    summaryList.createEl("li", { text: `Done: ${summary.done}/${summary.total}` });
    summaryList.createEl("li", { text: `Due: ${summary.due}` });
    summaryList.createEl("li", { text: `Overdue: ${summary.overdue}` });
    summaryList.createEl("li", { text: `Start: ${summary.start}` });
    summaryList.createEl("li", { text: `Scheduled: ${summary.scheduled}` });
    summaryList.createEl("li", { text: `Recurrence: ${summary.recurrence}` });
    summaryList.createEl("li", { text: `Daily Notes: ${summary.dailyNotes}` });

    const shiftCalendar = async (delta: number): Promise<void> => {
      const next = new Date(this.calendarDate);
      if (this.calendarMode === "week") {
        next.setDate(next.getDate() + delta * 7);
      } else {
        next.setMonth(next.getMonth() + delta);
      }
      this.calendarDate = next;
      await this.render();
    };
    prevBtn.addEventListener("click", async () => shiftCalendar(-1));
    nextBtn.addEventListener("click", async () => shiftCalendar(1));
    todayBtn.addEventListener("click", async () => { this.calendarDate = new Date(); await this.render(); });
    summaryBtn.addEventListener("click", () => {
      this.calendarSummaryOpen = !this.calendarSummaryOpen;
      if (this.calendarSummaryOpen) {
        summaryPopup.removeAttribute("hidden");
      } else {
        summaryPopup.setAttribute("hidden", "hidden");
      }
    });

    if (this.calendarMode === "month") {
      titleEl.setText(this.formatCalendarTitle(this.calendarDate, "month"));
      await this.renderCalendarMonth(wrap, allItems, todayIso);
      return;
    }
    if (this.calendarMode === "week") {
      titleEl.setText(this.formatCalendarTitle(this.calendarDate, "week"));
      await this.renderCalendarWeek(wrap, allItems, todayIso);
      return;
    }
    titleEl.setText(this.formatCalendarTitle(this.calendarDate, "list"));
    await this.renderCalendarList(wrap, allItems, todayIso);
  }

  private formatCalendarTitle(date: Date, mode: "month" | "week" | "list"): string {
    if (mode === "month" || mode === "list") {
      return date.toLocaleDateString(undefined, { year: "numeric", month: "long" });
    }
    const weekStart = this.startOfWeek(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
  }

  private startOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const sundayFirst = this.plugin.settings.calendarFirstDayOfWeek === "sunday";
    const offset = sundayFirst ? -day : (day === 0 ? -6 : 1 - day);
    result.setDate(result.getDate() + offset);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private getWeekdayOrder(): number[] {
    return this.plugin.settings.calendarFirstDayOfWeek === "sunday"
      ? [0, 1, 2, 3, 4, 5, 6]
      : [1, 2, 3, 4, 5, 6, 0];
  }

  private getWeekdayLabel(weekday: number): string {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return labels[weekday] ?? "";
  }

  private toCalendarIso(date: Date): string {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    const year = copy.getFullYear();
    const month = String(copy.getMonth() + 1).padStart(2, "0");
    const day = String(copy.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private isValidIso(value?: string): value is string {
    return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
  }

  private isDateInCalendarRange(dateIso: string): boolean {
    if (!this.isValidIso(dateIso)) return false;
    const check = new Date(dateIso);
    check.setHours(0, 0, 0, 0);
    if (this.calendarMode === "week") {
      const weekStart = this.startOfWeek(this.calendarDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return check >= weekStart && check <= weekEnd;
    }
    const monthStart = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth(), 1);
    const monthEnd = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() + 1, 0);
    monthStart.setHours(0, 0, 0, 0);
    monthEnd.setHours(23, 59, 59, 999);
    return check >= monthStart && check <= monthEnd;
  }

  private extractDailyNoteDate(filePath: string): string | undefined {
    const match = filePath.match(/(\d{4}-\d{2}-\d{2})/);
    return match?.[1];
  }

  private buildCalendarSummary(
    tasks: ParsedTask[],
    todayIso: string
  ): { total: number; done: number; due: number; overdue: number; start: number; scheduled: number; recurrence: number; dailyNotes: number } {
    const inScope = (task: ParsedTask): boolean => {
      return [
        task.dueDate,
        task.startDate,
        task.scheduledDate,
        task.doneDate,
        this.extractDailyNoteDate(task.filePath),
      ].some((date) => Boolean(date && this.isDateInCalendarRange(date)));
    };
    const scopedTasks = tasks.filter(inScope);
    const uniqueById = new Map(scopedTasks.map((task) => [task.id, task]));
    const values = Array.from(uniqueById.values());
    const activeTasks = values.filter((task) => {
      const checkbox = task.checkboxStatus.trim();
      const isDoneByMarker = this.plugin.settings.completionMarkers.includes(checkbox);
      const isCancelledByMarker = this.plugin.settings.cancelledMarkers.includes(checkbox);
      return !isDoneByMarker && !isCancelledByMarker && task.displayStatus !== "completed" && task.displayStatus !== "cancelled";
    });
    const done = values.filter((task) => task.displayStatus === "completed").length;
    const due = activeTasks.filter(
      (task) =>
        this.isValidIso(task.dueDate) &&
        this.isDateInCalendarRange(task.dueDate)
    ).length;
    const overdue = activeTasks.filter((task) => task.displayStatus === "overdue" && this.isValidIso(task.dueDate) && task.dueDate < todayIso).length;
    const start = activeTasks.filter((task) => this.isValidIso(task.startDate) && this.isDateInCalendarRange(task.startDate)).length;
    const scheduled = activeTasks.filter((task) => this.isValidIso(task.scheduledDate) && this.isDateInCalendarRange(task.scheduledDate)).length;
    const recurrence = activeTasks.filter((task) => Boolean(task.recurrence)).length;
    const dailyNotes = values.filter((task) => {
      const dailyDate = this.extractDailyNoteDate(task.filePath);
      return Boolean(dailyDate && this.isDateInCalendarRange(dailyDate) && !task.dueDate && !task.startDate && !task.scheduledDate);
    }).length;
    return {
      total: values.length,
      done,
      due,
      overdue,
      start,
      scheduled,
      recurrence,
      dailyNotes,
    };
  }

  private collectCalendarItems(tasks: ParsedTask[]): Record<string, Array<{ task: ParsedTask; type: "due" | "start" | "scheduled" | "done" | "overdue" | "process" }>> {
    const byDate: Record<string, Array<{ task: ParsedTask; type: "due" | "start" | "scheduled" | "done" | "overdue" | "process" }>> = {};
    const todayIso = this.toCalendarIso(new Date());
    const showInProcessTasks = this.plugin.settings.showCalendarInProcessTasks;

    const pushItem = (dateKey: string, task: ParsedTask, type: "due" | "start" | "scheduled" | "done" | "overdue" | "process"): void => {
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push({ task, type });
    };

    for (const task of tasks) {
      if (this.isValidIso(task.dueDate)) pushItem(task.dueDate, task, "due");
      if (this.isValidIso(task.startDate)) pushItem(task.startDate, task, "start");
      if (this.isValidIso(task.scheduledDate)) pushItem(task.scheduledDate, task, "scheduled");
      if (this.isValidIso(task.doneDate)) pushItem(task.doneDate, task, "done");
      if (task.displayStatus === "overdue" && this.isValidIso(task.dueDate) && task.dueDate < todayIso) {
        pushItem(todayIso, task, "overdue");
      }
      if (
        showInProcessTasks &&
        task.displayStatus !== "completed" &&
        task.displayStatus !== "cancelled" &&
        this.isValidIso(task.startDate) &&
        this.isValidIso(task.dueDate) &&
        task.startDate < task.dueDate
      ) {
        const start = new Date(task.startDate);
        const due = new Date(task.dueDate);
        for (
          let day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
          day < due;
          day.setDate(day.getDate() + 1)
        ) {
          pushItem(this.toCalendarIso(day), task, "process");
        }
      }
    }

    return byDate;
  }

  private async renderCalendarMonth(
    parent: HTMLElement,
    itemsByDate: Record<string, Array<{ task: ParsedTask; type: "due" | "start" | "scheduled" | "done" | "overdue" | "process" }>>,
    todayIso: string
  ): Promise<void> {
    const showWeekends = this.plugin.settings.showCalendarMonthWeekends;
    const weekdayOrder = this.getWeekdayOrder();
    const visibleWeekdays = showWeekends
      ? weekdayOrder
      : weekdayOrder.filter((weekday) => weekday !== 0 && weekday !== 6);
    const monthWrap = parent.createDiv({ cls: "task-calendar-month" });
    const heads = monthWrap.createDiv({ cls: "task-calendar-heads" });
    heads.style.gridTemplateColumns = `repeat(${visibleWeekdays.length}, minmax(0, 1fr))`;
    for (const weekday of visibleWeekdays) {
      const head = heads.createEl("div", { text: this.getWeekdayLabel(weekday), cls: "task-calendar-head" });
      if (weekday === 0 || weekday === 6) head.addClass("weekend");
    }
    const grid = monthWrap.createDiv({ cls: "task-calendar-month-grid" });
    grid.style.gridTemplateColumns = `repeat(${visibleWeekdays.length}, minmax(0, 1fr))`;

    const monthStart = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth(), 1);
    const monthEnd = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() + 1, 0);
    const cursor = this.startOfWeek(monthStart);
    const renderEnd = this.startOfWeek(monthEnd);
    renderEnd.setDate(renderEnd.getDate() + 6);

    for (let day = new Date(cursor); day <= renderEnd; day.setDate(day.getDate() + 1)) {
      const weekday = day.getDay();
      if (!showWeekends && (weekday === 0 || weekday === 6)) {
        continue;
      }
      const isoDate = this.toCalendarIso(day);
      const inCurrentMonth = day.getMonth() === monthStart.getMonth();
      const isWeekend = weekday === 0 || weekday === 6;
      const dayEl = grid.createDiv({ cls: `task-calendar-day${isWeekend ? " weekend-day" : ""}${inCurrentMonth ? "" : " outside"}${isoDate === todayIso ? " today" : ""}` });
      dayEl.createEl("div", { text: String(day.getDate()), cls: "task-calendar-date" });
      const itemsEl = dayEl.createDiv({ cls: "task-calendar-items" });
      const dayItems = itemsByDate[isoDate] ?? [];
      for (const entry of dayItems.slice(0, 4)) {
        await this.renderCalendarItem(itemsEl, entry.task, entry.type);
      }
      if (dayItems.length > 4) {
        itemsEl.createEl("span", { text: `+${dayItems.length - 4} more`, cls: "task-calendar-item" });
      }
    }
  }

  private async renderCalendarWeek(
    parent: HTMLElement,
    itemsByDate: Record<string, Array<{ task: ParsedTask; type: "due" | "start" | "scheduled" | "done" | "overdue" | "process" }>>,
    todayIso: string
  ): Promise<void> {
    const showWeekends = this.plugin.settings.showCalendarWeekends;
    const weekdayOrder = this.getWeekdayOrder();
    const start = this.startOfWeek(this.calendarDate);

    const renderDayCard = async (container: HTMLElement, index: number, isWeekend: boolean): Promise<void> => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const isoDate = this.toCalendarIso(day);
      const dayEl = container.createDiv({ cls: `task-calendar-day week-day${isWeekend ? " weekend-day" : ""}${isoDate === todayIso ? " today" : ""}` });
      dayEl.createEl("div", { text: `${this.getWeekdayLabel(day.getDay())} ${day.getDate()}`, cls: "task-calendar-date" });
      const itemsEl = dayEl.createDiv({ cls: "task-calendar-items" });
      for (const entry of itemsByDate[isoDate] ?? []) {
        await this.renderCalendarItem(itemsEl, entry.task, entry.type);
      }
    };

    if (!showWeekends) {
      const weekGrid = parent.createDiv({ cls: "task-calendar-week task-calendar-week-compact" });
      for (let index = 0; index < 7; index++) {
        const weekday = weekdayOrder[index];
        if (weekday === 0 || weekday === 6) continue;
        await renderDayCard(weekGrid, index, false);
      }
      return;
    }

    const weekSplit = parent.createDiv({ cls: "task-calendar-week-split" });
    const weekdayGrid = weekSplit.createDiv({ cls: "task-calendar-week task-calendar-week-main" });
    for (let index = 0; index < 7; index++) {
      const weekday = weekdayOrder[index];
      if (weekday === 0 || weekday === 6) continue;
      await renderDayCard(weekdayGrid, index, false);
    }

    const weekendGrid = weekSplit.createDiv({ cls: "task-calendar-weekend" });
    for (const weekendWeekday of [6, 0]) {
      const index = weekdayOrder.indexOf(weekendWeekday);
      if (index >= 0) {
        await renderDayCard(weekendGrid, index, true);
      }
    }
  }

  private async renderCalendarList(
    parent: HTMLElement,
    itemsByDate: Record<string, Array<{ task: ParsedTask; type: "due" | "start" | "scheduled" | "done" | "overdue" | "process" }>>,
    todayIso: string
  ): Promise<void> {
    const list = parent.createDiv({ cls: "task-calendar-list" });
    const monthStart = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth(), 1);
    const monthEnd = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() + 1, 0);
    const showFullMonth = this.plugin.settings.calendarListShowFullMonth;
    for (let date = new Date(monthStart); date <= monthEnd; date.setDate(date.getDate() + 1)) {
      const isoDate = this.toCalendarIso(date);
      const dayItems = itemsByDate[isoDate] ?? [];
      if (!showFullMonth && dayItems.length === 0) continue;
      const details = list.createEl("details", { cls: "task-calendar-list-day" });
      if (isoDate === todayIso) details.addClass("today");
      if (isoDate === todayIso) details.open = true;
      details.createEl("summary", { text: `${date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })} (${dayItems.length})` });
      const content = details.createDiv({ cls: "task-calendar-list-content" });
      if (dayItems.length === 0) {
        content.createEl("span", { text: "No tasks", cls: "task-calendar-item" });
      } else {
        for (const entry of dayItems) {
          await this.renderCalendarItem(content, entry.task, entry.type);
        }
      }
    }
  }

  private async renderCalendarItem(
    parent: HTMLElement,
    task: ParsedTask,
    type: "due" | "start" | "scheduled" | "done" | "overdue" | "process"
  ): Promise<void> {
    const linkTarget = task.sectionHeading ? `${task.filePath}#${task.sectionHeading}` : task.filePath;
    const item = parent.createEl("a", {
      cls: `task-calendar-item type-${type} internal-link`,
      text: `${type.toUpperCase()} ${task.description}`,
    });
    item.setAttribute("href", linkTarget);
    item.setAttribute("data-href", linkTarget);
    item.setAttribute("aria-label", linkTarget);
    item.addEventListener("mouseenter", (event) => {
      (this.app.workspace as any).trigger("hover-link", {
        event,
        source: VIEW_TYPE_TASK_MATRIX,
        hoverParent: this,
        targetEl: item,
        linktext: linkTarget,
      });
    });
    item.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await this.openTask(task);
    });
  }

  private async renderEisenhower(parent: HTMLElement, tasks: ParsedTask[]): Promise<void> {
    const board = parent.createDiv({ cls: "task-matrix-grid" });
    const isMobile = this.isMobileLayout();
    const columns: Array<{ title: string; quadrant: ParsedTask["quadrant"]; subtitle: string }> = [
      { title: "Q1", quadrant: "Q1", subtitle: "Important + Urgent" },
      { title: "Q2", quadrant: "Q2", subtitle: "Important + Not urgent" },
      { title: "Q3", quadrant: "Q3", subtitle: "Urgent + Lower importance" },
      { title: "Q4", quadrant: "Q4", subtitle: "Delegated or discard" },
    ];

    for (const column of columns) {
      const cell = board.createDiv({ cls: "task-matrix-cell" });
      cell.dataset.quadrant = column.quadrant;
      if (isMobile) {
        cell.addClass("is-mobile-collapsible");
      }

      // Drag and drop handlers
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

      // Define default values based on quadrant
      const getQuadrantDefaults = (quadrant: ParsedTask["quadrant"]): Partial<ParsedTask> => {
        const today = new Date().toISOString().slice(0, 10);
        switch (quadrant) {
          case "Q1":
            return { priority: Priority.High, dueDate: today };
          case "Q2":
            return { priority: Priority.High };
          case "Q3":
            return { priority: Priority.Low, dueDate: today };
          case "Q4":
            return { priority: Priority.Lowest };
          default:
            return {};
        }
      };

      const isCollapsed = isMobile && this.collapsedMatrixQuadrants.has(column.quadrant);
      if (isCollapsed) {
        cell.addClass("is-collapsed");
      }

      const header = this.createColumnHeader(cell, `${column.title} ${column.subtitle}`, group.length, () => {
        const defaults = getQuadrantDefaults(column.quadrant);
        new TaskEditModal(this.app, null, this.plugin, defaults).open();
      }, isMobile, isCollapsed);
      const body = cell.createDiv({ cls: `task-matrix-cell-body${isCollapsed ? " is-collapsed" : ""}` });

      if (isMobile) {
        header.addEventListener("click", (event) => {
          if ((event.target as HTMLElement).closest(".task-matrix-add-btn")) return;
          if (this.collapsedMatrixQuadrants.has(column.quadrant)) {
            this.collapsedMatrixQuadrants.delete(column.quadrant);
          } else {
            this.collapsedMatrixQuadrants.add(column.quadrant);
          }
          void this.render();
        });
      }

      for (const task of group) {
        await this.createTaskCard(body, task, this.describeTask(task));
      }
    }
  }

  private createColumnHeader(
    parent: HTMLElement,
    title: string,
    count: number,
    onAddTask?: () => void,
    isCollapsible = false,
    isCollapsed = false
  ): HTMLElement {
    const header = parent.createDiv({ cls: `task-matrix-column-header${isCollapsible ? " is-collapsible" : ""}` });
    const titleWrap = header.createDiv({ cls: "task-matrix-column-title" });
    titleWrap.createEl("span", {
      text: isCollapsible ? (isCollapsed ? "▸" : "▾") : "",
      cls: "task-matrix-collapse-indicator",
    });
    titleWrap.createEl("h3", { text: title });

    const rightSection = header.createDiv({ cls: "task-matrix-header-right" });

    if (onAddTask) {
      const addBtn = rightSection.createEl("button", {
        text: "+",
        cls: "task-matrix-add-btn",
        title: "Add task",
      });
      addBtn.addEventListener("click", onAddTask);
    }

    rightSection.createEl("span", { text: String(count), cls: "task-matrix-count" });
    return header;
  }

  private async createTaskCard(parent: HTMLElement, task: ParsedTask, metaText: string): Promise<void> {
    const card = parent.createDiv({ cls: `task-matrix-card${task.blocked ? " blocked" : ""}` });
    card.draggable = true;
    card.dataset.taskId = task.id;

    // Drag handlers
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/task-id", task.id);
      card.addClass("dragging");
    });
    card.addEventListener("dragend", () => {
      card.removeClass("dragging");
    });

    // Click to open file
    card.addEventListener("click", async (e) => {
      // Don't open if clicking on action buttons
      if ((e.target as HTMLElement).closest(".task-matrix-action-btn")) return;
      await this.openTask(task);
    });

    const top = card.createDiv({ cls: "task-matrix-card-top" });

    // Render markdown description
    const titleEl = top.createDiv({ cls: "task-matrix-card-title" });
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (file instanceof TFile) {
      // Render the description as markdown to support inline code, dataview, etc.
      const markdownContent = task.description || "*No description*";
      await MarkdownRenderer.render(this.app, markdownContent, titleEl, task.filePath, this);
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
      const depText = task.blocked ? `⛔ Depends ${task.dependsOn}` : `✓ Depends ${task.dependsOn}`;
      chips.createEl("span", { text: depText, cls: `task-matrix-chip${task.blocked ? " warning" : ""}` });
    }
    if (task.taskId) {
      chips.createEl("span", { text: `ID ${task.taskId}`, cls: "task-matrix-chip" });
    }
    // Check for date conflict tag in the original task line
    if (task.lineText.toLowerCase().includes("#due-date-conflict")) {
      chips.createEl("span", { text: "⚠️ Due Date Conflict", cls: "task-matrix-chip conflict" });
    }

    card.createEl("div", { text: metaText, cls: "task-matrix-card-meta" });

    // Action buttons
    const actions = card.createDiv({ cls: "task-matrix-card-actions" });

    if (task.displayStatus !== "completed") {
      const completeBtn = actions.createEl("button", {
        text: "✓",
        cls: "task-matrix-action-btn",
        title: "Complete",
      });
      completeBtn.addEventListener("click", () => this.plugin.toggleTaskStatus(task));

      // Only show start button if no start date or start date is in the future
      if (!task.startDate || task.displayStatus === "to-be-started") {
        const startBtn = actions.createEl("button", {
          text: "▶",
          cls: "task-matrix-action-btn",
          title: "Start",
        });
        startBtn.addEventListener("click", () => this.plugin.startTask(task));
      }

      const cancelBtn = actions.createEl("button", {
        text: "✕",
        cls: "task-matrix-action-btn",
        title: "Cancel",
      });
      cancelBtn.addEventListener("click", () => this.plugin.cancelTask(task));
    } else {
      const reopenBtn = actions.createEl("button", {
        text: "↺",
        cls: "task-matrix-action-btn",
        title: "Reopen",
      });
      reopenBtn.addEventListener("click", () => this.plugin.toggleTaskStatus(task));
    }

    const editBtn = actions.createEl("button", {
      text: "✎",
      cls: "task-matrix-action-btn",
      title: "Edit",
    });
    editBtn.addEventListener("click", () => {
      new TaskEditModal(this.app, task, this.plugin).open();
    });

    const deleteBtn = actions.createEl("button", {
      text: "🗑",
      cls: "task-matrix-action-btn",
      title: "Delete",
    });
    deleteBtn.addEventListener("click", () => {
      if (confirm("Delete this task?")) {
        this.plugin.deleteTask(task);
      }
    });

    // Matrix view: quick move icons for the other three quadrants
    if (this.currentView === "eisenhower") {
      actions.createEl("span", { text: "|", cls: "task-matrix-action-separator" });
      actions.createEl("span", { text: "Move to", cls: "task-matrix-action-label" });

      const quickTargets: ParsedTask["quadrant"][] = (["Q1", "Q2", "Q3", "Q4"] as const).filter(
        (quadrant) => quadrant !== task.quadrant
      );
      for (const targetQuadrant of quickTargets) {
        const moveBtn = actions.createEl("button", {
          text: targetQuadrant.slice(1),
          cls: "task-matrix-action-btn quadrant-move",
          title: `Move to ${targetQuadrant}`,
        });
        moveBtn.addEventListener("click", () => this.plugin.moveTaskToQuadrant(task, targetQuadrant));
      }
    }

    // GTD view: quick move icons for Inbox / In Progress / Waiting
    if (this.currentView === "gtd") {
      const simpleFlow = !this.plugin.settings.includeCompleted;
      const currentGtdColumn = this.mapTaskToGtdColumn(task, simpleFlow);
      const quickStates: ParsedTask["gtdState"][] = ["Inbox", "In Progress", "Waiting"];
      const stateLabels: Record<"Inbox" | "In Progress" | "Waiting", string> = {
        Inbox: "I",
        "In Progress": "P",
        Waiting: "W",
      };

      if (quickStates.includes(currentGtdColumn)) {
        const targets = quickStates.filter((state) => state !== currentGtdColumn);
        actions.createEl("span", { text: "|", cls: "task-matrix-action-separator" });
        actions.createEl("span", { text: "Move to", cls: "task-matrix-action-label" });
        for (const targetState of targets) {
          const moveBtn = actions.createEl("button", {
            text: stateLabels[targetState as "Inbox" | "In Progress" | "Waiting"],
            cls: "task-matrix-action-btn quadrant-move",
            title: `Move to ${targetState}`,
          });
          moveBtn.addEventListener("click", () => this.plugin.moveTaskToGTDState(task, targetState));
        }
      }
    }
  }

  private statusBadge(status: ParsedTask["displayStatus"]): string {
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

  private describeTask(task: ParsedTask): string {
    return `${task.filePath}:${task.lineNumber} · ${task.gtdState}`;
  }

  private async openTask(task: ParsedTask): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) {
      new Notice(`File not found: ${task.filePath}`);
      return;
    }

    const leaf = this.app.workspace.getLeaf(true);
    await leaf.openFile(file);
    new Notice(`Opened ${task.filePath}:${task.lineNumber}`);
  }
}

class TaskEditModal extends Modal {
  private isCreateMode: boolean;
  private defaultValues: Partial<ParsedTask>;

  constructor(
    app: App,
    private readonly task: ParsedTask | null,
    private readonly plugin: TaskMatrixPlugin,
    defaultValues: Partial<ParsedTask> = {}
  ) {
    super(app);
    this.isCreateMode = task === null;
    this.defaultValues = defaultValues;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("task-matrix-modal");

    contentEl.createEl("h2", { text: this.isCreateMode ? "Add Task" : "Edit Task" });

    const form = contentEl.createDiv();

    // Get default values
    const description = this.isCreateMode ? "" : this.task!.description;
    const priority = this.isCreateMode ? (this.defaultValues.priority ?? "none") : this.task!.priority;
    const dueDate = this.isCreateMode ? (this.defaultValues.dueDate ?? "") : (this.task!.dueDate || "");
    const startDate = this.isCreateMode ? (this.defaultValues.startDate ?? "") : (this.task!.startDate || "");
    const taskId = this.isCreateMode ? "" : (this.task!.taskId || "");
    const dependsOn = this.isCreateMode ? "" : (this.task!.dependsOn || "");

    // Description
    const descRow = form.createDiv({ cls: "task-matrix-form-row" });
    descRow.createEl("label", { text: "Description" });
    const descInput = new TextComponent(descRow);
    descInput.setValue(description);

    // Priority
    const priorityRow = form.createDiv({ cls: "task-matrix-form-row" });
    priorityRow.createEl("label", { text: "Priority" });
    const prioritySelect = new DropdownComponent(priorityRow);
    prioritySelect.addOption("none", "None");
    prioritySelect.addOption("lowest", "Lowest");
    prioritySelect.addOption("low", "Low");
    prioritySelect.addOption("medium", "Medium");
    prioritySelect.addOption("high", "High");
    prioritySelect.addOption("highest", "Highest");
    prioritySelect.addOption("critical", "Critical");
    prioritySelect.setValue(priority);

    // Due Date
    const dueRow = form.createDiv({ cls: "task-matrix-form-row" });
    dueRow.createEl("label", { text: "Due Date" });
    const dueInput = dueRow.createEl("input", {
      type: "date",
      cls: "task-matrix-date-input",
      value: dueDate,
    });

    // Start Date
    const startRow = form.createDiv({ cls: "task-matrix-form-row" });
    startRow.createEl("label", { text: "Start Date" });
    const startInput = startRow.createEl("input", {
      type: "date",
      cls: "task-matrix-date-input",
      value: startDate,
    });

    // Task ID with auto-generate button
    const idRow = form.createDiv({ cls: "task-matrix-form-row" });
    const idLabelRow = idRow.createDiv({ cls: "task-matrix-label-row" });
    idLabelRow.createEl("label", { text: "Task ID" });

    const idInputRow = idRow.createDiv({ cls: "task-matrix-input-row" });
    const idInput = new TextComponent(idInputRow);
    idInput.setValue(taskId);
    idInput.inputEl.style.flex = "1";

    const generateIdBtn = new ButtonComponent(idInputRow)
      .setButtonText("🎲")
      .setTooltip("Generate random ID")
      .onClick(() => {
        idInput.setValue(generateShortId());
      });
    generateIdBtn.buttonEl.style.marginLeft = "8px";

    // Depends On - Dropdown with available tasks
    const dependsRow = form.createDiv({ cls: "task-matrix-form-row" });
    dependsRow.createEl("label", { text: "Depends On" });
    const dependsSelect = new DropdownComponent(dependsRow);
    dependsSelect.addOption("", "-- None --");

    // Get incomplete tasks with taskId, sorted by due date
    const availableTasks = this.plugin.tasks
      .filter((t) => t.displayStatus !== "completed" && t.displayStatus !== "cancelled" && t.taskId && t.taskId !== taskId)
      .sort((a, b) => {
        // Sort by due date (no due date = last)
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });

    for (const t of availableTasks) {
      const dueLabel = t.dueDate ? ` (Due: ${t.dueDate})` : "";
      const label = `${t.taskId}${dueLabel}: ${t.description.slice(0, 40)}${t.description.length > 40 ? "..." : ""}`;
      dependsSelect.addOption(t.taskId!, label);
    }
    dependsSelect.setValue(dependsOn);

    // Buttons
    const buttons = contentEl.createDiv({ cls: "task-matrix-modal-buttons" });

    new ButtonComponent(buttons)
      .setButtonText("Cancel")
      .onClick(() => this.close());

    new ButtonComponent(buttons)
      .setButtonText(this.isCreateMode ? "Create" : "Save")
      .setCta()
      .onClick(async () => {
        const updates = {
          description: descInput.getValue(),
          priority: prioritySelect.getValue() as ParsedTask["priority"],
          dueDate: dueInput.value || undefined,
          startDate: startInput.value || undefined,
          taskId: idInput.getValue() || undefined,
          dependsOn: dependsSelect.getValue() || undefined,
        };

        // Check for date conflict
        if (updates.startDate && updates.dueDate && updates.startDate > updates.dueDate) {
          new DateConflictModal(
            this.app,
            updates.startDate,
            updates.dueDate,
            async (result) => {
              if (result.adjustDueDate) {
                const today = new Date().toISOString().slice(0, 10);
                updates.dueDate = today;
                new Notice("Due date adjusted to today");
              } else if (result.addConflictTag) {
                // Will be handled in createTask/saveTask
              } else {
                // User cancelled, don't close modal
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

  private async createTask(updates: Partial<ParsedTask>, addConflictTag: boolean = false): Promise<void> {
    const desc = updates.description?.trim();
    if (!desc) {
      new Notice("Task description is required");
      return;
    }

    // Determine target file
    let targetFile: TFile | null = null;
    const { newTaskTargetPath } = this.plugin.settings;

    // Use configured target path with date template
    if (newTaskTargetPath) {
      const resolvedPath = this.resolveDateTemplate(newTaskTargetPath);
      targetFile = this.app.vault.getAbstractFileByPath(resolvedPath) as TFile | null;
      if (!targetFile) {
        new Notice(`Target note not found: ${resolvedPath}`);
        return;
      }
    } else {
      // No target path configured, use active file
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile && activeFile.extension === "md") {
        targetFile = activeFile;
      } else {
        new Notice("No target note configured and no active markdown file. Please configure Target note path in settings or open a markdown file.");
        return;
      }
    }

    // Build task line
    let taskLine = `- [ ] ${desc}`;

    if (updates.priority && updates.priority !== "none") {
      const priorityEmoji = {
        critical: "🔺",
        highest: "⏫",
        high: "🔼",
        medium: "",
        low: "🔽",
        lowest: "⏬",
      }[updates.priority];
      if (priorityEmoji) {
        taskLine = taskLine.replace(/^(- \[ \] )/, `$1${priorityEmoji} `);
      }
    }

    if (updates.dueDate) {
      taskLine += ` 📅 ${updates.dueDate}`;
    }

    if (updates.startDate) {
      taskLine += ` 🛫 ${updates.startDate}`;
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
      taskLine += ` 🆔 ${updates.taskId}`;
    }

    if (updates.dependsOn) {
      taskLine += ` ⛔ ${updates.dependsOn}`;
    }

    // Add conflict tag if needed
    if (addConflictTag) {
      taskLine += " #due-date-conflict";
    }

    // Read content and determine insertion point
    const content = await this.app.vault.read(targetFile);
    const { newTaskTargetHeading } = this.plugin.settings;

    let newContent: string;
    if (newTaskTargetHeading) {
      const result = this.insertTaskUnderHeading(content, newTaskTargetHeading, taskLine);
      if (!result.success) {
        new Notice(`Cannot add task: ${result.error}`);
        return;
      }
      newContent = result.content!;
    } else {
      newContent = content.trim() + "\n" + taskLine;
    }

    await this.app.vault.modify(targetFile, newContent);
    new Notice(`Task added to ${targetFile.path}`);
  }

  private resolveDateTemplate(template: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return template
      .replace(/YYYY/g, String(year))
      .replace(/MM/g, month)
      .replace(/DD/g, day);
  }

  private insertTaskUnderHeading(
    content: string,
    heading: string,
    taskLine: string
  ): { success: boolean; content?: string; error?: string } {
    const lines = content.split(/\r?\n/u);

    // Find the target heading
    const headingRegex = new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
    const headingIndex = lines.findIndex((line) => headingRegex.test(line.trim()));

    if (headingIndex === -1) {
      return { success: false, error: `Heading "${heading}" not found` };
    }

    // Determine heading level
    const headingMatch = lines[headingIndex].match(/^(#{1,6})/);
    if (!headingMatch) {
      return { success: false, error: "Invalid heading format" };
    }
    const headingLevel = headingMatch[1].length;

    // Find the end of this section (next heading of same or higher level, or end of file)
    let insertIndex = headingIndex + 1;
    for (let i = headingIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const nextHeadingMatch = line.match(/^(#{1,6})\s/);
      if (nextHeadingMatch && nextHeadingMatch[1].length <= headingLevel) {
        break;
      }
      insertIndex = i + 1;
    }

    // Insert task at the end of the section
    // Find the last non-empty line in the section
    let lastContentIndex = insertIndex - 1;
    while (lastContentIndex > headingIndex && !lines[lastContentIndex].trim()) {
      lastContentIndex--;
    }

    // Insert after the last content line
    lines.splice(lastContentIndex + 1, 0, taskLine);

    return { success: true, content: lines.join("\n") };
  }

  private async saveTask(updates: Partial<ParsedTask>, addConflictTag: boolean = false): Promise<void> {
    if (!this.task) return;
    const file = this.app.vault.getAbstractFileByPath(this.task.filePath);
    if (!(file instanceof TFile)) {
      new Notice(`File not found: ${this.task.filePath}`);
      return;
    }

    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = this.task.lineNumber - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      new Notice(`Line ${this.task.lineNumber} not found in file`);
      return;
    }

    let line = lines[lineIndex];

    // Update description
    const checkboxMatch = line.match(/^(\s*[-*]\s*\[[ xX/-]\]\s*)/);
    if (checkboxMatch && updates.description) {
      const prefix = checkboxMatch[1];
      // Keep the checkbox and any inline fields, update description
      const restOfLine = line.substring(prefix.length);
      // Remove old description, keep inline fields
      // Match emoji fields with optional dates, tags, and dataview inline fields
      const inlineFields = restOfLine.match(/(\s*(?:📅\s*\d{4}-\d{2}-\d{2}|🛫\s*\d{4}-\d{2}-\d{2}|⏳\s*\d{4}-\d{2}-\d{2}|✅\s*\d{4}-\d{2}-\d{2}|➕\s*\d{4}-\d{2}-\d{2}|🔺|⏫|🔼|🔽|⏬|🆔\s*\S+|⛔\s*\S+|#\w+|::\s*\S+)\s*)/gu) || [];
      // Filter out tags that already exist in the new description to avoid duplicates
      const uniqueInlineFields = inlineFields.filter((field) => {
        const trimmed = field.trim();
        // Only check tags (starting with #)
        if (trimmed.startsWith("#")) {
          return !updates.description!.toLowerCase().includes(trimmed.toLowerCase());
        }
        return true;
      });
      line = prefix + updates.description + " " + uniqueInlineFields.join(" ");
    }

    // Update priority
    if (updates.priority !== undefined) {
      line = line.replace(/🔺|⏫|🔼|🔽|⏬/gu, "");
      if (updates.priority === "critical") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1🔺 ");
      else if (updates.priority === "highest") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1⏫ ");
      else if (updates.priority === "high") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1🔼 ");
      else if (updates.priority === "low") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1🔽 ");
      else if (updates.priority === "lowest") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1⏬ ");
    }

    // Update due date - make date optional in regex to handle orphaned emojis
    if (updates.dueDate !== undefined) {
      line = line.replace(/\s*📅(?:\s*\d{4}-\d{2}-\d{2})?/gu, "");
      if (updates.dueDate) line += ` 📅 ${updates.dueDate}`;
    }

    // Update start date - make date optional in regex to handle orphaned emojis
    if (updates.startDate !== undefined) {
      line = line.replace(/\s*🛫(?:\s*\d{4}-\d{2}-\d{2})?/gu, "");
      if (updates.startDate) line += ` 🛫 ${updates.startDate}`;
    }

    // Update created date - make date optional in regex to handle orphaned emojis
    if (updates.createdDate !== undefined) {
      line = line.replace(/\s*➕(?:\s*\d{4}-\d{2}-\d{2})?/gu, "");
      if (updates.createdDate) line += ` ➕ ${updates.createdDate}`;
    }

    // Update task ID
    if (updates.taskId !== undefined) {
      line = line.replace(/\s*🆔\s*\S+/g, "");
      line = line.replace(/\bid::\s*\S+/gi, "");
      if (updates.taskId) line += ` 🆔 ${updates.taskId}`;
    }

    // Update depends on
    if (updates.dependsOn !== undefined) {
      line = line.replace(/\s*⛔\s*\S+/g, "");
      line = line.replace(/\bdependsOn::\s*\S+/gi, "");
      if (updates.dependsOn) line += ` ⛔ ${updates.dependsOn}`;
    }

    // Handle conflict tag
    line = line.replace(/\s*#due-date-conflict\b/gi, "");
    if (addConflictTag) {
      line += " #due-date-conflict";
    }

    // Clean up extra spaces
    line = line.replace(/\s+/g, " ").trim();

    lines[lineIndex] = line;
    await this.app.vault.modify(file, lines.join("\n"));
    new Notice("Task updated");
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// Confirmation modal for date conflict resolution
class DateConflictModal extends Modal {
  private result: { adjustDueDate: boolean; addConflictTag: boolean } | null = null;

  constructor(
    app: App,
    private readonly startDate: string,
    private readonly dueDate: string,
    private readonly onConfirm: (result: { adjustDueDate: boolean; addConflictTag: boolean }) => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("task-matrix-modal");

    contentEl.createEl("h2", { text: "Date Conflict Detected" });

    const message = contentEl.createEl("p");
    message.innerHTML = `Start date (<strong>${this.startDate}</strong>) is later than due date (<strong>${this.dueDate}</strong>).<br><br>Would you like to adjust the due date to today?`;

    const buttonRow = contentEl.createDiv({ cls: "task-matrix-modal-buttons" });

    new ButtonComponent(buttonRow)
      .setButtonText("No, add conflict tag")
      .onClick(() => {
        this.result = { adjustDueDate: false, addConflictTag: true };
        this.onConfirm(this.result);
        this.close();
      });

    new ButtonComponent(buttonRow)
      .setButtonText("Yes, adjust due date")
      .setCta()
      .onClick(() => {
        this.result = { adjustDueDate: true, addConflictTag: false };
        this.onConfirm(this.result);
        this.close();
      });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
    // If closed without selection, treat as cancel (no action)
    if (this.result === null) {
      this.onConfirm({ adjustDueDate: false, addConflictTag: false });
    }
  }
}

class TaskMatrixSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: TaskMatrixPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Task Matrix settings" });

    new Setting(containerEl)
      .setName("Scan folders")
      .setDesc("Comma-separated list of folder paths to scan for tasks. Leave empty to scan the whole vault.")
      .addText((text) =>
        text
          .setPlaceholder("Projects/Tasks, Inbox")
          .setValue(this.plugin.settings.scanFolders.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.scanFolders = value.split(",").map(s => s.trim()).filter(Boolean);
            await this.plugin.saveSettings();
            await this.plugin.refreshTasks();
          }),
      );

    new Setting(containerEl)
      .setName("Default view")
      .setDesc("Choose which dashboard opens first.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("eisenhower", "Eisenhower")
          .addOption("calendar", "Calendar")
          .addOption("gtd", "GTD")
          .addOption("list", "List")
          .setValue(this.plugin.settings.defaultView)
          .onChange(async (value: string) => {
            this.plugin.settings.defaultView = value as ViewMode;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Exclude folders")
      .setDesc("Comma-separated list of folder paths to exclude from task scanning.")
      .addText((text) =>
        text
          .setPlaceholder("Archive, Templates, Daily")
          .setValue(this.plugin.settings.excludeFolders.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.excludeFolders = value.split(",").map(s => s.trim()).filter(Boolean);
            await this.plugin.saveSettings();
            await this.plugin.refreshTasks();
          }),
      );

    new Setting(containerEl)
      .setName("Open location")
      .setDesc("Where to open the Task Matrix view.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("sidebar", "Right Sidebar")
          .addOption("tab", "New Tab")
          .setValue(this.plugin.settings.openLocation)
          .onChange(async (value: string) => {
            this.plugin.settings.openLocation = value as "sidebar" | "tab";
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Completion markers")
      .setDesc("Checkbox contents that indicate a completed task (comma-separated). Default: x, X")
      .addText((text) =>
        text
          .setPlaceholder("x, X, done, 完成")
          .setValue(this.plugin.settings.completionMarkers.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.completionMarkers = value.split(",").map(s => s.trim()).filter(Boolean);
            if (this.plugin.settings.completionMarkers.length === 0) {
              this.plugin.settings.completionMarkers = ["x", "X"];
            }
            await this.plugin.saveSettings();
            await this.plugin.refreshTasks();
          }),
      );

    new Setting(containerEl)
      .setName("Cancelled markers")
      .setDesc("Checkbox contents that indicate a cancelled task (comma-separated). Default: -")
      .addText((text) =>
        text
          .setPlaceholder("-, cancelled, skip")
          .setValue(this.plugin.settings.cancelledMarkers.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.cancelledMarkers = value.split(",").map(s => s.trim()).filter(Boolean);
            if (this.plugin.settings.cancelledMarkers.length === 0) {
              this.plugin.settings.cancelledMarkers = ["-"];
            }
            await this.plugin.saveSettings();
            await this.plugin.refreshTasks();
          }),
      );

    new Setting(containerEl)
      .setName("Include completed tasks")
      .setDesc("Show completed tasks in the matrix.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.includeCompleted).onChange(async (value) => {
          this.plugin.settings.includeCompleted = value;
          await this.plugin.saveSettings();
          await this.plugin.refreshTasks();
        }),
      );

    new Setting(containerEl)
      .setName("Track completion date")
      .setDesc("When enabled, automatically add ✅ yyyy-mm-dd to tasks when they are marked as completed.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.trackCompletionDate).onChange(async (value) => {
          this.plugin.settings.trackCompletionDate = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Urgent days range")
      .setDesc("Number of days to consider a task as urgent (1-7). Default: 1 (today only). 2 = today+tomorrow, 3 = today+2 days, etc.")
      .addSlider((slider) =>
        slider
          .setLimits(1, 7, 1)
          .setValue(this.plugin.settings.urgentDaysRange)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.urgentDaysRange = value;
            await this.plugin.saveSettings();
            await this.plugin.refreshTasks();
          }),
      );

    new Setting(containerEl)
      .setName("Calendar week view: show weekends")
      .setDesc("Show Saturday and Sunday columns in Calendar week mode.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showCalendarWeekends).onChange(async (value) => {
          this.plugin.settings.showCalendarWeekends = value;
          await this.plugin.saveSettings();
          await this.plugin.refreshTasks();
        }),
      );

    new Setting(containerEl)
      .setName("Calendar: first day of week")
      .setDesc("Choose whether Calendar weeks start on Monday or Sunday.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("monday", "Monday")
          .addOption("sunday", "Sunday")
          .setValue(this.plugin.settings.calendarFirstDayOfWeek)
          .onChange(async (value) => {
            this.plugin.settings.calendarFirstDayOfWeek = value as "monday" | "sunday";
            await this.plugin.saveSettings();
            await this.plugin.refreshTasks();
          }),
      );

    new Setting(containerEl)
      .setName("Calendar month view: show weekends")
      .setDesc("Show Saturday and Sunday columns in Calendar month mode.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showCalendarMonthWeekends).onChange(async (value) => {
          this.plugin.settings.showCalendarMonthWeekends = value;
          await this.plugin.saveSettings();
          await this.plugin.refreshTasks();
        }),
      );

    new Setting(containerEl)
      .setName("Calendar list: show full month")
      .setDesc("When enabled, list mode shows every day of the month. When disabled, only shows dates that have tasks.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.calendarListShowFullMonth).onChange(async (value) => {
          this.plugin.settings.calendarListShowFullMonth = value;
          await this.plugin.saveSettings();
          await this.plugin.refreshTasks();
        }),
      );

    new Setting(containerEl)
      .setName("Calendar: show in-process tasks")
      .setDesc("For tasks with both start and due dates, show them on each day between start and due in Calendar views.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showCalendarInProcessTasks).onChange(async (value) => {
          this.plugin.settings.showCalendarInProcessTasks = value;
          await this.plugin.saveSettings();
          await this.plugin.refreshTasks();
        }),
      );

    containerEl.createEl("h3", { text: "New Task Settings" });

    new Setting(containerEl)
      .setName("Target note path")
      .setDesc("Path template for new tasks. Use YYYY, MM, DD for date substitution. Leave empty to use fallback logic.")
      .addText((text) =>
        text
          .setPlaceholder("Daily/YYYY-MM-DD.md")
          .setValue(this.plugin.settings.newTaskTargetPath)
          .onChange(async (value) => {
            this.plugin.settings.newTaskTargetPath = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Target heading")
      .setDesc("Insert new tasks under this heading. Leave empty to append at end of file.")
      .addText((text) =>
        text
          .setPlaceholder("## 👀 GTD任务看板")
          .setValue(this.plugin.settings.newTaskTargetHeading)
          .onChange(async (value) => {
            this.plugin.settings.newTaskTargetHeading = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    containerEl.createEl("h3", { text: "List View Settings" });

    new Setting(containerEl)
      .setName("Group by folder")
      .setDesc("Group tasks by their containing folder in list view.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.listGroupByFolder).onChange(async (value) => {
          this.plugin.settings.listGroupByFolder = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Folder grouping depth")
      .setDesc("How many folder levels to display for grouping (1 = top level only, 2 = two levels, etc.).")
      .addSlider((slider) =>
        slider
          .setLimits(1, 5, 1)
          .setValue(this.plugin.settings.listGroupByFolderDepth)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.listGroupByFolderDepth = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
