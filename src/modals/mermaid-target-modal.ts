import { App, FuzzySuggestModal, TFile } from "obsidian";
import { t } from "../i18n";

/**
 * 「写入笔记」的目标选择。
 *
 * 用官方 `FuzzySuggestModal` 而不是自组列表：键盘导航、输入法、模糊匹配都由宿主保证。
 * 候选是全部 Markdown 笔记 —— 落点通常是一篇「总览」性质的笔记，与任务所在目录无关，
 * 所以不预设默认值，交给模糊搜索。
 */
export class MermaidTargetModal extends FuzzySuggestModal<TFile> {
  constructor(
    app: App,
    private readonly onPick: (file: TFile) => void,
  ) {
    super(app);
    this.setPlaceholder(t("选择要写入 Mermaid 的笔记（其标记块内内容会被替换）"));
  }

  getItems(): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }

  getItemText(file: TFile): string {
    return file.path;
  }

  onChooseItem(file: TFile): void {
    this.onPick(file);
  }
}
