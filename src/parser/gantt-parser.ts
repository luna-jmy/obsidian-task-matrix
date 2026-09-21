import { t } from "../i18n";
import { isValidIso } from "../utils/date";

/**
 * 甘特视图专用解析器。
 *
 * 与 `task-parser.ts` **不是同一套规则**，这是有意的：面板视图看的是「状态与日期」，
 * 甘特看的是「时间跨度与依赖」，两者的字段面本来就不同。字段口径逐条对齐
 * obsidian-gantt-builder（用户指定），于是同一行在两种视图下的解读可以不一样，
 * 但每一种都有据可依。
 *
 * 与来源项目的差异（仅两处，都是为了不出错）：
 * 1. 清洗任务名时用带 `g` 的正则，同一字段出现两次也能清干净（来源项目不带 `g`，
 *    只会清掉第一处，任务名里会剩一个孤儿 emoji）；
 * 2. id 用「路径:行号:名字」而不是 randomUUID —— 每次刷新重新解析，随机 id 会让
 *    「同一行的任务」在两个渲染帧里变成两个不同对象，折叠/高亮/联动全都对不上。
 */

/** 复选框判定：只认空格 / x / X（与来源项目一致，`[/]`、`[-]` 不算甘特任务） */
export const GANTT_TASK_PATTERN = /^\s*-\s*\[([ xX])\]\s+(.+)$/u;

