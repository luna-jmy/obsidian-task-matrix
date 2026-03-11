# Changelog

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
