import { Component, Menu } from "obsidian";
import { t } from "../i18n";
import { GanttTask } from "../parser/gantt-parser";
import { DEFAULT_GANTT_BAR_COLORS, GANTT_SIDEBAR_MIN_WIDTH, GanttBarColors } from "../types";
import { clampSplitWidth, SplitResizer } from "../utils/split-resizer";
import { barClass, barColorKey } from "./bar-colors";
import { GanttModel, GanttRow } from "./gantt-model";
import { buildTimeScale, GanttZoom, TimeScale } from "./time-scale";

/**
 * 自绘甘特视图（只读）。
 *
 * 与 Project Master 同一套骨架与数值契约，砍掉了「写」的那一半：没有拖拽改期、
 * 没有侧栏拖拽排序、没有右键菜单（这一轮的范围见规划）。留下的都是「看」要用到的：
 * 两级刻度表头、周末底带、网格线、今天线、任务条、分节折叠、Ctrl+滚轮缩放。
 *
 * 事件模型：**全部委托，监听器数量恒定**。视图每次刷新整体重渲染，按元素注册监听器
 * 会随刷新次数线性增长（元素脱离文档了，但监听器表还引用着它们，是真实泄漏）。
 * 所以只在构造时向根容器注册一次，之后靠 data-* 分发。
 *
 * 一切节点都走 `root.ownerDocument` 创建，弹出窗口（popout）里 DOM 归属才不会错。
 */

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * 行高（px）。**必须与 styles.css 里对应值一致**：这里是 SVG 坐标计算，
 * 那边是盒子高度，两边对不上就会出现条与行错位。
 */
const ROW_HEIGHT = 30;
const SECTION_HEIGHT = 26;
/** 网格线/表头标签的降级阈值（极端范围 + 日刻度时避免一次插入上万节点） */
const MAX_GRID_LINES = 1000;
const MAX_HEADER_LABELS = 240;
/** 日宽小于这个值时不再画周末底带：比网格线还细的竖条只会变成噪点 */
const MIN_DAY_WIDTH_FOR_OFF_DAYS = 3;
/** Ctrl+滚轮的累计阈值：触控板一次滑动会连发很多小 delta，攒够一格才走一档 */
const WHEEL_STEP_THRESHOLD = 40;

/** 拖动平移的判定阈值（px）：小于它算点击，不算拖动 */
const PAN_THRESHOLD_PX = 4;

/** 时间轴拖动平移的现场 */
interface PanState {
  pointerX: number;
  pointerY: number;
  /** 按下时的滚动位置：平移是「从这儿开始算位移」，不是在当前位置上累加 */
  startLeft: number;
  startTop: number;
  /** 是否已经越过阈值（越过之后就不再当点击看） */
  moved: boolean;
}

/**
 * 任务列（左侧那一列）的宽度。
 *
 * 之前是写死的 `30%` 且 `max-width: 320px`：任务名稍长就被省略号切掉，
 * 而甘特模式下没有别的面板可以腾地方，用户只能干看着。改成可拖。
 * 上下限取自 types 里的那一份（设置页填数字时用的是同一套），
 * 拖动时另按容器宽度现算上限，保证时间轴永远留得下 `TIMELINE_MIN_WIDTH`。
 */
const TIMELINE_MIN_WIDTH = 220;

/** 宽度 CSS 变量名：拖动时改它，样式表里的默认值只是「没人拖过」时的兜底 */
const SIDEBAR_WIDTH_VAR = "--tm-gantt-sidebar-width";

export interface GanttCallbacks {
  /** 点击任务条 / 任务列里的名字 → 打开所在笔记 */
  onOpenTask(task: GanttTask): void;
  /** 右键任务条 / 点任务列上的 ✎ → 编辑任务（打开任务编辑界面） */
  onEditTask(task: GanttTask): void;
  /** 点击分节头 → 折叠/展开（key 与面板视图共用，两边折叠状态一致） */
  onToggleSection(key: string): void;
  /**
   * 时间粒度变化（Ctrl + 滚轮）。
   * @param direction +1 = 更细，-1 = 更粗
   * @param anchor 缩放锚点：渲染后把该日期固定回原来的屏幕 x，
   *               否则缩放时视野会「跑掉」（用户正盯着的那天跳到别处）
   */
  onZoom(direction: 1 | -1, anchor: ZoomAnchor | null): void;
  /** 任务列宽度拖完（松手 / 键盘调整）→ 由调用方落盘。拖动过程不走这里 */
  onSidebarWidthCommit(width: number): void;
}

