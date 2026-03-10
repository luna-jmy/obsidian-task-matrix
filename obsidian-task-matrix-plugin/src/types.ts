export type ViewMode = "list" | "gtd" | "eisenhower";

export type TaskStatus = "open" | "completed" | "cancelled" | "in-progress";
export type GTDState = "Inbox" | "In Progress" | "Waiting" | "Done";
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
  status: TaskStatus;
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

export interface TaskMatrixSettings {
  scanFolder: string;
  defaultView: ViewMode;
  includeCompleted: boolean;
}

export const DEFAULT_SETTINGS: TaskMatrixSettings = {
  scanFolder: "",
  defaultView: "eisenhower",
  includeCompleted: true,
};
