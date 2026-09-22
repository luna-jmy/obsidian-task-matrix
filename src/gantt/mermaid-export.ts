import { GanttModel, GanttRow } from "./gantt-model";

/**
 * Mermaid 导出器（纯函数）：当前视图状态 → mermaid 字符串。
 *
 * 与 Project Master 的导出器同口径，逐条对齐：
 * - `    title <标题>`（标题留空则整行不输出）、`dateFormat YYYY-MM-DD`、`axisFormat %y-%m`；
 * - 只有**多个可见分节**才输出 `    section <名字>`：只有一个分节时它跟整图标题是重复信息；
 * - 只导出**当前看得见的那部分** —— 折叠的分节整段不出现，连 section 头都不出。
 *   用户折叠就是为了不关心，导出（尤其「写入笔记」）却把它写回去，等于白折叠；
 * - 状态/形状标记写在冒号后的最前面、以逗号分隔（mermaid 的规定）；
 * - 每个分节后留一个空行。
 *
 * 标记与自绘甘特的四种条色一一对应（settings 的「甘特条配色」），
 * 免得出现「图上标红、导出却没有 crit」这种两处口径漂移：
 *
 * | 标记        | 任务行里的写法                    |
 * |-------------|-----------------------------------|
 * | `milestone` | `#milestone` / `🚩`               |
 * | `crit`      | `🔺`                              |
 * | `done`      | 勾选框是 `x`                       |
 * | `active`    | 其余有日期的未完成任务              |
 */
export interface MermaidExportOptions {
  /** 图标题；留空则不输出 title 行 */
  title: string;
  /** 保留今天的竖线（关掉才输出 `todayMarker off` —— mermaid 默认是画的） */
  todayMarker: boolean;
  /** 把周末标成非工作日 */
  excludeWeekends: boolean;
  /**
   * 法定节假日与调休补班（含面板上的临时补充），升序的完整 ISO 日期。
   *
   * 由调用方从 `services/holiday-schedule` 取：**自绘甘特的灰色列与这里必须同源**，
   * 否则会出现「图上画成工作日、导出却是非工作日」这种最难解释的不一致。
   */
  holidays: { exclude: readonly string[]; include: readonly string[] };
}

/**
 * 名称里会影响 mermaid 语法的字符。
 *
 * 冒号是 `名字 :id, 起, 止` 的分隔符，换行会直接破图 —— 这两类都在名称里去掉。
 * （显示名保留其余字符：它是给人读的，不该被清洗成正则产物。）
 */
const UNSAFE_IN_NAME = /[:`\n\r]+/gu;

/** 用作 mermaid 任务 ID 时保留的字符：字母、数字、下划线、连字符、CJK */
const UNSAFE_IN_ID = /[^\p{L}\p{N}_-]+/gu;

export function exportMermaid(model: GanttModel, options: MermaidExportOptions): string {
  let code = "```mermaid\ngantt\n";

  const title = options.title.replace(/\s+/gu, " ").trim();
  if (title.length > 0) code += `    title ${title}\n`;
  code += "    dateFormat YYYY-MM-DD\n";
  code += "    axisFormat %y-%m\n";
  for (const directive of buildDirectives(options)) code += `${directive}\n`;
  code += "\n";

  const sections = visibleSections(model);
  const emitSections = sections.length > 1;
  const usedIds = new Map<string, number>();

  for (const section of sections) {
    if (emitSections) code += `    section ${cleanLabel(section.name)}\n`;
    for (const row of section.rows) {
      code += `    ${taskLine(row, usedIds)}\n`;
    }
    code += "\n";
  }

  code += "```";
  return code;
}

/**
 * 选项 → mermaid 指令行。顺序固定，保证同样的选项产出同样的文本（可被逐字比对）。
 *
 * ── 为什么周末与假日必须在**同一条** excludes 里 ────────────────────
 * mermaid 对 `excludes` 是「后一条覆盖前一条」：`excludes weekends` 与
 * `excludes 2026-10-01` 分成两行时，前一行会被丢掉 —— 表现就是「周末开关看着写了、
 * 图上却没生效」。两个来源因此必须并进同一份清单：
 *
 *     excludes weekends,2026-10-01,2026-10-02
 *
 * ── excludes 与 includes 的配合（法定节假日 + 调休）────────────────
 * mermaid 的 `includes` 是**优先级最高**的工作日白名单 —— 命中它的日子一律不算被排除，
 * 能盖过 weekends 与具体日期排除。于是国内日历可以这样表达：
 *
 *     excludes weekends,2026-10-01,2026-10-02   ← 周末 + 法定假日
 *     includes 2026-10-10                        ← 调休补班（那天是周六，但要上班）
 *
 * 被 includes 捞回来的日子不会进图上那条灰色「非工作日」色带。
 */
