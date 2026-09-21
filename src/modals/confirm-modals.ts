import { App, ButtonComponent, Modal } from "obsidian";
import { t } from "../i18n";
import { ConflictResolution } from "../services/task-actions";

/**
 * 两个确认模态。
 *
 * 对外只暴露 Promise 形式（`askDateConflict` / `askDeleteTask`），
 * 调用方写起来是 `await`，不必再套一层回调 —— 回调套回调最容易出
 * 「点了取消但外层已经把改动写下去了」这类错。
 *
 * 不使用 `window.confirm`：原生对话框会阻塞主线程，且样式与主题无关。
 */

class DateConflictModal extends Modal {
  private answered = false;

  constructor(
    app: App,
    private readonly startDate: string,
    private readonly dueDate: string,
    private readonly settle: (result: ConflictResolution) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.addClass("tm-modal");
    this.titleEl.setText(t("日期冲突"));
    const message = this.contentEl.createEl("p", { cls: "tm-modal__message" });
    message.setText(
      t("开始日期（{start}）晚于截止日期（{due}）。", { start: this.startDate, due: this.dueDate }),
    );
    this.contentEl.createEl("p", {
      cls: "tm-modal__message",
      text: t("要把截止日期调整到今天，还是保留原日期并标记为冲突？"),
    });

    const buttons = this.contentEl.createDiv({ cls: "tm-modal__buttons" });
    new ButtonComponent(buttons).setButtonText(t("取消")).onClick(() => this.close());
    new ButtonComponent(buttons)
      .setButtonText(t("标记冲突"))
      .onClick(() => this.answer("mark-conflict"));
    new ButtonComponent(buttons)
      .setButtonText(t("调整截止日期"))
      .setCta()
      .onClick(() => this.answer("adjust-due"));
  }

  onClose(): void {
    this.contentEl.empty();
    // 直接关掉（点遮罩、按 Esc）= 取消，外层不必再判一次
    if (!this.answered) this.settle("cancel");
  }

  private answer(result: ConflictResolution): void {
    this.answered = true;
    this.settle(result);
    this.close();
  }
}

class DeleteTaskModal extends Modal {
  private answered = false;

  constructor(
    app: App,
    private readonly description: string,
    private readonly settle: (confirmed: boolean) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.addClass("tm-modal");
    this.titleEl.setText(t("删除任务"));
    this.contentEl.createEl("p", {
      cls: "tm-modal__message",
      text: t("确定要删除「{description}」吗？这一行会从笔记里移除。", { description: this.description }),
    });

    const buttons = this.contentEl.createDiv({ cls: "tm-modal__buttons" });
    new ButtonComponent(buttons).setButtonText(t("取消")).onClick(() => this.close());
    new ButtonComponent(buttons)
      .setButtonText(t("删除"))
      .setWarning()
      .onClick(() => {
        this.answered = true;
        this.settle(true);
        this.close();
      });
  }

  onClose(): void {
    this.contentEl.empty();
    if (!this.answered) this.settle(false);
  }
}

/** 询问日期冲突的处理方式；关闭模态 = 取消 */
export function askDateConflict(app: App, startDate: string, dueDate: string): Promise<ConflictResolution> {
  return new Promise((resolve) => {
    new DateConflictModal(app, startDate, dueDate, resolve).open();
  });
}

/** 询问是否删除任务；关闭模态 = 不删除 */
export function askDeleteTask(app: App, description: string): Promise<boolean> {
  return new Promise((resolve) => {
    new DeleteTaskModal(app, description, resolve).open();
  });
}
