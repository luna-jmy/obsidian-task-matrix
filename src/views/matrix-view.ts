import { App, Component, getIconIds, ItemView, WorkspaceLeaf } from "obsidian";
import { ganttGroupingLabel, GANTT_GROUPINGS, ganttZoomLabel } from "../gantt/gantt-labels";
import { buildGanttModel, GanttModel } from "../gantt/gantt-model";
import { GanttZoom, ZOOM_LADDER } from "../gantt/time-scale";
import { ZoomAnchor } from "../gantt/gantt-view";
import { t } from "../i18n";
import { GanttTask } from "../parser/gantt-parser";
import { GanttBoard } from "../panels/gantt-board";
import { askDateConflict, askDeleteTask } from "../modals/confirm-modals";
import { TaskEditorHost, TaskEditorModal } from "../modals/task-editor-modal";
import { CalendarBoard } from "../panels/calendar-board";
import { FilterBar } from "../panels/filter-bar";
import { PanelBoard } from "../panels/panel-board";
import {
  buildCalendarSummary,
  CalendarMode,
  collectCalendarItems,
} from "../services/calendar-service";
import {
  applyFilters,
  applyVisibilityRanges,
  collectMarkers,
  defaultFilterState,
  initialFilterState,
  resolveDateRange,
  sortTasks,
} from "../services/filter-service";
import { buildPanels, GroupingResult } from "../services/grouping-service";
import {
  cancelTask,
  deleteTask,
  moveTaskToGtdState,
  moveTaskToQuadrant,
  startTask,
  toggleTaskStatus,
} from "../services/task-actions";
import {
  ActiveTab,
  FilterState,
  GanttGrouping,
  PanelDropTarget,
  ParsedTask,
  SortMode,
  TaskMatrixSettings,
  ViewMode,
} from "../types";
import { maxIso, minIso, todayIso } from "../utils/date";
import { pickViewIcon } from "../utils/icon";

/** 视图类型：`task-matrix-` 前缀保证不与其他插件的 view type 撞名 */
export const VIEW_TYPE_TASK_MATRIX = "task-matrix-view";

/** 面板模式的四个按钮：主区走容器网格或日历 */
const MODES: readonly ViewMode[] = ["list", "gtd", "eisenhower", "calendar"];

/**
 * 「默认视图」选了甘特时，面板那一侧的落点。
 *
 * 面板模式是持久状态（从甘特切回去要回到原来那一档），但冷启动时总得先给一个：
 * 矩阵是默认视图，用它最不意外。
 */
const FALLBACK_PANEL_MODE: ViewMode = "eisenhower";

function modeLabel(mode: ViewMode): string {
  switch (mode) {
    case "gtd":
      return "GTD";
    case "eisenhower":
      return t("矩阵");
    case "calendar":
      return t("日历");
    default:
      return t("笔记列表");
  }
}

/**
 * 视图对插件的依赖（接口注入，而不是直接 import 插件类）。
 *
 * 这样 views → main 不产生循环 import，视图也只看得见它真正需要的东西：
 * 数据从 `getTasks()` 来，写操作走服务层，写完通过 `requestRescan()` 让插件
 * 统一重新索引 —— 视图自己不缓存任务列表，避免两份真相。
 */
export interface TaskMatrixHost {
  app: App;
  settings: TaskMatrixSettings;
  getTasks(): readonly ParsedTask[];
  /** 甘特视图用的任务投影（字段口径不同，见 parser/gantt-parser.ts） */
  getGanttTasks(): readonly GanttTask[];
  /** 首次索引是否已经完成 */
  isIndexReady(): boolean;
  /** 数据可能已变：重新扫描并刷新所有视图 */
  requestRescan(): void;
  /** 只重绘（设置变化这类不涉及数据的情况） */
  requestRedraw(): void;
  /** 打开任务所在的笔记 */
  openTaskFile(task: ParsedTask): Promise<void>;
  /** 按路径打开笔记（甘特按任务定位，手里只有路径） */
  openNote(path: string): Promise<void>;
}

