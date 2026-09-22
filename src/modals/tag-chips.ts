import { t } from "../i18n";
import { addTagToText, extractTags, removeTagFromText } from "../parser/task-parser";

/**
 * 标签 chips：点一下把标签写进描述正文，再点一下从正文里去掉。
 *
 * 与 Project Master 的「点一下追加 / 点一下移除」同一套手感，区别只有一个：
 * 这里改的是**描述正文**（标签在笔记里本来就住在正文），而不是某个独立的字段。
 * 于是选中态也不用另存一份 —— 它由正文现算，手打、粘贴、点选三条路进来的标签
 * 看到的都是同一个状态。
 */
export interface TagChipsOptions {
  /** 候选标签（带 `#`），例如库里出现过的那些 */
  suggestions: readonly string[];
  /** 取当前正文 */
  getText(): string;
  /** 写回正文（调用方负责同步输入框） */
  setText(value: string): void;
}

export interface TagChipsHandle {
  /** 正文变了之后重算选中态 */
  refresh(): void;
}

/** 标签是否已在正文里（忽略 `#` 与大小写） */
function hasTag(text: string, tag: string): boolean {
  const name = tag.replace(/^#+/u, "").toLowerCase();
  return extractTags(text).some((entry) => entry.replace(/^#+/u, "") === name);
}

export function addTagChips(host: HTMLElement, options: TagChipsOptions): TagChipsHandle {
  const chips = new Map<string, HTMLButtonElement>();

  if (options.suggestions.length === 0) {
    // 库里还没有任何标签：留一句话，免得用户以为这排东西坏了
    host.createSpan({ cls: "tm-tag-chips__empty", text: t("还没有用过的标签，直接在描述里写 #标签 即可。") });
    return { refresh: () => undefined };
  }

  host.createSpan({ cls: "tm-tag-chips__label", text: t("标签") });
  for (const tag of options.suggestions) {
    const button = host.createEl("button", {
      cls: "tm-tag-chips__chip",
      text: tag,
      attr: { type: "button", "aria-pressed": "false" },
    });
    chips.set(tag, button);
    button.addEventListener("click", () => {
      const text = options.getText();
      options.setText(hasTag(text, tag) ? removeTagFromText(text, tag) : addTagToText(text, tag));
      refresh();
    });
  }

  function refresh(): void {
    const text = options.getText();
    for (const [tag, button] of chips) {
      const active = hasTag(text, tag);
      button.toggleClass("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("title", active ? t("点一下从描述里去掉") : t("点一下加到描述里"));
    }
  }

  refresh();
  return { refresh };
}
