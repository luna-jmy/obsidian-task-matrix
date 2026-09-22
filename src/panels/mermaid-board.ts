import { App, Component, MarkdownRenderer, Notice } from "obsidian";
import { t } from "../i18n";
import {
  MermaidImageExport,
  resolveExportBackground,
  serializePreviewSvg,
  svgToJpegBlob,
} from "../utils/svg-image";

/**
 * Mermaid 预览（甘特模式里的第二个页签）：一行控件 + 预览区。
 *
 * 结构刻意极简，与 Project Master 的预览面板一致：
 * - **没有代码编辑区**。甘特图是唯一可编辑版本，预览只是它的投影；留一个能改的代码框
 *   就等于允许出现第二份真相（改了代码、再去甘特上折一下，两边立刻各说各话）。
 *   去掉编辑区后，「预览始终跟着甘特最新状态」是结构上保证的 —— 每次都是重新生成的；
 * - 选项是 chip 开关 + 两个日期输入（改完立刻重算预览并存设置）；
 * - 四个出口：复制代码到剪贴板、写进指定笔记的落点标记之间、导出 SVG、导出 JPG。
 *
 * 预览本身交给 `MarkdownRenderer`：Obsidian 自带 mermaid，不必自己引一份运行时。
 * 图片出口只负责**把预览里那张图取出来**（svg = 文本 / jpg = 二进制），
 * 落点与文件名是视图/store 的事（见 services/image-export）。
 */
export interface MermaidOptions {
  /** 导出代码里保留今天的竖线 */
  todayMarker: boolean;
  /** 把周末标成非工作日 */
  excludeWeekends: boolean;
  /** 临时排除日期（完整 ISO 或区间） */
  excludeDates: string;
  /** 临时调休上班日 */
  includeDates: string;
}

export interface MermaidBoardHost {
  /** 当前应当展示/导出的 mermaid 全文（由甘特模型实时生成） */
  getSource(): string;
  getOptions(): MermaidOptions;
  /** 选项变化 → 存设置 + 重算预览 */
  onOptionsChange(patch: Partial<MermaidOptions>): void;
  /** 复制代码到剪贴板 */
  onExportCode(): void;
  /** 写入笔记（落点标记之间） */
  onWriteToNote(): void;
  /** 图片落盘（面板已把预览里的 svg 取出） */
  onExportImage(payload: MermaidImageExport): void;
}

type ToggleKey = "todayMarker" | "excludeWeekends";
type DateFieldKey = "excludeDates" | "includeDates";

/** 开关项写成函数：文案要按当前语言求值，常量会在 import 时把语言冻住 */
function toggleSpecs(): { key: ToggleKey; label: string; hint: string }[] {
  return [
    { key: "todayMarker", label: t("今天线"), hint: t("导出的代码里保留今天的竖线。") },
    {
      key: "excludeWeekends",
      label: t("排除周末"),
      hint: t(
        "把周六周日标成非工作日：自绘甘特图与导出的图都会把它们画成灰色列。注意：任务条长度始终按起止日期算（自然日），不会因为跳过周末而缩短。",
      ),
    },
  ];
}

/**
 * 两个日期清单（国内日历的两半）：
 * 节假日进 excludes，调休补班进 includes —— 后者优先级更高，能把落在周末的补班日捞回工作日。
 */
function dateFieldSpecs(): { key: DateFieldKey; label: string; placeholder: string; hint: string }[] {
  return [
    {
      key: "excludeDates",
      label: t("排除日期"),
      placeholder: "2026-10-01~2026-10-07",
      hint: t(
        "临时补充的排除日期。支持区间 2026-10-01~2026-10-07（也认「至」），多条用逗号分隔；这些日子在图上会画成灰色的非工作日。成规模的法定节假日建议在设置里按年份维护「法定节假日排期」，导出时会自动套用。",
      ),
    },
    {
      key: "includeDates",
      label: t("调休上班"),
      placeholder: "2026-10-10",
      hint: t(
        "临时补充的调休补班日。写法同上；这些日子强制算工作日（优先级高于排除），用于把「周六但要上班」从灰色里捞回来。年度排期里的补班日会自动套用，这里只填例外。",
      ),
    },
  ];
}

