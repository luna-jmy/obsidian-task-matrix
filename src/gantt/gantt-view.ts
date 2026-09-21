import { Component } from "obsidian";
import { t } from "../i18n";
import { GanttTask } from "../parser/gantt-parser";
import { DEFAULT_GANTT_BAR_COLORS, GanttBarColors } from "../types";
import { addDaysIso, weekdayOfIso } from "../utils/date";
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

export interface GanttCallbacks {
  /** 点击任务条 / 侧栏链接 → 打开所在笔记 */
  onOpenTask(task: GanttTask): void;
  /** 点击分节头 → 折叠/展开（key 与面板视图共用，两边折叠状态一致） */
  onToggleSection(key: string): void;
  /**
   * 时间粒度变化（Ctrl + 滚轮）。
   * @param direction +1 = 更细，-1 = 更粗
   * @param anchor 缩放锚点：渲染后把该日期固定回原来的屏幕 x，
   *               否则缩放时视野会「跑掉」（用户正盯着的那天跳到别处）
   */
  onZoom(direction: 1 | -1, anchor: ZoomAnchor | null): void;
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
  private sidebarHeadEl: HTMLElement | null = null;
  private sidebarBodyEl: HTMLElement | null = null;
  private timelineEl: HTMLElement | null = null;
  private canvasEl: HTMLElement | null = null;

  private scale: TimeScale | null = null;
  private layout: LayoutEntry[] = [];
  private wheelAccumulator = 0;
  /** 本轮配色：跟着每次 render 一起传进来，视图自己不留一份可能过期的副本 */
  private colors: GanttBarColors = DEFAULT_GANTT_BAR_COLORS;
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
    this.scale = buildTimeScale(model.rangeStart, model.rangeEnd, zoom, { today });
    this.layout = buildLayout(model);
    this.taskIndex = new Map(model.rows.map((row) => [row.task.id, row.task]));

    this.ensureFrame();
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
    this.sidebarHeadEl = sidebar.createDiv({ cls: "tm-gantt__sidebar-head" });
    this.sidebarBodyEl = sidebar.createDiv({ cls: "tm-gantt__sidebar-body" });

    this.timelineEl = frame.createDiv({ cls: "tm-gantt__timeline" });
    this.canvasEl = this.timelineEl.createDiv({ cls: "tm-gantt__canvas" });

    this.component.registerDomEvent(this.timelineEl, "scroll", () => this.syncScroll());
    this.frameBuilt = true;
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
   * 周末底带：画在所有内容之下，只做背景提示。
   *
   * 只画周末，没有节假日 —— 任务矩阵没有节假日日历这层配置，凭空造一个
   * 工作日口径反而会让人对不上账。
   */
  private renderOffDays(host: SVGElement, scale: TimeScale, height: number): void {
    if (scale.dayWidth < MIN_DAY_WIDTH_FOR_OFF_DAYS) return;
    for (const band of weekendBands(scale.startIso, scale.endIso)) {
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
    title.textContent = `${row.task.name}\n${row.start} → ${row.end}\n${t("{count} 天", { count: row.calendarDays })}`;
    bar.appendChild(title);
    host.appendChild(bar);

    if (!row.task.milestone) {
      this.renderDurationLabel(host, `${row.calendarDays}`, x, width, barY, barHeight);
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
    const el = this.elementOf(evt.target);
    if (el === null) return;

    const toggle = el.closest("[data-toggle-section]")?.getAttribute("data-toggle-section");
    if (toggle !== null && toggle !== undefined) {
      evt.preventDefault();
      this.callbacks.onToggleSection(toggle);
      return;
    }

    const task = this.taskOf(evt.target);
    if (task !== null) {
      evt.preventDefault();
      this.callbacks.onOpenTask(task);
    }
  }

  private onKeyDown(evt: KeyboardEvent): void {
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
   * @returns 是否真的滚了。容器还隐藏着（例如视图在收起的侧栏里）时 clientWidth 是 0，
   *          这时按 0 算会把视野甩到很远的地方；宁可这次不滚，等下一次渲染再来。
   */
  scrollToToday(): boolean {
    const scale = this.scale;
    const timeline = this.timelineEl;
    if (scale === null || timeline === null || scale.todayX === null) return false;
    if (timeline.clientWidth === 0) return false;
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

/**
 * 区间内的周末，合并成连续色带。
 *
 * 合并是必须的：不合并的话一年就要插 104 个矩形，而相邻的周六周日本来就该
 * 连成一条；合并后一年只剩 52 条。
 */
function weekendBands(startIso: string, endIso: string): Array<{ start: string; end: string }> {
  const bands: Array<{ start: string; end: string }> = [];
  let current: { start: string; end: string } | null = null;

  for (let cursor = startIso; cursor <= endIso; cursor = addDaysIso(cursor, 1)) {
    const weekday = weekdayOfIso(cursor);
    const isWeekend = weekday === 0 || weekday === 6;
    if (isWeekend) {
      if (current === null) current = { start: cursor, end: cursor };
      else current.end = cursor;
    } else if (current !== null) {
      bands.push(current);
      current = null;
    }
  }
  if (current !== null) bands.push(current);
  return bands;
}