/** 缩放锚点：某个日期 + 它距可视时间轴左边缘的像素偏移 */
export interface ZoomAnchor {
  iso: string;
  offsetX: number;
}

export interface GanttRenderOptions {
  /** 缩放锚点：渲染后把该日期固定回原来的屏幕 x */
  anchor?: ZoomAnchor;
  /** 四类 Mermaid 状态各自的条色（来自设置） */
  colors: GanttBarColors;
  /** 任务列宽度（px，来自设置）；上限由 CSS 与实际容器宽度兜底 */
  sidebarWidth: number;
  /**
   * 非工作日色带（已合并成连续区间）。
   *
   * 由调用方从 `services/holiday-schedule` 算好传进来：**必须与 Mermaid 导出的
   * excludes/includes 同源**，否则会出现「图上画成工作日、导出却是非工作日」。
   * 视图自己不读设置，也不重算一遍日历。
   */
  offDays: Array<{ start: string; end: string }>;
}

/** 侧栏与时间轴共用的纵向布局条目，保证两侧行高严格对齐 */
interface LayoutEntry {
  kind: "section" | "row";
  sectionKey: string;
  sectionName: string;
  collapsed: boolean;
  row: GanttRow | null;
  y: number;
  height: number;
}

export class GanttView {
  private frameBuilt = false;
  /**
   * 甘特框架元素。刻意在宿主容器里**再套一层**：宿主由调用方持有、负责在父级
   * flex 布局里占位；本视图只管「甘特内部怎么排」。两者落在同一个元素上时，
   * 双方各自写的 flex 属性会互相覆盖。
   */
  private frame: HTMLElement | null = null;
  /** 任务列本身（拖动分隔条时调整宽度的目标） */
  private sidebarEl: HTMLElement | null = null;
  private sidebarHeadEl: HTMLElement | null = null;
  private sidebarBodyEl: HTMLElement | null = null;
  private timelineEl: HTMLElement | null = null;
  private canvasEl: HTMLElement | null = null;

  private scale: TimeScale | null = null;
  private layout: LayoutEntry[] = [];
  private wheelAccumulator = 0;
  /** 拖动平移的现场（null = 没在拖） */
  private pan: PanState | null = null;
  /** 刚刚拖过时间轴：吞掉随之而来的那次 click（浏览器在 pointerup 后一定补发） */
  private suppressNextClick = false;
  /** 还欠一次「落到今天」：容器当时量不到宽度，等 ResizeObserver 报出宽度再补 */
  private pendingScrollToToday = false;
  /** 本轮配色：跟着每次 render 一起传进来，视图自己不留一份可能过期的副本 */
  private colors: GanttBarColors = DEFAULT_GANTT_BAR_COLORS;
  /** 本轮非工作日色带，同样每次 render 一起进来 */
  private offDays: Array<{ start: string; end: string }> = [];
  /**
   * 任务 id → 任务。
   *
   * 任务条上只带 id（DOM 属性挂不了对象），点击时回来查表。每次渲染重建，
   * 与当前 model 严格一致，不会残留上一轮的任务。
   */
  private taskIndex = new Map<string, GanttTask>();

  constructor(
    private readonly component: Component,
    private readonly root: HTMLElement,
    private readonly callbacks: GanttCallbacks,
  ) {
    this.registerInteraction();
  }

  // ────────────────────────────── 渲染 ──────────────────────────────

  render(model: GanttModel, zoom: GanttZoom, today: string, options: GanttRenderOptions): void {
    const { anchor, colors } = options;
    this.colors = colors;
    this.offDays = options.offDays;
    this.scale = buildTimeScale(model.rangeStart, model.rangeEnd, zoom, { today });
    this.layout = buildLayout(model);
    this.taskIndex = new Map(model.rows.map((row) => [row.task.id, row.task]));

    this.ensureFrame();
    // 宽度先按设置写一次：拖过之后这里不断被覆盖，两边不会漂移
    this.applySidebarWidth(options.sidebarWidth);
    const head = this.sidebarHeadEl;
    const body = this.sidebarBodyEl;
    const canvas = this.canvasEl;
    if (head === null || body === null || canvas === null) return;

    head.setText(summaryLabel(model));
    body.empty();
    canvas.empty();
    canvas.style.setProperty("--tm-canvas-width", `${this.scale.totalWidth}px`);

    this.renderSidebar(body);
    this.renderHeader(canvas);
    this.renderBody(canvas);

    if (model.rows.length === 0) {
      canvas.createDiv({
        cls: "tm-gantt__empty",
        text: t("没有可显示的任务（需要至少一个开始日或截止日）"),
      });
    }

    this.syncScroll();
    if (anchor !== undefined && this.timelineEl !== null) {
      this.timelineEl.scrollLeft = Math.max(0, this.scale.xForDate(anchor.iso) - anchor.offsetX);
    }
  }

