import { Component } from "obsidian";

/**
 * 可拖动的分栏边界（与 Project Master 的实现同口径）。
 *
 * 只做一件事：把「指针横向移动了多少」换算成目标元素的新宽度，收敛后回调。
 * **落盘不在这里**：拖动过程每帧都写设置等于把磁盘当草稿纸，只在松手（或键盘调整）时
 * 回调一次 `onCommit`。
 *
 * 宽度由调用方写进 **CSS 变量**，而不是内联 `width`：变量只提供默认值，
 * 样式表里的响应式规则（例如「窗口太窄时也不许把时间轴挤没」）照样能盖过它。
 *
 * 上下限由调用方给：上限是**函数**，因为合理的上限取决于容器当下的宽度
 * （窗口变窄后，昨天存的宽度会把主区挤没）。
 */

/** 键盘每次调整的步长（px）；按住 Shift 走大步 */
const KEY_STEP = 16;
const KEY_STEP_LARGE = 64;

/**
 * 宽度收敛（纯函数）：拖动与设置读取共用同一条规则，避免两处各写一套上下限。
 * 非数字给下限（而不是 NaN）；上限小于下限时以下限为准（不返回自相矛盾的值）。
 */
export function clampSplitWidth(width: number, min: number, max: number): number {
  const ceiling = Math.max(min, max);
  if (!Number.isFinite(width)) return min;
  return Math.min(Math.max(Math.round(width), min), ceiling);
}

export interface SplitResizerConfig {
  /** 要调整宽度的元素 */
  target: HTMLElement;
  /** 拖动手柄（分隔条本身） */
  handle: HTMLElement;
  /** 宽度下限（px） */
  min: number;
  /** 宽度上限（px），每次拖动现算 */
  max: () => number;
  /** 拖动中（每帧）/ 键盘调整时：只改 DOM，不落盘 */
  onResize(width: number): void;
  /** 松手 / 键盘调整后：落盘 */
  onCommit(width: number): void;
}

export class SplitResizer {
  private startX = 0;
  private startWidth = 0;
  private lastWidth = 0;
  /** 拖动期间的 document 监听器；松手必须摘掉，否则会随着每次拖动累积 */
  private detach: (() => void) | null = null;

  constructor(
    private readonly component: Component,
    private readonly config: SplitResizerConfig,
  ) {
    this.component.registerDomEvent(config.handle, "pointerdown", (evt) =>
      this.onPointerDown(evt),
    );
    // 键盘也能调：分隔条可聚焦，方向键 ±16px（Shift ±64px）
    this.component.registerDomEvent(config.handle, "keydown", (evt) => this.onKeyDown(evt));
  }

  /** 元素当下的实测宽度：不读设置，读它自己 —— 这样与「用户看到的多宽」永远一致 */
  private currentWidth(): number {
    return this.config.target.getBoundingClientRect().width;
  }

  private maxWidth(): number {
    return Math.max(this.config.min, Math.round(this.config.max()));
  }

  private onPointerDown(evt: PointerEvent): void {
    // 只认主键；握在分隔条上，别把这一下再传给下面的元素
    if (evt.button !== 0) return;
    evt.preventDefault();
    evt.stopPropagation();

    this.startX = evt.clientX;
    this.startWidth = this.currentWidth();
    this.lastWidth = this.startWidth;
    this.config.handle.addClass("is-dragging");

    const doc = this.config.handle.ownerDocument;
    // 拖动中禁掉选中，否则一路把任务名刷蓝
    doc.body.addClass("tm-resizing");

    const onMove = (move: PointerEvent): void => {
      const width = clampSplitWidth(
        this.startWidth + (move.clientX - this.startX),
        this.config.min,
        this.maxWidth(),
      );
      this.lastWidth = width;
      this.config.onResize(width);
    };
    const onEnd = (): void => {
      this.finish();
      // 没真的移动过就不落盘：点一下分隔条不该写一次设置
      if (Math.round(this.lastWidth) !== Math.round(this.startWidth)) {
        this.config.onCommit(this.lastWidth);
      }
    };

    doc.addEventListener("pointermove", onMove);
    doc.addEventListener("pointerup", onEnd);
    doc.addEventListener("pointercancel", onEnd);
    this.detach = () => {
      doc.removeEventListener("pointermove", onMove);
      doc.removeEventListener("pointerup", onEnd);
      doc.removeEventListener("pointercancel", onEnd);
    };
  }

  private onKeyDown(evt: KeyboardEvent): void {
    const step = evt.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    let delta = 0;
    if (evt.key === "ArrowLeft") delta = -step;
    else if (evt.key === "ArrowRight") delta = step;
    else return;
    evt.preventDefault();
    // 键盘调整是「一次成型」的操作，直接落盘
    const width = clampSplitWidth(this.currentWidth() + delta, this.config.min, this.maxWidth());
    this.config.onResize(width);
    this.config.onCommit(width);
  }

  private finish(): void {
    this.detach?.();
    this.detach = null;
    this.config.handle.removeClass("is-dragging");
    this.config.handle.ownerDocument.body.removeClass("tm-resizing");
  }
}
