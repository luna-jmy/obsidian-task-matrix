import { UiLanguage } from "./i18n/translate";

/**
 * 面板模式：主区走「容器 + 任务卡片」网格（日历有自己的一套布局）。
 *
 * 甘特**不在**这里面：它是与面板并列的另一块主区，将来还要带自己的控制按钮
 * （时间粒度、分组、Mermaid 导出…），混进这一组会让「切模式」与「切视图」
 * 变成同一件事，后面加按钮时无处安放。
 */
export type ViewMode = "list" | "gtd" | "eisenhower" | "calendar";

/** 第一层切换：面板模式 / 甘特 */
export type ActiveTab = "panel" | "gantt";

/** 设置里的「默认视图」：四种面板模式，或甘特 */
export type DefaultView = ViewMode | "gantt";

/**
 * 甘特的分节口径。
 *
 * 前三档刻意与三种面板视图的分组规则一致（文件夹 = 列表视图的分组规则），
 * 于是「同一批任务换个视图看」时分组含义不漂移；`none` 是经典甘特的一整条平铺。
 */
export type GanttGrouping = "none" | "folder" | "note" | "gtd" | "quadrant";

/**
 * 甘特条配色。
 *
 * 四个键对应 Mermaid 甘特能标出来的四种状态，每个都能在任务行里找到写法：
 * - `active`    未完成的任务（`- [ ]`）
 * - `done`      已完成（`- [x]`）
 * - `crit`      关键任务（`🔺` / `#crit` / `#critical`）
 * - `fallback`  其他：既非关键也非已完成，且起止日期不完整（图上那段是推导值）
 */
export interface GanttBarColors {
  active: string;
  done: string;
  crit: string;
  fallback: string;
}

export const DEFAULT_GANTT_BAR_COLORS: GanttBarColors = {
  active: "var(--color-blue)",
  done: "var(--color-green)",
  crit: "var(--color-red)",
  fallback: "var(--text-muted)",
};

/**
 * 某一年度的法定节假日排期。
 *
 * 两个字段都是**自由文本清单**而不是日期数组：用户改的是「10-01~10-07」这种写法，
 * 存成数组反而要在 UI 与存储之间来回翻译。展开成具体日期由
 * `services/holiday-schedule.ts` 负责（纯函数，可测）。
 */
export interface YearHolidaySchedule {
  /** 放假：`MM-DD`、`MM-DD~MM-DD`（跨年自动算到次年）或完整 `YYYY-MM-DD`，逗号/空格分隔 */
  holidays: string;
  /** 调休上班日：写法同上，导出为 includes（优先级高于放假） */
  makeupWorkdays: string;
}

/** 年度排期表：键 = 四位年份 */
export type HolidayScheduleMap = Record<string, YearHolidaySchedule>;

/**
 * 甘特条上显示的天数口径（与 Project Master 同口径）。
 *
 * - `off`：不显示；
 * - `calendar`：自然日跨度（含首尾）；
 * - `workday`：工作日跨度 = 自然日 − 非工作日（周末 / 法定节假日，补班日算工作日）。
 *   「哪些日子不算工作日」完全取自「排除周末」开关与法定节假日排期 ——
 *   与导出的 excludes/includes、图上的灰色列是同一份口径。
 */
export type BarDurationMode = "off" | "calendar" | "workday";

/**
 * 三档的全量清单，供设置页下拉使用。
 *
 * 用 `Record<T, true>` 派生而不是手写数组：**漏写一个成员会直接编译报错**，
 * 手写数组只会静静地与类型定义脱节。
 */
const BAR_DURATION_MODE_KEYS: Record<BarDurationMode, true> = {
  off: true,
  calendar: true,
  workday: true,
};
export const BAR_DURATION_MODES = Object.keys(BAR_DURATION_MODE_KEYS) as BarDurationMode[];

/**
 * 甘特任务列的宽度契约。
 *
 * 放这儿而不是甘特视图里：设置页（填数字时收敛）与视图（拖动时收敛）要用同一份上下限，
 * 两边各写一套的话，设置里能填的宽度和拖得出来的宽度迟早对不上。
 */
export const GANTT_SIDEBAR_MIN_WIDTH = 140;
/** 设置页上的上限；实际能拖多宽还取决于容器宽度（时间轴要留得下） */
export const GANTT_SIDEBAR_MAX_WIDTH = 1200;
export const GANTT_SIDEBAR_DEFAULT_WIDTH = 240;
export type OpenLocation = "sidebar" | "tab";
export type FirstDayOfWeek = "monday" | "sunday";

// User-defined task status display type
export type TaskStatusDisplay = "open" | "completed" | "cancelled" | "in-progress" | "to-be-started" | "overdue";
export type GTDState = "Inbox" | "To be Started" | "In Progress" | "Waiting" | "Overdue" | "Done";
export type EisenhowerQuadrant = "Q1" | "Q2" | "Q3" | "Q4";

export enum Priority {
  Critical = "critical",
  Highest = "highest",
  High = "high",
  Medium = "medium",
  None = "none",
  Low = "low",
  Lowest = "lowest",
}

