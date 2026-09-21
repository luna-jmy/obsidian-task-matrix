/**
 * 即时悬停提示。
 *
 * 为什么不用宿主的页面预览（`hover-link` 事件）：它的弹出时机由核心插件
 * 「页面预览」的悬停延迟设置决定，插件改不了；用户把延迟调大一点，日历上
 * 就得停住鼠标等半天才看到东西。这里自己画一个 —— 进入元素立刻出现，没有计时器。
 *
 * 元素挂在锚点所属的 `document` 上（不是全局 document）：弹出窗口里的视图
 * 属于另一个 window，挂错地方会出现「提示跑到另一个窗口」。
 */
export interface TooltipLine {
  text: string;
  /** 次要信息（路径、行号），用弱化的颜色 */
  muted?: boolean;
}

const OFFSET = 8;

export class HoverTooltip {
  private el: HTMLElement | null = null;
  private doc: Document | null = null;

  show(anchor: HTMLElement, lines: readonly TooltipLine[]): void {
    if (lines.length === 0) return;
    const el = this.ensureElement(anchor.ownerDocument);

    el.empty();
    for (const line of lines) {
      el.createDiv({ cls: line.muted === true ? "tm-tooltip__line is-muted" : "tm-tooltip__line", text: line.text });
    }
    el.removeClass("is-hidden");

    this.position(el, anchor);
  }

  hide(): void {
    this.el?.addClass("is-hidden");
  }

  /** 视图关闭时调用：提示元素挂在 document 上，不清理就会留一个孤儿节点 */
  destroy(): void {
    this.el?.remove();
    this.el = null;
    this.doc = null;
  }

  private ensureElement(doc: Document): HTMLElement {
    if (this.el !== null && this.doc === doc) return this.el;
    this.destroy();

    this.doc = doc;
    this.el = doc.body.createDiv({ cls: "tm-tooltip is-hidden" });
    return this.el;
  }

  /** 默认贴在锚点上方；上方放不下就翻到下方，并夹在视口内 */
  private position(el: HTMLElement, anchor: HTMLElement): void {
    const win = anchor.ownerDocument.defaultView;
    const anchorRect = anchor.getBoundingClientRect();
    const ownRect = el.getBoundingClientRect();

    const viewportWidth = win?.innerWidth ?? 0;
    const viewportHeight = win?.innerHeight ?? 0;

    let top = anchorRect.top - ownRect.height - OFFSET;
    if (top < OFFSET) top = anchorRect.bottom + OFFSET;
    top = Math.min(top, Math.max(OFFSET, viewportHeight - ownRect.height - OFFSET));

    let left = anchorRect.left;
    if (left + ownRect.width > viewportWidth - OFFSET) {
      left = Math.max(OFFSET, viewportWidth - ownRect.width - OFFSET);
    }

    el.style.top = `${Math.round(top)}px`;
    el.style.left = `${Math.round(left)}px`;
  }
}
