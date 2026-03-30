# Changelog

## 0.1.12
- Improve: Eisenhower view now supports mobile-only quadrant collapse/expand by tapping the quadrant title, while desktop stays fully expanded

## 0.1.11
- New: Add global Start date and Due date filters with operators for exact match, range match, and empty/non-empty checks
- Improve: Date filter inputs now disable clearly when the selected condition does not need a date value

## 0.1.10
- Improve: Mobile layout for toolbar, GTD board, Eisenhower cards, calendar views, and edit modal without changing core task behavior

## 0.1.9
- Fix: Calendar `Summary` now excludes completed/cancelled tasks from `Due`, `Overdue`, `Start`, `Scheduled`, and `Recurrence` counts
- Fix: `Done` count in Calendar `Summary` remains accurate even when global `Include completed tasks` is disabled
- New: Calendar setting `First day of week` (`Monday` or `Sunday`)
- Change: Calendar week view layout now places weekends (`Sat`, `Sun`) on a separate bottom row when weekend display is enabled
- Improve: Calendar visual style refreshed (toolbar, cards, summary popup, task chips, responsive behavior)
- Fix: `Today` highlight now has higher priority than weekend styling (including when today is Saturday/Sunday)

## 0.1.8
- New: Matrix view quick move buttons on task cards (`Move to 1/2/3/4`)
- New: GTD view quick move buttons on task cards (`Move to I/P/W`)
- New: List view folder groups can now be collapsed/expanded when `Group by folder` is enabled
- Change: Plugin display name updated to `Task Matrix`

## 0.1.7
- Fix: GTD view drag-and-drop from Inbox to In Progress now works correctly for tasks with start dates
- Fix: Tasks with start date = today now correctly show as "Open" instead of "To be Started"
- Fix: Timezone issue in date comparison causing wrong task status display
- New: Date conflict detection when start date > due date
  - Shows warning modal when dragging tasks or editing dates
  - Prevents invalid date combinations
- New: Multiple scan folders support in settings (comma-separated)
- New: Start date display on task cards
- Fix: Properly exclude tasks inside code blocks using Obsidian's metadata cache

## 0.1.6
- Improved: Enhanced GTD view classification with additional tags
  - In Progress: Now recognizes `#started`, `#doing`, `#active` tags
  - Waiting: Now recognizes `#waiting`, `#delegated`, `#blocked` tags

## 0.1.5
- Fix: Resolved duplicate emoji issue when dragging tasks between quadrants
  - Due date emoji (📅) was sometimes left behind when removing dates, causing `📅 📅 2026-03-12` patterns
- New: Added 🔺 (Critical) priority level
  - Higher priority than ⏫ (Highest)
  - Critical tasks are treated as Important in Eisenhower Matrix
- Fix: Task edit modal dropdown menu height increased for better text visibility

## 0.1.4
- New: Urgent days range 设置 (1-7天)
  - 默认 1 = 只有今天和逾期算 urgent
  - 可调至 7 = 未来7天内到期都算 urgent
- New: Track completion date setting
  - When enabled, completing a task adds `✅ yyyy-mm-dd` to the task line
  - Reopening a task removes the completion date
- New: 任务编辑器的 Depends On 改为下拉列表
  - 显示所有未完成且有任务ID的任务
  - 按 Due Date 由近到远排序
  - 显示任务ID、截止日期和描述预览

## 0.1.3
- New: List view folder grouping with configurable depth
- New: Date picker in task editor for Due Date and Start Date
- New: Task creation settings with target note path and heading
  - Support date templates (YYYY, MM, DD) in target path
  - Insert tasks under specific heading
  - Error handling when target note or heading not found
- Fix: Matrix view Q3 overdue tasks dragged to Q2 now correctly clear due date
- Fix: Properly exclude Dataview inline fields from task detection

## 0.1.2
- Fix: Prevent duplicate tags when editing tasks
- New: Add "+" button in GTD and Matrix column headers to create tasks
- New: Auto-fill preset values when adding tasks to specific columns/quadrants
  - GTD In Progress: sets start date to today
  - GTD Waiting: adds #waiting tag
  - Matrix Q1: sets high priority + due date to today
  - Matrix Q2: sets high priority
  - Matrix Q3: sets low priority + due date to today
  - Matrix Q4: sets lowest priority

## 0.1.1
- GTD: Cancelled tasks now appear in Done
- GTD: Hide Done column when "Include Completed" is off
- GTD: Overdue tasks are visible in GTD view

## 0.1.0
- Initial release
- List, GTD, and Eisenhower views
- Task editing and drag-drop
- Dependency tracking
- Settings panel
