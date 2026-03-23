# AGENTS.md

This file provides guidance to coding agents working with code in this repository.

## Project Overview

Obsidian Task Matrix is an Obsidian plugin that provides visual task dashboards with three views: List, GTD (Kanban), and Eisenhower Matrix. It parses markdown tasks with emoji notation and provides drag-and-drop task management.

## Build Commands

```bash
# Development build with watch mode
npm run dev

# Production build (includes TypeScript type checking)
npm run build

# Version bump (updates versions.json and stages manifest.json)
npm run version
```

The build outputs `main.js` to the repository root. During development, the plugin folder should be symlinked or copied to `.obsidian/plugins/obsidian-task-matrix/` in a test vault.

## Architecture

### File Structure

- `src/main.ts` - Main plugin class (~1000+ lines), contains all UI rendering, event handling, and Obsidian integration
- `src/types.ts` - Type definitions, enums, and default settings
- `src/task-parser.ts` - Task parsing logic from markdown lines

### Key Architecture Patterns

**Single-File UI Architecture**: All view rendering is contained in `main.ts` within the `TaskMatrixView` class. Each view mode (list/gtd/eisenhower) has its own rendering method (`renderListView`, `renderGtdView`, `renderEisenhowerView`).

**Task Identity**: Tasks are identified by a composite key `${filePath}:${lineNumber}:${description}`. Line numbers are critical for locating and updating tasks in files.

**Task Parsing**: Uses regex patterns in `task-parser.ts` to extract emoji markers (📅 due date, 🛫 start date, ⏫ priority, etc.) from markdown task lines.

**Debounced Refresh**: File changes trigger a 2-second debounced refresh (`scheduleRefresh`) to batch rapid changes. The refresh re-parses all markdown files in the configured scan folder.

**Drag and Drop**: Native HTML5 drag-and-drop with `dragstart`/`dragover`/`drop` events. Dropping updates tags or status via `updateTaskContent` which rewrites the entire markdown line.

**Settings Storage**: Uses Obsidian's `Plugin.loadData()`/`saveData()` for settings. Default settings are in `types.ts`.

**Modal-Based Editing**: Task creation/editing uses Obsidian's `Modal` class with programmatic form fields (TextComponent, ToggleComponent, DropdownComponent), not React.

### Important Implementation Details

**No Native Confirm Dialogs**: Per `.agent/workflows/no-native-confirm.md`, use custom modals instead of `window.confirm()`. The codebase already follows this pattern with `EditTaskModal` and similar classes.

**Checkbox Status Handling**: The plugin distinguishes between `checkboxStatus` (actual text in brackets like " ", "/", "x", "-") and `displayStatus` (computed state like "in-progress", "overdue"). Custom completion markers are configurable in settings.

**GTD State Computation**: Tasks are auto-categorized into GTD states based on tags (#waiting, #doing), dates, and dependencies. See `computeGtdState()` in `task-parser.ts`.

**Eisenhower Quadrants**: Computed from priority + due date urgency. Q1 = urgent+important, Q2 = not urgent+important, etc.

**External Dependencies**: The plugin uses only Obsidian's API. All DOM manipulation is vanilla JavaScript (no React/Vue).

## Obsidian API Usage

- `Plugin.registerView()` - Registers the task matrix view type
- `WorkspaceLeaf` - Manages the view container
- `Vault.read()` - Reads file content for task parsing
- `Vault.modify()` - Updates file content when tasks change
- `MarkdownRenderer.render()` - Renders task descriptions with markdown support
- `Modal` - Base class for task editing dialogs

## Testing

No test framework is currently configured. Testing is done manually by:
1. Building the plugin
2. Copying `main.js` and `manifest.json` to a test vault's `.obsidian/plugins/obsidian-task-matrix/`
3. Reloading Obsidian (Ctrl+R) or using the "Reload app without saving" command

## Release Checklist

When releasing a new version:

1. **Update Version Numbers**
   - Update `version` in `manifest.json`
   - Update `version` in `package.json` (keep in sync)

2. **Update Documentation**
   - Add changelog entry to `CHANGELOG.md` with new features/fixes
   - Update `README.md` if there are user-facing changes

3. **Build and Verify**
   ```bash
   npm run build
   ```
   - Ensure TypeScript compiles without errors
   - Verify `main.js` is generated in repo root

4. **Git Operations**
   ```bash
   git add -A
   git commit -m "Release vX.Y.Z"
   git tag X.Y.Z
   git push origin main --tags
   ```

5. **GitHub Release**
   - Create release from tag
   - **Only attach required files:** `main.js`, `manifest.json`, `styles.css` (if exists)
   - **Do NOT include:** `versions.json`, `package.json`, source files
   - Copy relevant changelog entries to release notes

## Common Issues & Solutions

**Duplicate Emoji Bug**: When modifying task dates via drag-and-drop, orphaned emojis (e.g., `📅` without date) could accumulate. Fixed by using regex that makes the date optional: `(?:\s*\d{4}-\d{2}-\d{2})?` to match and remove emoji with or without attached date.

**Priority Handling**: When adding new priority levels, update:
1. `Priority` enum in `types.ts`
2. `PRIORITY_MARKERS` array in `task-parser.ts`
3. `computeQuadrant()` to determine if priority counts as "Important"
4. `priorityRank()` for sorting order
5. `EditTaskModal` dropdown options in `main.ts`
