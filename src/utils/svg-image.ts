import type { App } from "obsidian";

/**
 * Mermaid 预览的图片导出 —— 把预览 DOM 里的 `<svg>` 变成可落盘的 SVG 文本 / JPEG 二进制
 * （与 Project Master 同口径）。
 *
 * 单独成文件的原因：这里全是 DOM 活（序列化、光栅化），与预览面板的「控件 + 预览」
 * 职责无关；能纯化的部分（文件名、附件目录推导、viewBox 解析）单独拆出来，便于断言。
 */

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

/**
 * 要抄进导出文件里的宿主 CSS 变量。
 *
 * Obsidian 渲染 mermaid 时把主题变量交给了 mermaid 的 themeVariables，图里的颜色
 * 因此可能写成 `var(--text-normal)` 这种**引用**。SVG 一旦脱离宿主文档树
 * （另存为文件、或塞进 `<img>` 去光栅化），这些变量就不存在了 —— 配色会整片变黑或透明。
 * 所以导出前按当前计算值把它们钉进 svg 自己的一小段 `<style>` 里。
 */
const HOST_CSS_VARIABLES = [
  "--background-primary",
  "--background-primary-alt",
  "--background-secondary",
  "--background-modifier-border",
  "--text-normal",
  "--text-muted",
  "--text-faint",
  "--text-accent",
  "--interactive-accent",
  "--font-text",
  "--font-interface",
  "--color-red",
  "--color-green",
  "--color-blue",
  "--color-orange",
  "--color-yellow",
];

/** 导出载荷：面板只负责从预览里取出数据，落点与文件名由视图决定 */
export interface MermaidImageExport {
  format: "svg" | "jpg";
  /** svg = 文本；jpg = 二进制 */
  data: string | ArrayBuffer;
}

export interface SerializedSvg {
  text: string;
  width: number;
  height: number;
}

export interface JpegOptions {
  width: number;
  height: number;
  /** 底色（JPEG 没有透明通道，必须先铺一层） */
  background: string;
  /** 输出倍率，默认 2（够 retina；像素总量另有上限，见 MAX_CANVAS_PIXELS） */
  scale?: number;
}

/** Canvas 像素上限：3000×2000 约 6M 像素、24M 已是内存不小的图，再大就是炸弹 */
const MAX_CANVAS_PIXELS = 24_000_000;

/**
 * 导出文件名：`甘特图-20260921-0905.svg`。
 *
 * 时间从参数注入（而不是内部 new Date()），所以这条是纯函数、可以测。
 */
export function exportImageName(prefix: string, ext: "svg" | "jpg", now: Date): string {
  const pad = (value: number): string => String(value).padStart(2, "0");
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `${prefix}-${stamp}.${ext}`;
}

/**
 * Obsidian「附件默认位置」配置 → vault 相对目录（纯函数）。
 *
 * 用宿主自己的附件配置，而不是给插件再加一个目录参数：那是用户**已经配过**的地方，
 * 没有理由让他为导出图片再写一遍路径。
 *
 * - `"/"`（vault 根）与空值/非字符串 → `""`（= vault 根，沿用 Obsidian 的表示法）；
 * - `"./"`（与当前笔记同目录）→ 当前笔记所在目录；没有活动笔记时退回 vault 根；
 * - 其余（`assets`、`900 Assets/图` 等）→ 去掉首尾斜杠后原样使用。
 */
export function resolveAttachmentFolder(setting: unknown, activeFolder: string | null): string {
  const raw = typeof setting === "string" ? setting.trim() : "";
  if (raw.length === 0 || raw === "/") return "";
  if (raw === "./") return activeFolder ?? "";
  return raw.replace(/^\/+|\/+$/gu, "");
}

/**
 * viewBox → 尺寸（纯函数）。写不成四个有效数字就返回 null，
 * 交给调用方退回「实测尺寸」—— 不猜。
 */
export function parseViewBoxSize(viewBox: string | null): { width: number; height: number } | null {
  if (viewBox === null) return null;
  const parts = viewBox
    .trim()
    .split(/[\s,]+/u)
    .map(Number);
  if (parts.length !== 4) return null;
  const width = parts[2];
  const height = parts[3];
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}

/** Obsidian 的「附件默认位置」（`vault.getConfig` 不在公开类型里，按运行时能力探测） */
export function readAttachmentSetting(app: App): unknown {
  const vault = app.vault as App["vault"] & { getConfig?(key: string): unknown };
  if (typeof vault.getConfig !== "function") return undefined;
  try {
    return vault.getConfig("attachmentFolderPath");
  } catch {
    return undefined;
  }
}

