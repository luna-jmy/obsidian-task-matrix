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
} from "../parser/task-writer";
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

    new Setting(form).setName(t("描述")).addText((text) =>
      text
        .setPlaceholder(t("任务描述"))
        .setValue(description)
        .onChange((value) => {
          description = value;
        }),
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
            void this.submit({ description, priority, startDate, dueDate, taskId, dependsOn });
          }),
      );
  }

  onClose(): void {
    this.contentEl.empty();
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
    const description = updates.description?.trim() ?? "";
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

    // 从容器头「+」进来的：带上那个容器的状态
    if (this.defaults.gtdState === "Waiting") line += " #waiting";
    else if (this.defaults.gtdState === "In Progress") line += " #doing";
    if (updates.conflictTag === true) line += " #due-date-conflict";

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

    const description = updates.description?.trim() ?? "";
    if (description.length === 0) {
      new Notice(t("请填写任务描述"));
      return false;
    }

    const result = await editTaskLine(this.host.app, task, (line) => {
      let next = line;

      // 只改用户真的动过的字段，其余 token 连位置都不动 —— 别的任务插件
      // 与 git diff 都会因此保持稳定
      if (description !== task.description) next = replaceTaskDescription(next, description);
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


