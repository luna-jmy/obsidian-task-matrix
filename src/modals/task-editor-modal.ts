import { App, Modal, Notice, Setting, TextComponent, TFile } from "obsidian";
import { t } from "../i18n";
import { generateShortId } from "../parser/task-parser";
import {
  appendLine,
  compactLine,
  editFileContent,
  editTaskLine,
  insertLineUnderHeading,
  replaceTaskDescription,
  setDateField,
  setIdentifierField,
  setPriority,
  setTags,
} from "../parser/task-writer";
import { addListFieldSetting } from "./list-field";
import { priorityLabel } from "../services/filter-service";
import { ensureNote, resolvePlaceholders } from "../services/note-service";
import { hasDateConflict } from "../services/task-actions";
import { ParsedTask, Priority, TaskMatrixSettings } from "../types";
import { todayIso } from "../utils/date";
import { askDateConflict } from "./confirm-modals";

/** 模态需要的外部依赖：不直接拿插件类，避免 views ↔ main 的循环 import */
export interface TaskEditorHost {
  app: App;
  settings: TaskMatrixSettings;
  tasks: readonly ParsedTask[];
  onSaved(): void;
}

/** 编辑结果。`conflictTag` 不是任务字段，而是「这次保存要不要打冲突标记」的意图 */
export type TaskEditorUpdates = Partial<ParsedTask> & { conflictTag?: boolean };

/**
 * 日期冲突标记。
 *
 * 它是一枚标签，但**不归标签字段管**：写不写由保存时的冲突对话框决定，
 * 标签字段只负责用户自己加的那些。所以它既不进标签字段，也不会被标签字段顺手删掉。
 */
const CONFLICT_TAG = "#due-date-conflict";