function buildDirectives(options: MermaidExportOptions): string[] {
  const lines: string[] = [];
  if (!options.todayMarker) {
    // mermaid 默认就画 today 竖线，所以要「关掉」才输出指令
    lines.push("    todayMarker off");
  }

  const excludes = [
    ...(options.excludeWeekends ? ["weekends"] : []),
    ...options.holidays.exclude,
  ];
  if (excludes.length > 0) lines.push(`    excludes ${excludes.join(",")}`);

  if (options.holidays.include.length > 0) {
    lines.push(`    includes ${options.holidays.include.join(",")}`);
  }
  return lines;
}

/**
 * 这次导出实际会包含的行（折叠分节的行不算）。
 *
 * 给调用方判断「有没有内容可导出」与显示计数用：直接用 `model.rows` 会把折叠掉的
 * 任务也数进去，于是出现「提示说导出了 16 条，图里只有 9 条」。
 */
export function exportableRows(model: GanttModel | null): GanttRow[] {
  if (model === null) return [];
  return visibleSections(model).flatMap((section) => section.rows);
}

function visibleSections(model: GanttModel): GanttModel["sections"] {
  return model.sections.filter((section) => !section.collapsed);
}

/**
 * 一行任务。
 *
 * 格式是 `显示名 :标记…, ID, 起始日, 结束日`（mermaid 的语法：冒号前是显示名，
 * 冒号后依次是标签、ID、日期）。显示名保留原文（只去掉冒号/换行），ID 才做清洗 ——
 * ID 用于 `after` 之类的引用，用户看不到，没必要为它牺牲可读性。
 * 清洗后为空（纯 emoji 的任务名）时 ID 退回 `task`，不会渲成一条无名任务。
 *
 * 里程碑走 mermaid 规定的另一副写法 `milestone, ID, 日期, 0d`（官方示例同形）：
 * 它画的是「一个时刻」，给起止区间反而不对。我们的自绘甘特也把菱形画在结束日上，
 * 两边取值一致（`row.end`）。
 */
function taskLine(row: GanttRow, usedIds: Map<string, number>): string {
  const id = uniqueId(row.task.name, usedIds);
  const label = cleanLabel(row.task.name) || id;
  const critical = row.task.critical ? "crit, " : "";

  if (row.task.milestone) {
    return `${label} :${critical}milestone, ${id}, ${row.end}, 0d`;
  }

  // 未完成的任务标 active：mermaid 据此把它画成普通条
  const status = row.task.completed ? "done, " : "active, ";
  return `${label} :${critical}${status}${id}, ${row.start}, ${row.end}`;
}

/**
 * 显示名 / 分节名：去掉会破语法的字符，并把空白收成一个空格。
 *
 * 逐处替换会留下双空格（`a:b` → `a b`，再遇一个空格就成两格），收一遍读起来才正常。
 */
function cleanLabel(text: string): string {
  return text.replace(UNSAFE_IN_NAME, " ").replace(/\s+/gu, " ").trim();
}

/**
 * 唯一 ID：同名任务会产生重复 ID（mermaid 会报错或静默丢条），追加 `-2`、`-3`。
 */
function uniqueId(name: string, usedIds: Map<string, number>): string {
  const cleaned = name.replace(UNSAFE_IN_ID, "").trim();
  const base = cleaned.length > 0 ? cleaned : "task";
  const seen = usedIds.get(base);
  if (seen === undefined) {
    usedIds.set(base, 1);
    return base;
  }
  const next = seen + 1;
  usedIds.set(base, next);
  return `${base}-${next}`;
}

/** 「写入笔记」用：把 fenced 代码块包进落点标记（标记由设置提供） */
export function wrapInMarkers(mermaid: string, markers: { start: string; end: string }): string {
  return `${markers.start}\n\n${mermaid}\n\n${markers.end}`;
}
