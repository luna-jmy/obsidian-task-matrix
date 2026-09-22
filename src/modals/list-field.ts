import { Setting, TextComponent } from "obsidian";
import { t } from "../i18n";

/**
 * 多值字段（标签）：输入框 + 一排「库里已经用过的值」点选。
 *
 * 与 Project Master 的同名字段同一套做法（那个插件的 `suggestion-fields.ts`）：
 * 输入框能自由写，下面那排点一下追加、再点移除。抽出来是因为候选值这套交互
 * 一旦有两处实现，两边的选中态迟早会走岔。
 *
 * 为什么不用 `<datalist>`：它匹配的是**整个输入串**，而这里存的是逗号分隔的多个值，
 * 从第二个值开始就永远匹配不上 —— 多值只能用点选。
 */

/** 「点一下」的语义：已有 → 移除，没有 → 追加（纯函数，写反了会变成「点一下追加出两个」） */
export function toggleListValue(list: readonly string[], value: string): string[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

/** 输入框 → 列表。值里不能有空格和逗号（标签、状态枚举都是这样） */
export function parseListInput(value: string): string[] {
  return value
    .split(/[,，\s]+/u)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function formatListInput(list: readonly string[]): string {
  return list.join(", ");
}

export interface ListFieldOptions {
  desc?: string;
  /** 已有值候选；空数组 = 退化成纯输入框 */
  suggestions?: readonly string[];
}

export function addListFieldSetting(
  host: HTMLElement,
  name: string,
  initial: readonly string[],
  assign: (value: string[]) => void,
  options: ListFieldOptions = {},
): void {
  let current = [...initial];
  let text: TextComponent | null = null;

  new Setting(host)
    .setName(name)
    .setDesc(options.desc ?? t("多个值用逗号分隔"))
    .addText((component) => {
      text = component;
      component.setValue(formatListInput(initial));
      component.onChange((value) => {
        current = parseListInput(value);
        assign(current);
        renderChips();
      });
    });

  const suggestions = options.suggestions ?? [];
  if (suggestions.length === 0) return;

  // 挂在 setting 之后的**独立一块**（不塞进 setting 的行里）：那一行是「标题 | 输入框」
  // 的两列布局，多塞一个子节点只会被挤在同一行
  const chips = host.createDiv({ cls: "tm-value-chips" });
  const renderChips = (): void => {
    chips.empty();
    for (const value of suggestions) {
      const selected = current.includes(value);
      const chip = chips.createEl("button", {
        cls: `tm-value-chip${selected ? " is-active" : ""}`,
        text: value,
        attr: { type: "button", title: selected ? t("点一下移除") : t("点一下追加") },
      });
      // Modal 不是 Component：这些节点随弹窗关闭时的 contentEl.empty() 一起销毁
      chip.addEventListener("click", () => {
        current = toggleListValue(current, value);
        assign(current);
        // 回写输入框：用户看得见自己选了什么，还能接着手改
        text?.setValue(formatListInput(current));
        renderChips();
      });
    }
  };
  renderChips();
}
