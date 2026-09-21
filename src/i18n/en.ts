/**
 * English UI text.
 *
 * Keys are the Chinese source strings, character for character (punctuation and
 * placeholders included). Workflow for a new string: write `t("中文原文")` in the
 * source, then add its English line here. Missing entries are caught by
 * `npm run check:i18n`, which scans the sources instead of trusting memory.
 */
export const EN: Record<string, string> = {
  // ── toolbar / modes ──────────────────────────────────────────────
  "任务矩阵": "Task matrix",
  "新建任务": "New task",
  "刷新": "Refresh",
  "重新扫描任务": "Rescan tasks",
  "打开任务矩阵": "Open task matrix",
  "列表": "List",
  "矩阵": "Matrix",
  "日历": "Calendar",
  "GTD": "GTD",
  "全部展开": "Expand all",
  "全部收起": "Collapse all",

  // ── filter bar ───────────────────────────────────────────────────
  "状态": "Status",
  "状态预设": "Status presets",
  "全部状态": "All statuses",
  "只看未完成": "Active only",
  "隐藏已取消": "Hide cancelled",
  "标记": "Marker",
  "方括号内容是 {marker} 的任务": "Tasks whose brackets contain {marker}",
  "搜索": "Search",
  "任务描述、文件、ID": "Description, file or ID",
  "开始日期": "Start date",
  "截止日期": "Due date",
  "按开始日期筛选": "Filter by start date",
  "按截止日期筛选": "Filter by due date",
  "区间起始日期": "Range start date",
  "区间结束日期": "Range end date",
  "不限": "Any time",
  "今天": "Today",
  "本周": "This week",
  "本月": "This month",
  "本年": "This year",
  "自定义区间": "Custom range",
  "排序": "Sort",
  "排序方式": "Sort mode",
  "截止日 ↑": "Due ↑",
  "截止日 ↓": "Due ↓",
  "开始日 ↑": "Start ↑",
  "优先级": "Priority",
  "文件名": "File name",
  "清除筛选": "Clear filters",
  "清除全部筛选条件，显示所有任务": "Clear every filter and show all tasks",
  "{shown}/{total} 个任务": "{shown}/{total} tasks",

  // ── task status ──────────────────────────────────────────────────
  "未开始": "Open",
  "待开始": "To be started",
  "进行中": "In progress",
  "已逾期": "Overdue",
  "已完成": "Completed",
  "已取消": "Cancelled",

  // ── priority levels ──────────────────────────────────────────────
  "紧急": "Critical",
  "最高": "Highest",
  "高": "High",
  "中": "Medium",
  "低": "Low",
  "最低": "Lowest",
  "无": "None",

  // ── containers ───────────────────────────────────────────────────
  "全部任务": "All tasks",
  "根目录": "Vault root",
  "收件箱": "Inbox",
  "等待中": "Waiting",
  "重要且紧急": "Important and urgent",
  "重要不紧急": "Important, not urgent",
  "紧急不重要": "Urgent, not important",
  "不重要不紧急": "Not important, not urgent",
  "暂无任务": "No tasks",
  "没有符合当前筛选条件的任务": "No tasks match the current filters",
  "正在建立任务索引…": "Building the task index…",
  "索引在 Obsidian 布局就绪后开始，大库需要一点时间。":
    "Indexing starts once Obsidian has finished loading; a large vault takes a moment.",
  "{count} 个任务": "{count} tasks",
  "在此容器新建任务": "New task in this container",

  // ── cards ────────────────────────────────────────────────────────
  "无描述": "No description",
  "优先级 {level}": "Priority {level}",
  "截止 {date}": "Due {date}",
  "开始 {date}": "Start {date}",
  "ID {id}": "ID {id}",
  "被 {id} 阻塞": "Blocked by {id}",
  "依赖 {id} 已完成": "Depends on {id} (done)",
  "日期冲突": "Date conflict",
  "完成": "Done",
  "重新打开": "Reopen",
  "开始": "Start",
  "取消": "Cancel",
  "编辑": "Edit",
  "删除": "Delete",
  "移动到": "Move to",
  "移动到 {quadrant}": "Move to {quadrant}",
  "移动到「{state}」": "Move to {state}",
  "已移动到 {quadrant}": "Moved to {quadrant}",
  "已移动到「{state}」": "Moved to {state}",
  "任务已完成": "Task completed",
  "已重新打开": "Task reopened",
  "任务已取消": "Task cancelled",
  "任务已开始": "Task started",
  "任务已删除": "Task deleted",
  "任务已更新": "Task updated",
  "已刷新：{count} 个任务": "Refreshed: {count} tasks",

  // ── calendar ─────────────────────────────────────────────────────
  "月": "Month",
  "周": "Week",
  "汇总": "Summary",
  "截止": "Due",
  "计划": "Scheduled",
  "逾期": "Overdue",
  "无任务": "No tasks",
  "还有 {count} 项": "{count} more",
  "已完成：{done}/{total}": "Done: {done}/{total}",
  "截止：{count}": "Due: {count}",
  "逾期：{count}": "Overdue: {count}",
  "开始：{count}": "Start: {count}",
  "计划：{count}": "Scheduled: {count}",
  "重复：{count}": "Recurring: {count}",
  "日记：{count}": "Daily notes: {count}",
  "周一": "Mon",
  "周二": "Tue",
  "周三": "Wed",
  "周四": "Thu",
  "周五": "Fri",
  "周六": "Sat",
  "周日": "Sun",

  // ── gantt ────────────────────────────────────────────────────────
  "甘特": "Gantt",
  "时间粒度": "Time scale",
  "分组依据": "Group by",
  "日": "Day",
  "年": "Year",
  "不分组": "No grouping",
  "按 GTD 状态分组": "Group by GTD state",
  "按矩阵象限分组": "Group by quadrant",
  "未命名任务": "Untitled task",
  "里程碑": "Milestone",
  "关键": "Critical",
  "缺日期": "Missing dates",
  "起止日期不完整，图上那一段是推导出来的":
    "Start or due date is missing, so the span shown is inferred",
  "{count} 天": "{count} days",
  "{count} 个没有日期": "{count} without dates",
  "{name}：{start} 至 {end}，{days} 天": "{name}: {start} to {end}, {days} days",
  "没有可显示的任务（需要至少一个开始日或截止日）":
    "No tasks to show (each needs a start or due date)",

  // ── settings: tabs ───────────────────────────────────────────────
  "通用": "General",
  "扫描范围、界面语言与任务标记的写法。改动会触发一次全库重新索引。":
    "Scan scope, interface language and how task markers are written. Changing these rebuilds the index.",
  "新建任务落到哪篇笔记、用哪个模板、插到哪个标题下。":
    "Where new tasks go, which template to use, and which heading they are inserted under.",
  "视图偏好": "View preferences",
  "打开视图时的默认状态，以及面板模式铺出哪些任务。":
    "What the view looks like when it opens, and which tasks the panel modes show.",
  "日历与甘特": "Calendar and Gantt",
  "日历与甘特各自的显示口径和配色，互不影响。":
    "Display settings and colours for the calendar and the Gantt, which do not affect each other.",
  "甘特图模式": "Gantt mode",
  "退出甘特图模式": "Exit Gantt mode",

  // ── settings: journal template ───────────────────────────────────
  "日志模板": "Journal template",
  "模板笔记路径": "Template note path",
  "目标笔记不存在时，用这篇笔记的内容新建。填 vault 相对路径，扩展名可省略；留空则新建空白笔记。":
    "Used to create the target note when it does not exist yet. Enter a vault-relative path; the extension is optional. Leave empty to create a blank note.",
  "模板": "Templates",
  "目标笔记路径与模板里可用的占位符": "Placeholders available in the path and the template",
  "{{title}} 是新笔记的文件名，{{date}} 与 {{time}} 是当前日期与时间，也可以写成 {{date:YYYY-MM-DD}} 指定格式；未识别的占位符原样保留。":
    "{{title}} is the new note's file name, {{date}} and {{time}} are the current date and time, and {{date:YYYY-MM-DD}} picks a format. Unrecognised placeholders are kept as they are.",
  "新建任务的落点，默认写到当日日志；笔记不存在时会自动新建。留空表示写进当前打开的笔记。":
    "Where new tasks go. The default writes to today's journal, creating the note if needed. Leave empty to use the note you have open.",
  "找不到模板笔记：{path}（已按空白笔记创建）":
    "Template note not found: {path} (created a blank note instead)",
  "模板命令未全部执行，笔记已按模板原文创建；可稍后执行一次模板命令重跑":
    "Some template commands did not run. The note was created from the template as written; run the template command again later if needed.",
  "无法创建目标笔记：{path}": "Could not create the target note: {path}",

  // ── settings: gantt colours ──────────────────────────────────────
  "甘特视图": "Gantt view",
  "甘特条配色": "Bar colours",
  "按 Mermaid 甘特的四种状态配色。颜色可写 var(--color-blue) 或颜色名；点下面的色块即改。":
    "One colour per Mermaid Gantt state. Values can be var(--color-blue) or a colour name; click a swatch to change one.",
  "关键任务": "Critical tasks",
  "带 🔺 或 #crit 标记的任务；优先级最高，同时已完成也按这一色显示。":
    "Tasks marked 🔺 or #crit. Takes precedence, so a critical task keeps this colour even when completed.",
  "其他状态": "Other states",
  "既非关键也非已完成、且起止日期不完整（图上那一段是推导值）的任务。":
    "Tasks that are neither critical nor completed and are missing a date, so the span shown is inferred.",
  "未完成、且起止日期完整的任务。": "Tasks that are still open and have both dates.",
  "已完成的任务（勾选框为 x）。": "Tasks whose checkbox is ticked.",
  "默认：{value}": "Default: {value}",
  "红": "Red",
  "橙": "Orange",
  "黄": "Yellow",
  "绿": "Green",
  "青": "Cyan",
  "蓝": "Blue",
  "紫": "Purple",
  "粉": "Pink",

  // ── task editor ──────────────────────────────────────────────────
  "编辑任务": "Edit task",
  "描述": "Description",
  "任务描述": "Task description",
  "任务 ID": "Task ID",
  "用于被其他任务依赖": "Used by other tasks as a dependency",
  "随机生成 ID": "Generate a random ID",
  "依赖任务": "Depends on",
  "不依赖": "No dependency",
  "（截止 {date}）": "(due {date})",
  "创建": "Create",
  "保存": "Save",
  "请填写任务描述": "Enter a task description",
  "找不到文件：{path}": "File not found: {path}",
  "请先在设置里指定目标笔记，或打开一个 Markdown 文件":
    "Set a target note in the settings, or open a Markdown file first",
  "已添加到 {path}": "Added to {path}",
  "无法添加任务：{reason}": "Cannot add the task: {reason}",
  "找不到标题「{heading}」": "Heading \"{heading}\" not found",
  "标题格式不合法": "Invalid heading format",
  "在 {path}:{line} 找不到该任务行": "Task line not found in {path}:{line}",

  // ── confirm dialogs ──────────────────────────────────────────────
  "开始日期（{start}）晚于截止日期（{due}）。":
    "The start date ({start}) is later than the due date ({due}).",
  "要把截止日期调整到今天，还是保留原日期并标记为冲突？":
    "Adjust the due date to today, or keep it and mark the conflict?",
  "调整截止日期": "Adjust due date",
  "标记冲突": "Mark as conflicting",
  "已把截止日期调整为今天": "Due date adjusted to today",
  "删除任务": "Delete task",
  "确定要删除「{description}」吗？这一行会从笔记里移除。":
    "Delete \"{description}\"? The line is removed from the note.",

  // ── settings: interface / scanning ───────────────────────────────
  "界面": "Interface",
  "界面语言": "Interface language",
  "自动": "Automatic",
  "中文": "中文",
  "自动跟随 Obsidian 的界面语言。": "Follow the Obsidian interface language.",
  "扫描范围": "Scanning",
  "扫描目录": "Scan folders",
  "用英文逗号分隔多个目录。留空表示扫描整个仓库（大库会很慢）。当前默认：{folders}":
    "Comma separated folders to scan. Leave empty to scan the whole vault (slow on large vaults). Current default: {folders}",
  "排除目录": "Excluded folders",
  "用英文逗号分隔多个目录，其下的任务不参与统计。":
    "Comma separated folders whose tasks are left out of every view.",

  // ── settings: markers ────────────────────────────────────────────
  "任务标记": "Task markers",
  "已完成标记": "Completion markers",
  "方括号里的内容，逗号分隔。默认 x 与 X。": "Checkbox contents, comma separated. Defaults to x and X.",
  "已取消标记": "Cancelled markers",
  "方括号里的内容，逗号分隔。默认短横线。":
    "Checkbox contents, comma separated. Defaults to a hyphen.",
  "忽略标记": "Ignored markers",
  "带这些标记的任务不进视图也不进统计，逗号分隔。":
    "Tasks with these markers are skipped in views and counts, comma separated.",
  "自动记录完成日期": "Track completion date",
  "勾选完成时自动补上完成标记与当天日期，重新打开时移除。":
    "Adds the completion marker and today's date when you complete a task, and removes it when you reopen.",

  // ── settings: display ────────────────────────────────────────────
  "显示": "Display",
  "默认视图": "Default view",
  "打开时先显示哪一种面板。": "Which panel to show first.",
  "打开位置": "Open location",
  "右侧边栏": "Right sidebar",
  "新标签页": "New tab",
  "面板打开在右侧边栏还是新标签页。": "Open the panel in the right sidebar or a new tab.",
  "紧急天数": "Urgent window",
  "距今多少天内有截止日的任务算紧急，矩阵据此划入紧急象限。":
    "How many days ahead counts as urgent. Tasks due within it land in the urgent quadrants.",
  "截止日显示范围": "Due date range",
  "只铺出这么多月内到期的任务，逾期与已完成的始终显示。0 表示不限制。":
    "Only show tasks due within this many months. Overdue and completed tasks always show. 0 means no limit.",
  "隐藏远期开始的任务": "Hide tasks that start far ahead",
  "开始日在 1 个月之后的先不铺出来。": "Hide tasks that start more than one month away.",
  "铺出无截止日的已完成任务": "Show completed tasks without a due date",
  "关闭时，已完成任务要有完成日或截止日才会显示。":
    "When off, a completed task needs a completion or due date to show.",
  "已完成任务的显示范围": "Completed task range",
  "只铺出这么多月内完成的已完成任务，0 表示不限制。":
    "Only show tasks completed within this many months. 0 means no limit.",
  "排序档位说明": "Sort options",
  "排序在筛选栏里随时可改，可选：{modes}":
    "Sorting can be changed from the filter bar at any time: {modes}",

  // ── settings: new tasks ──────────────────────────────────────────
  "目标笔记路径": "Target note path",
  "目标标题": "Target heading",
  "把新任务插到哪个标题下（要带上井号）。留空表示追加到文末。":
    "Heading to insert new tasks under (include the #). Leave empty to append at the end of the note.",

  // ── settings: list ───────────────────────────────────────────────
  "列表视图": "List view",
  "按文件夹分组": "Group by folder",
  "按笔记分组": "Group by note",
  "列表视图里按所在文件夹划分容器。": "Split list view containers by folder.",
  "分组层级": "Folder depth",
  "取文件路径的前几层作为容器名。": "How many leading folders to use as the container name.",
  "归档, 模板": "Archive, Templates",

  // ── settings: calendar ───────────────────────────────────────────
  "日历视图": "Calendar view",
  "每周第一天": "First day of week",
  "决定日历里一周从哪天排起。": "Which day a calendar week starts on.",
  "月视图显示周末": "Show weekends in month view",
  "关闭后只列工作日。": "When off, only weekdays are shown.",
  "周视图显示周末": "Show weekends in week view",
  "开启后周末单独排在下方一行。": "When on, weekends move to their own row below.",
  "列表视图显示整月": "Show the whole month in list view",
  "关闭后只列出有任务的日期。": "When off, only dates with tasks are listed.",
  "铺开进行中的任务": "Spread in-progress tasks",
  "同时有开始日与截止日的任务，会在起止之间的每一天都出现。":
    "Tasks with both a start and a due date appear on every day in between.",
};