  /** 只建一次：滚动监听器挂在持久节点上，重渲染不会累积监听器 */
  private ensureFrame(): void {
    if (this.frameBuilt) return;
    // tabindex=-1：容器能接收键盘事件，但不会因为获得焦点把页面滚走
    this.root.tabIndex = -1;

    const frame = this.root.createDiv({ cls: "tm-gantt" });
    this.frame = frame;

    const sidebar = frame.createDiv({ cls: "tm-gantt__sidebar" });
    this.sidebarEl = sidebar;
    this.sidebarHeadEl = sidebar.createDiv({ cls: "tm-gantt__sidebar-head" });
    this.sidebarBodyEl = sidebar.createDiv({ cls: "tm-gantt__sidebar-body" });

    /*
     * 任务列与时间轴之间那道可拖的分隔条。
     *
     * `role="separator"` + tabindex：键盘用户能用方向键调宽度（SplitResizer 里实现），
     * 拖拽本身是鼠标/触屏的便利，不是唯一入口。
     */
    const handle = frame.createDiv({
      cls: "tm-gantt__resizer",
      attr: {
        role: "separator",
        "aria-orientation": "vertical",
        "aria-label": t("拖动调整任务列宽度"),
        tabindex: "0",
      },
    });
    new SplitResizer(this.component, {
      target: sidebar,
      handle,
      min: GANTT_SIDEBAR_MIN_WIDTH,
      // 上限现算：时间轴至少要留得下 TIMELINE_MIN_WIDTH
      max: () => frame.getBoundingClientRect().width - TIMELINE_MIN_WIDTH,
      onResize: (width) => this.applySidebarWidth(width),
      onCommit: (width) => this.callbacks.onSidebarWidthCommit(width),
    });

    this.timelineEl = frame.createDiv({ cls: "tm-gantt__timeline" });
    this.canvasEl = this.timelineEl.createDiv({ cls: "tm-gantt__canvas" });

    this.component.registerDomEvent(this.timelineEl, "scroll", () => this.syncScroll());
    this.registerPanning(this.timelineEl);
    this.watchTimelineWidth(this.timelineEl);
    this.frameBuilt = true;
  }

  /**
   * 布局稳定后再补一次「落到今天」。
   *
   * 视图挂载与索引就绪的先后不保证：首次渲染时容器可能还没有宽度（视图在收起的侧栏里、
   * 或页签在后台），`clientWidth` 是 0，这种时候按 0 算会把视野甩到很远的地方，只能等
   * 它真的被量出宽度再滚。**只靠「下一次渲染」不够** —— 索引就绪之后可能根本不会再有
   * 下一次渲染，用户就永远停在时间轴最左端（最早的日期）。
   */
  private watchTimelineWidth(timeline: HTMLElement): void {
    const view = timeline.ownerDocument.defaultView;
    // 从所属窗口取构造器：弹出窗口（popout）里 DOM 归属不能错
    const Observer = view?.ResizeObserver;
    if (Observer === undefined) return;
    const observer = new Observer(() => {
      if (!this.pendingScrollToToday || timeline.clientWidth === 0) return;
      this.scrollToToday();
    });
    observer.observe(timeline);
    this.component.register(() => observer.disconnect());
  }

  /**
   * 时间轴的拖动平移（按住拖动，桌面端鼠标 / 触控笔）。
   *
   * 甘特的常态是「横向看时间」，而横向滚动条在 Obsidian 里是浮层、又细，
   * 不好找也不好抓；按住拖动是最直接的手势。触屏不接这一套 ——
   * 那里本来就是滑动滚动，再叠一层平移会互相打架。
   *
   * 拖动超过阈值就吞掉随后那次 click：否则「拖完顺手打开一篇笔记」
   * （浏览器在 pointerup 后一定补发 click）。
   */
  private registerPanning(timeline: HTMLElement): void {
    const doc = timeline.ownerDocument;
    this.component.registerDomEvent(timeline, "pointerdown", (evt) => {
      if (evt.button !== 0 || evt.pointerType === "touch") return;
      // 用户自己动手了：欠着的那次「落到今天」取消，别等布局一稳就把视野抢回去
      this.pendingScrollToToday = false;
      this.pan = {
        pointerX: evt.clientX,
        pointerY: evt.clientY,
        startLeft: timeline.scrollLeft,
        startTop: timeline.scrollTop,
        moved: false,
      };
    });
    this.component.registerDomEvent(doc, "pointermove", (evt) => {
      const pan = this.pan;
      if (pan === null || this.timelineEl === null) return;
      const dx = evt.clientX - pan.pointerX;
      const dy = evt.clientY - pan.pointerY;
      // 阈值：手抖一两个像素不该被当成拖动，否则单击打开笔记会时不时失灵
      if (!pan.moved && Math.abs(dx) + Math.abs(dy) < PAN_THRESHOLD_PX) return;
      if (!pan.moved) {
        pan.moved = true;
        timeline.addClass("is-panning");
      }
      evt.preventDefault();
      timeline.scrollLeft = pan.startLeft - dx;
      timeline.scrollTop = pan.startTop - dy;
    });
    const endPan = (): void => {
      const pan = this.pan;
      if (pan === null) return;
      this.pan = null;
      this.suppressNextClick = pan.moved;
      timeline.removeClass("is-panning");
    };
    this.component.registerDomEvent(doc, "pointerup", endPan);
    this.component.registerDomEvent(doc, "pointercancel", endPan);
  }

