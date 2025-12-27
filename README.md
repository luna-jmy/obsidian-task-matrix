# Obsidian Task Matrix ⚡

A powerful, visual task management board designed for power users of **Obsidian**. Transform your plain-text Markdown task lists into a dynamic, bilingual task management system with three complementary views.

![Obsidian Matrix Preview](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 💡 Why Obsidian Task Matrix?

**Obsidian Task Matrix** bridges the gap between plain-text task management and visual productivity tools. While Obsidian excels at knowledge management, managing tasks through plain text alone can be overwhelming as your task list grows. This tool brings your tasks to life with three powerful, interconnected views—without ever leaving the Obsidian ecosystem.

**Perfect for:**
- Obsidian power users who want better task visualization
- GTD practitioners looking for visual workflow management
- Productivity enthusiasts who need both structure (Eisenhower) and flexibility (GTD)
- Teams managing complex projects with task dependencies
- Bilingual users (English/中文) working across contexts

## ✨ Features

### 🔄 Three Interconnected Views
Switch seamlessly between three complementary productivity frameworks:

| View | Best For | Key Benefit |
|------|----------|-------------|
| **📋 List View** | Comprehensive task overview | Multi-criteria sorting + manual prioritization |
| **📥 GTD Flow** | Workflow management | Visual progress tracking with smart automation |
| **🔳 Eisenhower Matrix** | Priority decisions | Urgency vs. importance at a glance |

### 🧠 Intelligence & Automation
- **Smart Task Detection**: Automatically identifies task states, priorities, urgency, and blocking conditions
- **Intelligent Drag-and-Drop**: Moving tasks between GTD columns auto-updates tags, dates, and status
- **Dependency Awareness**: Blocked tasks are visually indicated and protected from accidental moves
- **Cross-View Badges**: See GTD status in Eisenhower view, and Eisenhower quadrants in GTD view—never lose context

### 🌐 Bilingual by Design
- Full Chinese (简体中文) and English interface
- Instant language switching without losing data
- Context-aware translations for productivity terminology

### 🎯 Productivity Enhancements
- **Multi-Criteria Sorting**: Sort tasks by due date, priority, start date, scheduled date, or status—combine multiple criteria for custom ordering
- **Project Management**: Toggle `#project` tag with a single checkbox
- **Status Filtering**: Quickly view open, completed, or cancelled tasks
- **Hover Tooltips**: ⓘ icons explain detection and classification rules for each quadrant/state

### 🔒 Privacy & Portability
- **100% Local Storage**: All data stays in your browser—no accounts, no servers, no tracking
- **Markdown-Native**: Export your tasks back to Obsidian with full metadata preserved
- **Zero Lock-In**: Your data remains in standard Markdown format—always accessible

## 🌟 Product Highlights

### 1. Smart GTD Automation
Unlike basic kanban boards, Obsidian Task Matrix understands GTD semantics:
- Drag a task to **In Progress** → Start date auto-sets to today, waiting tags removed
- Drag to **Waiting** → `#waiting` tag added automatically
- Drag to **Inbox** → All state tags and dates cleared—fresh start
- Drag to **Done** → Marked complete with completion date

### 2. Intelligent Eisenhower Classification
Tasks are auto-classified using smart rules:
- **Urgency detection**: Due within 3 days = Urgent
- **Importance detection**: High priority = Important
- **Smart filtering**: Blocked tasks (unfinished dependencies) hidden to reduce noise
- **Visual clarity**: Color-coded quadrants for instant recognition

### 3. Dependency-Aware Workflow
- Tasks with unfinished `dependsOn` are marked as blocked
- Blocked tasks automatically appear in GTD Waiting column
- Protected from being dragged out of Waiting until dependency resolved
- Cross-view badges show blocking status everywhere

### 4. Obsidian-Native Integration
- Import tasks directly from Obsidian Markdown files
- Full support for [Obsidian Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) plugin format
- Export with all metadata: priorities, dates, tags, dependencies
- Maintain your plain-text workflow while gaining visual power

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
