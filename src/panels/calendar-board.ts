import { t } from "../i18n";
import {
  CalendarEntry,
  CalendarMode,
  CalendarSummary,
  calendarItemLabel,
  calendarModeLabel,
  calendarTitle,
  monthDates,
  monthGridDates,
  weekDates,
  weekdayLabel,
} from "../services/calendar-service";
import { ParsedTask, TaskMatrixSettings } from "../types";
import { formatIso, isWeekend, weekdayOrder } from "../utils/date";
import { HoverTooltip } from "./tooltip";

/**
 * 日历模式：保留时间轴专用布局，不套容器网格。
 *
 * 理由：传统日历的信息载体是「7 列 × N 行」的位置本身，换成等大容器会把这个
 * 位置感抹掉。它自身已是规整网格，视觉上与容器网格同样对称。
 */
export interface CalendarBoardCallbacks {
  onOpenTask(task: ParsedTask): void;
  onShift(delta: number): void;
  onToday(): void;
  onModeChange(mode: CalendarMode): void;
  onToggleSummary(): void;
}

export interface CalendarBoardOptions {
  mode: CalendarMode;
  anchor: Date;
  summaryOpen: boolean;
  settings: TaskMatrixSettings;
  itemsByDate: Record<string, CalendarEntry[]>;
  summary: CalendarSummary;
  today: string;
}

const MAX_ITEMS_PER_DAY = 4;

export class CalendarBoard {
  private readonly tooltip = new HoverTooltip();

  constructor(
    private readonly host: HTMLElement,
    private readonly callbacks: CalendarBoardCallbacks,
  ) {
    this.host.addClass("tm-calendar");
  }

  /** 视图关闭时调用：提示元素挂在 document 上，不清理会留下孤儿节点 */
  destroy(): void {
    this.tooltip.destroy();
  }

  render(options: CalendarBoardOptions): void {
    this.host.empty();
    // 重绘会把锚点整批换掉，先收起提示，免得它挂在一个已经不存在的日期格上
    this.tooltip.hide();
    this.renderToolbar(options);

    switch (options.mode) {
      case "week":
        this.renderWeek(options);
        return;
      case "list":
        this.renderList(options);
        return;
      default:
        this.renderMonth(options);
    }
  }

  private renderToolbar(options: CalendarBoardOptions): void {
    const bar = this.host.createDiv({ cls: "tm-calendar__toolbar" });

    const modes = bar.createDiv({ cls: "tm-calendar__modes" });
    for (const mode of ["list", "month", "week"] as CalendarMode[]) {
      const button = modes.createEl("button", {
        cls: `tm-calendar__mode${options.mode === mode ? " is-active" : ""}`,
        text: calendarModeLabel(mode),
        attr: { type: "button" },
      });
      button.addEventListener("click", () => this.callbacks.onModeChange(mode));
    }

    const nav = bar.createDiv({ cls: "tm-calendar__nav" });
    const prev = nav.createEl("button", { cls: "tm-calendar__nav-btn", text: "←", attr: { type: "button" } });
    nav.createDiv({
      cls: "tm-calendar__title",
      text: calendarTitle(options.anchor, options.mode, options.settings.calendarFirstDayOfWeek),
    });
    const today = nav.createEl("button", { cls: "tm-calendar__nav-btn", text: t("今天"), attr: { type: "button" } });
    const next = nav.createEl("button", { cls: "tm-calendar__nav-btn", text: "→", attr: { type: "button" } });
    prev.addEventListener("click", () => this.callbacks.onShift(-1));
    next.addEventListener("click", () => this.callbacks.onShift(1));
    today.addEventListener("click", () => this.callbacks.onToday());

    const summaryBtn = nav.createEl("button", {
      cls: `tm-calendar__nav-btn${options.summaryOpen ? " is-active" : ""}`,
      text: t("汇总"),
      attr: { type: "button" },
    });
    summaryBtn.addEventListener("click", () => this.callbacks.onToggleSummary());

    if (options.summaryOpen) this.renderSummary(bar, options.summary);
  }

  private renderSummary(parent: HTMLElement, summary: CalendarSummary): void {
    const popup = parent.createDiv({ cls: "tm-calendar__summary" });
    const list = popup.createEl("ul");
    const rows: Array<[string, string]> = [
      ["✅", t("已完成：{done}/{total}", { done: summary.done, total: summary.total })],
      ["📅", t("截止：{count}", { count: summary.due })],
      ["⚠️", t("逾期：{count}", { count: summary.overdue })],
      ["🛫", t("开始：{count}", { count: summary.start })],
      ["⏳", t("计划：{count}", { count: summary.scheduled })],
      ["🔁", t("重复：{count}", { count: summary.recurrence })],
      ["📝", t("日记：{count}", { count: summary.dailyNotes })],
    ];
    for (const [icon, text] of rows) {
      list.createEl("li", { text: `${icon} ${text}` });
    }
  }

  // ────────────────────────────── 月视图 ──────────────────────────────