/**
 * 任务矩阵视图 —— 只做布局组装与生命周期。
 *
 * 三层结构（自上而下，与 Project Master 同款）：
 *   第一行 `.tm-toolbar`   新建任务 / 刷新 / 四种模式 / 全部展开收起
 *   第二行 `.tm-filter-bar` 搜索 · 状态 · 日期 · 排序 · 计数 · 清除
 *   主区   `.tm-board`      容器网格（容器 + 任务卡片）；日历模式走 `.tm-calendar`
 *
 * 业务规则全在 services/（纯函数）、绘制全在 panels/，这里不做判断只做接线。
 */
export class MatrixView extends ItemView {
  /**
   * 第一层：面板模式还是甘特。
   *
   * 面板模式（`this.mode`）在切到甘特时**保持不变**，切回来还在原来那一档。
   */
  private activeTab: ActiveTab;
  private mode: ViewMode;
  private sortMode: SortMode = "due-asc";
  private filterState: FilterState | null = null;
  private calendarMode: CalendarMode = "month";
  private calendarAnchor = new Date();
  private calendarSummaryOpen = false;
  /**
   * 折叠的容器/分节 key：一份状态喂给所有渲染路径。
   *
   * 面板视图与甘特共用同一批 key（`folder:` / `gtd:` / `q:`），所以「在甘特里
   * 收起文件夹分组」与「在列表里收起同一个文件夹」是同一个状态，切视图不会变样。
   */
  private readonly collapsedKeys = new Set<string>();

  // 甘特自己的视图状态（粒度 / 分组 / 缩放锚点）
  private ganttZoom: GanttZoom = "day";
  private ganttGrouping: GanttGrouping = "none";
  private ganttAnchor: ZoomAnchor | undefined;
  private ganttNeedsScrollToToday = true;