  /**
   * 把宽度写进 CSS 变量（不写内联 width）。
   *
   * 变量只负责这一件事，样式表里 `max-width: calc(100% - …)` 之类的兜底规则照样生效 ——
   * 窗口被拖窄后，昨天存的宽度不会把时间轴挤没。
   */
  private applySidebarWidth(width: number): void {
    const value = clampSplitWidth(width, GANTT_SIDEBAR_MIN_WIDTH, Number.MAX_SAFE_INTEGER);
    this.frame?.style.setProperty(SIDEBAR_WIDTH_VAR, `${value}px`);
  }

  private renderSidebar(host: HTMLElement): void {
    for (const entry of this.layout) {
      if (entry.kind === "section") {
        this.renderSectionHeader(host, entry);
        continue;
      }
      const row = entry.row;
      if (row === null) continue;

      const rowEl = host.createDiv({ cls: "tm-gantt__sidebar-row" });
      rowEl.dataset.taskId = row.task.id;
      rowEl.dataset.section = entry.sectionKey;

      const nameEl = rowEl.createDiv({ cls: "tm-gantt__sidebar-name" });
      const link = nameEl.createEl("a", {
        cls: "internal-link",
        text: row.task.name,
        attr: { title: `${row.task.filePath}:${row.task.lineNumber}`, tabindex: "-1" },
      });
      link.dataset.openTask = row.task.id;

      const meta = rowEl.createDiv({ cls: "tm-gantt__sidebar-meta" });
      if (row.task.milestone) {
        meta.createSpan({ cls: "tm-gantt__tag", text: t("里程碑") });
      }
      if (row.task.critical) {
        meta.createSpan({ cls: "tm-gantt__tag", text: t("关键") });
      }
      if (row.startFallback || row.endFallback) {
        meta.createSpan({
          cls: "tm-gantt__fallback-hint",
          text: t("缺日期"),
          attr: { title: t("起止日期不完整，图上那一段是推导出来的") },
        });
      }

      /*
       * 编辑按钮。
       *
       * 任务条是一段 SVG，塞不进 HTML 按钮（塞进去也要自己处理定位与缩放），所以
       * 编辑入口一直只有右键 —— 那不是「看得到」的入口。任务列里的每一行与条子严格
       * 一一对应，把按钮放在这儿既不遮挡条子，又天然是个 `<button>`：
       * 键盘 Tab 能到、读屏能念（右键菜单两条都做不到）。
       *
       * 图标沿用任务卡片上的 `✎`，两个视图的「编辑」是同一个记号。
       */
      const edit = rowEl.createEl("button", {
        cls: "tm-gantt__row-edit",
        text: "✎",
        attr: {
          type: "button",
          title: t("编辑任务"),
          "aria-label": `${t("编辑任务")}：${row.task.name}`,
        },
      });
      edit.dataset.editTask = row.task.id;
    }
  }

  private renderSectionHeader(host: HTMLElement, entry: LayoutEntry): void {
    const header = host.createEl("button", {
      cls: `tm-gantt__sidebar-section${entry.collapsed ? " is-collapsed" : ""}`,
      attr: { type: "button", "aria-expanded": String(!entry.collapsed) },
    });
    header.dataset.toggleSection = entry.sectionKey;
    header.createSpan({ cls: "tm-gantt__chevron", text: entry.collapsed ? "▸" : "▾" });
    header.createSpan({ cls: "tm-gantt__sidebar-section-name", text: entry.sectionName });
  }

