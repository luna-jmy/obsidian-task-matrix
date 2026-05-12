export type ViewMode = "list" | "gtd" | "eisenhower" | "calendar";
export type OpenLocation = "sidebar" | "tab";
export type FirstDayOfWeek = "monday" | "sunday";

// User-defined task status display type
export type TaskStatusDisplay = "open" | "completed" | "cancelled" | "in-progress" | "to-be-started" | "overdue";
export type GTDState = "Inbox" | "To be Started" | "In Progress" | "Waiting" | "Overdue" | "Done";
export type EisenhowerQuadrant = "Q1" | "Q2" | "Q3" | "Q4";

export enum Priority {
  Critical = "critical",
  Highest = "highest",
  High = "high",
  Medium = "medium",
  None = "none",
  Low = "low",
  Lowest = "lowest",
}

export interface ParsedTask {
  id: string;
  filePath: string;
  lineNumber: number;
  lineText: string;
  sectionHeading?: string;
  description: string;
  // The actual checkbox status in the markdown
  checkboxStatus: CheckboxStatus;
  // The computed display status based on dates
  displayStatus: TaskStatusDisplay;
  priority: Priority;
  dueDate?: string;
  startDate?: string;
  scheduledDate?: string;
  doneDate?: string;
  createdDate?: string;
  recurrence?: string;
  taskId?: string;
  dependsOn?: string;
  tags: string[];
  blocked: boolean;
  gtdState: GTDState;
  quadrant: EisenhowerQuadrant;
}

export type CheckboxStatus = string;

export interface TaskMatrixSettings {
  scanFolders: string[];
  excludeFolders: string[];
  defaultView: ViewMode;
  includeCompleted: boolean;
  openLocation: OpenLocation;
  // Custom completion markers (checkbox content that means completed)
  completionMarkers: string[];
  // Custom cancelled markers (checkbox content that means cancelled)
  cancelledMarkers: string[];
  // List view folder grouping
  listGroupByFolder: boolean;
  listGroupByFolderDepth: number;
  // Task creation settings
  newTaskTargetPath: string;
  newTaskTargetHeading: string;
  // Track completion date
  trackCompletionDate: boolean;
  // Urgent days range (1-7, default 1 means today only)
  urgentDaysRange: number;
  // Calendar setting: show weekends in week view
  showCalendarWeekends: boolean;
  // Calendar setting: show weekends in month view
  showCalendarMonthWeekends: boolean;
  // Calendar list setting: show every day of month, or only dates with tasks
  calendarListShowFullMonth: boolean;
  // Calendar setting: show in-process tasks on every day between start and due
  showCalendarInProcessTasks: boolean;
  // Calendar setting: first day of week
  calendarFirstDayOfWeek: FirstDayOfWeek;
}

export const DEFAULT_SETTINGS: TaskMatrixSettings = {
  scanFolders: [],
  excludeFolders: [],
  defaultView: "eisenhower",
  includeCompleted: true,
  openLocation: "sidebar",
  completionMarkers: ["x", "X"],
  cancelledMarkers: ["-"],
  listGroupByFolder: false,
  listGroupByFolderDepth: 1,
  newTaskTargetPath: "",
  newTaskTargetHeading: "",
  trackCompletionDate: false,
  urgentDaysRange: 1,
  showCalendarWeekends: true,
  showCalendarMonthWeekends: true,
  calendarListShowFullMonth: false,
  showCalendarInProcessTasks: false,
  calendarFirstDayOfWeek: "monday",
};
