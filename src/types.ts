export type ViewMode = "list" | "gtd" | "eisenhower";
export type OpenLocation = "sidebar" | "tab";

// User-defined task status display type
export type TaskStatusDisplay = "open" | "completed" | "cancelled" | "in-progress" | "to-be-started" | "overdue";
export type GTDState = "Inbox" | "To be Started" | "In Progress" | "Waiting" | "Overdue" | "Done";
export type EisenhowerQuadrant = "Q1" | "Q2" | "Q3" | "Q4";

export enum Priority {
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

export type CheckboxStatus = " " | "/" | "-" | "x" | string;

export interface TaskMatrixSettings {
  scanFolder: string;
  excludeFolders: string[];
  defaultView: ViewMode;
  includeCompleted: boolean;
  openLocation: OpenLocation;
  // Custom completion markers (checkbox content that means completed)
  completionMarkers: string[];
}

export const DEFAULT_SETTINGS: TaskMatrixSettings = {
  scanFolder: "",
  excludeFolders: [],
  defaultView: "eisenhower",
  includeCompleted: true,
  openLocation: "sidebar",
  completionMarkers: ["x", "X"],
};