  private renderHeader(host: HTMLElement): void {
    const scale = this.scale;
    if (scale === null) return;
    const header = host.createDiv({ cls: "tm-gantt__header" });
    const upper = header.createDiv({ cls: "tm-gantt__header-row tm-gantt__header-row--upper" });
    const lower = header.createDiv({ cls: "tm-gantt__header-row tm-gantt__header-row--lower" });
    this.fillHeaderRow(upper, scale.upper);
    this.fillHeaderRow(lower, scale.lower);
  }

  private fillHeaderRow(host: HTMLElement, columns: TimeScale["lower"]): void {
    // 标签抽稀只影响文字，不影响列宽，网格线因此始终与表头对齐
    const step = Math.max(1, Math.ceil(columns.length / MAX_HEADER_LABELS));
    columns.forEach((column, index) => {
      const cell = host.createDiv({ cls: "tm-gantt__header-cell" });
      cell.style.setProperty("--tm-cell-width", `${column.width}px`);
      if (index % step === 0) {
        cell.createSpan({ cls: "tm-gantt__header-label", text: column.label });
      }
    });
  }

  private renderBody(host: HTMLElement): void {
    const scale = this.scale;
    if (scale === null) return;

    const height = Math.max(entryBottom(this.layout), ROW_HEIGHT);
    const svg = this.svg("svg");
    svg.setAttribute("class", "tm-gantt__svg");
    svg.setAttribute("width", String(scale.totalWidth));
    svg.setAttribute("height", String(height));
    host.appendChild(svg);

    const shapes = this.svg("g");
    svg.appendChild(shapes);

    // 顺序即层级：周末底带最下，然后网格线、任务条、今天线
    this.renderOffDays(shapes, scale, height);
    this.renderGrid(shapes, scale, height);

    for (const entry of this.layout) {
      if (entry.kind !== "row" || entry.row === null) continue;
      this.renderRowShapes(shapes, entry.row, entry.y, scale);
    }

    if (scale.todayX !== null) {
      const line = this.svg("line");
      line.setAttribute("class", "tm-gantt__today");
      line.setAttribute("x1", String(scale.todayX));
      line.setAttribute("x2", String(scale.todayX));
      line.setAttribute("y1", "0");
      line.setAttribute("y2", String(height));
      shapes.appendChild(line);
    }
  }

  /**
   * 非工作日底带：画在所有内容之下，只做背景提示。
   *
   * 内容 = 周末（开关打开时）∪ 法定节假日 − 调休补班日，由调用方按同一份日历算好
   * （见 GanttRenderOptions.offDays）。视图这里只负责按日期画矩形。
   */
  private renderOffDays(host: SVGElement, scale: TimeScale, height: number): void {
    if (scale.dayWidth < MIN_DAY_WIDTH_FOR_OFF_DAYS) return;
    for (const band of this.offDays) {
      const x = scale.xForDate(band.start);
      const rect = this.svg("rect");
      rect.setAttribute("class", "tm-gantt__off-day");
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", "0");
      rect.setAttribute("width", String(scale.endXForDate(band.end) - x));
      rect.setAttribute("height", String(height));
      host.appendChild(rect);
    }
  }

  private renderGrid(host: SVGElement, scale: TimeScale, height: number): void {
    if (scale.lower.length > MAX_GRID_LINES) return;
    for (const column of scale.lower) {
      const line = this.svg("line");
      line.setAttribute("class", "tm-gantt__grid-line");
      line.setAttribute("x1", String(column.x));
      line.setAttribute("x2", String(column.x));
      line.setAttribute("y1", "0");
      line.setAttribute("y2", String(height));
      host.appendChild(line);
    }
  }

  private renderRowShapes(host: SVGElement, row: GanttRow, y: number, scale: TimeScale): void {
    const x = scale.xForDate(row.start);
    const width = barWidth(row.start, row.end, scale, x);
    const barY = y + 5;
    const barHeight = ROW_HEIGHT - 10;
    const fallback = row.startFallback || row.endFallback;
    // 四类状态取一色：关键 > 已完成 > 其他（日期是推导值）> 进行中
    const color = this.colors[barColorKey(row)];

    // 里程碑是「一个时刻」而不是一段跨度：画菱形，不画条
    const bar = row.task.milestone
      ? this.buildMilestone(x, width, barY, barHeight, color)
      : this.buildBar(x, width, barY, barHeight, row, fallback, color);
    bar.dataset.taskId = row.task.id;
    bar.setAttribute("tabindex", "0");
    bar.setAttribute("role", "button");
    bar.setAttribute(
      "aria-label",
      t("{name}：{start} 至 {end}，{days} 天", {
        name: row.task.name,
        start: row.start,
        end: row.end,
        days: row.calendarDays,
      }),
    );

    const title = this.svg("title");
    /*
     * 悬停把两种口径都报出来：条上的文字是压缩过的（`45 工作日`），这里给全。
     * 设置为「不显示」时连天数都不提 —— 那正是用户想要的「别标天数」。
     */
    title.textContent =
      row.durationLabel === null
        ? `${row.task.name}\n${row.start} → ${row.end}`
        : `${row.task.name}\n${row.start} → ${row.end}\n` +
          t("自然日 {calendar} 天 · 工作日 {workday} 天", {
            calendar: row.calendarDays,
            workday: row.workdayDays,
          });
    bar.appendChild(title);
    host.appendChild(bar);

    // 里程碑是「一个时刻」，没有跨度可言；口径设为「不显示」时整块都不画
    if (!row.task.milestone && row.durationLabel !== null) {
      this.renderDurationLabel(host, row.durationLabel, x, width, barY, barHeight);
    }
  }

