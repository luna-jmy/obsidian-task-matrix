import { App, TAbstractFile, TFile } from "obsidian";
import { ganttHeadingOf, GanttTask, parseGanttTaskLine } from "../parser/gantt-parser";
import { computeGtdState, parseTaskLine } from "../parser/task-parser";
import { ParsedTask, TaskMatrixSettings } from "../types";

/**
 * 任务索引：把 vault 里「范围内的 Markdown 文件」解析成任务列表。
 *
 * 设置是**逐次传入**而不是构造时捕获的：设置一改，复用旧实例就会带着旧口径
 * 继续扫描（扫描目录、字段标记都可能变），这种「改了没生效」最难查。
 */

/** Excalidraw 把数据存成 .md（结尾为 .excalidraw.md），扫描它既没意义还会干扰它的保存 */
export function isExcalidrawPath(path: string): boolean {
  return path.toLowerCase().endsWith(".excalidraw.md");
}

export function isPathInScope(path: string, settings: TaskMatrixSettings): boolean {
  const excluded = settings.excludeFolders.some((folder) => isInside(path, folder));
  if (excluded) return false;

  if (settings.scanFolders.length === 0) return true;
  return settings.scanFolders.some((folder) => isInside(path, folder));
}

/** 该路径是否需要触发重新索引（只关心范围内的普通 Markdown） */
export function isTrackedMarkdownPath(path: string, settings: TaskMatrixSettings): boolean {
  return path.toLowerCase().endsWith(".md")
    && !isExcalidrawPath(path)
    && isPathInScope(path, settings);
}

/**
 * 这一路径属于设置里的哪一个（扫描）目录，按设置里的**原文**返回。
 *
 * 分组标题要用它而不是截断的一级目录名：用户是按「300 Resources/360 WorkMemos」
 * 这样的目录组织资料的，标题就该长这样。都不匹配（没配扫描目录）时返回 null，
 * 由调用方决定退回什么。
 */
export function scanFolderOf(path: string, folders: readonly string[]): string | null {
  return folders.find((folder) => isInside(path, folder)) ?? null;
}

/**
 * 路径是否落在某个设置目录之下（含多级路径，例如 `300 Resources/360 WorkMemos`）。
 *
 * 比较**不区分大小写**：Windows / macOS / iOS 的文件系统都不区分，用户手打目录名时
 * 大小写经常和真实路径不一致，按字符严格比会变成「填了目录却没生效」。
 * 顺带把粘贴来的反斜杠、首尾斜杠都归一化掉。
 */
function isInside(path: string, folderSetting: string): boolean {
  const folder = folderSetting
    .trim()
    .replace(/\\/gu, "/")
    .replace(/^\/+|\/+$/gu, "")
    .toLowerCase();
  if (folder.length === 0) return false;

  const target = path.toLowerCase();
  return target === folder || target.startsWith(`${folder}/`);
}

export function shouldRescanForVaultChange(
  file: TAbstractFile,
  settings: TaskMatrixSettings,
): boolean {
  return file instanceof TFile && isTrackedMarkdownPath(file.path, settings);
}

export function shouldRescanForRename(
  file: TAbstractFile,
  oldPath: string,
  settings: TaskMatrixSettings,
): boolean {
  const currentMatches = file instanceof TFile && isTrackedMarkdownPath(file.path, settings);
  return currentMatches || isTrackedMarkdownPath(oldPath, settings);
}

/** 一次索引的产出：两种视图各自的投影 */
export interface TaskIndexResult {
  /** 面板视图（列表 / GTD / 矩阵 / 日历）用的任务 */
  tasks: ParsedTask[];
  /** 甘特视图用的任务，字段口径不同（见 parser/gantt-parser.ts） */
  ganttTasks: GanttTask[];
}

/**
 * 全量解析。
 *
 * 索引层**不做显示取舍**：范围内解析出来的任务一律收进来，「要不要显示」
 * 完全交给筛选层（filter-service）。这样界面上看到的每一处取舍都能在筛选栏里
 * 找到对应的开关，不会出现「设置里没写、但任务就是不出现」的暗规则。
 *
 * 两套解析器在**同一次文件读取**里跑完：磁盘 I/O 是这里的大头，为了两个投影
 * 各读一遍文件不划算。两种解析器的规则刻意不同（一个认任意标记与标签，
 * 一个只认空格/x/X 与 🛫📅），所以循环里各跑各的，互不干扰。
 *
 * 逐文件 `cachedRead`（每次 await 都是一次让出主线程的机会），所以大 vault
 * 下不会出现一次性长任务；是否还有更新的扫描由调用方的代次号判断。
 */
