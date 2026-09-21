import { App, moment, normalizePath, Notice, TFile } from "obsidian";
import { t } from "../i18n";

/**
 * 笔记层面的写入：占位符解析、按模板新建、目录补齐。
 *
 * 与 `parser/task-writer.ts` 的分工：那边只改**已存在的**笔记里的一行，
 * 这边负责「笔记还不存在」的情况 —— 新建任务默认落到当日日志，
 * 而当天还没写日志是常态，所以「缺了就建」是主路径而不是异常分支。
 */

/** 核心「模板」插件在用户没改设置时用的日期/时间格式 */
const CORE_DATE_FORMAT = "YYYY-MM-DD";
const CORE_TIME_FORMAT = "HH:mm";

/**
 * 宿主提供的 moment。
 *
 * 只声明用得到的 `.format()`：obsidian.d.ts 里 `moment` 的类型是 `typeof Moment`
 * （模块命名空间），直接调用会被 TS 判成「不可调用」，而运行时它确实是那个函数。
 * 自己实现一套格式化又要去追 moment 的 token（`dddd`、`Mo` 之类），
 * 不如就用宿主的这一份，只把类型收窄到我们真正用的一个方法。
 */
const now = moment as unknown as () => { format: (pattern: string) => string };

/**
 * 解析 `{{title}}` / `{{date}}` / `{{time}}` / `{{date:FORMAT}}` / `{{time:FORMAT}}`，
 * 顺带兼容历史上支持的 `YYYY` / `MM` / `DD`（老用户的路径模板里可能还写着这两个）。
 *
 * 未识别的占位符**原样保留**：用户写的东西不该被我们悄悄吃掉。
 * 顺序要紧：先处理 `{{date:…}}`（它内部可能含 YYYY），再处理裸的 YYYY/MM/DD。
 */
export function resolvePlaceholders(text: string, options: { title?: string } = {}): string {
  const at = now();
  const formatted = (raw: string | undefined, fallback: string): string => {
    const value = (raw ?? "").trim();
    return at.format(value.length === 0 ? fallback : value);
  };

  return (
    text
      .replace(/\{\{title\}\}/gu, options.title ?? "")
      .replace(/\{\{date(?::([^}]+))?\}\}/gu, (_match, format: string | undefined) =>
        formatted(format, CORE_DATE_FORMAT),
      )
      .replace(/\{\{time(?::([^}]+))?\}\}/gu, (_match, format: string | undefined) =>
        formatted(format, CORE_TIME_FORMAT),
      )
      .replace(/YYYY/gu, at.format("YYYY"))
      .replace(/MM/gu, at.format("MM"))
      .replace(/DD/gu, at.format("DD"))
  );
}

/** 逐级确保目录存在（幂等）。不用 createFolder 一把梭：父目录缺失时的行为随版本而异 */
export async function ensureFolder(app: App, folderPath: string): Promise<void> {
  const normalized = normalizePath(folderPath.trim()).replace(/^\/+|\/+$/gu, "");
  if (normalized.length === 0 || normalized === ".") return;

  let current = "";
  for (const segment of normalized.split("/")) {
    if (segment.length === 0) continue;
    current = current.length === 0 ? segment : `${current}/${segment}`;
    if (app.vault.getAbstractFileByPath(current) !== null) continue;
    await app.vault.createFolder(current);
  }
}

/**
 * 模板路径候选：清洗后的相对路径，以及补上 `.md` 的那一份。
 *
 * 清洗只做「能收敛就收敛」，**不做模糊匹配**：找不到就得说找不到，
 * 不能猜一个名字相近的文件出来把用户的模板换掉。复制「链接」拿到的是 wikilink，
 * 所以顺手剥一层 `[[]]` 与引号。
 */
function templateCandidates(raw: string): string[] {
  let value = raw.trim();
  const link = /^!?\[\[([^\]|]+)(?:\|[^\]]*)?\]\]$/u.exec(value);
  if (link !== null) value = (link[1] ?? "").trim();
  value = value.replace(/^["'`]+|["'`]+$/gu, "");

  const path = normalizePath(value).replace(/^\/+|\/+$/gu, "");
  if (path.length === 0) return [];
  return path.toLowerCase().endsWith(".md") ? [path] : [path, `${path}.md`];
}

export function findTemplate(app: App, raw: string): TFile | null {
  for (const candidate of templateCandidates(raw)) {
    const file = app.vault.getAbstractFileByPath(candidate);
    if (file instanceof TFile) return file;
  }
  return null;
}

/**
 * 确保笔记存在：没有就按模板新建（连目录一起补齐）。
 *
 * - 模板没填 → 建空白笔记（这是正常路径，不提示）
 * - 模板填了但读不到 → 建空白笔记 + 提示一句，**不算失败**
 * - 模板里的 `{{title}}` 取新笔记自己的文件名
 */
export async function ensureNote(
  app: App,
  path: string,
  options: { templatePath: string } = { templatePath: "" },
): Promise<TFile> {
  const normalized = normalizePath(path);
  const existing = app.vault.getAbstractFileByPath(normalized);
  if (existing instanceof TFile) return existing;

  const slash = normalized.lastIndexOf("/");
  await ensureFolder(app, slash === -1 ? "" : normalized.slice(0, slash));

  const rawTemplate = options.templatePath.trim();
  const template = rawTemplate.length === 0 ? null : findTemplate(app, rawTemplate);
  if (rawTemplate.length > 0 && template === null) {
    new Notice(t("找不到模板笔记：{path}（已按空白笔记创建）", { path: rawTemplate }));
  }

  const name = slash === -1 ? normalized : normalized.slice(slash + 1);
  const title = name.replace(/\.md$/u, "");
  const body =
    template === null ? "" : resolvePlaceholders(await app.vault.read(template), { title });

  const file = await app.vault.create(normalized, body);
  if (template !== null) await runTemplateCommands(app, file);
  return file;
}

/** 宿主把插件实例挂在 `app.plugins` 上，但官方没有这段类型 */
interface AppWithPlugins extends App {
  plugins?: {
    plugins?: Record<
      string,
      { templater?: { overwrite_file_commands?: (file: TFile) => Promise<void> } }
    >;
  };
}

/**
 * 让 Templater 执行模板里的 `<% %>`（例如 `tp.file.title`、`tp.system.suggester`）。
 *
 * 刻意做成 best-effort：Templater 是**可选依赖**，没装 / 没启用 / 那个版本没有这个方法
 * 就什么都不做，命令原样留在笔记里（用户随时可以自己跑一次，数据不会丢）。
 * 不 import、不声明依赖：插件不该硬依赖另一款社区插件，所以按「有就调、没有就算了」拿实例。
 */
async function runTemplateCommands(app: App, file: TFile): Promise<void> {
  const templater = (app as AppWithPlugins).plugins?.plugins?.["templater-obsidian"]?.templater;
  if (templater === undefined || typeof templater.overwrite_file_commands !== "function") return;

  try {
    await templater.overwrite_file_commands(file);
  } catch {
    /*
     * 模板里的用户脚本抛错（最常见的是 `tp.system.suggester` 被 Esc 取消）。
     * 笔记已经建好了，不能因为模板出错就把整条创建算失败 —— 提示一句，
     * 命令原样留在笔记里，想跑随时可以再执行一次。
     */
    new Notice(t("模板命令未全部执行，笔记已按模板原文创建；可稍后执行一次模板命令重跑"));
  }
}
