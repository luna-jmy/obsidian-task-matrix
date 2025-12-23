
import { ObsidianTask, Priority, GTDState } from '../types';

const PRIORITY_MAP: Record<string, Priority> = {
  '🔺': Priority.Highest,
  '⏫': Priority.High,
  '🔼': Priority.Medium,
  '🔽': Priority.Low,
  '⏬': Priority.Lowest,
};

const REVERSE_PRIORITY_MAP: Record<Priority, string> = {
  [Priority.Highest]: '🔺',
  [Priority.High]: '⏫',
  [Priority.Medium]: '🔼',
  [Priority.None]: '',
  [Priority.Low]: '🔽',
  [Priority.Lowest]: '⏬',
};

function getDateValue(d?: string | Date): number {
  if (!d) return 0;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return 0;
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

export function parseObsidianTask(line: string): ObsidianTask | null {
  const taskRegex = /^[ \t]*[-*][ \t]\[( |x|X|[/]|-)\][ \t]*(.*)$/;
  const match = line.match(taskRegex);
  if (!match) return null;

  const statusChar = match[1].toLowerCase();
  const rawDescription = match[2];
  
  let status: 'open' | 'completed' | 'cancelled' = 'open';
  if (statusChar === 'x') status = 'completed';
  if (statusChar === '-') status = 'cancelled';

  const extract = (regex: RegExp) => {
    const m = rawDescription.match(regex);
    return m ? m[1].trim() : undefined;
  };

  const dueDate = extract(/📅\s*(\d{4}-\d{2}-\d{2})/);
  const startDate = extract(/🛫\s*(\d{4}-\d{2}-\d{2})/);
  const scheduledDate = extract(/⏳\s*(\d{4}-\d{2}-\d{2})/);
  const recurrence = extract(/🔁\s*([^📅🛫⏳⏫🔼🔽➕🆔⛔🏁🔺⏬\n]+)/);
  const createdDate = extract(/➕\s*(\d{4}-\d{2}-\d{2})/);
  const doneDate = extract(/✅\s*(\d{4}-\d{2}-\d{2})/);
  const cancelledDate = extract(/❌\s*(\d{4}-\d{2}-\d{2})/);
  const taskId = extract(/🆔\s*([^\s📅🛫⏳⏫🔼🔽➕⛔🏁🔺⏬\n]+)/);
  const dependsOn = extract(/⛔\s*([^\s📅🛫⏳⏫🔼🔽➕🆔🏁🔺⏬\n]+)/);

  let priority = Priority.None;
  for (const [icon, p] of Object.entries(PRIORITY_MAP)) {
    if (rawDescription.includes(icon)) {
      priority = p;
      break;
    }
  }

  const cleanDescription = rawDescription
    .replace(/📅\s*\d{4}-\d{2}-\d{2}/g, '')
    .replace(/🛫\s*\d{4}-\d{2}-\d{2}/g, '')
    .replace(/⏳\s*\d{4}-\d{2}-\d{2}/g, '')
    .replace(/🔁\s*[^📅🛫⏳⏫🔼🔽➕🆔⛔🏁🔺⏬\n]+/g, '')
    .replace(/➕\s*\d{4}-\d{2}-\d{2}/g, '')
    .replace(/✅\s*\d{4}-\d{2}-\d{2}/g, '')
    .replace(/❌\s*\d{4}-\d{2}-\d{2}/g, '')
    .replace(/🆔\s*[^\s]+/g, '')
    .replace(/⛔\s*[^\s]+/g, '')
    .replace(/[🔺⏫🔼🔽⏬]/g, '')
    .trim();

  const todayValue = getDateValue(new Date());
  const dueDateValue = dueDate ? getDateValue(dueDate) : 0;
  const startDateValue = startDate ? getDateValue(startDate) : 0;
  const scheduledDateValue = scheduledDate ? getDateValue(scheduledDate) : 0;

  const threeDaysLaterValue = getDateValue(new Date(new Date().setDate(new Date().getDate() + 3)));
  const isImportant = [Priority.Highest, Priority.High].includes(priority);
  const isUrgent = dueDateValue !== 0 && dueDateValue <= threeDaysLaterValue;
  
  let gtdState: GTDState = 'Inbox';
  const descLower = cleanDescription.toLowerCase();

  // GTD Priority Rule: Done > Waiting > NextActions > Inbox
  if (status === 'completed') {
    gtdState = 'Done';
  } else if (dependsOn || descLower.includes('#waiting') || descLower.includes('#delegated') || descLower.includes('#blocked')) {
    gtdState = 'NextActions'; // In our UI "NextActions" is "Waiting/Delegated"
  } else if (
    statusChar === '/' || 
    descLower.includes('#next') || 
    descLower.includes('#doing') || 
    descLower.includes('#active') || 
    (startDateValue !== 0 && startDateValue <= todayValue) || 
    (scheduledDateValue !== 0 && scheduledDateValue <= todayValue)
  ) {
    gtdState = 'InProgress'; // In our UI "InProgress" is "Next Actions"
  } else {
    gtdState = 'Inbox';
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    originalLine: line,
    description: cleanDescription,
    status,
    dueDate,
    startDate,
    scheduledDate,
    priority,
    recurrence,
    createdDate,
    doneDate,
    cancelledDate,
    taskId,
    dependsOn,
    isImportant,
    isUrgent,
    gtdState
  };
}

export function stringifyTask(task: ObsidianTask): string {
  let statusChar = ' ';
  if (task.status === 'completed') statusChar = 'x';
  if (task.status === 'cancelled') statusChar = '-';
  
  let line = `- [${statusChar}] ${task.description}`;
  
  if (task.priority !== Priority.None) line += ` ${REVERSE_PRIORITY_MAP[task.priority]}`;
  if (task.recurrence) line += ` 🔁 ${task.recurrence}`;
  if (task.dueDate) line += ` 📅 ${task.dueDate}`;
  if (task.scheduledDate) line += ` ⏳ ${task.scheduledDate}`;
  if (task.startDate) line += ` 🛫 ${task.startDate}`;
  if (task.createdDate) line += ` ➕ ${task.createdDate}`;
  if (task.doneDate) line += ` ✅ ${task.doneDate}`;
  if (task.cancelledDate) line += ` ❌ ${task.cancelledDate}`;
  if (task.taskId) line += ` 🆔 ${task.taskId}`;
  if (task.dependsOn) line += ` ⛔ ${task.dependsOn}`;
  
  return line;
}