/**
 * 预览里的 `<svg>` → 独立可用的 SVG 文本。
 *
 * 三件事：**写死尺寸**（外部查看器不认宿主布局算出来的大小）、补齐命名空间、
 * 把宿主主题变量钉进去（见 HOST_CSS_VARIABLES）。尺寸取「实测」与「viewBox」里
 * 较大的那个：面板窄的时候实测值会小于图本身的内容尺寸，按它导出会糊。
 */
export function serializePreviewSvg(svg: SVGSVGElement): SerializedSvg {
  const rect = svg.getBoundingClientRect();
  const boxed = parseViewBoxSize(svg.getAttribute("viewBox"));
  const width = Math.max(1, Math.round(Math.max(rect.width, boxed?.width ?? 0)));
  const height = Math.max(1, Math.round(Math.max(rect.height, boxed?.height ?? 0)));

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", SVG_NS);
  clone.setAttribute("xmlns:xlink", XLINK_NS);
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  if (svg.getAttribute("viewBox") === null) {
    clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }
  injectHostVariables(clone, svg);
  return { text: new XMLSerializer().serializeToString(clone), width, height };
}

/** JPEG 的底色：优先用主题背景色（深色主题下发白的图很难看），读不到就白底 */
export function resolveExportBackground(svg: SVGSVGElement): string {
  const computed = svg.ownerDocument.defaultView?.getComputedStyle(svg);
  const value = computed?.getPropertyValue("--background-primary").trim() ?? "";
  return value.length > 0 ? value : "#ffffff";
}

/** SVG 文本 → JPEG Blob（经 canvas 光栅化） */
export async function svgToJpegBlob(
  doc: Document,
  svgText: string,
  options: JpegOptions,
): Promise<Blob> {
  const view = doc.defaultView;
  if (view === null) throw new Error("没有可用的窗口环境");
  const scale = clampScale(options.scale ?? 2, options.width, options.height);
  // 用 blob URL 而不是 data URL：中文/特殊字符不必自己编码，也不会撞上长度上限
  const url = view.URL.createObjectURL(
    new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = await loadSvgImage(doc, url);
    const canvas = doc.createElement("canvas");
    canvas.width = Math.max(1, Math.round(options.width * scale));
    canvas.height = Math.max(1, Math.round(options.height * scale));
    const ctx = canvas.getContext("2d");
    if (ctx === null) throw new Error("无法创建画布上下文");
    // 先铺底色：JPEG 没有透明通道，否则透明区会变成黑块
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await toJpegBlob(canvas);
  } finally {
    view.URL.revokeObjectURL(url);
  }
}

function loadSvgImage(doc: Document, url: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = doc.createElement("img");
    // 处理器先挂、src 后设：图命中缓存时 onload 可能同步就触发
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("无法把 SVG 转成位图（图里引用了外部资源时会被拦下）"));
    image.src = url;
  });
}

function toJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob === null) {
          reject(new Error("画布导出失败"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92,
    );
  });
}

/**
 * 倍率上限：像素总量超了就等比往下压。
 * 宁可糊一点，也不要把几张几十兆的 canvas 同时压在内存里。
 */
function clampScale(scale: number, width: number, height: number): number {
  const desired = Math.max(1, scale);
  if (width <= 0 || height <= 0) return 1;
  const pixels = width * height * desired * desired;
  if (pixels <= MAX_CANVAS_PIXELS) return desired;
  return Math.max(1, Math.sqrt(MAX_CANVAS_PIXELS / (width * height)));
}

/** 把宿主当前生效的主题变量写进 svg 自己的 `<style>`（理由见 HOST_CSS_VARIABLES） */
function injectHostVariables(target: SVGSVGElement, source: SVGSVGElement): void {
  const view = source.ownerDocument.defaultView;
  if (view === null) return;
  // 必须从**在文档里的那个** svg 读计算值：clone 还没入文档，算出来是空的
  const computed = view.getComputedStyle(source);
  const declarations: string[] = [];
  for (const name of HOST_CSS_VARIABLES) {
    const value = computed.getPropertyValue(name).trim();
    if (value.length > 0) declarations.push(`${name}: ${value};`);
  }
  if (declarations.length === 0) return;
  const style = source.ownerDocument.createElementNS(SVG_NS, "style");
  style.textContent = `svg { ${declarations.join(" ")} }`;
  target.insertBefore(style, target.firstChild);
}
