import { Component } from "obsidian";
import { t } from "../i18n";
import {
  DATE_PRESETS,
  datePresetLabel,
  detectStatusPreset,
  hasActiveFilter,
  markerLabel,
  presetToStatuses,
  resolveDateRange,
  SORT_MODES,
  sortModeLabel,
  statusLabel,
  statusPresetLabel,
  TASK_STATUSES,
  toggle,
} from "../services/filter-service";
import { DateRangePreset, DateRangeState, FilterState, SortMode, TaskStatusFilter } from "../types";
import { todayIso } from "../utils/date";

/**
 * 第二行：筛选与搜索。
 *
 * 与 Project Master 同一口径，两条实现约束：
 * 1. DOM 只建一次，状态变化走 `update()` 同步 —— 重建输入框会丢光标和中文输入法
 *    候选框，这是「输入一个字就断」的根因。
 * 2. 状态不存在这里：全部读写视图持有的 `FilterState`，筛选栏只做展示与回调。
 */
export interface FilterBarHost {
  getState(): FilterState;
  getSortMode(): SortMode;
  getCounts(): { shown: number; total: number };
  /** 数据里真实出现过的方括号标记（`- [x]` 的 x 之类），由数据驱动 */
  getAvailableMarkers(): string[];
  setStatuses(statuses: TaskStatusFilter[]): void;
  setMarkers(markers: string[]): void;
  setSearch(keyword: string): void;
  setStartDate(range: DateRangeState): void;
  setDueDate(range: DateRangeState): void;
  setSortMode(mode: SortMode): void;
  clearFilters(): void;
}

/** 搜索防抖：输入即筛，不必回车 */
const SEARCH_DEBOUNCE_MS = 300;

export class FilterBar {
  private chipsEl: HTMLElement | null = null;
  private markerGroupEl: HTMLElement | null = null;
  private markerChipsEl: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private presetSelect: HTMLSelectElement | null = null;
  private sortSelect: HTMLSelectElement | null = null;
  private countEl: HTMLElement | null = null;
  private clearBtn: HTMLButtonElement | null = null;
  private searchTimer: number | null = null;
  private readonly dateControls = new Map<"start" | "due", DateControls>();

  constructor(
    private readonly component: Component,
    private readonly host: HTMLElement,
    private readonly deps: FilterBarHost,
  ) {
    this.host.addClass("tm-filter-bar");
    this.build();
    this.component.register(() => this.clearSearchTimer());
  }

  private build(): void {
    this.buildStatusGroup();
    this.buildMarkerGroup();
    this.buildSearchGroup();
    this.dateControls.set("start", this.buildDateGroup("start"));
    this.dateControls.set("due", this.buildDateGroup("due"));
    this.buildSortGroup();
    this.buildSummary();
    this.update();
  }

  private buildStatusGroup(): void {
    const group = this.host.createDiv({ cls: "tm-filter-group tm-filter-group--status" });
    group.createEl("label", { cls: "tm-filter-label", text: t("状态") });

    const preset = group.createEl("select", {
      cls: "dropdown tm-filter-select",
      attr: { "aria-label": t("状态预设") },
    });
    this.presetSelect = preset;
    for (const value of ["active-only", "hide-cancelled", "all"] as const) {
      preset.createEl("option", { value, text: statusPresetLabel(value) });
    }
    this.component.registerDomEvent(preset, "change", () => {
      this.deps.setStatuses(presetToStatuses(preset.value as "active-only" | "hide-cancelled" | "all"));
    });

    this.chipsEl = group.createDiv({ cls: "tm-chips" });
  }

  /**
   * 标记筛选：按方括号里的原始内容筛（`- [x]` 的 x、`- [-]` 的 -、未勾选的空）。
   *
   * 候选从**数据里实际出现过的标记**生成，而不是把设置里的配置列一遍：
   * 配置了却一个都没用到的标记，做成 chip 只会点了没反应。
   */
  private buildMarkerGroup(): void {
    const group = this.host.createDiv({ cls: "tm-filter-group tm-filter-group--marker" });
    this.markerGroupEl = group;
    group.createEl("label", { cls: "tm-filter-label", text: t("标记") });
    this.markerChipsEl = group.createDiv({ cls: "tm-chips tm-chips--marker" });
  }