export interface ParsedTask {
  id: string;
  filePath: string;
  lineNumber: number;
  lineText: string;
  sectionHeading?: string;
  description: string;
  // The actual checkbox status in the markdown
  checkboxStatus: CheckboxStatus;
  // The computed display status based on dates
  displayStatus: TaskStatusDisplay;
  priority: Priority;
  dueDate?: string;
  startDate?: string;
  scheduledDate?: string;
  doneDate?: string;
  createdDate?: string;
  recurrence?: string;
  taskId?: string;
  dependsOn?: string;
  tags: string[];
  blocked: boolean;
  gtdState: GTDState;
  quadrant: EisenhowerQuadrant;
}

export type CheckboxStatus = string;

// ────────────────────────────── 筛选 ──────────────────────────────

/** 筛选栏按 displayStatus 多选：就是任务在界面上显示的那几种状态 */
export type TaskStatusFilter = TaskStatusDisplay;

export type DateRangePreset = "all" | "today" | "week" | "month" | "year" | "custom";

export interface DateRangeState {
  preset: DateRangePreset;
  /** 仅在 preset === "custom" 时生效；null = 不限这一端 */
  start: string | null;
  end: string | null;
}

/** 筛选栏的全部状态。视图持有它，筛选栏只读写，不自己存一份。 */
export interface FilterState {
  search: string;
  statuses: TaskStatusFilter[];
  /**
   * 按方括号里的标记筛选（`- [x]` 的 `x`、`- [-]` 的 `-`、未勾选的空串）。
   * 空数组 = 不按标记筛。
   */
  markers: string[];
  startDate: DateRangeState;
  dueDate: DateRangeState;
}

export type SortMode = "due-asc" | "due-desc" | "start-asc" | "priority" | "file";

// ────────────────────────────── 面板 ──────────────────────────────

/** 容器的拖放语义：GTD 改状态、矩阵改象限。列表容器没有落点。 */
export type PanelDropTarget =
  | { kind: "gtd"; state: GTDState }
  | { kind: "quadrant"; quadrant: EisenhowerQuadrant };

/**
 * 一个「容器」的渲染规格。
 *
 * 分组服务算出 PanelSpec[]，面板只负责画——这样四种模式共用同一套
 * 容器/卡片渲染，容器的等高等宽规则也就只有一处。
 */
export interface PanelSpec {
  key: string;
  title: string;
  subtitle?: string;
  tasks: ParsedTask[];
  dropTarget?: PanelDropTarget;
  /**
   * 卡片元信息行里笔记的显示方式（缺省 = `path`，即 GTD/矩阵的现状）。
   *
   * 列表模式的容器本身就以笔记/文件夹为单位：按笔记分容器时容器标题就是笔记名，
   * 卡片里再写一遍完整路径是噪声（`hidden`）；按文件夹分容器时同容器里有多篇笔记，
   * 显示笔记名（不带路径）刚好够区分（`name`）。
   */
  noteMeta?: "path" | "name" | "hidden";
  /** 容器头「+」新建任务时的预填值 */
  addDefaults?: Partial<ParsedTask>;
}

/**
 * 列表模式（笔记列表）开启「按文件夹分组」时的分区。
 *
 * 分区是**分组的一层标题**，不是容器：里面装的是笔记容器（`panels`），
 * 自己只有一行可折叠的头。折叠 key 与面板容器共用一套 `collapsedKeys`。
 */
export interface PanelSection {
  key: string;
  title: string;
  panels: PanelSpec[];
}