/** 图片出口：文案与提示写在一处，将来加格式只改这张表 */
function imageExports(): { format: "svg" | "jpg"; label: string; hint: string }[] {
  return [
    {
      format: "svg",
      label: t("导出 SVG"),
      hint: t("把预览里的图存成矢量图（.svg）：放大不糊，也能再拿去别的工具里改。"),
    },
    {
      format: "jpg",
      label: t("导出 JPG"),
      hint: t("把预览里的图存成位图（.jpg，2 倍分辨率、底色跟随主题）：适合贴进聊天或文档。"),
    },
  ];
}

/** 日期输入的防抖：每次按键都重算预览会卡，还会连着写盘 */
const INPUT_DEBOUNCE_MS = 400;

export class MermaidBoard {
  private readonly toggles = new Map<ToggleKey, HTMLButtonElement>();
  private readonly dateInputs = new Map<DateFieldKey, HTMLInputElement>();
  private previewEl: HTMLElement | null = null;

  private previewChild: Component | null = null;
  /** 渲染代次：mermaid 渲染是异步的，用它丢弃过期结果 */
  private renderGeneration = 0;
  private inputTimer: number | null = null;
  /** 防抖期间累积的改动（两个输入框共用一个定时器） */
  private pendingPatch: Partial<MermaidOptions> = {};

  constructor(
    private readonly component: Component,
    private readonly app: App,
    private readonly host: HTMLElement,
    private readonly deps: MermaidBoardHost,
  ) {
    this.build();
    this.component.register(() => this.clearInputTimer());
  }

  private build(): void {
    this.host.addClass("tm-mermaid");

    const bar = this.host.createDiv({ cls: "tm-mermaid__bar" });
    for (const spec of toggleSpecs()) {
      const button = bar.createEl("button", {
        cls: "tm-chip",
        text: spec.label,
        attr: { type: "button", title: spec.hint, "aria-pressed": "false" },
      });
      this.toggles.set(spec.key, button);
      this.component.registerDomEvent(button, "click", () => {
        const next = !this.deps.getOptions()[spec.key];
        this.deps.onOptionsChange({ [spec.key]: next });
      });
    }

    for (const spec of dateFieldSpecs()) {
      const field = bar.createEl("label", { cls: "tm-mermaid__field", attr: { title: spec.hint } });
      field.createSpan({ cls: "tm-mermaid__field-label", text: spec.label });
      const input = field.createEl("input", {
        cls: "tm-mermaid__input",
        attr: { type: "text", placeholder: spec.placeholder, "aria-label": spec.label },
      });
      this.dateInputs.set(spec.key, input);
      this.component.registerDomEvent(input, "input", () => {
        this.scheduleInput(
          spec.key === "excludeDates"
            ? { excludeDates: input.value }
            : { includeDates: input.value },
        );
      });
    }

    /*
     * 配色说明折成一个小图标：常驻一行会白占预览的高度。
     * 这条也是用户最容易误会的地方 —— 在设置里改了四种条色，导出的图却不跟着变。
     */
    bar.createSpan({
      cls: "tm-mermaid__hint",
      text: "ⓘ",
      attr: {
        title: t(
          "Mermaid 的 gantt 语法不支持逐任务配色：设置里的四种条色只影响自绘甘特图，导出时会忽略。",
        ),
      },
    });

    const actions = bar.createDiv({ cls: "tm-mermaid__actions" });
    const exportButton = actions.createEl("button", {
      cls: "tm-btn mod-cta",
      text: t("导出代码"),
      attr: { type: "button", title: t("复制当前预览的 Mermaid 代码") },
    });
    this.component.registerDomEvent(exportButton, "click", () => this.deps.onExportCode());

    const writeButton = actions.createEl("button", {
      cls: "tm-btn",
      text: t("写入笔记"),
      attr: {
        type: "button",
        title: t("替换指定笔记里落点标记之间的内容（标记可在设置里改）"),
      },
    });
    this.component.registerDomEvent(writeButton, "click", () => this.deps.onWriteToNote());

    for (const spec of imageExports()) {
      const button = actions.createEl("button", {
        cls: "tm-btn",
        text: spec.label,
        attr: { type: "button", title: spec.hint },
      });
      this.component.registerDomEvent(button, "click", () => void this.exportImage(spec.format));
    }

    this.previewEl = this.host.createDiv({ cls: "tm-mermaid__preview" });
  }

