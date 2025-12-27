# Obsidian Task Matrix ⚡

A powerful, visual task management board designed for power users of **Obsidian**. Transform your plain-text Markdown task lists into a dynamic, bilingual task management system with three complementary views.

![Obsidian Matrix Preview](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## ✨ Features

- **🌐 Bilingual Support**: Full support for Chinese (简体中文) and English with instant switching
- **📋 List View**: Traditional task list with powerful multi-criteria sorting and manual drag-and-drop reordering
- **📥 GTD Flow**: Getting Things Done workflow with Inbox, In Progress, Waiting, and Done columns. Smart drag-and-drop automatically manages tags and dates
- **🔳 Eisenhower Matrix**: Time management matrix categorizing tasks by Importance and Urgency. Blocked tasks (unfinished dependencies) are automatically excluded for clarity
- **🔄 Cross-View Linking**: See GTD status badges in Eisenhower view and Eisenhower quadrant badges in GTD view for unified task awareness
- **🏷️ Smart Project Management**: Toggle project-related tasks to automatically add/remove `#project` tags
- **📊 Intelligent Task Detection**: Automatic detection of task states, priorities, urgency, and blocking conditions
- **📄 Obsidian Integration**: Seamlessly import and export tasks in Obsidian-compatible Markdown format with full metadata support
- **🔒 Privacy First**: All data is stored locally in your browser. No server, no tracking

## 🎯 Three View Modes

### 1. List View 📋
- View all tasks in a traditional list format
- **Multi-criteria sorting**: Sort by due date, priority, start date, scheduled date, or status with customizable direction
- **Manual ordering**: Drag and drop to create your own priority sequence
- **Status filtering**: View all, open, completed, or cancelled tasks

### 2. GTD Flow 📥
Getting Things Done methodology with four stages:

- **Inbox (收件箱)**: Newly collected tasks waiting to be processed
- **In Progress (进行中)**: Tasks with `#started/#doing/#active` tags, or reached start/scheduled date
- **Waiting (等待中)**: Tasks with `#waiting/#delegated/#blocked` tags, or unfinished dependencies
- **Done (已完成)**: Completed or cancelled tasks

**Smart Drag-and-Drop:**
- Drag to **In Progress** → Auto-sets start date to today, removes waiting tags
- Drag to **Waiting** → Auto-adds `#waiting` tag
- Drag to **Inbox** → Removes all state tags and dates
- Drag to **Done** → Marks as completed with done date
- **Blocked tasks** (with unfinished dependencies) cannot be dragged out of Waiting column

### 3. Eisenhower Matrix 🔳
Time management matrix with automatic classification:

| Quadrant | Detection Rules | Classification |
|----------|----------------|----------------|
| **Q1** (Important & Urgent) | High priority + Due within 3 days | Do it now |
| **Q2** (Important & Not Urgent) | High priority + No urgent deadline | Schedule it |
| **Q3** (Not Important & Urgent) | Low/No priority + Due within 3 days | Delegate or quick task |
| **Q4** (Not Important & Not Urgent) | Low/No priority + No urgent deadline | Delete or postpone |

**Note:** Blocked tasks (with unfinished `dependsOn`) are excluded from all quadrants for clarity.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/luna-jmy/ObsidianTaskMatrix.git
   cd ObsidianTaskMatrix
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 🛠️ Tech Stack

- **Framework**: [React](https://reactjs.org/) (Vite)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Icons**: [Lucide React](https://lucide.dev/) / SVG

## 📝 Markdown Format Support

The app parses standard Obsidian/Tasks plugin formats:

```markdown
- [ ] Task Description 📅 2025-01-01 ⏫ 🆔 task-1 #project
- [/] In Progress Task 💼
- [-] Cancelled Task ❌
- [x] Completed Task ✅ 2025-01-01
```

**Supported Metadata:**
- **Priority**: `⏫` (High), `🔼` (Medium), `🔽` (Low)
- **Dates**: `📅` (Due date), `📆` (Scheduled date), `⏳` (Start date), `✅` (Done date)
- **Task ID**: `🆔 task-id` (for dependencies)
- **Dependencies**: `🆔 dependent-on-task-id`
- **Status Tags**: `#waiting`, `#delegated`, `#blocked`, `#project`
- **Progress**: `[/]` (In Progress), `[-]` (Cancelled)

## 📱 Known Limitations

- **Drag & Drop**: HTML5 Drag and Drop API is not supported on touch devices (phones, tablets, iPads). Drag-and-drop features require a mouse or trackpad. Touch devices can still use all other features like creating, editing, and viewing tasks.

## 🤝 Contributing

Feel free to open issues or submit pull requests to help improve the project!

## 📄 License

MIT License
