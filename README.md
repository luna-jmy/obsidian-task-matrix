# Obsidian Task Matrix ⚡

Visual task dashboards with list, GTD, Eisenhower, and calendar views.

## ✨ Features

### 🧭 Interface

The view is three rows, top to bottom:

1. **Toolbar** — new task, refresh, the four panel modes (List / GTD / Matrix / Calendar), a **Gantt mode** toggle, **Hide filters** (collapses the filter bar, which is expanded by default), and one expand/collapse button that shows what it will do next (it reads **Collapse all** only when every container is open). Clicking **Gantt mode** swaps the panel buttons for the Gantt's own controls (time scale and grouping); the button then reads **Exit Gantt mode**, and the panel mode you were on is remembered.
2. **Filter bar** — search, status chips, start and due date ranges, sorting, a live `shown/total` count, and a clear button.
3. **Main area** — equally sized containers holding task cards, so the grid stays symmetrical at any window width.

The interface ships in Chinese and English and follows the Obsidian language by default (Interface → Interface language).

### 🔄 Four Views

| View | Layout | Best for |
|------|--------|----------|
| **📋 Note list** | A container per note; with grouping on, those containers sit under collapsible folder sections | Browsing everything |
| **📥 GTD** | Four containers: Inbox, In progress, Waiting, Done | Working through a flow |
| **🔳 Matrix** | Four containers: Q1–Q4 | Deciding what matters |
| **🗓 Calendar** | Month, week or list | Planning by date |
| **📊 Gantt** | A timeline with day, week, month and year scales | Seeing how work spans time |

Hovering an entry in the calendar gives an instant tooltip with the task and the note it lives in — it does not wait for the page-preview delay.

### 📊 The Gantt view

The Gantt is a mode rather than a panel layout: the view opens in panel mode, and **Gantt mode** in the toolbar swaps the main area for the timeline and brings the Gantt's own controls (time scale and grouping) into the toolbar. Leaving it restores the panel mode you were on.

