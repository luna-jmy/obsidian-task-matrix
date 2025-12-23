import React from 'react';
import { ObsidianTask, Priority } from '../types';

interface TaskCardProps {
  task: ObsidianTask;
  onToggleStatus: (id: string) => void;
  onEdit: (task: ObsidianTask) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleStatus, onEdit, onDelete }) => {
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
    // Find the parent card to set ghost image opacity
    const target = (e.target as HTMLElement).closest('.task-card-container');
    if (target) {
      setTimeout(() => {
        (target as HTMLElement).style.opacity = '0.4';
      }, 0);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = (e.target as HTMLElement).closest('.task-card-container');
    if (target) {
      (target as HTMLElement).style.opacity = '1';
    }
  };

  return (
    <div 
      className={`task-card-container p-3 mb-2 rounded-lg border shadow-sm hover:shadow-md transition-all group relative flex gap-2
        ${isProject ? 'border-l-4 border-l-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white'}
      `}
    >
      {/* 1. Drag Handle - The ONLY way to initiate drag */}
      <div 
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 px-1"
        title="Drag to move"
      >
        <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
          <circle cx="2" cy="3" r="1.5" /><circle cx="2" cy="9" r="1.5" /><circle cx="2" cy="15" r="1.5" />
          <circle cx="10" cy="3" r="1.5" /><circle cx="10" cy="9" r="1.5" /><circle cx="10" cy="15" r="1.5" />
        </svg>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex items-start gap-3 min-w-0">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          onChange={() => onToggleStatus(task.id)}
        />
        <div className="flex-1 min-w-0 pr-12">
          <p className={`text-sm font-medium leading-tight break-words ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {isProject && <span className="mr-1 text-[9px] bg-indigo-600 text-white px-1 rounded uppercase font-black">Project</span>}
            {task.description}
          </p>
          
          <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
            {task.priority !== Priority.None && (
              <span className={`px-1.5 py-0.5 rounded font-bold ${priorityColor[task.priority]}`}>
                {priorityIcon[task.priority]} {task.priority.toUpperCase()}
              </span>
            )}
            {task.dueDate && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">📅 {task.dueDate}</span>}
            {task.startDate && <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">🛫 {task.startDate}</span>}
            {task.dependsOn && <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-100">⛔ {task.dependsOn}</span>}
          </div>
        </div>
      </div>

      {/* 3. Action Buttons - Now standard buttons without drag interference */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onEdit(task)}
          className="p-1.5 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md border border-slate-100 shadow-sm transition-all"
          title="Edit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button 
          onClick={() => onDelete(task.id)}
          className="p-1.5 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md border border-slate-100 shadow-sm transition-all"
          title="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  );
};