  private filterBar: FilterBar | null = null;
  private board: PanelBoard | null = null;
  private calendar: CalendarBoard | null = null;
  private gantt: GanttBoard | null = null;
  private boardHost: HTMLElement | null = null;
  private calendarHost: HTMLElement | null = null;
  private ganttHost: HTMLElement | null = null;
  private readonly modeButtons = new Map<ViewMode, HTMLButtonElement>();
  /** 根容器：甘特模式下挂 `tm-root--gantt`，工具栏的显隐全由这一个类切换 */
  private rootEl: HTMLElement | null = null;
  private ganttToggleBtn: HTMLButtonElement | null = null;
  private ganttZoomSelect: HTMLSelectElement | null = null;
  private ganttGroupingSelect: HTMLSelectElement | null = null;
  private collapseBtn: HTMLButtonElement | null = null;
  /**
   * 当前模式真实渲染出来的可折叠单元（容器 key / 甘特分节 key）。
   * 展开/收起按钮据此判断自己在哪个状态；为空表示这个模式没有可折叠的东西。
   */
  private lastCollapsibleKeys: readonly string[] = [];
  private markdownComponent: Component | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly host: TaskMatrixHost,
  ) {
    super(leaf);
    const defaultView = host.settings.defaultView;
    this.activeTab = defaultView === "gantt" ? "gantt" : "panel";
    this.mode = defaultView === "gantt" ? FALLBACK_PANEL_MODE : defaultView;
  }

  getViewType(): string {
    return VIEW_TYPE_TASK_MATRIX;
  }

  getDisplayText(): string {
    return t("任务矩阵");
  }

  getIcon(): string {
    // 与 ribbon 共用同一个来源，免得两处各写一份图标名、改一处漏一处
    return pickViewIcon(getIconIds());
  }

  // ────────────────────────────── 生命周期 ──────────────────────────────

  /**
   * 布局只搭一次：工具栏与筛选栏建好后不再重建，状态变化走 `update()`/类名同步。
   *
   * 用 `Promise.resolve()` 而不是 `async`：这里确实没有需要等待的东西，
   * 加个 `async` 只会让读的人以为有异步步骤。
   */
  onOpen(): Promise<void> {
    const root = this.contentEl.createDiv({ cls: "tm-root" });
    this.rootEl = root;
    this.buildToolbar(root);
    this.buildFilterBar(root);
    this.buildBody(root);
    this.syncToolbar();
    this.render();
    return Promise.resolve();
  }

  onClose(): Promise<void> {
    // 视图自有资源在此收口；不 detach leaves，不跨视图清理
    this.releaseMarkdownComponent();
    this.calendar?.destroy();
    this.gantt?.destroy();
    this.filterBar = null;
    this.board = null;
    this.calendar = null;
    this.gantt = null;
    this.boardHost = null;
    this.calendarHost = null;
    this.ganttHost = null;
    this.rootEl = null;
    this.ganttToggleBtn = null;
    this.ganttZoomSelect = null;
    this.ganttGroupingSelect = null;
    this.modeButtons.clear();
    this.contentEl.empty();
    return Promise.resolve();
  }

  // ────────────────────────────── 布局 ──────────────────────────────

  private buildToolbar(root: HTMLElement): void {
    const bar = root.createDiv({ cls: "tm-toolbar" });
    bar.createEl("h2", { cls: "tm-toolbar__title", text: t("任务矩阵") });

    const actions = bar.createDiv({ cls: "tm-toolbar__actions" });
    this.addButton(actions, t("新建任务"), () => this.openEditor(null, {}));
    this.addButton(actions, t("刷新"), () => this.host.requestRescan());

    // 面板模式组：容器网格 / 日历。整组只在面板模式下显示（甘特模式下收起）
    const modes = actions.createDiv({
      cls: "tm-toolbar__modes tm-toolbar__panel-only",
      attr: { role: "group" },
    });
    for (const mode of MODES) {
      const button = modes.createEl("button", {
        cls: "tm-mode-btn",
        text: modeLabel(mode),
        attr: { type: "button" },
      });
      this.modeButtons.set(mode, button);
      this.registerDomEvent(button, "click", () => {
        if (this.activeTab === "panel" && this.mode === mode) return;
        this.switchToPanel(mode);
      });
    }

    /*
     * 甘特自己的一套控件，全部收在「甘特图模式」下（Project Master 的面板模式反过来）。
     *
     * 默认是面板模式，点按钮才进甘特，退出时这两个下拉跟着一起消失 ——
     * 面板模式下它们调什么都没有反应，留在工具栏上只会让人以为坏了。
     * 下拉本身只在建工具栏时创建一次，取值走 `syncToolbar()`：
     * 每轮重建会丢掉展开状态（与筛选栏的输入框同一个坑）。
     */
    const zoomField = actions.createDiv({ cls: "tm-toolbar__field tm-toolbar__gantt-only" });
    zoomField.createEl("label", { cls: "tm-toolbar__label", text: t("时间粒度") });
    const zoom = zoomField.createEl("select", {
      cls: "dropdown",
      attr: { "aria-label": t("时间粒度") },
    });
    this.ganttZoomSelect = zoom;
    // 由粗到细，与 ZOOM_LADDER 一致：Ctrl+滚轮的阶梯与下拉里的顺序同一条线
    for (const mode of [...ZOOM_LADDER].reverse()) {
      zoom.createEl("option", { value: mode, text: ganttZoomLabel(mode) });
    }
    this.registerDomEvent(zoom, "change", () => {
      this.ganttAnchor = undefined;
      this.ganttZoom = zoom.value as GanttZoom;
      this.render();
    });

    const groupingField = actions.createDiv({ cls: "tm-toolbar__field tm-toolbar__gantt-only" });
    groupingField.createEl("label", { cls: "tm-toolbar__label", text: t("分组依据") });
    const grouping = groupingField.createEl("select", {
      cls: "dropdown",
      attr: { "aria-label": t("分组依据") },
    });
    this.ganttGroupingSelect = grouping;
    for (const mode of GANTT_GROUPINGS) {
      grouping.createEl("option", { value: mode, text: ganttGroupingLabel(mode) });
    }
    this.registerDomEvent(grouping, "change", () => {
      this.ganttGrouping = grouping.value as GanttGrouping;
      this.render();
    });

    /*
     * 进/出甘特的开关。
     *
     * 做成「一个按钮切换」而不是两个按钮/一组页签：它只有两个状态，
     * 而按钮文字本身就说明了当前在哪、点下去会去哪（同「全部收起」那个按钮的口径）。
     */
    this.ganttToggleBtn = this.addButton(
      actions,
      t("甘特图模式"),
      () => this.switchTab(this.activeTab === "gantt" ? "panel" : "gantt"),
      "tm-btn--toggle",
    );

    /*
     * 展开/收起只有一个按钮：它显示的是「点下去会发生什么」。
     * 只要有一个容器是收起的，就说明当前不是全展开状态，按钮显示「全部展开」；
     * 反之为「全部收起」。两个按钮并排会逼用户在两个图标之间先判断自己在哪个状态。
     */
    this.collapseBtn = this.addButton(actions, t("全部收起"), () => this.toggleAllCollapsed());
  }

  private buildFilterBar(root: HTMLElement): void {
    const hostEl = root.createDiv({ cls: "tm-filter-host" });
    this.filterBar = new FilterBar(this, hostEl, {
      getState: () => this.filterStateValue(),
      getSortMode: () => this.sortMode,
      getCounts: () => this.counts(),
      getAvailableMarkers: () => collectMarkers(this.host.getTasks(), this.host.settings),
      setStatuses: (statuses) => this.patchFilter({ statuses }),
      setMarkers: (markers) => this.patchFilter({ markers }),
      setSearch: (search) => this.patchFilter({ search }),
      setStartDate: (startDate) => this.patchFilter({ startDate }),
      setDueDate: (dueDate) => this.patchFilter({ dueDate }),
      setSortMode: (mode) => {
        this.sortMode = mode;
        this.render();
      },
      clearFilters: () => {
        this.filterState = defaultFilterState();
        this.render();
      },
    });
  }

  private buildBody(root: HTMLElement): void {
    const body = root.createDiv({ cls: "tm-body" });

    this.boardHost = body.createDiv({ cls: "tm-board-host" });
    this.board = new PanelBoard(this.boardHost, this.host.app, {
      onOpen: (task) => void this.host.openTaskFile(task),
      onToggle: (task) => void this.runAction(() => toggleTaskStatus(this.host.app, this.host.settings, task)),
      onStart: (task) => void this.runAction(() => startTask(this.host.app, task)),
      onCancel: (task) => void this.runAction(() => cancelTask(this.host.app, this.host.settings, task)),
      onEdit: (task) => this.openEditor(task, {}),
      onDelete: (task) => void this.confirmDelete(task),
      onMoveGtd: (task, state) =>
        void this.runAction(() =>
          moveTaskToGtdState(this.host.app, this.host.settings, task, state, (start, due) =>
            askDateConflict(this.host.app, start, due)),
        ),
      onMoveQuadrant: (task, quadrant) =>
        void this.runAction(() => moveTaskToQuadrant(this.host.app, task, quadrant)),
      onToggleCollapse: (key) => this.toggleCollapse(key),
      onAddTask: (panel) => this.openEditor(null, panel.addDefaults ?? {}),
      onDropTask: (taskId, target) => void this.handleDrop(taskId, target),
    });

    this.calendarHost = body.createDiv({ cls: "tm-board-host is-hidden" });
    this.calendar = new CalendarBoard(this.calendarHost, {
      onOpenTask: (task) => void this.host.openTaskFile(task),
      onShift: (delta) => this.shiftCalendar(delta),
      onToday: () => {
        this.calendarAnchor = new Date();
        this.render();
      },
      onModeChange: (mode) => {
        this.calendarMode = mode;
        this.render();
      },
      onToggleSummary: () => {
        this.calendarSummaryOpen = !this.calendarSummaryOpen;
        this.render();
      },
    });

    this.ganttHost = body.createDiv({ cls: "tm-board-host is-hidden" });
    this.gantt = new GanttBoard(this.ganttHost, this, {
      onOpenTask: (task) => void this.host.openNote(task.filePath),
      onEditTask: (task) => this.openGanttTaskEditor(task),
      onToggleSection: (key) => this.toggleCollapse(key),
      onZoomStep: (direction, anchor) => this.stepGanttZoom(direction, anchor),
    });
  }

  /** 选面板模式：顺带把主区切回面板那一侧（点「列表」时不该还停在甘特上） */
  private switchToPanel(mode: ViewMode): void {
    this.mode = mode;
    this.activeTab = "panel";
    this.syncToolbar();
    this.render();
  }

  /**
   * 切到甘特。
   *
   * 进甘特时把视野落到今天（甘特的常态就是盯着最近这几周）；`display:none`
   * 会把滚动容器归零，所以每次进入都重新定位一次，不必保存上次的位置。
   */
  private switchTab(tab: ActiveTab): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    if (tab === "gantt") {
      this.ganttAnchor = undefined;
      this.ganttNeedsScrollToToday = true;
    }
    this.syncToolbar();
    this.render();
  }

  /** Ctrl+滚轮：在粒度阶梯上走一档，并记住锚点把那天钉回原位 */
  private stepGanttZoom(direction: 1 | -1, anchor: ZoomAnchor | null): void {
    const index = ZOOM_LADDER.indexOf(this.ganttZoom);
    const next = index + direction;
    if (next < 0 || next >= ZOOM_LADDER.length) return;
    this.ganttZoom = ZOOM_LADDER[next] ?? this.ganttZoom;
    this.ganttAnchor = anchor ?? undefined;
    this.render();
  }

  private addButton(
    host: HTMLElement,
    label: string,
    onClick: () => void,
    cls = "",
  ): HTMLButtonElement {
    const button = host.createEl("button", {
      cls: cls.length > 0 ? `tm-btn ${cls}` : "tm-btn",
      text: label,
      attr: { type: "button" },
    });
    this.registerDomEvent(button, "click", onClick);
    return button;
  }

  // ────────────────────────────── 渲染管道 ──────────────────────────────

  /**
   * 唯一的数据入口：索引 → 显示口径 → 筛选 → 排序 → 分组 → 画。
   *
   * 顺序有讲究：「显示口径」（设置里的截止日范围、远期开始）先于用户筛选生效，
   * 这样筛选栏里的计数与用户看到的容器内容永远一致。
   */
  render(): void {
    const all = this.host.getTasks();
    const today = todayIso();
    const settings = this.host.settings;

    // 用户当下的筛选（含条件搜索、日期、状态）
    const filtered = applyFilters(all, this.filterStateValue(), today);
    // 再叠加设置里的长期显示口径（截止日范围、远期开始）
    const visible = applyVisibilityRanges(filtered, settings, today);
    const ordered = sortTasks(visible, this.sortMode);

    this.releaseMarkdownComponent();
    const markdownComponent = this.getMarkdownComponent();

    const ganttActive = this.activeTab === "gantt";
    const calendarActive = !ganttActive && this.mode === "calendar";

    // 三个宿主互斥显隐集中在这里写一次：分散到各分支里迟早会漏掉一个
    this.boardHost?.toggleClass("is-hidden", ganttActive || calendarActive);
    this.calendarHost?.toggleClass("is-hidden", !calendarActive);
    this.ganttHost?.toggleClass("is-hidden", !ganttActive);

    if (ganttActive) {
      this.renderGantt(filtered, today, settings);
    } else if (calendarActive) {
      this.renderCalendar(filtered);
    } else {
      const grouping: GroupingResult = buildPanels(ordered, this.mode, settings);
      // 分区与容器共用一套折叠 key：全收/全开对两层都生效
      this.lastCollapsibleKeys = [
        ...(grouping.sections?.map((section) => section.key) ?? []),
        ...grouping.panels.map((panel) => panel.key),
      ];
      void this.board?.render(grouping, {
        collapsedKeys: this.collapsedKeys,
        markdownComponent,
        loaded: this.host.isIndexReady(),
      });
    }

    this.filterBar?.update();
    this.syncToolbar();
  }

  /**
   * 日历吃「用户筛过的」数据，但不吃「截止日显示范围」：日历自己是按区间看的，
   * 再套一层范围裁剪会出现「切到日历发现远期任务没了」这种莫名其妙的缺口。
   */
  private renderCalendar(filtered: readonly ParsedTask[]): void {
    const settings = this.host.settings;
    this.lastCollapsibleKeys = [];
    this.calendar?.render({
      mode: this.calendarMode,
      anchor: this.calendarAnchor,
      summaryOpen: this.calendarSummaryOpen,
      settings,
      itemsByDate: collectCalendarItems(filtered, {
        showInProcessTasks: settings.showCalendarInProcessTasks,
      }),
      summary: buildCalendarSummary(filtered, this.calendarMode, this.calendarAnchor, settings),
      today: todayIso(),
    });
  }

  /**
   * 甘特同样按「用户筛过的」数据画，不吃长期显示口径 —— 那两条是为了让面板
   * 不至于一次铺出上千张卡片，而甘特本来就是按时段看的，再裁一刀会出现
   * 「任务在列表里有、在甘特上找不到」这种对不上账的缺口。
   */
  private renderGantt(
    filtered: readonly ParsedTask[],
    today: string,
    settings: TaskMatrixSettings,
  ): void {
    const allParsed = this.host.getTasks();
    const allKeys = new Set(allParsed.map((task) => `${task.filePath}:${task.lineNumber}`));
    const visibleKeys = new Set(filtered.map((task) => `${task.filePath}:${task.lineNumber}`));

    const ganttTasks = this.host.getGanttTasks().filter((task) => {
      const key = `${task.filePath}:${task.lineNumber}`;
      // 面板解析器认出来的行跟着筛选走；它不认的行（极少）无法判断，保留而不是丢掉
      return visibleKeys.has(key) || !allKeys.has(key);
    });

    const model: GanttModel = buildGanttModel(ganttTasks, {
      grouping: this.ganttGrouping,
      collapsedKeys: this.collapsedKeys,
      today,
      axisRange: this.ganttAxisRange(today),
      settings,
      parsedByLine: new Map(allParsed.map((task) => [`${task.filePath}:${task.lineNumber}`, task])),
    });

    // 无分组时只有一个分节、没有分节头，折叠它就没法展开了 —— 也不进「全部收起」
    this.lastCollapsibleKeys =
      this.ganttGrouping === "none" ? [] : model.sections.map((section) => section.key);

    const scrolledToToday = this.gantt?.render({
      zoom: this.ganttZoom,
      grouping: this.ganttGrouping,
      model,
      today,
      anchor: this.ganttAnchor,
      colors: settings.ganttBarColors,
      scrollToToday: this.ganttNeedsScrollToToday,
    });
    this.ganttAnchor = undefined;
    // 容器还没显示出来时这次没滚成，留着标记等下一次渲染
    if (scrolledToToday === true) this.ganttNeedsScrollToToday = false;
  }

  /** 筛选栏的起止日期一起撑开时间轴（gantt-model 那边是「只扩不缩」的并集） */
  private ganttAxisRange(today: string): { start: string; end: string } | undefined {
    const state = this.filterStateValue();
    const startRange = resolveDateRange(state.startDate, today);
    const dueRange = resolveDateRange(state.dueDate, today);
    const from = minIso(startRange.start, dueRange.start);
    const to = maxIso(startRange.end, dueRange.end);
    if (from === null && to === null) return undefined;
    return { start: from ?? today, end: to ?? today };
  }

  private syncToolbar(): void {
    const ganttActive = this.activeTab === "gantt";

    // 一个类决定整条工具栏的显隐：面板模式那组与甘特那两个下拉互斥
    this.rootEl?.toggleClass("tm-root--gantt", ganttActive);

    for (const [mode, button] of this.modeButtons) {
      button.toggleClass("is-active", mode === this.mode);
      button.setAttribute("aria-pressed", String(mode === this.mode));
    }

    if (this.ganttToggleBtn !== null) {
      this.ganttToggleBtn.setText(ganttActive ? t("退出甘特图模式") : t("甘特图模式"));
      this.ganttToggleBtn.toggleClass("is-on", ganttActive);
    }
    // 下拉的取值只在建工具栏时给过一次，缩放/分组改过之后要在这儿对齐
    if (this.ganttZoomSelect !== null) this.ganttZoomSelect.value = this.ganttZoom;
    if (this.ganttGroupingSelect !== null) this.ganttGroupingSelect.value = this.ganttGrouping;

    // 日历没有可折叠的单元、甘特「不分组」时也没有分节头：按钮留着只会「点了没反应」
    const hasCollapsibles = this.lastCollapsibleKeys.length > 0;
    if (this.collapseBtn !== null) {
      this.collapseBtn.toggleClass("is-hidden", !hasCollapsibles);
      this.collapseBtn.setText(this.isAllExpanded() ? t("全部收起") : t("全部展开"));
    }
  }

  /** 只要还有一个单元是收起的，就不算全展开 */
  private isAllExpanded(): boolean {
    return this.lastCollapsibleKeys.every((key) => !this.collapsedKeys.has(key));
  }

  private filterStateValue(): FilterState {
    // 第一屏的档位：隐藏已取消，其余都铺；之后完全由筛选栏接管
    this.filterState ??= initialFilterState();
    return this.filterState;
  }

  private patchFilter(patch: Partial<FilterState>): void {
    this.filterState = { ...this.filterStateValue(), ...patch };
    this.render();
  }

  private counts(): { shown: number; total: number } {
    const all = this.host.getTasks();
    const today = todayIso();
    const visible = applyVisibilityRanges(
      applyFilters(all, this.filterStateValue(), today),
      this.host.settings,
      today,
    );
    return { shown: visible.length, total: all.length };
  }

  /** 一个按钮走完两个方向：全展开时它收起，否则它展开 */
  private toggleAllCollapsed(): void {
    if (this.isAllExpanded()) {
      // 只收起当前模式真实存在的单元，避免积累永远用不上的 key
      for (const key of this.lastCollapsibleKeys) this.collapsedKeys.add(key);
    } else {
      this.collapsedKeys.clear();
    }
    this.render();
  }

  private toggleCollapse(key: string): void {
    if (this.collapsedKeys.has(key)) this.collapsedKeys.delete(key);
    else this.collapsedKeys.add(key);
    this.render();
  }

  private shiftCalendar(delta: number): void {
    const next = new Date(this.calendarAnchor);
    if (this.calendarMode === "week") next.setDate(next.getDate() + delta * 7);
    else next.setMonth(next.getMonth() + delta);
    this.calendarAnchor = next;
    this.render();
  }

  // ────────────────────────────── 动作 ──────────────────────────────

  /** 写操作统一收口：写完让插件重新索引，而不是本地猜结果 */
  private async runAction(action: () => Promise<void>): Promise<void> {
    await action();
    this.host.requestRescan();
  }

  private openEditor(task: ParsedTask | null, defaults: Partial<ParsedTask>): void {
    const editorHost: TaskEditorHost = {
      app: this.host.app,
      settings: this.host.settings,
      tasks: this.host.getTasks(),
      onSaved: () => this.host.requestRescan(),
    };
    new TaskEditorModal(editorHost, task, defaults).open();
  }

  /**
   * 甘特里的「编辑任务」。
   *
   * 甘特解析器只产出它自己那套字段（`GanttTask`），而编辑界面要的是面板解析器的
   * `ParsedTask`（它认得标签、依赖、GTD 状态）。两者是同一条线上跑出来的，
   * 按 `文件:行号` 就能对上 —— 也正是甘特做 GTD/象限分组时用的同一个索引。
   *
   * 对不上时（理论上极少：面板解析器与甘特解析器认的行会略有出入）退回到「打开笔记」，
   * 总比右键点了没反应好；宁可多一步，也不能让人以为坏了。
   */
  private openGanttTaskEditor(ganttTask: GanttTask): void {
    const parsed = this.host
      .getTasks()
      .find(
        (task) => task.filePath === ganttTask.filePath && task.lineNumber === ganttTask.lineNumber,
      );
    if (parsed === undefined) {
      void this.host.openNote(ganttTask.filePath);
      return;
    }
    this.openEditor(parsed, {});
  }

  private async confirmDelete(task: ParsedTask): Promise<void> {
    const confirmed = await askDeleteTask(this.host.app, task.description);
    if (!confirmed) return;
    await this.runAction(() => deleteTask(this.host.app, task));
  }

  private async handleDrop(taskId: string, target: PanelDropTarget): Promise<void> {
    const task = this.host.getTasks().find((candidate) => candidate.id === taskId);
    if (task === undefined) return;

    if (target.kind === "gtd") {
      await this.runAction(() =>
        moveTaskToGtdState(this.host.app, this.host.settings, task, target.state, (start, due) =>
          askDateConflict(this.host.app, start, due)),
      );
      return;
    }
    await this.runAction(() => moveTaskToQuadrant(this.host.app, task, target.quadrant));
  }

  // ────────────────────────────── 内联 Markdown ──────────────────────────────

  /**
   * 卡片内联 Markdown 的宿主组件。
   *
   * 每次重绘前卸载旧的：渲染器注册的监听器与子组件都挂在这个 Component 上，
   * 不卸载就会随刷新次数线性增长。
   */
  private getMarkdownComponent(): Component {
    if (this.markdownComponent === null) {
      this.markdownComponent = new Component();
      this.markdownComponent.load();
    }
    return this.markdownComponent;
  }

  private releaseMarkdownComponent(): void {
    this.markdownComponent?.unload();
    this.markdownComponent = null;
  }
}