/** 标题判定：`##` = 项目、`###` = 分节（`#` 与 `####+` 不参与） */
export const GANTT_HEADING_PATTERN = /^\s{0,3}(#{2,3})\s+(.+)$/u;

const DATE = "\\d{4}-\\d{2}-\\d{2}";

/*
 * 字段来源（字符串形式，便于同时派生「提取用」与「清洗用」两套正则）。
 * 每条都是「emoji 分支 | Dataview 行内字段分支」二选一，结尾的 `]` 可选——
 * Dataview 写法需要它，emoji 写法没有它。少了这个 `?` 会让 emoji 形式全部失配。
 */
const START_FIELD = `(?:\\u{1F6EB}\\uFE0F?\\s*|\\[start::\\s*)(${DATE})\\]?`;
const SCHEDULED_FIELD = `(?:\\u{23F3}\\uFE0F?\\s*|\\[scheduled::\\s*)(${DATE})\\]?`;
const DUE_FIELD = `(?:\\u{1F4C5}\\uFE0F?\\s*|\\[due::\\s*)(${DATE})\\]?`;
const DONE_FIELD = `(?:\\u{2705}\\uFE0F?|\\[completion::\\s*)(${DATE})\\]?`;
const CREATED_FIELD = `(?:\\u{2795}\\uFE0F?|\\[created::\\s*)(${DATE})\\]?`;
const CANCELLED_FIELD = `(?:\\u{274C}\\uFE0F?|\\[cancelled::\\s*)(${DATE})\\]?`;
const ID_FIELD = "(?:\\u{1F194}\\uFE0F?\\s*|\\[id::\\s*)([a-zA-Z0-9_-]+)\\]?";
const DEPENDENCY_FIELD =
  "(?:\\u{26D4}\\uFE0F?\\s*|\\[(?:dependsOn|depends on|depends)::\\s*)([a-zA-Z0-9_-]+)\\]?";
const OWNER_FIELD = "\\[owner::\\s*([^\\]]+)\\]";

const START_RE = new RegExp(START_FIELD, "u");
const SCHEDULED_RE = new RegExp(SCHEDULED_FIELD, "u");
const DUE_RE = new RegExp(DUE_FIELD, "u");
const ID_RE = new RegExp(ID_FIELD, "u");
const DEPENDENCY_RE = new RegExp(DEPENDENCY_FIELD, "iu");
const MILESTONE_RE = new RegExp("#milestone|\\u{1F6A9}\\uFE0F?", "iu");
// crit 只认 `🔺`：`#milestone` 是里程碑的标记（用户口径 2026-09-21），
// 而 `#crit` / `#critical` 不作为关键任务的判定 —— 想标关键任务就写 `🔺`
const CRITICAL_RE = new RegExp("\\u{1F53A}\\uFE0F?", "u");

/** 清洗任务名用：同一条字段也允许出现多次，所以带 `g`（绝不拿来 `.test()`，避免 lastIndex 状态） */
const STRIP_PATTERNS = [
  START_FIELD,
  SCHEDULED_FIELD,
  DUE_FIELD,
  DONE_FIELD,
  CREATED_FIELD,
  CANCELLED_FIELD,
  ID_FIELD,
  DEPENDENCY_FIELD,
  OWNER_FIELD,
].map((source) => new RegExp(source, "gu"));

/** 字段清完之后仍可能剩下的孤儿 emoji */
const ORPHAN_EMOJI = /[\u{1F6EB}\u{23F3}\u{1F4C5}\u{2705}\u{2795}\u{274C}\u{1F194}\u{26D4}\u{1F53A}\u{1F6A9}]/gu;

export interface GanttTask {
  /** 稳定标识：路径:行号:名字。随机 id 会在每次刷新后失效，联动与高亮就断了 */
  id: string;
  filePath: string;
  lineNumber: number;
  lineText: string;
  name: string;
  /** 由 `##` 标题得到 */
  project: string;
  /** 由 `###` 标题得到 */
  section: string;
  completed: boolean;
  /** 渲染用的开始日：`🛫`，缺省时回退 `⏳`（与来源项目一致） */
  startDate?: string;
  /** 完整的 `⏳`，用于区分「真的是开工日」还是「拿计划日顶上的」 */
  scheduledDate?: string;
  dueDate?: string;
  taskId?: string;
  dependsOn?: string;
  /** `🔺`（唯一的 crit 标记） */
  critical: boolean;
  /** `#milestone` / `🚩` —— 对应 Mermaid 的 `milestone`，图上画成菱形 */
  milestone: boolean;
}

export interface GanttHeading {
  level: 2 | 3;
  text: string;
}

/** 该行是不是甘特认的分节标题；不是则返回 null */
export function ganttHeadingOf(line: string): GanttHeading | null {
  const match = GANTT_HEADING_PATTERN.exec(line);
  if (match === null) return null;
  return { level: match[1].length === 2 ? 2 : 3, text: match[2].trim() };
}

/** 去掉所有已知字段与残留 emoji，留下人类可读的任务名 */
export function stripGanttFields(raw: string): string {
  let name = raw;
  for (const pattern of STRIP_PATTERNS) {
    name = name.replace(pattern, "");
  }
  name = name.replace(ORPHAN_EMOJI, "");
  // 这几个是甘特自己的控制标签（改形状/状态），不是任务名的内容，从名字里剥掉。
  // 其他标签（`#doing` 之类）属于任务文本，保留
  name = name.replace(/#crit\b/giu, "").replace(/#milestone\b/giu, "");
  return name.replace(/\s+/gu, " ").trim();
}

export function parseGanttTaskLine(
  line: string,
  filePath: string,
  lineNumber: number,
  headings: { project: string; section: string },
): GanttTask | null {
  const match = GANTT_TASK_PATTERN.exec(line);
  if (match === null) return null;

  const raw = match[2];
  const start = normalizeIso(START_RE.exec(raw)?.[1]);
  const scheduled = normalizeIso(SCHEDULED_RE.exec(raw)?.[1]);
  const due = normalizeIso(DUE_RE.exec(raw)?.[1]);
  const name = stripGanttFields(raw) || t("未命名任务");

  return {
    id: `${filePath}:${lineNumber}:${name}`,
    filePath,
    lineNumber,
    lineText: line,
    name,
    project: headings.project,
    section: headings.section,
    completed: match[1].toLowerCase() === "x",
    // 🛫 缺省时用 ⏳ 顶上：来源项目的口径，能让「只写了计划日」的任务也上得了图
    startDate: start ?? scheduled,
    scheduledDate: scheduled,
    dueDate: due,
    taskId: ID_RE.exec(raw)?.[1]?.trim() || undefined,
    dependsOn: DEPENDENCY_RE.exec(raw)?.[1]?.trim() || undefined,
    critical: CRITICAL_RE.test(raw),
    milestone: MILESTONE_RE.test(raw),
  };
}

function normalizeIso(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed !== undefined && isValidIso(trimmed) ? trimmed : undefined;
}