  private buildBar(
    x: number,
    width: number,
    barY: number,
    barHeight: number,
    row: GanttRow,
    fallback: boolean,
    color: string,
  ): SVGRectElement {
    const bar = this.svg("rect");
    bar.setAttribute("class", `tm-gantt__bar ${barClass(row)}`);
    bar.setAttribute("x", String(x));
    bar.setAttribute("y", String(barY));
    bar.setAttribute("width", String(width));
    bar.setAttribute("height", String(barHeight));
    bar.setAttribute("rx", "4");
    if (fallback) bar.dataset.fallback = "true";
    /*
     * 填充色内联写 `fill`，**不中转 CSS 变量**。
     *
     * 颜色值本身就长成 `var(--color-blue)`，若再存进自定义属性、由样式表的
     * `fill: var(--tm-bar-color, …)` 取用，就成了「变量套变量」——
     * 实测这一层解析不出颜色、条子会变黑。
     */
    bar.style.fill = color;
    return bar;
  }

  /** 里程碑：以结束日为尖点的菱形，宽度固定一个日宽；颜色沿用状态色，形状负责区分 */
  private buildMilestone(
    x: number,
    width: number,
    barY: number,
    barHeight: number,
    color: string,
  ): SVGPolygonElement {
    const size = Math.min(barHeight, 14);
    const centerX = x + width;
    const centerY = barY + barHeight / 2;
    const half = size / 2;
    const diamond = this.svg("polygon");
    diamond.setAttribute("class", "tm-gantt__bar tm-gantt__bar--milestone");
    diamond.setAttribute(
      "points",
      [
        `${centerX},${centerY - half}`,
        `${centerX + half},${centerY}`,
        `${centerX},${centerY + half}`,
        `${centerX - half},${centerY}`,
      ].join(" "),
    );
    diamond.style.fill = color;
    return diamond;
  }

  /**
   * 条上的天数。
   *
   * 放得下就写在条内（配合对比色与描边），放不下就挪到右外侧用次要色——
   * 绝不能因为条子窄就把信息吞掉：年档下 40 天的条子只有几十像素宽，
   * 而「这段到底跨了多久」正是最需要看见的。
   */
  private renderDurationLabel(
    host: SVGElement,
    label: string,
    barX: number,
    barWidthPx: number,
    barY: number,
    barHeight: number,
  ): void {
    const inset = 6;
    const fits = barWidthPx >= estimateTextWidth(label) + inset * 2;

    const text = this.svg("text");
    text.setAttribute(
      "class",
      fits ? "tm-gantt__bar-duration" : "tm-gantt__bar-duration tm-gantt__bar-duration--outside",
    );
    text.setAttribute("y", String(barY + barHeight / 2));
    if (fits) {
      text.setAttribute("x", String(barX + barWidthPx / 2));
      text.setAttribute("text-anchor", "middle");
    } else {
      text.setAttribute("x", String(barX + barWidthPx + inset));
      text.setAttribute("text-anchor", "start");
    }
    text.textContent = label;
    host.appendChild(text);
  }

