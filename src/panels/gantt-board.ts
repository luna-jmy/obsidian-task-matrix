import { Component } from "obsidian";
import { GanttView, ZoomAnchor } from "../gantt/gantt-view";
import { GanttModel } from "../gantt/gantt-model";
import { GanttZoom } from "../gantt/time-scale";
import { GanttTask } from "../parser/gantt-parser";
import { GanttBarColors, GanttGrouping } from "../types";

/**
 * 甘特面板：只有时间轴本身。
 *
 * 时间粒度与分组依据不在这儿 —— 它们在主工具栏上（甘特图模式下才显示），
 * 因为「切换甘特的显示口径」和「切进/切出甘特」是同一层的事，
 * 控件分散在两个地方时用户得先想一下该往哪找。
 */
export interface GanttBoardCallbacks {
  onOpenTask(task: GanttTask): void;
  /** 右键任务条 / 点任务列上的 ✎ → 编辑任务 */
  onEditTask(task: GanttTask): void;
  onToggleSection(key: string): void;
  /** Ctrl + 滚轮：direction +1 = 更细 */
  onZoomStep(direction: 1 | -1, anchor: ZoomAnchor | null): void;
  /** 任务列宽度拖完 → 落盘（拖动过程不回调，见 utils/split-resizer） */
  onSidebarWidthCommit(width: number): void;
}

export interface GanttBoardOptions {
  zoom: GanttZoom;
  grouping: GanttGrouping;
  model: GanttModel;
  today: string;
  anchor?: ZoomAnchor;
  /** 四类 Mermaid 状态各自的条色（来自设置） */
  colors: GanttBarColors;
  /** 任务列宽度（px，来自设置） */
  sidebarWidth: number;
  /** 非工作日色带（已合并成连续区间；与 Mermaid 导出同源） */
  offDays: Array<{ start: string; end: string }>;
  /** 首次显示（或换回甘特模式）时把视野落到今天 */
  scrollToToday: boolean;
}

export class GanttBoard {
  private readonly view: GanttView;

  constructor(
    host: HTMLElement,
    component: Component,
    callbacks: GanttBoardCallbacks,
  ) {
    host.addClass("tm-gantt-board");

    const viewHost = host.createDiv({ cls: "tm-gantt-board__view" });
    // 包一层箭头函数而不是直接传方法引用：直接传会丢掉 `this`（调用方那边也会丢）
    this.view = new GanttView(component, viewHost, {
      onOpenTask: (task) => callbacks.onOpenTask(task),
      onEditTask: (task) => callbacks.onEditTask(task),
      onToggleSection: (key) => callbacks.onToggleSection(key),
      onZoom: (direction, anchor) => callbacks.onZoomStep(direction, anchor),
      onSidebarWidthCommit: (width) => callbacks.onSidebarWidthCommit(width),
    });
  }

  /**
   * 复位到「今天」：只挪滚动位置，不重渲染。
   *
   * @returns 是否真的滚了（容器量不到宽度时为 false，视图会记下来等宽度就绪再补）
   */
  scrollToToday(): boolean {
    return this.view.scrollToToday();
  }

  /** @returns 是否已经把视野落到今天（容器还没显示出来时为 false，调用方下次再试） */
  render(options: GanttBoardOptions): boolean {
    this.view.render(options.model, options.zoom, options.today, {
      anchor: options.anchor,
      colors: options.colors,
      sidebarWidth: options.sidebarWidth,
      offDays: options.offDays,
    });
    return options.scrollToToday ? this.view.scrollToToday() : false;
  }

  destroy(): void {
    this.view.destroy();
  }
}
