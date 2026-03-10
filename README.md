# Obsidian Task Matrix ⚡

A powerful Obsidian plugin that transforms your Markdown tasks into visual task dashboards with List, GTD, and Eisenhower Matrix views.

## ✨ Features

### 🔄 Three Complementary Views

| View | Best For | Key Benefit |
|------|----------|-------------|
| **📋 List View** | Comprehensive task overview | Search and browse all tasks |
| **📥 GTD Flow** | Workflow management | Visual Kanban with Inbox → In Progress → Waiting → Done |
| **🔳 Eisenhower Matrix** | Priority decisions | Urgency vs. importance at a glance |

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
- **Dependency Tracking**: Blocked tasks (with unfinished dependencies) are visually marked
- **Drag & Drop**: Move tasks between GTD columns or Eisenhower quadrants to auto-update tags

### 🎛️ Task Actions

Each task card provides quick actions:
- ✓ Complete/Uncomplete
- ▶ Start (set to in-progress)
- ✕ Cancel
- ✎ Edit (modify description, priority, dates, ID, dependencies)
- 🗑 Delete
- Click to open task in file

### ⚙️ Settings

- **Scan Folder**: Limit task indexing to a specific vault folder
- **Default View**: Choose which view opens first (List/GTD/Eisenhower)
- **Include Completed**: Toggle visibility of completed/cancelled tasks

## 📥 Installation

### From GitHub Releases

1. Download the latest release `obsidian-task-matrix.zip`
2. Extract to your vault's `.obsidian/plugins/` folder
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
```

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

### Drag & Drop

- **GTD View**: Drag tasks between columns to update their state
  - To "In Progress": Adds `#doing` tag
  - To "Waiting": Adds `#waiting` tag
  - To "Done": Marks as completed

- **Eisenhower View**: Drag tasks between quadrants to adjust priority

## 🏗️ Tech Stack

- **Obsidian API**: Plugin framework
- **TypeScript**: Type-safe development
- **esbuild**: Fast bundling

## 📝 Changelog

### 0.1.1
- GTD: Cancelled tasks now appear in Done
- GTD: Hide Done column when "Include Completed" is off
- GTD: Overdue tasks are visible in GTD view

### 0.1.0
- Initial release
- List, GTD, and Eisenhower views
- Task editing and drag-drop
- Dependency tracking
- Settings panel

## 📄 License

MIT License

## 🤝 Contributing

Contributions welcome! Please open issues or submit pull requests.