/** 标签集合是否相同（忽略 `#` 与前缀、忽略顺序） */
function sameTags(a: readonly string[], b: readonly string[]): boolean {
  const normalize = (list: readonly string[]): string =>
    list
      .map((tag) => tag.replace(/^#+/u, "").toLowerCase())
      .sort()
      .join("\n");
  return normalize(a) === normalize(b);
}

/**
 * 任务在笔记里只占一行，所以换行与连续空白并成一个空格。
 *
 * 描述用两行文本域只是为了看着宽松、好改，不代表任务行能存多行 ——
 * 不并的话，写进笔记的会是一条断成两行的任务，解析器只认得出第一行。
 */
function oneLine(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

/**
 * 新建 / 编辑任务。
 *
 * 只在「拼出目标那一行」这件事上做判断，落盘全部交给 task-writer 的
 * 行级原子写入：从打开模态到点保存之间，笔记可能已被别的插件改过，
 * 拿着打开时的快照去写会覆盖别人的改动。
 */
export class TaskEditorModal extends Modal {
  private readonly isCreateMode: boolean;

  constructor(
    private readonly host: TaskEditorHost,
    private readonly task: ParsedTask | null,
    private readonly defaults: Partial<ParsedTask> = {},
  ) {
    super(host.app);
    this.isCreateMode = task === null;
  }

  onOpen(): void {
    this.contentEl.addClass("tm-modal");
    this.titleEl.setText(this.isCreateMode ? t("新建任务") : t("编辑任务"));

    const form = this.contentEl.createDiv({ cls: "tm-form" });
    const source = this.task;

    let description = this.isCreateMode ? "" : (source?.description ?? "");
    let priority: Priority = this.isCreateMode
      ? (this.defaults.priority ?? Priority.None)
      : (source?.priority ?? Priority.None);
    let startDate = this.isCreateMode ? (this.defaults.startDate ?? "") : (source?.startDate ?? "");
    let dueDate = this.isCreateMode ? (this.defaults.dueDate ?? "") : (source?.dueDate ?? "");
    let taskId = this.isCreateMode ? "" : (source?.taskId ?? "");
    let dependsOn = this.isCreateMode ? "" : (source?.dependsOn ?? "");
    // 冲突标记不进标签字段：它是冲突对话框的产物，列在这儿只会让人以为能随手删
    let tags = this.isCreateMode
      ? [...(this.defaults.tags ?? [])]
      : (source?.tags ?? []).filter((tag) => tag !== CONFLICT_TAG);

    new Setting(form)
      .setName(t("描述"))
      .setDesc(t("任务在笔记里只占一行，换行会被并成一个空格。"))
      .addTextArea((area) => {
        area.setPlaceholder(t("任务描述"));
        area.setValue(description);
        // 两行：够看清稍长的描述，又不至于把弹窗撑高
        area.inputEl.rows = 2;
        area.inputEl.addClass("tm-form__description");
        area.onChange((value) => {
          description = value;
        });
      });

    /*
     * 标签：输入框 + 「库里已经用过的标签」点选。
     *
     * 手打最容易打出「工作」与「工作项」这种并存变体，之后按标签筛就是两拨；
     * 候选值只来自库里**真正出现过的**标签，不预置、不猜。
     */
    addListFieldSetting(
      form,
      t("标签"),
      tags,
      (list) => {
        tags = list;
      },
      {
        desc: t("多个标签用逗号分隔；也可以点下面的已有标签。"),
        suggestions: this.knownTags(),
      },
    );

    new Setting(form).setName(t("优先级")).addDropdown((dropdown) => {
      for (const level of [
        Priority.None,
        Priority.Lowest,
        Priority.Low,
        Priority.Medium,
        Priority.High,
        Priority.Highest,
        Priority.Critical,
      ]) {
        dropdown.addOption(level, priorityLabel(level));
      }
      dropdown.setValue(priority).onChange((value) => {
        priority = value as Priority;
      });
    });

    new Setting(form).setName(t("开始日期")).addText((text) => {
      text.inputEl.type = "date";
      text.setValue(startDate).onChange((value) => {
        startDate = value;
      });
    });

    new Setting(form).setName(t("截止日期")).addText((text) => {
      text.inputEl.type = "date";
      text.setValue(dueDate).onChange((value) => {
        dueDate = value;
      });
    });

    let idText: TextComponent | null = null;
    new Setting(form)
      .setName(t("任务 ID"))
      .setDesc(t("用于被其他任务依赖"))
      .addText((text) => {
        idText = text;
        text.setValue(taskId).onChange((value) => {
          taskId = value.trim();
        });
      })
      .addButton((button) =>
        button.setButtonText("🎲").setTooltip(t("随机生成 ID")).onClick(() => {
          taskId = generateShortId();
          idText?.setValue(taskId);
        }),
      );

    new Setting(form).setName(t("依赖任务")).addDropdown((dropdown) => {
      dropdown.addOption("", t("不依赖"));
      for (const [id, label] of this.dependencyOptions(source?.taskId ?? "")) {
        dropdown.addOption(id, label);
      }
      dropdown.setValue(dependsOn).onChange((value) => {
        dependsOn = value;
      });
    });

    const buttons = this.contentEl.createDiv({ cls: "tm-modal__buttons" });
    new Setting(buttons)
      .addButton((button) => button.setButtonText(t("取消")).onClick(() => this.close()))
      .addButton((button) =>
        button
          .setButtonText(this.isCreateMode ? t("创建") : t("保存"))
          .setCta()
          .onClick(() => {
            void this.submit({
              description,
              priority,
              startDate,
              dueDate,
              taskId,
              dependsOn,
              tags,
            });
          }),
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }

  /**
   * 库里已经用过的标签，按出现次数排序，取前 40 个。
   *
   * 截断是有意的：候选排的价值在于「常用的那几个一眼就在」，把几百个标签全铺出来
   * 反而要在一堆长尾里找。想用的没在候选里，直接手打即可。
   */
  private knownTags(): string[] {
    const counts = new Map<string, number>();
    for (const task of this.host.tasks) {
      for (const tag of task.tags) {
        if (tag === CONFLICT_TAG) continue;
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 40)
      .map(([tag]) => tag);
  }

  /** 依赖候选：未完成、有 ID、且不是自己；按截止日由近到远 */
  private dependencyOptions(selfId: string): Array<[string, string]> {
    const options: Array<[string, string]> = [];
    const seen = new Set<string>();
    const candidates = this.host.tasks
      .filter(
        (task) =>
          task.displayStatus !== "completed"
          && task.displayStatus !== "cancelled"
          && Boolean(task.taskId)
          && task.taskId !== selfId,
      )
      .sort((a, b) => (a.dueDate ?? "9999-99-99").localeCompare(b.dueDate ?? "9999-99-99"));

    for (const candidate of candidates) {
      const id = candidate.taskId;
      if (id === undefined || seen.has(id)) continue;
      seen.add(id);
      const due = candidate.dueDate ? t("（截止 {date}）", { date: candidate.dueDate }) : "";
      options.push([id, `${id}${due}：${candidate.description.slice(0, 40)}`]);
    }
    return options;
  }

  // ────────────────────────────── 提交 ──────────────────────────────

  private async submit(updates: TaskEditorUpdates): Promise<void> {
    const startDate = updates.startDate ?? "";
    const dueDate = updates.dueDate ?? "";

    if (hasDateConflict(startDate, dueDate)) {
      const choice = await askDateConflict(this.host.app, startDate, dueDate);
      if (choice === "cancel") return;
      if (choice === "adjust-due") {
        updates.dueDate = todayIso();
        new Notice(t("已把截止日期调整为今天"));
      } else {
        updates.conflictTag = true;
      }
    }

    const saved = this.isCreateMode ? await this.createTask(updates) : await this.saveTask(updates);
    if (!saved) return;
    this.host.onSaved();
    this.close();
  }

  private async createTask(updates: TaskEditorUpdates): Promise<boolean> {
    const description = oneLine(updates.description ?? "");
    if (description.length === 0) {
      new Notice(t("请填写任务描述"));
      return false;
    }

    const target = await this.resolveTargetFile();
    if (target === null) return false;

    // 用 task-writer 的写入器拼行，格式与「编辑已有任务」完全一致
    let line = `- [ ] ${description}`;
    if (updates.priority !== undefined && updates.priority !== Priority.None) {
      line = setPriority(line, updates.priority);
    }
    if (updates.dueDate) line = setDateField(line, "📅", updates.dueDate);
    if (updates.startDate) line = setDateField(line, "🛫", updates.startDate);
    if (updates.taskId) line = setIdentifierField(line, "🆔", "id::", updates.taskId);
    if (updates.dependsOn) line = setIdentifierField(line, "⛔", "dependsOn::", updates.dependsOn);

    /*
     * 状态标签（从容器头「+」进来的）与用户填的标签一起写。
     *
     * 必须合并成一次 setTags：它会先剥掉行上所有标签再统一补回末尾，
     * 分成两次写的话，后一次会把前一次刚加的那个当旧标签删掉。
     */
    const stateTag =
      this.defaults.gtdState === "Waiting"
        ? "#waiting"
        : this.defaults.gtdState === "In Progress"
          ? "#doing"
          : "";
    const tags = [...(updates.tags ?? []), ...(stateTag.length > 0 ? [stateTag] : [])];
    if (tags.length > 0) line = setTags(line, tags);
    if (updates.conflictTag === true) line += ` ${CONFLICT_TAG}`;

    const heading = this.host.settings.newTaskTargetHeading;
    let failure: string | undefined;

    if (heading.length > 0) {
      const inserted = await editFileContent(this.host.app, target, (content) => {
        const result = insertLineUnderHeading(content, heading, line);
        if (!result.success) {
          failure = result.error;
          return null;
        }
        return result.content ?? null;
      });
      if (!inserted && failure !== undefined) {
        new Notice(t("无法添加任务：{reason}", { reason: failure }));
        return false;
      }
    } else {
      await editFileContent(this.host.app, target, (content) => appendLine(content, line));
    }

    new Notice(t("已添加到 {path}", { path: target.path }));
    return true;
  }

  /**
   * 落点笔记：配了路径模板就用它（**不存在时按模板新建**），没配就用当前打开的笔记。
   *
   * 「当日日志还没写」是常态而不是异常，所以这里走的是「缺了就建」，
   * 而不是提示用户先自己去建一篇 —— 新建任务本来就该是一步的事。
   */
  private async resolveTargetFile(): Promise<TFile | null> {
    // 从容器头「+」进来的：落点就是那个容器对应的笔记（列表按笔记分组时是那篇笔记，
    // GTD/象限容器不带这个字段，走下面设置里的落点）
    const explicit = this.isCreateMode ? this.defaults.filePath : undefined;
    if (explicit !== undefined && explicit.length > 0) {
      const file = this.host.app.vault.getAbstractFileByPath(explicit);
      if (file instanceof TFile) return file;
      // 笔记刚被删/改名：不在这里自作主张重建，落回设置里的路径更安全
    }

    const { newTaskTargetPath, newTaskTemplatePath } = this.host.settings;
    if (newTaskTargetPath.length > 0) {
      const path = resolvePlaceholders(newTaskTargetPath);
      try {
        return await ensureNote(this.host.app, path, { templatePath: newTaskTemplatePath });
      } catch {
        // 目录建不出来、同名文件已存在之类：说清是哪条路径失败，别让用户猜
        new Notice(t("无法创建目标笔记：{path}", { path }));
        return null;
      }
    }

    const active = this.host.app.workspace.getActiveFile();
    if (active === null || active.extension !== "md") {
      new Notice(t("请先在设置里指定目标笔记，或打开一个 Markdown 文件"));
      return null;
    }
    return active;
  }

  private async saveTask(updates: TaskEditorUpdates): Promise<boolean> {
    const task = this.task;
    if (task === null) return false;

    const description = oneLine(updates.description ?? "");
    if (description.length === 0) {
      new Notice(t("请填写任务描述"));
      return false;
    }

    const result = await editTaskLine(this.host.app, task, (line) => {
      let next = line;

      // 只改用户真的动过的字段，其余 token 连位置都不动 —— 别的任务插件
      // 与 git diff 都会因此保持稳定
      if (description !== task.description) next = replaceTaskDescription(next, description);
      /*
       * 标签变了才动它：没变就一个字符都不碰 —— 标签在行里的位置、写法保持原样，
       * 别的编辑器插的字也就不受影响。真变了则统一落到行尾（见 setTags 的说明）。
       */
      if (updates.tags !== undefined && !sameTags(updates.tags, task.tags)) {
        // 冲突标记归冲突对话框管，不归标签字段：重写标签时原样带上，别把它顺手删了
        const keepConflict = new RegExp(`${CONFLICT_TAG}\\b`, "iu").test(next);
        next = setTags(next, keepConflict ? [...updates.tags, CONFLICT_TAG] : updates.tags);
      }
      if (updates.priority !== undefined && updates.priority !== task.priority) {
        next = setPriority(next, updates.priority);
      }
      if (updates.dueDate !== undefined && updates.dueDate !== (task.dueDate ?? "")) {
        next = setDateField(next, "📅", updates.dueDate);
      }
      if (updates.startDate !== undefined && updates.startDate !== (task.startDate ?? "")) {
        next = setDateField(next, "🛫", updates.startDate);
      }
      if (updates.taskId !== undefined && updates.taskId !== (task.taskId ?? "")) {
        next = setIdentifierField(next, "🆔", "id::", updates.taskId);
      }
      if (updates.dependsOn !== undefined && updates.dependsOn !== (task.dependsOn ?? "")) {
        next = setIdentifierField(next, "⛔", "dependsOn::", updates.dependsOn);
      }
      if (updates.conflictTag === true && !/#due-date-conflict\b/iu.test(next)) {
        next = `${next} #due-date-conflict`;
      }

      if (next === line) return line;
      return compactLine(next);
    });

    if (result === "missing") {
      new Notice(t("在 {path}:{line} 找不到该任务行", { path: task.filePath, line: task.lineNumber }));
      return false;
    }
    if (result === "updated") new Notice(t("任务已更新"));
    return true;
  }
}


