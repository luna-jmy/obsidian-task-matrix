import {
  App,
  ItemView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  WorkspaceLeaf,
} from "obsidian";
import { DEFAULT_SETTINGS, ParsedTask, TaskMatrixSettings, ViewMode } from "./types";
import { parseTaskLine, sortTasks } from "./task-parser";

const VIEW_TYPE_TASK_MATRIX = "task-matrix-view";
const ICONS = {
  refresh: "?",
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
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_TASK_MATRIX);
  }

  async loadSettings(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refreshOpenViews();
  }

  async activateView(): Promise<void> {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_MATRIX)[0];
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: VIEW_TYPE_TASK_MATRIX, active: true });
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
    this.refreshOpenViews();
    if (showNotice) {
      new Notice(`Task Matrix refreshed: ${this.tasks.length} tasks`);
    }
  }

  private refreshOpenViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_MATRIX)) {
      const view = leaf.view;
      if (view instanceof TaskMatrixView) {
        view.render();
      }
    }
  }

  private shouldIncludeFile(file: TFile): boolean {
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
        const parsed = parseTaskLine(line, file.path, index + 1);
        if (!parsed) return;
        if (!this.settings.includeCompleted && (parsed.status === "completed" || parsed.status === "cancelled")) {
          return;
        }
        tasks.push(parsed);
      });
    }

    return sortTasks(tasks);
  }
}

class TaskMatrixView extends ItemView {
  private currentView: ViewMode;
  private searchQuery = "";

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
    this.render();
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }

  render(): void {
    const root = this.contentEl;
    root.empty();
    root.addClass("task-matrix-view");

    const shell = root.createDiv({ cls: "task-matrix-shell" });
    this.renderHeader(shell);
    this.renderBody(shell);
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
    const search = toolbar.createEl("input", {
      type: "search",
      placeholder: "Search tasks, file paths, ids...",
      cls: "task-matrix-search",
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
    button.addEventListener("click", () => {
      this.currentView = mode;
      this.render();
    });
  }

  private renderBody(parent: HTMLElement): void {
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
      this.renderList(parent, tasks);
      return;
    }

    if (this.currentView === "gtd") {
      this.renderGtd(parent, tasks);
      return;
    }

    this.renderEisenhower(parent, tasks);
  }

  private renderList(parent: HTMLElement, tasks: ParsedTask[]): void {
    const wrap = parent.createDiv({ cls: "task-matrix-list" });
    for (const task of tasks) {
      this.createTaskCard(wrap, task, `${task.filePath}:${task.lineNumber}`);
    }
  }

  private renderGtd(parent: HTMLElement, tasks: ParsedTask[]): void {
    const board = parent.createDiv({ cls: "task-matrix-board" });
    const columns: Array<{ title: string; state: ParsedTask["gtdState"] }> = [
      { title: "Inbox", state: "Inbox" },
      { title: "In Progress", state: "In Progress" },
      { title: "Waiting", state: "Waiting" },
      { title: "Done", state: "Done" },
    ];

    for (const column of columns) {
      const columnEl = board.createDiv({ cls: "task-matrix-column" });
      const group = tasks.filter((task) => task.gtdState === column.state);
      this.createColumnHeader(columnEl, column.title, group.length);
      for (const task of group) {
        this.createTaskCard(columnEl, task, this.describeTask(task));
      }
    }
  }

  private renderEisenhower(parent: HTMLElement, tasks: ParsedTask[]): void {
    const board = parent.createDiv({ cls: "task-matrix-grid" });
    const columns: Array<{ title: string; quadrant: ParsedTask["quadrant"]; subtitle: string }> = [
      { title: "Q1", quadrant: "Q1", subtitle: "Important + Urgent" },
      { title: "Q2", quadrant: "Q2", subtitle: "Important + Not urgent" },
      { title: "Q3", quadrant: "Q3", subtitle: "Urgent + Lower importance" },
      { title: "Q4", quadrant: "Q4", subtitle: "Backlog or discard" },
    ];

    for (const column of columns) {
      const cell = board.createDiv({ cls: "task-matrix-cell" });
      const group = tasks.filter((task) => task.quadrant === column.quadrant && task.status !== "completed" && task.status !== "cancelled");
      this.createColumnHeader(cell, `${column.title} ${column.subtitle}`, group.length);
      for (const task of group) {
        this.createTaskCard(cell, task, this.describeTask(task));
      }
    }
  }

  private createColumnHeader(parent: HTMLElement, title: string, count: number): void {
    const header = parent.createDiv({ cls: "task-matrix-column-header" });
    header.createEl("h3", { text: title });
    header.createEl("span", { text: String(count), cls: "task-matrix-count" });
  }

  private createTaskCard(parent: HTMLElement, task: ParsedTask, metaText: string): void {
    const card = parent.createDiv({ cls: "task-matrix-card" });
    card.addEventListener("click", async () => {
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
      chips.createEl("span", { text: `Depends ${task.dependsOn}`, cls: "task-matrix-chip warning" });
    }
    if (task.taskId) {
      chips.createEl("span", { text: `ID ${task.taskId}`, cls: "task-matrix-chip" });
    }

    card.createEl("div", { text: metaText, cls: "task-matrix-card-meta" });
  }

  private statusBadge(status: ParsedTask["status"]): string {
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

  private describeTask(task: ParsedTask): string {
    return `${task.filePath}:${task.lineNumber} ¡¤ ${task.gtdState}`;
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
          .onChange(async (value: ViewMode) => {
            this.plugin.settings.defaultView = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Include completed tasks")
      .setDesc("Show completed and cancelled tasks in the matrix.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.includeCompleted).onChange(async (value) => {
          this.plugin.settings.includeCompleted = value;
          await this.plugin.saveSettings();
          await this.plugin.refreshTasks();
        }),
      );
  }
}
