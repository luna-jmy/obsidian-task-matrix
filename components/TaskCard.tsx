
import React, { useState, useEffect } from 'react';
import { ObsidianTask, Priority } from '../types';

interface TaskCardProps {
  task: ObsidianTask;
  onToggleStatus: (id: string) => void;
  onEdit: (task: ObsidianTask) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleStatus, onEdit, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isProject = task.description.toLowerCase().includes('#project');

  // Reset confirmation state if user moves away or after timeout
  useEffect(() => {
    if (confirmDelete) {
      const timer = setTimeout(() => setConfirmDelete(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmDelete]);

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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(task.id);
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`p-3 mb-2 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative flex flex-col justify-center min-h-[72px]
        ${isProject ? 'border-l-4 border-l-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white'}
      `}
    >
      {/* Isolated Edit Button - Top Right */}
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(task); }}
        className="absolute top-1.5 right-1.5 p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Edit Task"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      </button>

      {/* Isolated Delete Button - Bottom Right */}
      <button 
        onClick={handleDeleteClick}
        className={`absolute bottom-1.5 right-1.5 flex items-center gap-1.5 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10 text-[10px] font-bold
          ${confirmDelete 
            ? 'bg-red-600 text-white shadow-lg shadow-red-200 animate-pulse opacity-100' 
            : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}
        `}
        title={confirmDelete ? "Click again to confirm delete" : "Delete Task"}
      >
        {confirmDelete && <span>CONFIRM?</span>}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {confirmDelete ? (
            <polyline points="3 6 5 6 21 6"></polyline>
          ) : (
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          )}
        </svg>
      </button>

      <div className="flex items-start gap-3 pointer-events-none">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-auto shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(task.id);
          }}
          readOnly
        />
        <div className="flex-1 min-w-0 pr-10">
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
            {task.taskId && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                🆔 {task.taskId}
              </span>
            )}
            {task.dependsOn && (
              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100">
                ⛔ {task.dependsOn}
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