  /** SVG 元素统一经 ownerDocument 创建（popout 安全） */
  private svg<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
    return this.root.ownerDocument.createElementNS(SVG_NS, tag);
  }

  // ────────────────────────────── 交互 ──────────────────────────────

  /** 监听器只注册这一次，之后全靠 data-* 委托分发 */
  private registerInteraction(): void {
    this.component.registerDomEvent(this.root, "click", (evt) => this.onClick(evt));
    this.component.registerDomEvent(this.root, "keydown", (evt) => this.onKeyDown(evt));
    this.component.registerDomEvent(this.root, "contextmenu", (evt) => this.onContextMenu(evt));
    // passive:false —— 要在 Ctrl+滚轮 时 preventDefault，否则会连带缩放整个界面
    this.component.registerDomEvent(this.root, "wheel", (evt) => this.onWheel(evt), {
      passive: false,
    });
  }

  /** 把事件目标收窄成元素（跨窗口安全：用根容器所属窗口的构造器判断） */
  private elementOf(target: EventTarget | null): Element | null {
    const win = this.root.ownerDocument.defaultView;
    if (win === null || !(target instanceof win.Element)) return null;
    return target;
  }

  private taskOf(target: EventTarget | null): GanttTask | null {
    const el = this.elementOf(target);
    if (el === null) return null;
    const id = el.closest("[data-task-id]")?.getAttribute("data-task-id");
    if (id === null || id === undefined) return null;
    return this.taskIndex.get(id) ?? null;
  }

  private onClick(evt: MouseEvent): void {
    // 刚拖过时间轴：这一下是拖动的余波，不当点击（否则拖完顺手打开一篇笔记）
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }

    const el = this.elementOf(evt.target);
    if (el === null) return;

    const toggle = el.closest("[data-toggle-section]")?.getAttribute("data-toggle-section");
    if (toggle !== null && toggle !== undefined) {
      evt.preventDefault();
      this.callbacks.onToggleSection(toggle);
      return;
    }

    // 编辑按钮要排在「打开笔记」前面：它就在任务行里，会先命中行的 data-task-id
    const editId = el.closest("[data-edit-task]")?.getAttribute("data-edit-task");
    if (editId !== null && editId !== undefined) {
      evt.preventDefault();
      const editable = this.taskIndex.get(editId);
      if (editable !== undefined) this.callbacks.onEditTask(editable);
      return;
    }

    const task = this.taskOf(evt.target);
    if (task !== null) {
      evt.preventDefault();
      this.callbacks.onOpenTask(task);
    }
  }

  /**
   * 右键任务条：编辑任务 / 打开笔记。
   *
   * 任务条本身是一段 SVG，塞不进 HTML 按钮（塞进去也要自己处理定位、缩放、命中），
   * 所以条子上的等价入口是右键菜单 —— Obsidian 同类场景的通行做法（文件树、关系图），
   * Project Master 的甘特条也是这么做的。**但右键不能是唯一入口**：任务列里的行与条子
   * 一一对应，编辑按钮放在那儿（见 renderSidebar）。单击仍然是「打开笔记」，与卡片一致。
   */
  private onContextMenu(evt: MouseEvent): void {
    const task = this.taskOf(evt.target);
    if (task === null) return;
    evt.preventDefault();

    const menu = new Menu();
    menu.addItem((item) =>
      item
        .setTitle(t("编辑任务"))
        .setIcon("pencil")
        .onClick(() => this.callbacks.onEditTask(task)),
    );
    menu.addItem((item) =>
      item
        .setTitle(t("打开笔记"))
        .setIcon("file-text")
        .onClick(() => this.callbacks.onOpenTask(task)),
    );
    menu.showAtMouseEvent(evt);
  }

  private onKeyDown(evt: KeyboardEvent): void {
    const el = this.elementOf(evt.target);
    // 行内按钮（✎）有自己的键盘行为：回车/空格该走它自己的 click，
    // 不能被这里抢成「打开笔记」（两种情况同时发生过一次就够糟糕了）
    if (el !== null && el.closest("[data-edit-task]") !== null) return;

    const task = this.taskOf(evt.target);
    if (task === null) return;
    // 键盘等价入口：不依赖鼠标（可访问性）
    if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      this.callbacks.onOpenTask(task);
    }
  }

  private onWheel(evt: WheelEvent): void {
    if (!evt.ctrlKey && !evt.metaKey) return;
    // 拦下来：不拦的话 Electron 会把整个界面一起缩放
    evt.preventDefault();
    this.wheelAccumulator += evt.deltaY;
    if (Math.abs(this.wheelAccumulator) < WHEEL_STEP_THRESHOLD) return;
    const direction: 1 | -1 = this.wheelAccumulator < 0 ? 1 : -1;
    this.wheelAccumulator = 0;
    this.callbacks.onZoom(direction, this.anchorAtClientX(evt.clientX));
  }

  /** 把屏幕 x 换算成「日期 + 距可视区左缘的偏移」，缩放后据此还原视野 */
  private anchorAtClientX(clientX: number): ZoomAnchor | null {
    const scale = this.scale;
    const timeline = this.timelineEl;
    if (scale === null || timeline === null) return null;
    const bounds = timeline.getBoundingClientRect();
    const offsetX = clientX - bounds.left;
    return { iso: scale.dateForX(offsetX + timeline.scrollLeft), offsetX };
  }

  /** 供键盘 Ctrl +/- 用：以可视区中心为锚点 */
  centerAnchor(): ZoomAnchor | null {
    const timeline = this.timelineEl;
    if (timeline === null) return null;
    const bounds = timeline.getBoundingClientRect();
    return this.anchorAtClientX(bounds.left + bounds.width / 2);
  }

  // ────────────────────────────── 滚动 ──────────────────────────────

  /**
   * 打开时把视野落到今天：甘特的常态就是盯着最近这几周。
   *
   * @returns 是否真的滚了。容器还量不到宽度时（视图在收起的侧栏里、页签在后台）
   *          `clientWidth` 是 0，按 0 算会把视野甩到很远的地方；这时记下「还欠一次
   *          定位」，等 ResizeObserver 报出真实宽度再补（见 watchTimelineWidth）。
   */
  scrollToToday(): boolean {
    const scale = this.scale;
    const timeline = this.timelineEl;
    if (scale === null || timeline === null || scale.todayX === null) return false;
    if (timeline.clientWidth === 0) {
      this.pendingScrollToToday = true;
      return false;
    }
    this.pendingScrollToToday = false;
    // 今天落在可视区左侧 1/3 处：前面留一点上下文，后面给接下来的日子
    timeline.scrollLeft = Math.max(0, scale.todayX - timeline.clientWidth / 3);
    return true;
  }

  /** 侧栏纵向跟随时间轴滚动（两侧行高一致，用 transform 对齐） */
  private syncScroll(): void {
    if (this.timelineEl === null || this.sidebarBodyEl === null) return;
    this.sidebarBodyEl.style.setProperty("--tm-sidebar-offset", `${-this.timelineEl.scrollTop}px`);
  }

  destroy(): void {
    this.frameBuilt = false;
    this.frame = null;
    this.sidebarHeadEl = null;
    this.sidebarBodyEl = null;
    this.timelineEl = null;
    this.canvasEl = null;
    this.scale = null;
    this.layout = [];
    this.taskIndex.clear();
    this.root.empty();
  }
}

