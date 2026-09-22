import { t } from "../i18n";
import { GanttGrouping } from "../types";
import { GanttZoom } from "./time-scale";

/**
 * 甘特工具栏上那两个下拉的档位与文案。
 *
 * 单独放一个文件而不是留在面板里：控件挂在主工具栏上（甘特图模式下才显示），
 * 面板只负责画时间轴，两边都要用的档位表就落在这儿，避免各写一份。
 */
export const GANTT_GROUPINGS: readonly GanttGrouping[] = [
  "none",
  "folder",
  "note",
  "gtd",
  "quadrant",
];

/**
 * 甘特这块主区里的两个页签。
 *
 * 时间轴与 Mermaid 预览是同一份数据的两种呈现（预览由当前时间轴的状态生成），
 * 所以放在同一块主区里做成页签，而不是两个顶级模式 —— 后者会让人以为
 * 「预览」是另一套数据。
 */
export type GanttView = "gantt" | "mermaid";

export const GANTT_VIEWS: readonly GanttView[] = ["gantt", "mermaid"];

export function ganttViewLabel(view: GanttView): string {
  return view === "mermaid" ? t("Mermaid 预览") : t("甘特");
}

export function ganttGroupingLabel(grouping: GanttGrouping): string {
  switch (grouping) {
    case "folder":
      return t("按文件夹分组");
    case "note":
      return t("按笔记分组");
    case "gtd":
      return t("按 GTD 状态分组");
    case "quadrant":
      return t("按矩阵象限分组");
    default:
      return t("不分组");
  }
}

export function ganttZoomLabel(zoom: GanttZoom): string {
  switch (zoom) {
    case "week":
      return t("周");
    case "month":
      return t("月");
    case "year":
      return t("年");
    default:
      return t("日");
  }
}
