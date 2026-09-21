import { getIconIds, moment, Notice, Plugin, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";
import { applyLanguageSetting, detectLocale, t } from "./i18n";
import { TaskMatrixSettingTab, SettingsHost } from "./settings";
import { GanttTask } from "./parser/gantt-parser";
import {
  collectIndex,
  ganttSignature,
  shouldRescanForRename,
  shouldRescanForVaultChange,
  taskSignature,
} from "./services/task-index";
import { DEFAULT_GANTT_BAR_COLORS, DEFAULT_SETTINGS, ParsedTask, TaskMatrixSettings } from "./types";
import { pickViewIcon } from "./utils/icon";
import { MatrixView, TaskMatrixHost, VIEW_TYPE_TASK_MATRIX } from "./views/matrix-view";

/** 事件合并窗口：一次保存可能连发多个 modify */
const REFRESH_DEBOUNCE_MS = 500;

/**
 * Task Matrix —— 薄装配层。
 *
 * 职责边界：只做「注册、事件接线、索引编排、把数据递给视图」。
 * 业务规则在 services/（纯函数），绘制在 panels/，布局组装在 views/。
 *
 * 生命周期约束：
 * - onload 只做轻量注册；全库扫描推迟到 onLayoutReady 之后，代次号可中止；
 * - 所有事件走 registerEvent，定时器走 register，视图经 registerView 工厂创建；
 * - onunload 不 detach leaves，避免破坏 Obsidian 的布局恢复。
 */
export default class TaskMatrixPlugin extends Plugin implements TaskMatrixHost, SettingsHost {
  settings: TaskMatrixSettings = DEFAULT_SETTINGS;

  private tasks: ParsedTask[] = [];
  /** 甘特视图的任务投影，与 tasks 同一次文件读取产出 */
  private ganttTasks: GanttTask[] = [];
  private indexReady = false;
  /** 索引代次：又发起了新扫描时，旧的那次结果直接丢弃 */
  private refreshGeneration = 0;
  private refreshTimer: number | null = null;
  /** null 表示「还没画过」，保证第一轮一定渲染 */
  private lastSignature: string | null = null;
  private shuttingDown = false;

  async onload(): Promise<void> {
    await this.loadSettings();
    // 语言要在任何视图/设置页渲染之前定下来，否则第一屏会用初值
    this.applyUiLanguage();

    this.registerView(
      VIEW_TYPE_TASK_MATRIX,
      (leaf: WorkspaceLeaf) => new MatrixView(leaf, this),
    );

    const icon = pickViewIcon(getIconIds());
    this.addRibbonIcon(icon, t("打开任务矩阵"), () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open-view",
      name: t("打开任务矩阵"),
      callback: () => {
        void this.activateView();
      },
    });

    this.addCommand({
      id: "refresh-view",
      name: t("重新扫描任务"),
      callback: () => {
        void this.refreshTasks(true);
      },
    });

    this.addSettingTab(new TaskMatrixSettingTab(this.app, this, this));

    this.registerEvent(this.app.vault.on("create", (file) => this.handleVaultChange(file)));
    this.registerEvent(this.app.vault.on("modify", (file) => this.handleVaultChange(file)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.handleVaultChange(file)));
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => this.handleVaultRename(file, oldPath)),
    );

    // 重活推迟到布局就绪之后，插件加载不被全库扫描拖住
    this.app.workspace.onLayoutReady(() => {
      void this.refreshTasks();
    });

    this.register(() => this.clearRefreshTimer());
  }

  onunload(): void {
    // 不 detach leaves：Obsidian 自己会恢复布局
    this.shuttingDown = true;
    this.clearRefreshTimer();
    this.tasks = [];
  }

  // ────────────────────────────── 设置 ──────────────────────────────

  async loadSettings(): Promise<void> {
    const saved = (await this.loadData()) as Partial<TaskMatrixSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
    // 配色是后加的一组字段：老 data.json 里可能整块缺失，也可能只有一半，
    // 逐键兜底一次，免得某类条子因为拿到 undefined 而失去颜色
    this.settings.ganttBarColors = {
      ...DEFAULT_GANTT_BAR_COLORS,
      ...(saved?.ganttBarColors ?? {}),
    };
  }

  /** 界面语言落到运行时；语言变了要重绘已打开的视图 */
  applyUiLanguage(): boolean {
    return applyLanguageSetting(this.settings.uiLanguage, detectLocale(moment.locale()));
  }

  /**
   * 落盘设置。
   *
   * `rescan` 决定要不要重建索引：扫描目录、标记、紧急天数这类改动会改变解析结果，
   * 必须重扫；而排序、分组层级这类只影响绘制，重扫一次纯属白读全库。
   */
  async persistSettings(rescan: boolean): Promise<void> {
    await this.saveData(this.settings);
    if (rescan) await this.refreshTasks();
    else this.redrawViews();
  }

  refreshViews(): void {
    this.redrawViews();
  }

  // ────────────────────────────── TaskMatrixHost ──────────────────────────────

  getTasks(): readonly ParsedTask[] {
    return this.tasks;
  }

  getGanttTasks(): readonly GanttTask[] {
    return this.ganttTasks;
  }

  isIndexReady(): boolean {
    return this.indexReady;
  }

  requestRescan(): void {
    void this.refreshTasks();
  }

  requestRedraw(): void {
    this.redrawViews();
  }

  async openTaskFile(task: ParsedTask): Promise<void> {
    await this.openNote(task.filePath);
  }

  /** 按路径打开笔记（甘特手里只有任务，没有 ParsedTask） */
  async openNote(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      new Notice(t("找不到文件：{path}", { path }));
      return;
    }
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.openFile(file);
  }

  // ────────────────────────────── 索引编排 ──────────────────────────────

  /**
   * 全量重扫。
   *
   * 代次号 + 卸载标志共同保证：过期的扫描结果绝不会写进状态，
   * 也不会把关闭后的视图再画一次。
   */
  async refreshTasks(showNotice = false): Promise<void> {
    const generation = ++this.refreshGeneration;
    const index = await collectIndex(this.app, this.settings);

    if (this.shuttingDown || generation !== this.refreshGeneration) return;

    this.tasks = index.tasks;
    this.ganttTasks = index.ganttTasks;
    this.indexReady = true;

    // 两个投影各算一份指纹：改一个 `### 分节` 标题不会让任何任务行变化，
    // 只盯面板指纹会漏掉「甘特分组已经全变了」这种更新
    const signature = `${taskSignature(index.tasks)}\n--\n${ganttSignature(index.ganttTasks)}`;
    if (signature !== this.lastSignature) {
      this.lastSignature = signature;
      this.redrawViews();
    }

    if (showNotice) new Notice(t("已刷新：{count} 个任务", { count: index.tasks.length }));
  }

  /** 设置变更后视图侧的筛选口径也会变，所以要强制重绘一次 */
  redrawViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_MATRIX)) {
      const view = leaf.view;
      if (view instanceof MatrixView) view.render();
    }
  }

  private handleVaultChange(file: TAbstractFile): void {
    if (shouldRescanForVaultChange(file, this.settings)) this.scheduleRefresh();
  }

  private handleVaultRename(file: TAbstractFile, oldPath: string): void {
    if (shouldRescanForRename(file, oldPath, this.settings)) this.scheduleRefresh();
  }

  private scheduleRefresh(): void {
    if (this.shuttingDown) return;
    this.clearRefreshTimer();
    const win = this.app.workspace.containerEl.ownerDocument.defaultView;
    if (win === null) {
      this.requestRescan();
      return;
    }
    this.refreshTimer = win.setTimeout(() => {
      this.refreshTimer = null;
      void this.refreshTasks();
    }, REFRESH_DEBOUNCE_MS);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer === null) return;
    this.app.workspace.containerEl.ownerDocument.defaultView?.clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_TASK_MATRIX);
    const leaf = existing.length > 0
      ? existing[0]
      : this.settings.openLocation === "sidebar"
        ? workspace.getRightLeaf(false)
        : workspace.getLeaf(true);
    if (leaf === null) return;

    await leaf.setViewState({ type: VIEW_TYPE_TASK_MATRIX, active: true });
    await workspace.revealLeaf(leaf);
  }
}
