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

    // Check scan folder
    const folder = this.settings.scanFolder.trim().replace(/^\/+|\/+$/g, "");
    if (!folder) return true;
    return file.path === folder || file.path.startsWith(`${folder}/`);
  }

  async collectTasks(): Promise<ParsedTask[]> {
    const tasks: ParsedTask[] = [];
    const files = this.app.vault.getMarkdownFiles().filter((file) => this.shouldIncludeFile(file));

    for (const file of files) {
      const content = await this.app.vault.cachedRead(file);
      const lines = content.split(/\r?\n/u);
      lines.forEach((line, index) => {
        const parsed = parseTaskLine(line, file.path, index + 1, this.settings);
        if (!parsed) return;
        // Filter out completed and cancelled tasks if setting is disabled
        if (!this.settings.includeCompleted && (parsed.displayStatus === "completed" || parsed.displayStatus === "cancelled")) {
          return;
        }
        tasks.push(parsed);
      });
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
    const newLine = line.replace(/\[[^\]]*\]/u, `[${newMarker}]`);

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

  // Drag and drop: move task to different state/quadrant
  async moveTaskToGTDState(task: ParsedTask, newState: ParsedTask["gtdState"]): Promise<void> {
    if (task.gtdState === newState) return;

    const file = this.app.vault.getAbstractFileByPath(task.filePath);
    if (!(file instanceof TFile)) return;

    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/u);
    const lineIndex = task.lineNumber - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) return;

    let line = lines[lineIndex];

    // Remove old GTD tags
    line = line.replace(/#(waiting|delegated|blocked|doing|active|next)\b/gi, "").trim();

    // Add appropriate tag for new state
    let tagToAdd = "";
    switch (newState) {
      case "Waiting":
        tagToAdd = " #waiting";
        break;
      case "In Progress":
        tagToAdd = " #doing";
        break;
      case "Done":
        // Mark as completed
        {
          const defaultCompleteMarker = this.settings.completionMarkers[0] ?? "x";
          line = line.replace(/\[[^\]]*\]/u, `[${defaultCompleteMarker}]`);
        }
        break;
    }

    if (tagToAdd && !line.toLowerCase().includes(tagToAdd.toLowerCase())) {
      line += tagToAdd;
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

    // Remove existing priority markers
    line = line.replace(/[🔼⏫🔽⏬]/gu, "").trim();

    // Add new priority marker after checkbox
    if (priorityMarker) {
      const checkboxMatch = line.match(/^(\s*[-*]\s*\[[ xX/-]\]\s*)/);
      if (checkboxMatch) {
        line = line.replace(checkboxMatch[1], checkboxMatch[1] + priorityMarker + " ");
      }
    }

    // Handle due date based on quadrant
    if (shouldClearDueDate) {
      // Remove due date emoji and date
      line = line.replace(/\s*📅\s*\d{4}-\d{2}-\d{2}/gu, "").trim();
    } else if (shouldAddDueDate) {
      // Check if already has due date
      if (!line.includes("📅")) {
        line = line + ` 📅 ${today}`;
      }
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
  private searchQuery = "";
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
      return [task.description, task.filePath, task.taskId, task.dependsOn]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
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

    const segmented = toolbar.createDiv({ cls: "task-matrix-segmented" });
    this.renderModeButton(segmented, "list", ICONS.list);
    this.renderModeButton(segmented, "gtd", ICONS.gtd);
    this.renderModeButton(segmented, "eisenhower", ICONS.eisenhower);

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
    const tasks = this.filteredTasks;
    if (tasks.length === 0) {
      const empty = parent.createDiv({ cls: "task-matrix-empty" });
      empty.createEl("h3", { text: "No tasks found" });
      empty.createEl("p", {
        text: this.searchQuery
          ? "The current search did not match any tasks."
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

    await this.renderEisenhower(parent, tasks);
  }

  private async renderList(parent: HTMLElement, tasks: ParsedTask[]): Promise<void> {
    const wrap = parent.createDiv({ cls: "task-matrix-list" });

    if (this.plugin.settings.listGroupByFolder) {
      // Group tasks by folder
      const grouped = this.groupTasksByFolder(tasks, this.plugin.settings.listGroupByFolderDepth);

      for (const [folderPath, folderTasks] of Object.entries(grouped)) {
        const groupEl = wrap.createDiv({ cls: "task-matrix-folder-group" });
        groupEl.createEl("h4", {
          text: folderPath || "Root",
          cls: "task-matrix-folder-header",
        });
        for (const task of folderTasks) {
          await this.createTaskCard(groupEl, task, `${task.filePath}:${task.lineNumber}`);
        }
      }
    } else {
      // Flat list
      for (const task of tasks) {
        await this.createTaskCard(wrap, task, `${task.filePath}:${task.lineNumber}`);
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

    const todayIso = (() => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      return date.toISOString().slice(0, 10);
    })();

    const getGtdColumn = (task: ParsedTask): ParsedTask["gtdState"] => {
      if (!simpleFlow) return task.gtdState;
      if (task.gtdState === "To be Started") return "Inbox";
      if (task.gtdState === "Overdue") {
        const desc = task.description.toLowerCase();
        const hasActiveTag = desc.includes("#doing") || desc.includes("#active") || desc.includes("#next");
        const hasStarted = Boolean(task.startDate && task.startDate <= todayIso);
        return hasStarted || hasActiveTag ? "In Progress" : "Inbox";
      }
      return task.gtdState;
    };

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

      const group = tasks.filter((task) => getGtdColumn(task) === column.state);

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

  private async renderEisenhower(parent: HTMLElement, tasks: ParsedTask[]): Promise<void> {
    const board = parent.createDiv({ cls: "task-matrix-grid" });
    const columns: Array<{ title: string; quadrant: ParsedTask["quadrant"]; subtitle: string }> = [
      { title: "Q1", quadrant: "Q1", subtitle: "Important + Urgent" },
      { title: "Q2", quadrant: "Q2", subtitle: "Important + Not urgent" },
      { title: "Q3", quadrant: "Q3", subtitle: "Urgent + Lower importance" },
      { title: "Q4", quadrant: "Q4", subtitle: "Backlog or discard" },
    ];

    for (const column of columns) {
      const cell = board.createDiv({ cls: "task-matrix-cell" });
      cell.dataset.quadrant = column.quadrant;

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

      this.createColumnHeader(cell, `${column.title} ${column.subtitle}`, group.length, () => {
        const defaults = getQuadrantDefaults(column.quadrant);
        new TaskEditModal(this.app, null, this.plugin, defaults).open();
      });

      for (const task of group) {
        await this.createTaskCard(cell, task, this.describeTask(task));
      }
    }
  }

  private createColumnHeader(
    parent: HTMLElement,
    title: string,
    count: number,
    onAddTask?: () => void
  ): void {
    const header = parent.createDiv({ cls: "task-matrix-column-header" });
    header.createEl("h3", { text: title });

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
    if (task.dependsOn) {
      const depText = task.blocked ? `⛔ Depends ${task.dependsOn}` : `✓ Depends ${task.dependsOn}`;
      chips.createEl("span", { text: depText, cls: `task-matrix-chip${task.blocked ? " warning" : ""}` });
    }
    if (task.taskId) {
      chips.createEl("span", { text: `ID ${task.taskId}`, cls: "task-matrix-chip" });
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

    // Depends On
    const dependsRow = form.createDiv({ cls: "task-matrix-form-row" });
    dependsRow.createEl("label", { text: "Depends On" });
    const dependsInput = new TextComponent(dependsRow);
    dependsInput.setValue(dependsOn);

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
          dependsOn: dependsInput.getValue() || undefined,
        };
        if (this.isCreateMode) {
          await this.createTask(updates);
        } else {
          await this.saveTask(updates);
        }
        this.close();
      });
  }

  private async createTask(updates: Partial<ParsedTask>): Promise<void> {
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

  private async saveTask(updates: Partial<ParsedTask>): Promise<void> {
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
      const inlineFields = restOfLine.match(/(\s*(?:📅|🛫|⏳|✅|➕|🔼|⏫|🔽|⏬|🆔|⛔|#\w+|::\s*\S+)\s*)/g) || [];
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
      line = line.replace(/[🔼⏫🔽⏬]/gu, "");
      if (updates.priority === "highest") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1⏫ ");
      else if (updates.priority === "high") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1🔼 ");
      else if (updates.priority === "low") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1🔽 ");
      else if (updates.priority === "lowest") line = line.replace(/(\s*[-*]\s*\[[ xX/-]\]\s*)/, "$1⏬ ");
    }

    // Update due date
    if (updates.dueDate !== undefined) {
      line = line.replace(/\s*📅\s*\d{4}-\d{2}-\d{2}/g, "");
      if (updates.dueDate) line += ` 📅 ${updates.dueDate}`;
    }

    // Update start date
    if (updates.startDate !== undefined) {
      line = line.replace(/\s*🛫\s*\d{4}-\d{2}-\d{2}/g, "");
      if (updates.startDate) line += ` 🛫 ${updates.startDate}`;
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

class TaskMatrixSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: TaskMatrixPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Task Matrix settings" });

    new Setting(containerEl)
      .setName("Scan folder")
      .setDesc("Only index markdown files inside this vault folder. Leave empty to scan the whole vault.")
      .addText((text) =>
        text
          .setPlaceholder("Projects/Tasks")
          .setValue(this.plugin.settings.scanFolder)
          .onChange(async (value) => {
            this.plugin.settings.scanFolder = value.trim();
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