  private buildSearchGroup(): void {
    const group = this.host.createDiv({ cls: "tm-filter-group tm-filter-group--search" });
    group.createEl("label", { cls: "tm-filter-label", text: t("搜索") });

    const input = group.createEl("input", {
      cls: "tm-filter-input",
      attr: { type: "search", placeholder: t("任务描述、文件、ID") },
    });
    this.searchInput = input;
    this.component.registerDomEvent(input, "input", () => this.scheduleSearch(input.value));
    this.component.registerDomEvent(input, "keydown", (evt) => {
      if (evt.key !== "Enter") return;
      evt.preventDefault();
      this.clearSearchTimer();
      this.deps.setSearch(input.value);
    });
  }

  /**
   * 日期区间：预设下拉 + **常显**的起止输入框。
   *
   * 常显而不是藏在某个模式里：选「本月」时也该看到具体是哪几天；
   * 手改任一端即自动切到「自定义区间」，不必先切模式再选日期。
   */
  private buildDateGroup(field: "start" | "due"): DateControls {
    const group = this.host.createDiv({ cls: `tm-filter-group tm-filter-group--${field}` });
    group.createEl("label", { cls: "tm-filter-label", text: field === "start" ? t("开始日期") : t("截止日期") });

    const select = group.createEl("select", {
      cls: "dropdown tm-filter-select",
      attr: { "aria-label": field === "start" ? t("按开始日期筛选") : t("按截止日期筛选") },
    });
    for (const preset of DATE_PRESETS) {
      select.createEl("option", { value: preset, text: datePresetLabel(preset) });
    }

    const row = group.createDiv({ cls: "tm-date-range" });
    const from = row.createEl("input", {
      cls: "tm-filter-input tm-filter-input--date",
      attr: { type: "date", "aria-label": t("区间起始日期") },
    });
    row.createSpan({ cls: "tm-date-sep", text: "~" });
    const to = row.createEl("input", {
      cls: "tm-filter-input tm-filter-input--date",
      attr: { type: "date", "aria-label": t("区间结束日期") },
    });

    const commit = (preset: DateRangePreset): void => {
      const range: DateRangeState = {
        preset,
        start: from.value === "" ? null : from.value,
        end: to.value === "" ? null : to.value,
      };
      if (field === "start") this.deps.setStartDate(range);
      else this.deps.setDueDate(range);
    };

    this.component.registerDomEvent(select, "change", () => commit(select.value as DateRangePreset));
    for (const input of [from, to]) {
      this.component.registerDomEvent(input, "change", () => commit("custom"));
    }

    return { group, select, from, to };
  }

  private buildSortGroup(): void {
    const group = this.host.createDiv({ cls: "tm-filter-group tm-filter-group--sort" });
    group.createEl("label", { cls: "tm-filter-label", text: t("排序") });

    const select = group.createEl("select", {
      cls: "dropdown tm-filter-select",
      attr: { "aria-label": t("排序方式") },
    });
    this.sortSelect = select;
    for (const mode of SORT_MODES) {
      select.createEl("option", { value: mode, text: sortModeLabel(mode) });
    }
    this.component.registerDomEvent(select, "change", () => {
      this.deps.setSortMode(select.value as SortMode);
    });
  }

  private buildSummary(): void {
    const group = this.host.createDiv({ cls: "tm-filter-group tm-filter-group--summary" });
    this.countEl = group.createDiv({ cls: "tm-filter-count" });
    const clear = group.createEl("button", {
      cls: "tm-filter-clear",
      text: t("清除筛选"),
      attr: { type: "button", title: t("清除全部筛选条件，显示所有任务") },
    });
    this.clearBtn = clear;
    this.component.registerDomEvent(clear, "click", () => this.deps.clearFilters());
  }

  // ────────────────────────────── 同步 ──────────────────────────────

