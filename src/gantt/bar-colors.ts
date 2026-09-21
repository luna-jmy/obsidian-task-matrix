import { GanttBarColors } from "../types";
import { GanttRow } from "./gantt-model";

/**
 * 任务条配色：把一行任务归到四类 Mermaid 状态里的某一类。
 *
 * 为什么按状态配色而不是让用户逐条设颜色：任务矩阵的任务是笔记里的**一行文字**，
 * 没有地方存「这条是什么颜色」（Project Master 存的是 frontmatter 的 `color` 字段）。
 * 与其造一个新的行内字段，不如让颜色只表达状态 —— 四类颜色在设置里可改，
 * 既满足「想要自己的配色」，又不往用户的笔记里塞插件私有语法。
 *
 * 判定优先级：关键 > 已完成 > 其他 > 进行中。
 * 关键任务排最前是有意的：它同时是已完成时也该一眼看出它是关键任务。
 */
export function barColorKey(row: GanttRow): keyof GanttBarColors {
  const { task } = row;
  if (task.critical) return "crit";
  if (task.completed) return "done";
  if (row.startFallback || row.endFallback) return "fallback";
  return "active";
}

/**
 * 任务条的状态类名。
 *
 * **它不决定颜色**（颜色由 JS 内联写 `fill`）。留类名是为了在开发者工具里
 * 一眼看出某条是什么状态，别去样式表里找它的颜色。
 */
export function barClass(row: GanttRow): string {
  if (row.task.milestone) return "tm-gantt__bar--milestone";
  return `tm-gantt__bar--${barColorKey(row)}`;
}