  /**
   * 导出预览里的图。
   *
   * 图从**当前渲染出来的 svg** 上取，不重新跑一遍 mermaid：导出的就是眼前这张
   * （含今天线、排除周末、节假日等选项的效果）。取不到就明说，不静默失败 ——
   * 预览还没渲染完就点按钮是最常见的一种操作。
   */
  private async exportImage(format: "svg" | "jpg"): Promise<void> {
    const svg = this.previewEl?.querySelector<SVGSVGElement>("svg") ?? null;
    if (svg === null) {
      new Notice(t("预览里还没有可导出的图，等它渲染完再点一次"));
      return;
    }
    try {
      const serialized = serializePreviewSvg(svg);
      if (format === "svg") {
        this.deps.onExportImage({ format, data: serialized.text });
        return;
      }
      const blob = await svgToJpegBlob(this.host.ownerDocument, serialized.text, {
        width: serialized.width,
        height: serialized.height,
        background: resolveExportBackground(svg),
      });
      this.deps.onExportImage({ format, data: await blob.arrayBuffer() });
    } catch (error) {
      new Notice(t("导出图片失败：{message}", { message: describeError(error) }));
    }
  }

  /**
   * 与外部的唯一同步入口：甘特状态一变就调它。
   *
   * 调用方必须**先让本面板可见再调**：mermaid 在 `display:none` 的容器里量不到尺寸，
   * 渲染出来是坏的（这坑与 Project Master 那边同源）。
   */
  update(): void {
    const options = this.deps.getOptions();
    for (const [key, button] of this.toggles) {
      const active = options[key];
      button.toggleClass("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
    // 正在输入的那个框不要回写：会把光标顶到末尾、中文输入法候选框也会丢
    for (const [key, input] of this.dateInputs) {
      if (this.host.ownerDocument.activeElement === input) continue;
      const value = options[key];
      if (input.value !== value) input.value = value;
    }
    this.renderPreview(this.deps.getSource());
  }

  private renderPreview(source: string): void {
    const el = this.previewEl;
    if (el === null) return;

    // 上一轮的子组件必须先卸载：mermaid 会往 DOM 里塞节点、绑监听器
    this.releasePreviewChild();
    el.empty();

    const generation = ++this.renderGeneration;
    const child = new Component();
    this.component.addChild(child);
    this.previewChild = child;

    void MarkdownRenderer.render(this.app, source, el, "", child)
      .then(() => {
        if (generation !== this.renderGeneration) return;
        if (el.childElementCount === 0) {
          el.createDiv({ cls: "tm-mermaid__preview-empty", text: t("没有可渲染的内容") });
        }
      })
      .catch((error: unknown) => {
        if (generation !== this.renderGeneration) return;
        el.empty();
        el.createDiv({
          cls: "tm-mermaid__preview-error",
          text: t("预览渲染失败：{message}", { message: describeError(error) }),
        });
        new Notice(t("Mermaid 预览渲染失败，导出的代码仍可用"));
      });
  }

  private scheduleInput(patch: Partial<MermaidOptions>): void {
    // 两个输入框共用一个定时器：累积各自的改动，一次落盘一次重渲染
    this.pendingPatch = { ...this.pendingPatch, ...patch };
    this.clearInputTimer();
    const win = this.host.ownerDocument.defaultView;
    if (win === null) return;
    this.inputTimer = win.setTimeout(() => {
      this.inputTimer = null;
      const pending = this.pendingPatch;
      this.pendingPatch = {};
      this.deps.onOptionsChange(pending);
    }, INPUT_DEBOUNCE_MS);
  }

  private clearInputTimer(): void {
    if (this.inputTimer === null) return;
    this.host.ownerDocument.defaultView?.clearTimeout(this.inputTimer);
    this.inputTimer = null;
  }

  destroy(): void {
    this.clearInputTimer();
    this.releasePreviewChild();
    this.host.empty();
  }

  private releasePreviewChild(): void {
    if (this.previewChild === null) return;
    this.component.removeChild(this.previewChild);
    this.previewChild = null;
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