export async function collectIndex(app: App, settings: TaskMatrixSettings): Promise<TaskIndexResult> {
  const tasks: ParsedTask[] = [];
  const ganttTasks: GanttTask[] = [];
  const files = app.vault.getMarkdownFiles().filter((file) => isTrackedMarkdownPath(file.path, settings));

  for (const file of files) {
    const content = await app.vault.cachedRead(file);
    const lines = content.split(/\r?\n/u);
    const codeBlockLines = codeBlockLineNumbers(app, file);

    // 面板解析器认任意级别的标题；甘特解析器只认 `##`（项目）与 `###`（分节）
    let sectionHeading: string | undefined;
    let ganttProject = "";
    let ganttSection = "";

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const lineNumber = index + 1;

      // 代码块里的 `- [ ]` 是示例，不是任务
      if (codeBlockLines.has(lineNumber)) continue;

      const headingMatch = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/u);
      if (headingMatch) sectionHeading = headingMatch[1].trim();

      const ganttHeading = ganttHeadingOf(line);
      if (ganttHeading !== null) {
        if (ganttHeading.level === 2) {
          ganttProject = ganttHeading.text;
          ganttSection = "";
        } else {
          ganttSection = ganttHeading.text;
        }
      }

      const parsed = parseTaskLine(line, file.path, lineNumber, settings);
      // 用户明确要求忽略的标记（例如 `- [I]`）在这里就丢掉，它们不算任务
      if (parsed !== null && !settings.excludeMarkers.includes(parsed.checkboxStatus.trim())) {
        parsed.sectionHeading = sectionHeading;
        tasks.push(parsed);
      }

      const ganttTask = parseGanttTaskLine(line, file.path, lineNumber, {
        project: ganttProject,
        section: ganttSection,
      });
      if (ganttTask !== null) ganttTasks.push(ganttTask);
    }
  }

  applyBlockedState(tasks);
  return { tasks, ganttTasks };
}

/** 用 metadataCache 的代码块区段标出行号，比正则配对 ``` 更稳 */
function codeBlockLineNumbers(app: App, file: TFile): Set<number> {
  const lines = new Set<number>();
  const sections = app.metadataCache.getFileCache(file)?.sections ?? [];
  for (const section of sections) {
    if (section.type !== "code") continue;
    for (let line = section.position.start.line + 1; line <= section.position.end.line + 1; line += 1) {
      lines.add(line);
    }
  }
  return lines;
}

/**
 * 依赖是否已完成，决定 `blocked`。
 *
 * 在整批任务上做一次（而不是解析单行时），因为依赖指向的任务可能在别的文件里。
 */
export function applyBlockedState(tasks: ParsedTask[]): void {
  const completedIds = new Set(
    tasks
      .filter((task) => task.displayStatus === "completed")
      .map((task) => task.taskId)
      .filter((id): id is string => Boolean(id)),
  );

  for (const task of tasks) {
    if (!task.dependsOn) continue;
    task.blocked = !completedIds.has(task.dependsOn);
    task.gtdState = computeGtdState(
      task.displayStatus,
      task.checkboxStatus,
      task.description,
      task.dueDate,
      task.startDate,
      task.blocked,
    );
  }
}

/** 任务列表的指纹：内容没变就不必重绘 */
export function taskSignature(tasks: readonly ParsedTask[]): string {
  return tasks
    .map(
      (task) =>
        `${task.id}|${task.lineText}|${task.displayStatus}|${task.gtdState}|${task.quadrant}` +
        `|${task.blocked}|${task.sectionHeading ?? ""}`,
    )
    .join("\n");
}

/**
 * 甘特任务的指纹。
 *
 * 必须**单独算一份**：改一个 `### 分节` 标题不会让任何任务行的文本变化，
 * 面板指纹因此察觉不到，但甘特的分节已经全变了 —— 只靠面板指纹会出现
 * 「改了分节名、甘特却还是旧分组」。
 */
export function ganttSignature(tasks: readonly GanttTask[]): string {
  return tasks
    .map(
      (task) =>
        `${task.id}|${task.lineText}|${task.project}|${task.section}|${task.completed}` +
        `|${task.critical}|${task.milestone}`,
    )
    .join("\n");
}
