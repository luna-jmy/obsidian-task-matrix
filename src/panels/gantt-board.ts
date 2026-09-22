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
  /** 右键任务条 → 编辑任务 */
  onEditTask(task: GanttTask): void;
  onToggleSection(key: string): void;
  /** Ctrl + 滚轮：direction +1 = 更细 */
  onZoomStep(direction: 1 | -1, anchor: ZoomAnchor | null): void;
}

export interface GanttBoardOptions {
  zoom: GanttZoom;
  grouping: GanttGrouping;
  model: GanttModel;
  today: string;
  anchor?: ZoomAnchor;
  /** 四类 Mermaid 状态各自的条色（来自设置） */
  colors: GanttBarColors;
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
    });
  }

  /** @returns 是否已经把视野落到今天（容器还没显示出来时为 false，调用方下次再试） */
  render(options: GanttBoardOptions): boolean {
    this.view.render(options.model, options.zoom, options.today, {
      anchor: options.anchor,
      colors: options.colors,
    });
    return options.scrollToToday ? this.view.scrollToToday() : false;
  }

  destroy(): void {
    this.view.destroy();
  }
}
