
import React from 'react';
import { ObsidianTask, Priority } from '../types';

interface TaskCardProps {
  task: ObsidianTask;
  onToggleStatus: (id: string) => void;
  onEdit: (task: ObsidianTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleStatus, onEdit }) => {
  const isProject = task.description.toLowerCase().includes('#project');

  const priorityColor = {
    [Priority.High]: 'text-red-600 bg-red-50',
    [Priority.Medium]: 'text-orange-600 bg-orange-50',
    [Priority.Low]: 'text-blue-600 bg-blue-50',
    [Priority.None]: 'text-slate-400 bg-slate-50',
    [Priority.Highest]: 'text-red-700 bg-red-100',
    [Priority.Lowest]: 'text-slate-400 bg-slate-50',
  };

  const priorityIcon = {
    [Priority.Highest]: '🔺',
    [Priority.High]: '⏫',
    [Priority.Medium]: '🔼',
    [Priority.Low]: '🔽',
    [Priority.Lowest]: '⏬',
    [Priority.None]: '',
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`p-3 mb-2 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative
        ${isProject ? 'border-l-4 border-l-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white'}
      `}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(task); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-all"
        title="Edit Task"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      </button>

      <div className="flex items-start gap-3 pointer-events-none">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(task.id);
          }}
          readOnly
        />
        <div className="flex-1 min-w-0 pr-4">
          <p className={`text-sm font-medium leading-tight ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {isProject && <span className="mr-1 text-[10px] bg-indigo-600 text-white px-1 rounded uppercase tracking-tighter">Project</span>}
            {task.description}
          </p>
          
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
            {task.priority !== Priority.None && (
              <span className={`px-1.5 py-0.5 rounded font-bold ${priorityColor[task.priority]}`}>
                {priorityIcon[task.priority]} {task.priority.toUpperCase()}
              </span>
            )}
            {task.dueDate && (
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                📅 {task.dueDate}
              </span>
            )}
            {task.startDate && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                🛫 {task.startDate}
              </span>
            )}
            {task.dependsOn && (
              <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-100">
                ⛔ {task.dependsOn}
              </span>
            )}
            {task.recurrence && (
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                🔁 {task.recurrence}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
