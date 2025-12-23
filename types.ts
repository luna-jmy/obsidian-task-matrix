
export enum Priority {
  Highest = 'highest',
  High = 'high',
  Medium = 'medium',
  None = 'none',
  Low = 'low',
  Lowest = 'lowest'
}

export type GTDState = 'Inbox' | 'NextActions' | 'InProgress' | 'Done';

export interface ObsidianTask {
  id: string;
  originalLine: string;
  description: string;
  status: 'open' | 'completed' | 'cancelled';
  dueDate?: string;
  startDate?: string;
  scheduledDate?: string;
  priority: Priority;
  recurrence?: string;
  createdDate?: string;
  doneDate?: string;
  cancelledDate?: string;
  taskId?: string;
  dependsOn?: string;
  onCompletion?: string;
  // UI related
  isImportant: boolean;
  isUrgent: boolean;
  gtdState: GTDState;
}

export type ViewMode = 'eisenhower' | 'gtd' | 'list';