  private renderMonth(options: CalendarBoardOptions): void {
    const showWeekends = options.settings.showCalendarMonthWeekends;
    const visibleWeekdays = weekdayOrder(options.settings.calendarFirstDayOfWeek)
      .filter((weekday) => showWeekends || !isWeekend(weekday));

    const wrap = this.host.createDiv({ cls: "tm-calendar__month" });
    if (!showWeekends) wrap.addClass("is-workweek");

    const heads = wrap.createDiv({ cls: "tm-calendar__heads" });
    for (const weekday of visibleWeekdays) {
      heads.createEl("div", {
        cls: `tm-calendar__head${isWeekend(weekday) ? " is-weekend" : ""}`,
        text: weekdayLabel(weekday),
      });
    }

    const grid = wrap.createDiv({ cls: "tm-calendar__grid" });
    const month = options.anchor.getMonth();
    for (const date of monthGridDates(options.anchor, options.settings.calendarFirstDayOfWeek, showWeekends)) {
      const iso = formatIso(date);
      const classes = ["tm-calendar__day"];
      if (isWeekend(date.getDay())) classes.push("is-weekend");
      if (date.getMonth() !== month) classes.push("is-outside");
      if (iso === options.today) classes.push("is-today");

      const dayEl = grid.createDiv({ cls: classes.join(" ") });
      dayEl.createDiv({ cls: "tm-calendar__date", text: String(date.getDate()) });

      const items = dayEl.createDiv({ cls: "tm-calendar__items" });
      const entries = options.itemsByDate[iso] ?? [];
      for (const entry of entries.slice(0, MAX_ITEMS_PER_DAY)) {
        this.renderItem(items, entry);
      }
      if (entries.length > MAX_ITEMS_PER_DAY) {
        items.createDiv({
          cls: "tm-calendar__more",
          text: t("还有 {count} 项", { count: entries.length - MAX_ITEMS_PER_DAY }),
        });
      }
    }
  }

  // ────────────────────────────── 周视图 ──────────────────────────────

  private renderWeek(options: CalendarBoardOptions): void {
    const showWeekends = options.settings.showCalendarWeekends;
    const wrap = this.host.createDiv({ cls: "tm-calendar__week" });

    const weekends: Date[] = [];
    const weekdays: Date[] = [];
    for (const date of weekDates(options.anchor, options.settings.calendarFirstDayOfWeek, true)) {
      (isWeekend(date.getDay()) ? weekends : weekdays).push(date);
    }

    const main = wrap.createDiv({ cls: "tm-calendar__week-main" });
    for (const date of weekdays) this.renderDayCard(main, date, options);

    if (!showWeekends) return;
    const aside = wrap.createDiv({ cls: "tm-calendar__weekend" });
    for (const date of weekends) this.renderDayCard(aside, date, options);
  }

  private renderDayCard(host: HTMLElement, date: Date, options: CalendarBoardOptions): void {
    const iso = formatIso(date);
    const classes = ["tm-calendar__day", "tm-calendar__day--card"];
    if (isWeekend(date.getDay())) classes.push("is-weekend");
    if (iso === options.today) classes.push("is-today");

    const dayEl = host.createDiv({ cls: classes.join(" ") });
    dayEl.createDiv({
      cls: "tm-calendar__date",
      text: `${weekdayLabel(date.getDay())} ${date.getDate()}`,
    });

    const items = dayEl.createDiv({ cls: "tm-calendar__items" });
    for (const entry of options.itemsByDate[iso] ?? []) {
      this.renderItem(items, entry);
    }
  }

  // ────────────────────────────── 列表视图 ──────────────────────────────

  private renderList(options: CalendarBoardOptions): void {
    const list = this.host.createDiv({ cls: "tm-calendar__list" });
    const showEmptyDays = options.settings.calendarListShowFullMonth;

    for (const date of monthDates(options.anchor)) {
      const iso = formatIso(date);
      const entries = options.itemsByDate[iso] ?? [];
      if (!showEmptyDays && entries.length === 0) continue;

      const details = list.createEl("details", {
        cls: `tm-calendar__list-day${iso === options.today ? " is-today" : ""}`,
      });
      if (iso === options.today) details.open = true;
      details.createEl("summary", {
        text: `${date.toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" })} (${entries.length})`,
      });

      const body = details.createDiv({ cls: "tm-calendar__list-body" });
      if (entries.length === 0) {
        body.createDiv({ cls: "tm-calendar__item", text: t("无任务") });
        continue;
      }
      for (const entry of entries) this.renderItem(body, entry);
    }
  }

  // ────────────────────────────── 条目 ──────────────────────────────

  private renderItem(host: HTMLElement, entry: CalendarEntry): void {
    const { task, type } = entry;
    const linkTarget = task.sectionHeading ? `${task.filePath}#${task.sectionHeading}` : task.filePath;

    const item = host.createEl("a", {
      cls: `tm-calendar__item is-${type} internal-link`,
      text: `${calendarItemLabel(type)} ${task.description}`,
      attr: { "aria-label": task.description },
    });
    item.setAttribute("href", linkTarget);
    item.setAttribute("data-href", linkTarget);

    /*
     * 悬停提示自己画，不走宿主的 `hover-link` 页面预览：那个的弹出时机由核心
     * 「页面预览」的悬停延迟决定，插件改不了，鼠标得停住等半天。
     * 这里进入即出现，没有计时器。
     */
    item.addEventListener("mouseenter", () => {
      this.tooltip.show(item, [
        { text: `${calendarItemLabel(type)} · ${task.description}` },
        { text: `${task.filePath}:${task.lineNumber}`, muted: true },
      ]);
    });
    item.addEventListener("mouseleave", () => this.tooltip.hide());
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.tooltip.hide();
      this.callbacks.onOpenTask(task);
    });
  }
}