// ────────────────────────────── 纯函数辅助 ──────────────────────────────

/** 天数估算字号（px）——必须与 CSS 里 `.tm-gantt__bar-duration` 的 font-size 一致 */
const DURATION_FONT_SIZE = 11;

/**
 * 粗略估文字宽度（px）：CJK 按字号全宽，其余按 0.55 倍。
 *
 * 只用来判断「塞不塞得进 bar」，不需要精确。刻意不用 `getBBox()`：
 * 那会强制同步布局，而每渲染一次要对每条任务都判一回，代价明显不成比例。
 */
function estimateTextWidth(label: string): number {
  let width = 0;
  for (const char of label) {
    width += /[\u3000-\u9fff\uff00-\uffef]/u.test(char)
      ? DURATION_FONT_SIZE
      : DURATION_FONT_SIZE * 0.55;
  }
  return width;
}

function buildLayout(model: GanttModel): LayoutEntry[] {
  const entries: LayoutEntry[] = [];
  let y = 0;
  for (const section of model.sections) {
    if (model.showSectionHeaders) {
      entries.push({
        kind: "section",
        sectionKey: section.key,
        sectionName: section.name,
        collapsed: section.collapsed,
        row: null,
        y,
        height: SECTION_HEIGHT,
      });
      y += SECTION_HEIGHT;
    }
    // 折叠的分节只留标题，不占行高
    if (section.collapsed) continue;
    for (const row of section.rows) {
      entries.push({
        kind: "row",
        sectionKey: section.key,
        sectionName: section.name,
        collapsed: false,
        row,
        y,
        height: ROW_HEIGHT,
      });
      y += ROW_HEIGHT;
    }
  }
  return entries;
}

function entryBottom(entries: LayoutEntry[]): number {
  const last = entries[entries.length - 1];
  return last === undefined ? 0 : last.y + last.height;
}

/** 条宽：单日任务至少给一个日宽的可见条（闭区间语义） */
function barWidth(start: string, end: string, scale: TimeScale, x: number): number {
  return Math.max(scale.dayWidth, scale.endXForDate(end) - x);
}

function summaryLabel(model: GanttModel): string {
  const base = t("{count} 个任务", { count: model.rows.length });
  if (model.skipped.length === 0) return base;
  return `${base} · ${t("{count} 个没有日期", { count: model.skipped.length })}`;
}