  /** 状态变化后调用：只同步，绝不重建 DOM */
  update(): void {
    const state = this.deps.getState();

    this.syncStatusChips(state.statuses);
    this.syncMarkerChips(state.markers);
    if (this.presetSelect !== null) this.presetSelect.value = detectStatusPreset(state.statuses);
    if (this.sortSelect !== null) this.sortSelect.value = this.deps.getSortMode();

    this.syncDateGroup(this.dateControls.get("start"), state.startDate);
    this.syncDateGroup(this.dateControls.get("due"), state.dueDate);

    if (this.searchInput !== null && this.searchInput.value !== state.search) {
      this.searchInput.value = state.search;
    }

    const counts = this.deps.getCounts();
    if (this.countEl !== null) {
      this.countEl.setText(t("{shown}/{total} 个任务", { shown: counts.shown, total: counts.total }));
      this.countEl.toggleClass("tm-filter-count--empty", counts.shown === 0);
    }
    this.clearBtn?.toggleClass("is-hidden", !hasActiveFilter(state));
  }

  private syncStatusChips(active: readonly TaskStatusFilter[]): void {
    this.renderChips(
      this.chipsEl,
      TASK_STATUSES.map((status) => ({
        value: status,
        label: statusLabel(status),
        active: active.includes(status),
        title: "",
      })),
      (value) => this.deps.setStatuses(toggle(this.deps.getState().statuses, value as TaskStatusFilter)),
    );
  }

  private syncMarkerChips(active: readonly string[]): void {
    const markers = this.deps.getAvailableMarkers();

    // 只有一个候选（例如整库都是未勾选的 `[ ]`）时这组没有筛选价值，直接收起来
    this.markerGroupEl?.toggleClass("is-hidden", markers.length <= 1);

    this.renderChips(
      this.markerChipsEl,
      markers.map((marker) => ({
        value: marker,
        label: markerLabel(marker),
        active: active.includes(marker),
        title: t("方括号内容是 {marker} 的任务", { marker: markerLabel(marker) }),
      })),
      (value) => this.deps.setMarkers(toggle(this.deps.getState().markers, value)),
    );
  }

  /** chips 不是输入框，重建不会丢光标或输入法状态，所以每次都整体重画 */
  private renderChips(
    host: HTMLElement | null,
    chips: readonly ChipSpec[],
    onToggle: (value: string) => void,
  ): void {
    if (host === null) return;
    host.empty();
    for (const chip of chips) {
      const button = host.createEl("button", {
        cls: `tm-chip${chip.active ? " is-active" : ""}`,
        text: chip.label,
        attr: { type: "button", "aria-pressed": String(chip.active), title: chip.title },
      });
      this.component.registerDomEvent(button, "click", () => onToggle(chip.value));
    }
  }

  /**
   * 回填预设与日期。
   *
   * 正在编辑的那个输入框跳过：不跳的话每次 update 都会覆盖用户刚敲了一半的日期。
   */
  private syncDateGroup(controls: DateControls | undefined, range: DateRangeState): void {
    if (controls === undefined) return;
    const today = todayIso();
    controls.select.value = range.preset;

    const effective =
      range.preset === "custom"
        ? { start: range.start, end: range.end }
        : resolveDateRange(range, today);

    const doc = this.host.ownerDocument;
    const pairs: Array<[HTMLInputElement, string | null]> = [
      [controls.from, effective.start],
      [controls.to, effective.end],
    ];
    for (const [input, value] of pairs) {
      if (input === doc.activeElement) continue;
      const next = value ?? "";
      if (input.value !== next) input.value = next;
    }
  }

  private scheduleSearch(raw: string): void {
    this.clearSearchTimer();
    const win = this.host.ownerDocument.defaultView;
    if (win === null) return;
    this.searchTimer = win.setTimeout(() => {
      this.searchTimer = null;
      this.deps.setSearch(raw);
    }, SEARCH_DEBOUNCE_MS);
  }

  private clearSearchTimer(): void {
    if (this.searchTimer === null) return;
    this.host.ownerDocument.defaultView?.clearTimeout(this.searchTimer);
    this.searchTimer = null;
  }
}

interface DateControls {
  group: HTMLElement;
  select: HTMLSelectElement;
  from: HTMLInputElement;
  to: HTMLInputElement;
}

interface ChipSpec {
  value: string;
  label: string;
  active: boolean;
  /** 悬停说明；空串表示不需要 */
  title: string;
}