- Bar colours are configurable in the settings, one per Mermaid Gantt state: `active` for open tasks, `done` for completed ones, `crit` for tasks marked `🔺`, and a colour for everything else. Type any CSS colour (`var(--color-blue)`, a colour name) or click a swatch.
- **Mermaid preview**: the Gantt area has two tabs — the timeline and a **Mermaid preview**. The preview is generated from the current Gantt state (filters, grouping, collapsed sections), so it is never a second source of truth: there is no code box to edit, and collapsed sections are left out just like on screen. Its toolbar carries two toggles (today's line, weekend marking) and two date fields (extra holidays and make-up workdays), which recompute the preview as you type.
- **Export**: **Export code** copies the generated Mermaid to the clipboard; **Write to note** picks a note and replaces what sits between the markers configured in the settings (`%% task-matrix:start %%` … `%% task-matrix:end %%`), touching nothing else. When the note has no markers yet, the block is appended at the end.
- **Export SVG / Export JPG** save the diagram itself: SVG is vector (stays sharp, editable elsewhere), JPG is a 2x bitmap with a background that follows your theme (handy for chat and documents). Both land in your Obsidian attachment folder with a timestamped name, and the path is copied to the clipboard so you can find the file right away.
- **Public holidays** are kept per year in the settings (see below) and applied automatically to whatever the Gantt spans — so the shaded columns in the timeline and the exported `excludes` / `includes` lines always agree, and a working Saturday is never shaded.
- The task column is resizable: drag the divider between the column and the timeline, or focus it and use the arrow keys (`Shift` for bigger steps). The width is saved, can also be set in the settings, and never squeezes the timeline out of view.
- Every row in the task column carries a `✎` button, so editing a task no longer requires knowing about right-click. Right-clicking a bar still opens the same menu (edit / open note).
- The time axis opens scrolled to today (it waits until it can measure its own width, so this also works when the view is in the sidebar) and scrolls back to it whenever you re-enter Gantt mode. **Jump to today** in the toolbar brings it back after you have panned or zoomed away. Drag the timeline to pan it — no need to hunt for the scrollbar — and `Ctrl` + wheel zooms between day, week, month and year.
- **Right-click a bar** to edit the task or open its note (a left click opens the note, same as a card in the panel views).
- Sections group by folder, note, GTD state or quadrant — or turn grouping off for a single flat list. Grouping by note gives one section per note (named after the note, ordered by path), which keeps a note's tasks together even when they span several folders' worth of projects. Section keys for folder, GTD state and quadrant are shared with the panel views, so collapsing a section in the Gantt also collapses the matching container there.
- The left column lists tasks and follows the timeline's vertical scroll; clicking a task or its bar opens the note.
- A task with only one date still gets a bar: the missing end is inferred and drawn with a dashed orange outline, and the sidebar shows 「missing dates」.
- `🚩` / `#milestone` renders as a diamond, `🔺` / `#crit` gets a red outline, weekends are shaded, and today is a dashed red line.
- Tasks with no start and no due date cannot be placed on a timeline and are left out; the sidebar header reports how many, so nothing disappears silently.

The Gantt parses task lines with its own rules (start `🛫`, scheduling `⏳`, due `📅`, `🆔`, `⛔`, `🔺` for critical tasks, `🚩` / `#milestone` for milestones, plus the Dataview-style `[start:: …]`, `[due:: …]`, `[id:: …]` and `[dependsOn:: …]` forms):

```markdown
## Launch
### Design
- [ ] Wireframes 🛫 2026-09-20 📅 2026-09-30 🆔 design 🔺
- [ ] Copy review 📅 2026-09-26 ⛔ design
- [x] Kickoff 🚩 2026-09-18
```

### 🎯 Task cards

Each card shows the rendered description, a status badge, and chips for priority, dates, task ID and dependencies:

- ✓ Complete / ↺ Reopen (optionally adds `✅ YYYY-MM-DD`)
- ▶ Start (adds `🛫` and `#doing`)
- ✕ Cancel
- ✎ Edit — description (a two-line field, tags written straight into it, with clickable tag chips underneath), priority, dates, ID, dependency
- 🗑 Delete
- 1–4 and 收/进/等 quick moves in the Matrix and GTD views
- Click the card to open the note it lives in

A task whose `⛔` dependency is unfinished gets a red left border.

**The Note list uses the same task cards as GTD and Matrix** — complete, start, cancel, edit, delete all work — with two differences: the note path is not repeated on every card (the container is the note; with folder grouping the card shows just the note name), and cards cannot be dragged between containers (a list container is a place, not a status). With grouping on, the note containers sit under collapsible folder sections; the expand/collapse button in the toolbar covers sections and containers alike.

**Tags are written in the description**, exactly where they sit in the note — no separate tags field, so there is only one place to look. Underneath it sits a row of tag chips: click one to write it into the description, click it again to take it out. The chips come from the tags actually used in your vault (most used first, plus this task's own), so you rarely have to type one and the `#work` / `#work-items` variants stop piling up. On save the tag set is pulled out of the text and rewritten at the end of the line, and only when it actually changed; the rest of the line, including where the inline fields sit, stays as it was. If nothing changed, the line is not rewritten at all.

### 🧠 How tasks are classified

- **GTD** comes from tags (`#waiting`, `#doing`, `#blocked`), start dates and dependencies. An overdue task that never started falls back to Inbox rather than sitting in a column of its own.
- **Matrix** treats high priority and above as important, and anything due inside the configured urgent window (1–7 days) as urgent.
- **Scheduling** is only ever written as plain markdown: `📅` due, `🛫` start, `⏳` scheduled, `✅` done, `➕` created, `🆔` task ID, `⛔` dependency, plus your own `#tags`.

### 🔍 Filtering

- **Search** matches description, file path, task ID and dependency ID.
- **Status chips**: open, to be started, overdue, completed, cancelled — with `Active only` / `Hide cancelled` / `All statuses` presets.
- **Marker chips**: filter by what is actually inside the brackets (`[ ]`, `[x]`, `[-]`, `/`, or any custom marker you use). The candidates come from your vault, so an unused marker never shows up as a dead chip.
- **Start and due date**: a preset (today, this week, this month, this year, custom) plus an explicit range; editing either end switches to a custom range automatically.
- **Sort**: due ↑, due ↓, start ↑, priority, file name.
- The count shows how many of the indexed tasks survive the current filters, and **Clear filters** goes back to the neutral baseline — nothing filtered, everything shown.

### 📥 Drag and drop

- Drag a card onto a GTD container to change its state, or onto a Matrix container to change its quadrant.
- Dropping writes the same tags and dates the quick-move buttons write.
- Drag and drop is desktop only; on mobile use the quick-move buttons.

### 📱 Mobile

- The toolbar and filter bar wrap instead of overflowing.
- Containers fall back to a single column on narrow screens.
- Cards keep every action reachable by tap.

### ⚙️ Settings

Settings are grouped the same way the view is:

#### Interface
- **Interface language**: automatic, Chinese, or English

#### Scanning
- **Scan folders**: comma-separated folders to index, multi-level paths included (`300 Resources/360 WorkMemos`). Defaults to `500 Journal, 100 Projects`; clear the field to scan the whole vault (slow on large vaults). Full-width commas and semicolons separate entries too, and paths are matched case-insensitively
- **Excluded folders**: tasks here stay out of every view and count

#### Task markers
- **Completion markers** / **Cancelled markers**: what the brackets must contain
- **Ignored markers**: checkbox contents that are not tasks at all
- **Track completion date**: add `✅ YYYY-MM-DD` when a task is completed

#### Display
- **Default view**, **Open location**
- **Urgent window**: how many days ahead counts as urgent (1–7)
- **Due date range**, **Completed task range**, **Hide tasks that start far ahead**: how much gets laid out at once
- **Show completed tasks without a due date**

#### New tasks
- **Target note path**: where new tasks go, today's journal by default; supports `{{title}}`, `{{date}}`, `{{time}}` and `{{date:FORMAT}}`. The note is created when missing. Empty means the note you have open
- **Target heading**: insert under this heading; empty appends at the end of the note
- **Journal template**: the note to copy when the target note does not exist yet (`{{title}}` is its file name; `<% … %>` commands are left to Templater)

#### Note list
- **Group by folder**: off, one container per note (the `+` in the container header adds a task to that note); on, those containers sit under collapsible folder sections
- Section names use the **full path of your scan folders** — a sub-folder you added to the scan list (`300 Resources/360 WorkMemos`) becomes its own section, and everything below it stays in that section. Without scan folders, each note's own folder path is used

#### GTD and matrix

Split into two halves — what decides the column, and what a drop writes. Only the tag vocabulary and the urgent window are adjustable; the rules themselves are stated in the settings page rather than offered as switches, because a switch that breaks classification or dragging is not a parameter.

**Classification**
- **Waiting tags** and **In-progress tags**: the tags that decide which column a task falls in (and the first entry is what dragging a task there writes — one list for both, so a dropped task cannot bounce back to the column it came from)
- **Urgent days**: how far ahead counts as urgent, which decides the urgent side of the matrix
- The order of the rules is listed right there: a dependency or waiting tag → Waiting; an in-progress tag → In progress; due date passed → Overdue; start date passed → In progress; start date ahead → To be started (folded into Inbox); otherwise Inbox

**Dragging**
- **Enable dragging**: one master switch. Turn it off and containers stop accepting drops and cards cannot be dragged; the quick-move buttons on cards and the Gantt context menu keep working. Everything below is disabled while it is off
- **What a drop writes** is fixed and spelled out: the target column's status tag, the other column's tags removed, and the start date brought in line — In progress gets today, Inbox has it cleared (a start date left in the past would send the task back). Quadrants write their priority and make the due date match the urgent side: Q1/Q3 get today's date, Q2/Q4 lose one that would make them urgent
- **What each quadrant writes**: one dropdown per quadrant for **importance**, limited to that quadrant's own side — high and above for Q1/Q2, medium and below (or nothing) for Q3/Q4 — so no choice can push a task into the other half. Urgency has no task marker of its own, so it is expressed through the due date

#### Calendar view
- **First day of week**, weekends in the month and week views, whole month in the list view, and spreading in-progress tasks across their date range

#### Gantt view
- **Days on bars**: do not show, calendar days (inclusive), or workdays. Workdays reuse the same calendar as the shaded columns and the exported `excludes` / `includes`: calendar days − weekends (when weekend marking is on) − public holidays + make-up workdays. When a bar is too narrow the label moves to its right, and hovering a bar always reports both counts
- **Bar colours**: one colour per Mermaid Gantt state (`active`, `done`, `crit`, everything else), typed as any CSS colour or picked from the swatches
- **Task column width**: the width of the task column; it can also be dragged right in the Gantt
- **Diagram title** and **markers**: the `title` line of the exported code, and the two markers **Write to note** replaces between. The today line, weekend marking and the two date lists live on the preview tab, so they can be adjusted while looking at the diagram

#### Public holiday schedule
Kept per year, because that is how holidays are actually announced: add a year, then fill in **Holidays** (`10-01~10-07`, `~` or `至`, ranges may cross into the next year) and **Make-up workdays** (working weekends). Ranges are expanded to individual dates when exporting, which mermaid requires. Whatever the Gantt spans is applied automatically; the two date fields on the preview tab are only for one-off additions.

## 📥 Installation

### Using BRAT (Recommended for Beta Versions)

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin in Obsidian
2. Open BRAT settings and click "Add Beta plugin"
3. Enter: `luna-jmy/obsidian-task-matrix`
4. Click "Add Plugin" and enable it in Community plugins

### From GitHub Releases

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create a folder named `task-matrix-dashboard` under `.obsidian/plugins/` in your vault
3. Put the downloaded files into that folder
4. Enable "Task Matrix" in Obsidian settings → Community plugins

The folder name must match the plugin id `task-matrix-dashboard`, otherwise Obsidian will not load the plugin.

### From Source

```bash
git clone https://github.com/luna-jmy/obsidian-task-matrix.git
cd obsidian-task-matrix
npm install
npm run build
```

Copy `main.js`, `manifest.json`, and `styles.css` into `.obsidian/plugins/task-matrix-dashboard/` in your vault.

## 🚀 Usage

### Opening the Task Matrix

- Click the **kanban icon** in the left ribbon
- Use the command palette: "Open task matrix"
- Set a hotkey for the "Open task matrix" command

### Creating Tasks

Create tasks in any markdown file using standard Obsidian syntax:

```markdown
- [ ] Review quarterly goals 📅 2025-03-15 🔼
- [ ] Write blog post #doing 🛫 2025-03-10
- [ ] Waiting for feedback #waiting 🆔 task-123
- [ ] Implement feature ⛔ task-123
- [x] Completed task ✅ 2025-03-11
```

### Task Dependencies

When editing a task, the "Depends On" field shows a dropdown of all incomplete tasks that have a task ID, sorted by due date (nearest first). This makes it easy to set up task dependencies without remembering task IDs.

### Task Format Reference

| Symbol | Meaning |
|--------|---------|
| `- [ ]` | Open task |
| `- [x]` | Completed (changeable in the settings) |
| `- [-]` | Cancelled (changeable in the settings) |
| `🔺` | Critical priority |
| `⏫` | Highest priority |
| `🔼` | High priority |
| `🔽` | Low priority |
| `⏬` | Lowest priority |
| `📅 YYYY-MM-DD` | Due date |
| `🛫 YYYY-MM-DD` | Start date |
| `⏳ YYYY-MM-DD` | Scheduled date |
| `➕ YYYY-MM-DD` | Created date |
| `🆔 task-id` | Task identifier |
| `⛔ task-id` | Depends on task |
| `✅ YYYY-MM-DD` | Completion date (added when "Track completion date" is on) |

`- [/]` is not a status of its own: a task counts as in progress once it has a start date in the past or a `#doing` / `#active` / `#next` tag.

### Drag targets

**GTD containers**

- → In progress: adds `#doing` and a `🛫` start date of today
- → Waiting: adds `#waiting`
- → Done: writes the completion marker
- → Inbox: clears the flow tags

**Matrix containers**

- → Q1: high priority plus a due date of today
- → Q2: high priority, due date cleared
- → Q3: low priority plus a due date of today
- → Q4: lowest priority, due date cleared

If the write would leave a start date after its due date, a dialog asks whether to move the due date to today or to keep both and mark the task `#due-date-conflict`.

## 🏗️ Tech Stack

- **Obsidian API**: Plugin framework
- **TypeScript**: Type-safe development
- **esbuild**: Fast bundling
- **i18n**: Chinese source strings with an English dictionary, verified on every build by `npm run check:i18n`

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 🔒 Data and privacy

Task Matrix runs entirely inside your vault:

- No network requests, no telemetry, and no account or sign-in.
- It only reads and writes markdown files that already exist in your vault, and only the task line you act on.
- Settings are stored through Obsidian's plugin data API inside your vault's `.obsidian` folder.

## 📄 License

[MIT License](LICENSE)

## 🤝 Contributing

Contributions welcome! Please open issues or submit pull requests.
