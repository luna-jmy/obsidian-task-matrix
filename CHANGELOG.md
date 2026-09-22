# Changelog

## 1.1.0
- New: **Hide filters** in the toolbar collapses the filter area so more tasks fit on screen (expanded by default, and it is session state — reopening the view shows it again; the filters themselves are never reset)
- Fix: The days label on Gantt bars looked doubled — its halo was drawn in `--background-primary`, which is white in a light theme, so white text got a white outline that smeared the strokes. It now uses a translucent black halo and a semibold weight, the same combination Project Master uses
- Fix: The exported Mermaid wrote `excludes weekends` on a line of its own, which mermaid silently drops as soon as another `excludes` line follows (last one wins) — weekend marking and public holidays now share a single `excludes weekends,<dates>` line
- New: **Jump to today** in the Gantt toolbar scrolls the timeline back to today after panning or zooming, without re-rendering (it also works from the Mermaid preview tab)
- New: **Days on bars** setting with three modes — do not show, calendar days (inclusive), or workdays, where workdays reuse the same calendar as the shaded columns and the exported `excludes` / `includes` (weekends when enabled, public holidays, make-up workdays)
- Fix: The Gantt timeline could open at the earliest date and refuse to scroll — the tab shell allowed the wide canvas to stretch the whole main area, so the scroll container's visible width equalled its content. It now shrinks properly, lands on today as soon as its width is known, and the timeline can be panned by dragging it
- New: Tag chips under the description — click one to write the tag into the description, click it again to take it out. Candidates come from the tags actually used in your vault (most used first, plus this task's own), so tags rarely need typing
- New: **Export SVG** and **Export JPG** on the Mermaid preview tab save the diagram itself (vector, or a 2x bitmap with a theme-aware background) into your Obsidian attachment folder, with a timestamped name, so overlapping exports never overwrite each other; the path is copied to the clipboard
- New: **Public holiday schedule** settings page — keep holidays and make-up workdays per year (`10-01~10-07`, ranges may cross into the next year). Whatever the Gantt spans is applied automatically, and the shaded columns in the timeline and the exported `excludes` / `includes` lines come from the same source, so a working Saturday is never shaded
- New: The Mermaid preview adds two date fields for one-off holidays and make-up workdays, and the settings tab shows where they live
- Change: Tags are edited right in the description, where they already live in the note — the separate tags field (and its suggestion list) is gone. The tag set is still pulled out of the text on save and rewritten only when it changed
- New: The Gantt's task column is resizable — drag the divider, use the arrow keys on it, or set the width in the settings; the width is remembered and never squeezes the timeline out of view
- New: Every Gantt task row has a `✎` button, so editing does not require right-clicking a bar (which still works, along with keyboard access to the button)
- New: The Gantt area has a **Mermaid preview** tab next to the timeline. The diagram is generated from the current Gantt state (filters, grouping and collapsed sections included), so it cannot drift from what you see: there is no code box to edit, and collapsed sections are excluded
- New: **Export code** copies the Mermaid to the clipboard; **Write to note** replaces the block between the markers in a note you pick (configurable, `%% task-matrix:start %%` / `%% task-matrix:end %%` by default), appending it when the note has no markers yet. Today line and weekend marking are toggled on the preview tab and saved with the settings
- New: Mermaid export settings — diagram title and the two markers used by **Write to note**
- Fix: The complete and cancel buttons on a task card did nothing — the checkbox writer looked for the checkbox after already consuming it, so the line came back unchanged
- Fix: Dragging a task to Inbox could leave it in In progress: a start date in the past still counts as "started", so the drop clears it (configurable)
- Fix: Dragging to Q2/Q4 deleted any due date; now only a date that would make the task land in an urgent quadrant is cleared
- Fix: Scan folders accept multi-level paths (`300 Resources/360 WorkMemos`), full-width commas or semicolons between entries, and are matched case-insensitively
- Fix: Tag matching is whole-token, so `#waiting` no longer matches `#waiting-for-review`
- New: **GTD and matrix** settings page, split into classification (which column or quadrant a task falls in) and dragging (what a drop writes): the tag lists, the start-date rules, urgent days, and each quadrant's importance and urgency
- New: One master switch for dragging — turning it off stops containers accepting drops and cards being draggable, without touching the quick-move buttons or the Gantt context menu
- Change: Urgent days moved from View preferences to the GTD and matrix page, next to the quadrant rules it feeds
- Change: The GTD/matrix start-date switches and the quadrant date dropdown are gone — they were rules, not parameters. Dragging to In progress always adds a start date of today, dragging to Inbox always clears it, and the settings page states both rules instead of offering combinations that break classification or dragging
- Change: Quadrant importance dropdowns only offer their own side's levels (high and above for Q1/Q2, medium and below for Q3/Q4), so a drop can never push a task into the other half
- Change: Drag-related settings are disabled while dragging is switched off
- Change: Folder grouping (the Note list's sections and the Gantt's folder sections) is named after the full path of your scan folders instead of a truncated top-level folder; the folder-depth setting is gone, and everything below a scan folder stays in its section

## 1.0.0
- New: Interface rebuilt to match the Project Master layout — one toolbar row, one filter and search row, then the panel grid
- New: List, GTD and Matrix views render as equally sized containers holding task cards
- Change: The List view is now the Note list — one container per note, and with **Group by folder** those containers sit under collapsible folder sections; same task cards as GTD and Matrix, just shorter, with the note path not repeated on the cards and no dragging between containers
- Change: The `+` in a note container adds the task to that note rather than to the default target
- New: Filter bar with search, status chips, start and due date ranges, sorting, a live `shown/total` count and a clear button
- New: Gantt view — a read-only timeline with day, week, month and year scales, weekend shading, a today marker, duration labels, milestones and critical tasks, grouped by folder, GTD state, quadrant, or not at all
- New: Bar colours are configurable — one colour per Mermaid Gantt state: `active` (open tasks), `done` (completed), `crit` (marked with 🔺) and other
- New: The Gantt can group sections by note — one section per note, named after it and ordered by path
- New: Right-click a Gantt bar to edit the task or open its note
- New: The task editor has a tags field — a list field with the tags already used in your vault as clickable candidates; only the tag set is rewritten, and only when it changed
- Change: The task editor's description is a two-line field, so longer descriptions are easier to read and edit
- Fix: The task editor no longer stretches to nearly the full window width when many tag candidates are shown
- New: The Gantt parses task fields with its own rules: `🛫` / `⏳` (start, with `⏳` as fallback), `📅`, `🆔`, `⛔`, Dataview-style `[start:: …]` fields, `🔺` for critical tasks and `🚩` / `#milestone` for milestones
- New: The settings page is split into tabs — General, New tasks, View preferences, and Calendar and Gantt
- New: New tasks go to today's journal by default (`500 Journal/{{date:YYYY-MM-DD}}`); when that note does not exist yet it is created from a template note you pick in the settings, and the folders along the way are created too. The path and template support `{{title}}`, `{{date}}`, `{{time}}` and `{{date:FORMAT}}`, while `<% … %>` commands are left to Templater (optional)
- New: Marker filter — pick the brackets content (`[ ]`, `[x]`, `[-]`, or anything else you use) from the values that actually appear in your vault
- New: Hovering a calendar entry shows an instant tooltip; the core page-preview delay no longer applies
- Fix: A task past its due date is labelled “overdue” on the due date itself, not “due”
- Change: Expand all and collapse all merged into one button that shows what it will do
- Change: The view opens in panel mode; a single **Gantt mode** button switches the main area to the timeline and brings the Gantt's controls (time scale, grouping) into the toolbar, so they are no longer visible when they would do nothing
- New: Chinese and English interface; follows the Obsidian language by default and can be pinned in the settings
- Change: Calendar view keeps its own month, week and list layouts instead of containers
- Change: All CSS classes use the `tm-` prefix; the `task-matrix-*` and `task-matrix-calendar-*` classes are gone
- Change: Source split into `parser/`, `services/`, `panels/`, `modals/`, `views/` and `i18n/`; `main.ts` is now a thin assembly layer
- Change: i18n coverage is verified on every build (`npm run check:i18n`)
- Fix: Plugin and ribbon icon falls back through a candidate list, so a missing icon name no longer leaves a blank slot

## 0.2.6
- Change: New installations scan `500 Journal` and `100 Projects` by default instead of the whole vault, so the first index pass stays fast; clear the field to scan everything
- Change: Task edits are written through `Vault.process`, so concurrent changes from other plugins or Obsidian Sync are no longer overwritten
- Fix: Line endings and trailing newlines are preserved, so editing a task no longer rewrites the whole note
- Fix: Task edits are matched by content as well as line number, so a stale index can no longer touch the wrong line
- Fix: Nested task indentation is kept when moving tasks between GTD columns or Eisenhower quadrants
- Fix: Editing a task only rewrites the fields you changed, keeping the original inline field order
- Fix: Completion dates use the local date instead of UTC
- Fix: Markdown rendering inside task cards releases its listeners on every refresh
- Change: The task index is built after the workspace is ready instead of blocking plugin startup
- Change: Views only re-render when the task list actually changed
- Change: Calendar CSS classes use the `task-matrix-` prefix to avoid clashing with other plugins and themes
- Change: Settings names and descriptions use sentence case

## 0.2.5
- Fix: Remove global CommonJS runtime injection from the bundled plugin to avoid breaking Excalidraw package loading
- Fix: Skip `.excalidraw.md` files during automatic task refresh to reduce interference with Excalidraw saves

## 0.2.4
- New: Add completed tasks toggle button to main toolbar
- New: Add global collapse/expand toggle for List, GTD, and Matrix views
- Fix: Matrix grid no longer stretches when quadrants are collapsed

## 0.2.3
- Fix: Calendar view shows task description instead of file path in hover tooltip
- Fix: Calendar view no longer duplicates start and due entries when they fall on the same day
- Fix: Calendar process items no longer include the due date

## 0.2.2
- Fix: Completed tasks in Calendar view now appear only once, preferring done date and falling back to due date

## 0.2.1
- Fix: Calendar view no longer shows cancelled tasks

## 0.2.0
- New: Add `Exclude markers` setting to ignore custom checkbox markers such as `- [I]` from task views and statistics
- New: Add completed-task display controls for showing completed tasks without due dates and limiting completed tasks by completion/due date range
- New: Add List view setting to show or hide cancelled tasks, hidden by default
- Change: GTD view now shows Inbox, In progress, Waiting, and Done columns only
- Fix: GTD Done column now counts only completion markers and excludes cancelled markers

## 0.1.18
- New: Add `Due date display range` setting to hide tasks due farther than the selected number of months while keeping overdue, completed, and cancelled tasks visible
- New: Add `Hide future start tasks` setting to hide tasks whose start date is more than one month away
- Fix: Edit task dropdown arrows no longer tile across the select field

## 0.1.16
- New: Eisenhower Matrix columns now support collapse/expand on desktop (previously mobile-only)
- New: GTD view columns now support collapse/expand on both desktop and mobile
- Fix: Collapsed Eisenhower quadrants on mobile no longer leave excessive empty space
- Fix: GTD and Matrix collapse no longer resets scroll position (toggles CSS classes in-place instead of re-rendering)
- Change: Mobile GTD view uses vertical single-column layout instead of horizontal scroll

## 0.1.15
- Fix: Clearing due date, start date, task ID, and depends-on in the edit modal now works correctly
- Improve: Start date field now appears above due date in the edit modal
- Improve: Calendar settings reorganized into its own section after List settings
- Improve: Calendar settings reordered with "first day of week" as the first option

## 0.1.14
- Fix: Align plugin description in repository manifest and release assets for marketplace validation

## 0.1.13
- Improve: List view now supports one-click expand/collapse for grouped folders
- Improve: List view visual style refreshed to match the calendar list look more closely

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
