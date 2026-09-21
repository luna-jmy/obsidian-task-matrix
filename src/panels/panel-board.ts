import { App, Component } from "obsidian";
import { t } from "../i18n";
import { PanelDropTarget, PanelSpec } from "../types";
import { renderTaskCard, TASK_DRAG_MIME, TaskCardCallbacks } from "./task-card";

/**
 * 主界面：容器网格。
 *
 * 「容器大小规则对称」落在这一个文件里：
 * - 列：`--fixed` 用 auto-fit + 1fr（固定 4 格时等宽撑满），`--flow` 用 auto-fill；
 * - 行：`grid-auto-rows: clamp(...)`（同一行等高），且**不写 `align-items: start`**
 *   —— 一写容器就退回内容高度，等高立刻失效；
 * - 内容溢出由容器自己的 `__body` 滚动承担，否则会顶破网格行高。
 * 这三条都在 styles.css 的 `.tm-board__grid` / `.tm-panel__body` 上。
 */
export interface PanelBoardCallbacks extends TaskCardCallbacks {
  onToggleCollapse(key: string): void;
  onAddTask(panel: PanelSpec): void;
  onDropTask(taskId: string, target: PanelDropTarget): void;
}

export interface PanelBoardOptions {
  grid: "fixed" | "flow";
  collapsedKeys: ReadonlySet<string>;
  markdownComponent: Component;
  /** 首次索引尚未完成时给一句说明，而不是直接说「没有任务」 */
  loaded: boolean;
}

export class PanelBoard {
  /**
   * 渲染代次。
   *
   * 卡片里的 Markdown 是逐个 await 渲染的，所以一次渲染会跨越多个宏任务；
   * 这期间如果又来一次渲染（连点筛选、文件连续变动），两次渲染会往同一个宿主里
   * 交错插入卡片，出现重复与错位。代次号让旧的那次在每次 await 之后自行退出。
   */
  private renderGeneration = 0;

  constructor(
    private readonly host: HTMLElement,
    private readonly app: App,
    private readonly callbacks: PanelBoardCallbacks,
  ) {
    this.host.addClass("tm-board");
  }

  async render(panels: readonly PanelSpec[], options: PanelBoardOptions): Promise<void> {
    const generation = ++this.renderGeneration;
    this.host.empty();

    if (!options.loaded) {
      const loading = this.host.createDiv({ cls: "tm-empty" });
      loading.createEl("h3", { text: t("正在建立任务索引…") });
      loading.createEl("p", { text: t("索引在 Obsidian 布局就绪后开始，大库需要一点时间。") });
      return;
    }

    if (panels.length === 0) {
      this.host.createDiv({ cls: "tm-empty", text: t("没有符合当前筛选条件的任务") });
      return;
    }

    const grid = this.host.createDiv({
      cls: `tm-board__grid tm-board__grid--${options.grid}`,
    });

    for (const panel of panels) {
      if (generation !== this.renderGeneration) return;
      await this.renderPanel(grid, panel, options, generation);
    }
  }

  private async renderPanel(
    grid: HTMLElement,
    panel: PanelSpec,
    options: PanelBoardOptions,
    generation: number,
  ): Promise<void> {
    const collapsed = options.collapsedKeys.has(panel.key);
    const el = grid.createDiv({ cls: `tm-panel${collapsed ? " is-collapsed" : ""}` });
    el.dataset.panelKey = panel.key;

    if (panel.dropTarget !== undefined) {
      this.registerDropTarget(el, panel.dropTarget);
    }

    const head = el.createDiv({ cls: "tm-panel__head" });
    head.createSpan({ cls: "tm-panel__chevron", text: collapsed ? "▸" : "▾" });
    const titleWrap = head.createDiv({ cls: "tm-panel__titles" });
    titleWrap.createEl("h3", { cls: "tm-panel__title", text: panel.title });
    if (panel.subtitle) {
      titleWrap.createDiv({ cls: "tm-panel__subtitle", text: panel.subtitle });
    }

    const right = head.createDiv({ cls: "tm-panel__head-right" });
    if (panel.addDefaults !== undefined) {
      this.addPanelButton(right, "+", t("在此容器新建任务"), () => this.callbacks.onAddTask(panel));
    }
    right.createSpan({ cls: "tm-panel__count", text: String(panel.tasks.length) });

    head.addEventListener("click", (event) => {
      if ((event.target as HTMLElement).closest("button")) return;
      this.callbacks.onToggleCollapse(panel.key);
    });

    const body = el.createDiv({ cls: "tm-panel__body" });
    if (panel.tasks.length === 0) {
      body.createDiv({ cls: "tm-panel__empty", text: t("暂无任务") });
      return;
    }

    for (const task of panel.tasks) {
      if (generation !== this.renderGeneration) return;
      await renderTaskCard(body, task, {
        app: this.app,
        markdownComponent: options.markdownComponent,
        mode: panel.dropTarget?.kind === "quadrant"
          ? "eisenhower"
          : panel.dropTarget?.kind === "gtd"
            ? "gtd"
            : "list",
      }, this.callbacks);
    }
  }

  /** 拖放落点：只有带 dropTarget 的容器接受投放（列表容器不接受） */
  private registerDropTarget(el: HTMLElement, target: PanelDropTarget): void {
    el.addClass("tm-panel--drop-target");

    el.addEventListener("dragover", (event) => {
      event.preventDefault();
      el.addClass("is-drop-over");
    });
    el.addEventListener("dragleave", (event) => {
      // 指针移到容器内的子元素上也会触发 dragleave，判断真正离开才算退出
      if (el.contains(event.relatedTarget as Node | null)) return;
      el.removeClass("is-drop-over");
    });
    el.addEventListener("drop", (event) => {
      event.preventDefault();
      el.removeClass("is-drop-over");
      const taskId = event.dataTransfer?.getData(TASK_DRAG_MIME) ?? "";
      if (taskId.length === 0) return;
      this.callbacks.onDropTask(taskId, target);
    });
  }

  private addPanelButton(host: HTMLElement, text: string, title: string, onClick: () => void): void {
    const button = host.createEl("button", {
      cls: "tm-panel__add tm-btn",
      text,
      attr: { type: "button", title },
    });
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      onClick();
    });
  }
}
