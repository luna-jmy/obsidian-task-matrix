
import React, { useState, useEffect } from 'react';
import { ObsidianTask, Priority } from '../types';
import { translations, Language, TranslationKey } from '../utils/i18n';

interface TaskCardProps {
  task: ObsidianTask;
  language: Language;
  onToggleStatus: (id: string) => void;
  onEdit: (task: ObsidianTask) => void;
  onDelete: (id: string) => void;
  isDragDisabled?: boolean;
  // Cross-view status display
  showGTDStatus?: boolean;
  showEisenhowerStatus?: boolean;
  gtdState?: string;
  eisenhowerQuadrant?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  language,
  onToggleStatus,
  onEdit,
  onDelete,
  isDragDisabled = false,
  showGTDStatus = false,
  showEisenhowerStatus = false,
  gtdState = '',
  eisenhowerQuadrant = ''
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isProject = task.description.toLowerCase().includes('#project');

  const t = (key: TranslationKey) => translations[language][key] || key;

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
    if (isDragDisabled) {
      e.preventDefault();
      return;
    }
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
      draggable={!isDragDisabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`p-2.5 sm:p-3 mb-2 rounded-lg border shadow-sm hover:shadow-md transition-all ${isDragDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-grab active:cursor-grabbing'} group relative flex flex-col justify-center min-h-[64px] sm:min-h-[72px]
        ${isProject ? 'border-l-4 border-l-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white'}
      `}
    >
      {/* 按钮容器 */}
      <div className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          className="p-1 sm:p-1.5 text-slate-400 sm:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title={t('card.edit')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirmDelete) {
              onDelete(task.id);
            } else {
              setConfirmDelete(true);
            }
          }}
          className={`p-1 sm:p-1.5 rounded-lg transition-all ${confirmDelete ? 'text-white bg-red-500 shadow-sm' : 'text-slate-400 sm:text-slate-300 hover:text-red-600 hover:bg-red-50'}`}
          title={confirmDelete ? t('actions.confim_delete') : t('card.delete')}
        >
          {confirmDelete ? (
            <span className="text-[8px] sm:text-[9px] font-black px-0.5 uppercase tracking-tighter">{t('actions.confim_delete')}</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          )}
        </button>
      </div>

      <div className="flex items-start gap-2 sm:gap-3 pointer-events-none">
        {task.status === 'cancelled' ? (
          <div className="mt-1 w-4 h-4 flex items-center justify-center text-slate-400 font-bold shrink-0">
            [-]
          </div>
        ) : (
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
        )}
        <div className="flex-1 min-w-0 pr-10 sm:pr-12">
          <p className={`text-xs sm:text-sm font-medium leading-tight ${(task.status === 'completed' || task.status === 'cancelled') ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {isProject && <span className="mr-1 text-[9px] sm:text-[10px] bg-indigo-600 text-white px-1 rounded uppercase tracking-tighter">{t('card.project')}</span>}
            {task.description}
          </p>

          <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1 sm:gap-1.5 text-[9px] sm:text-[10px]">
            {showGTDStatus && gtdState && (
              <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200" title="GTD State">
                🔄 {gtdState}
              </span>
            )}
            {showEisenhowerStatus && eisenhowerQuadrant && (
              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200" title="Eisenhower Quadrant">
                📊 {eisenhowerQuadrant}
              </span>
            )}
            {task.priority !== Priority.None && (
              <span className={`px-1.5 py-0.5 rounded font-bold ${priorityColor[task.priority]}`}>
                {priorityIcon[task.priority]} {(t(`priority.${task.priority.toLowerCase()}` as any)).toUpperCase()}
              </span>
            )}
            {task.taskId && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                🆔 {task.taskId}
              </span>
            )}
            {task.dependsOn && (
              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 font-mono">
                ⛔ {task.dependsOn}
              </span>
            )}
            {task.dueDate && (
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                📅 {task.dueDate}
              </span>
            )}
            {task.scheduledDate && (
              <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100">
                ⏳ {task.scheduledDate}
              </span>
            )}
            {task.startDate && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                🛫 {task.startDate}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
