/**
 * 视图/ribbon 图标的选择。
 *
 * 写死一个图标名是有风险的：名字在宿主里不存在时侧栏会出现空白占位，
 * 而不同 Obsidian 版本内置的图标集并不完全一致。这里按候选链挑第一个
 * **当前环境真的注册过**的名字，全都不认时退回第一个候选。
 */
export const ICON_CANDIDATES: readonly string[] = [
  "square-kanban",
  "kanban",
  "list-checks",
  "list-todo",
  "layout-list",
];

/** 从候选里挑一个可用图标；`iconIds` 取自 `getIconIds()` */
export function pickViewIcon(
  iconIds: readonly string[],
  candidates: readonly string[] = ICON_CANDIDATES,
): string {
  const available = new Set(iconIds.map((id) => id.replace(/^lucide-/u, "")));
  return candidates.find((name) => available.has(name)) ?? candidates[0] ?? "list-checks";
}
