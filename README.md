# Obsidian Task Matrix ⚡

A powerful, visual task management board designed for power users of **Obsidian**. Transform your plain-text Markdown task lists into a dynamic, bilingual Eisenhower Matrix or GTD Flow board.

![Obsidian Matrix Preview](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## ✨ Features

- **🌐 Bilingual Support**: Full support for Chinese (简体中文) and English. Includes automatic language detection and preference persistence.
- **🔳 Eisenhower Matrix (Time Management)**: Categorize tasks by Importance and Urgency. renamed to "时间管理矩阵" in Chinese for better clarity.
- **📥 GTD Flow**: Visualize your Getting Things Done workflow with Inbox, In Progress, Waiting, and Done columns.
- **📱 Fully Responsive**: Optimized for desktop and mobile, with dedicated touch-friendly controls.
- **🖱️ Manual Reordering**: Drag and drop tasks in the List View to create your own priority sequence.
- **📄 Obsidian Integration**: Seamlessly import and export tasks in Obsidian-compatible Markdown format. Supports metadata like `📅 2024-12-25`, `⏫ High`, and `🆔 task-1`.
- **🔒 Privacy First**: All data is stored locally in your browser storage. No server, no tracking.

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

The app parses standard Obsidian Task formats:
- `- [ ] Task Description 📅 2025-01-01 ⏫ #project`
- `- [/] In Progress Task`
- `- [-] Cancelled Task`

## 🤝 Contributing

Feel free to open issues or submit pull requests to help improve the project!

## 📄 License

MIT License
