# Obsidian Task Matrix ⚡

Visual task dashboards with list, GTD, and Eisenhower views.

## ✨ Features

### 🔄 Three Complementary Views

| View | Best For | Key Benefit |
|------|----------|-------------|
| **📋 List View** | Comprehensive task overview | Search and browse all tasks |
| **📥 GTD Flow** | Workflow management | Visual Kanban with Inbox → In Progress → Waiting → Done |
| **🔳 Eisenhower Matrix** | Priority decisions | Urgency vs. importance at a glance |
| **🗓 Calendar View** | Date planning | Review due, start, scheduled, and done tasks by month, week, or list |

### 🎯 Core Capabilities

- **Visual Task Dashboard**: See all your vault's tasks in one place
- **Smart Task Parsing**: Supports standard Obsidian task formats including:
  - Task status: `- [ ]`, `- [/]`, `- [-]`, `- [x]`
  - Priorities: `⏫` (Highest), `🔼` (High), `🔽` (Low), `⏬` (Lowest)
  - Dates: `📅` Due, `🛫` Start, `⏳` Scheduled, `✅` Done, `➕` Created
  - Task IDs: `🆔` for dependency tracking
  - Dependencies: `⛔` indicates a task is blocked by another
  - Tags: Any `#tag` including `#waiting`, `#doing`, `#blocked`

### 🧠 Smart Automation

- **Auto GTD Classification**: Tasks are automatically categorized based on status, tags, and dates
- **Eisenhower Quadrants**: Auto-sorted by priority and due date urgency
- **Configurable Urgent Range**: Set how many days count as "urgent" (1-7 days)
- **Dependency Tracking**: Blocked tasks (with unfinished dependencies) are visually marked
- **Drag & Drop**: Move tasks between GTD columns or Eisenhower quadrants to auto-update tags
- **Quick Move Buttons**: Move tasks directly between GTD states or Eisenhower quadrants from the task card
- **Date Conflict Detection**: Warns when a start date is later than a due date

### 🔍 Filtering & Navigation

- **Keyword Search**: Filter tasks by description, file path, task ID, or dependency ID
- **Date Filters**: Filter by `Start date` and `Due date` with `on`, `before`, `after`, `is empty`, `is not empty`, and more
- **Calendar Summary**: See scoped counts for due, overdue, start, scheduled, recurrence, and daily-note tasks
- **Calendar Modes**: Switch between month, week, and list layouts

### 🎛️ Task Actions

Each task card provides quick actions:
- ✓ Complete/Uncomplete (optionally adds `✅ YYYY-MM-DD` when completing)
- ▶ Start (set to in-progress)
- ✕ Cancel
- ✎ Edit (modify description, priority, dates, ID, dependencies)
- 🗑 Delete
- Click to open task in file

### 📁 List View Features

- **Folder Grouping**: Group tasks by folder with configurable depth (1-5 levels)
- **Expand/Collapse Groups**: Toggle individual groups or expand/collapse all with one click
- **Refreshed Styling**: List groups now use a cleaner card style aligned with the calendar list view

### 📱 Mobile Experience

- **Responsive Toolbar & Cards**: Better spacing and stacking for small screens
- **Swipe-Friendly GTD Board**: Horizontal column navigation on mobile
- **Mobile Matrix Collapse**: Collapse Eisenhower quadrants by tapping the title on mobile only
- **Responsive Calendar Layouts**: Improved month, week, and list browsing on smaller screens

### ⚙️ Settings

- **Scan Folder**: Limit task indexing to a specific vault folder
- **Default View**: Choose which view opens first (List/GTD/Eisenhower)
- **Open Location**: Open in sidebar or new tab
- **Include Completed**: Toggle visibility of completed/cancelled tasks
- **Completion/Cancelled Markers**: Customize checkbox markers for task states
- **Track Completion Date**: Auto-add `✅ YYYY-MM-DD` when completing tasks
- **Urgent Days Range**: Set urgent threshold (1-7 days, default 1 = today only)

#### List View Settings
- **Group by Folder**: Enable folder grouping
- **Grouping Depth**: How many folder levels to group by (1-5)

#### New Task Settings
- **Target Note Path**: Default location for new tasks (supports `YYYY`, `MM`, `DD` templates)
- **Target Heading**: Insert new tasks under a specific heading

## 📥 Installation

### Using BRAT (Recommended for Beta Versions)

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin in Obsidian
2. Open BRAT settings and click "Add Beta plugin"
3. Enter: `luna-jmy/obsidian-task-matrix`
4. Click "Add Plugin" and enable it in Community Plugins

### From GitHub Releases

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create a folder named `task-matrix` under your vault's `.obsidian/plugins/`
3. Put the downloaded files into that folder
3. Enable "Task Matrix" in Obsidian Settings → Community Plugins

### From Source

```bash
git clone https://github.com/luna-jmy/obsidian-task-matrix.git
cd obsidian-task-matrix/obsidian-task-matrix-plugin
npm install
npm run build
```

Copy the `obsidian-task-matrix-plugin` folder to your vault's `.obsidian/plugins/` directory.

## 🚀 Usage

### Opening the Task Matrix

- Click the **kanban icon** in the left ribbon
- Use the command palette: "Open task matrix"
- Set a hotkey for the "Open task matrix" command

### Creating Tasks

Create tasks in any markdown file using standard Obsidian syntax:

```markdown
- [ ] Review quarterly goals 📅 2025-03-15 🔼
- [/] Write blog post #doing 🛫 2025-03-10
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
| `- [/]` | In progress |
| `- [-]` | Cancelled |
| `- [x]` | Completed |
| `⏫` | Highest priority |
| `🔼` | High priority |
| `🔽` | Low priority |
| `⏬` | Lowest priority |
| `📅 YYYY-MM-DD` | Due date |
| `🛫 YYYY-MM-DD` | Start date |
| `⏳ YYYY-MM-DD` | Scheduled date |
| `🆔 task-id` | Task identifier |
| `⛔ task-id` | Depends on task |
| `✅ YYYY-MM-DD` | Completion date (auto-added when "Track completion date" is enabled) |

### Drag & Drop

- **GTD View**: Drag tasks between columns to update their state
  - To "In Progress": Adds `#doing` tag
  - To "Waiting": Adds `#waiting` tag
  - To "Done": Marks as completed

- **Eisenhower View**: Drag tasks between quadrants to adjust priority and urgency
  - To Q1 (Important + Urgent): Sets high priority, adds due date
  - To Q2 (Important + Not Urgent): Sets high priority, clears due date
  - To Q3 (Urgent + Lower importance): Sets low priority, adds due date
  - To Q4 (Delegated or discard): Sets lowest priority, clears due date

### Date Filters

Use the `Date Filters` control in the toolbar to narrow tasks by:

- `Start date`
- `Due date`

Supported operators:

- `not on`
- `on`
- `before`
- `on or before`
- `after`
- `on or after`
- `is empty`
- `is not empty`

## 🏗️ Tech Stack

- **Obsidian API**: Plugin framework
- **TypeScript**: Type-safe development
- **esbuild**: Fast bundling

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 📣 Official Account

Follow my WeChat official account:

![WeChat Official Account QR](assets/qr-official.jpg)

## 📄 License

[MIT License](LICENSE)

## 🤝 Contributing

Contributions welcome! Please open issues or submit pull requests.