export interface TaskMatrixSettings {
  uiLanguage: UiLanguage;
  scanFolders: string[];
  excludeFolders: string[];
  defaultView: DefaultView;
  /** 甘特条配色（四类 Mermaid 状态各一个） */
  ganttBarColors: GanttBarColors;
  /** 甘特任务列的宽度（px）。可拖动调整，松手后写在这里 */
  ganttSidebarWidth: number;
  /** 甘特条上显示的天数口径：不显示 / 自然日 / 工作日 */
  ganttBarDuration: BarDurationMode;
  /** Mermaid 导出的图标题；留空则不输出 title 行 */
  mermaidTitle: string;
  /** 导出的代码里保留今天的竖线（mermaid 默认就画，关掉才输出 off） */
  mermaidTodayMarker: boolean;
  /** 导出时把周末标成非工作日（与调休/节假日并进同一条 `excludes weekends,…`） */
  mermaidExcludeWeekends: boolean;
  /** 预览面板上的临时排除日期（跨年度；完整 ISO 或 `A~B` 区间，逗号分隔） */
  mermaidExcludeDates: string;
  /** 预览面板上的临时调休上班日（写法同上，优先级高于排除） */
  mermaidIncludeDates: string;
  /**
   * 年度法定节假日排期（键 = 四位年份）。
   *
   * 导出与自绘甘特都按**图跨到的年份**自动套用，所以不必在面板里手打每一天；
   * 面板上的两个输入框退化成「临时补充」。
   */
  holidaySchedules: HolidayScheduleMap;
  /**
   * 「写入笔记」的落点标记。
   *
   * 只替换这两个标记**之间**的内容，标记之外一个字都不动 —— 用户在同一篇笔记里
   * 手写的东西因此不会被覆盖。标记缺失时整块追加到文末。
   */
  mermaidMarkerStart: string;
  mermaidMarkerEnd: string;
  /** 已完成任务的显示范围（月）。0 = 不限制 */
  completedTaskDisplayRange: number;
  /** 是否也铺出「没有截止日」的已完成任务 */
  includeCompletedWithoutDueDate: boolean;
  openLocation: OpenLocation;
  // Custom completion markers (checkbox content that means completed)
  /**
   * GTD 状态标签。
   *
   * 这两份清单既是**判定依据**（带这些标签的任务落在哪一列），也是**拖拽写入的词汇**
   * （拖到等待中写的是第一个）。同一份词表，才不会出现「拖进去写了个判定不认的标签、
   * 任务立刻跳回原来的列」。
   */
  gtdWaitingTags: string[];
  gtdInProgressTags: string[];
  /** 总开关：关掉后容器不接受拖入、卡片不可拖动（快捷移动按钮不受影响） */
  dragEnabled: boolean;
  /** 拖到各象限时写入的优先级（**重要性**这一轴；高及以上算重要） */
  quadrantPriorities: Record<EisenhowerQuadrant, Priority>;
  completionMarkers: string[];
  // Custom markers to exclude from task views and statistics
  excludeMarkers: string[];
  // Custom cancelled markers (checkbox content that means cancelled)
  cancelledMarkers: string[];
  // List view folder grouping
  listGroupByFolder: boolean;
  // Task creation settings
  /** 新建任务的落点模板；默认写到当日日志 */
  newTaskTargetPath: string;
  /** 落点笔记不存在时，用这篇模板笔记的内容新建（vault 相对路径，留空 = 空白笔记） */
  newTaskTemplatePath: string;
  newTaskTargetHeading: string;
  // Track completion date
  trackCompletionDate: boolean;
  // Urgent days range (1-7, default 1 means today only)
  urgentDaysRange: number;
  // Calendar setting: show weekends in week view
  showCalendarWeekends: boolean;
  // Calendar setting: show weekends in month view
  showCalendarMonthWeekends: boolean;
  // Calendar list setting: show every day of month, or only dates with tasks
  calendarListShowFullMonth: boolean;
  // Calendar setting: show in-process tasks on every day between start and due
  showCalendarInProcessTasks: boolean;
  // Calendar setting: first day of week
  calendarFirstDayOfWeek: FirstDayOfWeek;
  // Due date display range in months (0 = no limit, default 1)
  dueDateDisplayRange: number;
  // Whether to hide tasks with start date more than 1 month from now
  hideFutureStartTasks: boolean;
}

export const DEFAULT_SETTINGS: TaskMatrixSettings = {
  uiLanguage: "auto",
  // Defaults keep the first index pass small instead of scanning the whole vault.
  scanFolders: ["500 Journal", "100 Projects"],
  excludeFolders: [],
  defaultView: "eisenhower",
  ganttBarColors: { ...DEFAULT_GANTT_BAR_COLORS },
  ganttSidebarWidth: GANTT_SIDEBAR_DEFAULT_WIDTH,
  // 默认沿用「一直显示自然日」的旧行为：这个插件历来就把天数写在条上，
  // 默认改成「不显示」等于让现有用户的甘特图悄悄变样
  ganttBarDuration: "calendar",
  mermaidTitle: "任务进度甘特图",
  mermaidTodayMarker: true,
  mermaidExcludeWeekends: false,
  mermaidExcludeDates: "",
  mermaidIncludeDates: "",
  holidaySchedules: {},
  mermaidMarkerStart: "%% task-matrix:start %%",
  mermaidMarkerEnd: "%% task-matrix:end %%",
  completedTaskDisplayRange: 1,
  includeCompletedWithoutDueDate: false,
  openLocation: "sidebar",
  gtdWaitingTags: ["#waiting", "#delegated", "#blocked"],
  gtdInProgressTags: ["#doing", "#active", "#started", "#next"],
  dragEnabled: true,
  quadrantPriorities: {
    Q1: Priority.High,
    Q2: Priority.High,
    Q3: Priority.Low,
    Q4: Priority.Lowest,
  },
  completionMarkers: ["x", "X"],
  excludeMarkers: [],
  cancelledMarkers: ["-"],
  listGroupByFolder: false,
  // 默认落到当日日志：新任务最常见的去处就是今天那条，缺了会被自动建出来
  newTaskTargetPath: "500 Journal/{{date:YYYY-MM-DD}}",
  newTaskTemplatePath: "",
  newTaskTargetHeading: "",
  trackCompletionDate: false,
  urgentDaysRange: 1,
  showCalendarWeekends: true,
  showCalendarMonthWeekends: true,
  calendarListShowFullMonth: false,
  showCalendarInProcessTasks: false,
  calendarFirstDayOfWeek: "monday",
  dueDateDisplayRange: 1,
  hideFutureStartTasks: true,
};
