
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ObsidianTask, ViewMode, Priority, GTDState } from './types';
import { parseObsidianTask, stringifyTask } from './utils/parser';
import { TaskCard } from './components/TaskCard';
import { translations, Language, TranslationKey } from './utils/i18n';

const STORAGE_KEY = 'obsidian_matrix_tasks';

const INITIAL_TASK_FORM = {
  description: '',
  priority: Priority.None,
  dueDate: '',
  startDate: '',
  scheduledDate: '',
  recurrence: '',
  createdDate: new Date().toISOString().split('T')[0],
  doneDate: '',
  cancelledDate: '',
  status: 'open' as 'open' | 'completed' | 'cancelled',
  taskId: '',
  dependsOn: '',
  hasNextAction: false
};

const DEFAULT_YAML_TEMPLATE = (date: string) => `---
cssclasses:
  - matrix
obsidianUIMode: preview
created: ${date}
aliases:
area:
type: task
status: active
due_date:
priority: 3
tags:
source:
keywords:
---`;

const PRIORITY_ORDER = {
  [Priority.Highest]: 5,
  [Priority.High]: 4,
  [Priority.Medium]: 3,
  [Priority.None]: 2,
  [Priority.Low]: 1,
  [Priority.Lowest]: 0,
};

const STATUS_ORDER = {
  'open': 0,
  'completed': 1,
  'cancelled': 2
};

const generateShortId = () => Math.random().toString(36).substr(2, 6);

const App: React.FC = () => {
  const [tasks, setTasks] = useState<ObsidianTask[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [viewMode, setViewMode] = useState<ViewMode>('eisenhower');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // List View State
  const [listSortBy, setListSortBy] = useState<string>('manual');
  const [listSortDir, setListSortDir] = useState<'asc' | 'desc'>('desc');
  const [listFilterStatus, setListFilterStatus] = useState<string>('all');

  const [inputText, setInputText] = useState('');
  const [yamlHeader, setYamlHeader] = useState(DEFAULT_YAML_TEMPLATE(new Date().toISOString().split('T')[0]));
  const [taskForm, setTaskForm] = useState(INITIAL_TASK_FORM);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('obsidian_matrix_lang');
    if (saved === 'en' || saved === 'zh') return saved;
    return navigator.language.startsWith('zh') ? 'zh' : 'en';
  });

  const t = useCallback((key: TranslationKey, params?: Record<string, any>) => {
    let str = translations[language][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('obsidian_matrix_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (isConfirmingClear) {
      const timer = setTimeout(() => setIsConfirmingClear(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmingClear]);

  const getDynamicGTDState = useCallback((task: ObsidianTask, allTasks: ObsidianTask[]): GTDState => {
    if (task.status === 'completed' || task.status === 'cancelled') return 'Done';
    const descLower = task.description.toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];
    const hasUnfinishedDependency = task.dependsOn && allTasks.some(t => t.taskId === task.dependsOn && t.status !== 'completed');
    const hasWaitingTag = descLower.includes('#waiting') || descLower.includes('#delegated') || descLower.includes('#blocked');
    if (hasUnfinishedDependency || hasWaitingTag) return 'NextActions';
    const hasStartedTag = descLower.includes('#started') || descLower.includes('#doing') || descLower.includes('#active') || descLower.includes('#next');
    const isStartedByDate = (task.startDate && task.startDate <= todayStr) || (task.scheduledDate && task.scheduledDate <= todayStr);
    const isWorkingStatus = task.originalLine && task.originalLine.includes('[/]');
    if (hasStartedTag || isStartedByDate || isWorkingStatus) return 'InProgress';
    return 'Inbox';
  }, []);

  // Filter tasks for matrix views
  const e_q1 = useMemo(() => tasks.filter(t => t.isImportant && t.isUrgent && t.status === 'open'), [tasks]);
  const e_q2 = useMemo(() => tasks.filter(t => t.isImportant && !t.isUrgent && t.status === 'open'), [tasks]);
  const e_q3 = useMemo(() => tasks.filter(t => !t.isImportant && t.isUrgent && t.status === 'open'), [tasks]);
  const e_q4 = useMemo(() => tasks.filter(t => !t.isImportant && !t.isUrgent && t.status === 'open'), [tasks]);

  const g_inbox = useMemo(() => tasks.filter(t => t.status === 'open' && getDynamicGTDState(t, tasks) === 'Inbox'), [tasks, getDynamicGTDState]);
  const g_waiting = useMemo(() => tasks.filter(t => t.status === 'open' && getDynamicGTDState(t, tasks) === 'NextActions'), [tasks, getDynamicGTDState]);
  const g_doing = useMemo(() => tasks.filter(t => t.status === 'open' && getDynamicGTDState(t, tasks) === 'InProgress'), [tasks, getDynamicGTDState]);
  const g_done = useMemo(() => tasks.filter(t => t.status === 'completed' || t.status === 'cancelled'), [tasks]);

  // List View Computed Data
  const sortedAndFilteredTasks = useMemo(() => {
    let filtered = tasks;
    if (listFilterStatus === 'open') filtered = tasks.filter(t => t.status === 'open');
    if (listFilterStatus === 'completed') filtered = tasks.filter(t => t.status === 'completed');
    if (listFilterStatus === 'cancelled') filtered = tasks.filter(t => t.status === 'cancelled');

    if (listSortBy === 'manual') return filtered;

    return [...filtered].sort((a, b) => {
      let result = 0;
      if (listSortBy === 'dueDate') {
        const valA = a.dueDate || (listSortDir === 'asc' ? '9999-99-99' : '0000-00-00');
        const valB = b.dueDate || (listSortDir === 'asc' ? '9999-99-99' : '0000-00-00');
        result = valA.localeCompare(valB);
      } else if (listSortBy === 'priority') {
        result = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      } else if (listSortBy === 'startDate') {
        const valA = a.startDate || (listSortDir === 'asc' ? '9999-99-99' : '0000-00-00');
        const valB = b.startDate || (listSortDir === 'asc' ? '9999-99-99' : '0000-00-00');
        result = valA.localeCompare(valB);
      } else if (listSortBy === 'scheduledDate') {
        const valA = a.scheduledDate || (listSortDir === 'asc' ? '9999-99-99' : '0000-00-00');
        const valB = b.scheduledDate || (listSortDir === 'asc' ? '9999-99-99' : '0000-00-00');
        result = valA.localeCompare(valB);
      } else if (listSortBy === 'status') {
        result = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      }

      return listSortDir === 'asc' ? result : -result;
    });
  }, [tasks, listSortBy, listSortDir, listFilterStatus]);

  const generateMarkdownBody = useCallback(() => {
    if (viewMode === 'gtd') {
      const table = `|                   |              |
| ----------------- | ------------ |
| ![[#收集箱 (Inbox)]] | ![[#执行中]]     |
| ![[#已处理/授权]]    | ![[#已完成]]    |
|                   |              |

`;
      const sections = [
        { title: '收集箱 (Inbox)', tasks: g_inbox },
        { title: '执行中', tasks: g_doing },
        { title: '已处理/授权', tasks: g_waiting },
        { title: '已完成', tasks: g_done }
      ];

      const content = sections.map(s => `### ${s.title}\n${s.tasks.map(stringifyTask).join('\n')}`).join('\n\n');
      return `# GTD Flow\n\n${table}${content}`;
    } else if (viewMode === 'eisenhower') {
      const table = `|                   |              |
| ----------------- | ------------ |
| ![[#重要且紧急 🔴]] | ![[#重要不紧急 🟢]] |
| ![[#不重要但紧急 🟡]] | ![[#不重要不紧急 ⚪]] |
|                   |              |

`;
      const sections = [
        { title: '重要且紧急 🔴', tasks: e_q1 },
        { title: '重要不紧急 🟢', tasks: e_q2 },
        { title: '不重要但紧急 🟡', tasks: e_q3 },
        { title: '不重要不紧急 ⚪', tasks: e_q4 }
      ];

      const content = sections.map(s => `### ${s.title}\n${s.tasks.map(stringifyTask).join('\n')}`).join('\n\n');
      return `# Eisenhower Matrix\n\n${table}${content}`;
    } else {
      // List View Export
      return `# Task List\n\n${sortedAndFilteredTasks.map(stringifyTask).join('\n')}`;
    }
  }, [viewMode, g_inbox, g_waiting, g_doing, g_done, e_q1, e_q2, e_q3, e_q4, sortedAndFilteredTasks]);

  const handleDownloadMD = () => {
    const body = generateMarkdownBody();
    const content = `${yamlHeader}\n\n${body}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${viewMode === 'gtd' ? 'gtd-flow' : viewMode === 'eisenhower' ? 'matrix' : 'list'}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = () => {
    const body = generateMarkdownBody();
    navigator.clipboard.writeText(body);
    alert('Copied to clipboard (YAML excluded as requested)!');
  };

  const handleClearAll = useCallback(() => {
    if (isConfirmingClear) {
      setTasks([]);
      setIsConfirmingClear(false);
    } else {
      setIsConfirmingClear(true);
    }
  }, [isConfirmingClear]);

  const handleDrop = (e: React.DragEvent, targetData: any) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const todayStr = new Date().toISOString().split('T')[0];

    // Manual Reorder Logic for List View
    if (viewMode === 'list' && listSortBy === 'manual') {
      const dropTaskId = targetData.taskId;
      if (taskId === dropTaskId) return;

      setTasks(prev => {
        const newTasks = [...prev];
        const draggedIdx = newTasks.findIndex(t => t.id === taskId);
        const targetIdx = newTasks.findIndex(t => t.id === dropTaskId);
        const [removed] = newTasks.splice(draggedIdx, 1);
        newTasks.splice(targetIdx, 0, removed);
        return newTasks;
      });
      return;
    }

    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        let updated: ObsidianTask = { ...task };

        if (viewMode === 'eisenhower') {
          const { isUrgent, isImportant } = targetData;
          if (isImportant) {
            updated.priority = Priority.High;
          } else {
            updated.priority = Priority.None;
          }
          if (isUrgent) {
            if (!task.dueDate) updated.dueDate = todayStr;
          } else {
            updated.dueDate = undefined;
          }
        } else if (viewMode === 'gtd') {
          const { gtdState } = targetData;
          if (gtdState === 'Done') {
            updated.status = 'completed';
            updated.doneDate = todayStr;
          } else if (gtdState === 'InProgress' || gtdState === 'NextActions') {
            setTimeout(() => handleOpenEdit(task), 0);
            return task;
          } else if (gtdState === 'Inbox') {
            updated.status = 'open';
            updated.startDate = undefined;
            updated.scheduledDate = undefined;
            updated.dependsOn = undefined;
            updated.description = task.description.replace(/#(waiting|delegated|blocked|next|doing|active)\b/gi, '').trim();
          }
        }

        const line = stringifyTask(updated);
        return parseObsidianTask(line) || updated;
      }
      return task;
    }));
  };

  const handleOpenEdit = useCallback((task: ObsidianTask) => {
    setEditingTaskId(task.id);
    setTaskForm({
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate || '',
      startDate: task.startDate || '',
      scheduledDate: task.scheduledDate || '',
      recurrence: task.recurrence || '',
      createdDate: task.createdDate || '',
      doneDate: task.doneDate || '',
      cancelledDate: task.cancelledDate || '',
      status: task.status,
      taskId: task.taskId || '',
      dependsOn: task.dependsOn || '',
      hasNextAction: false
    });
    setIsTaskModalOpen(true);
  }, []);

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.description.trim()) return;
    let finalTaskId = taskForm.taskId;
    if (taskForm.hasNextAction && !finalTaskId) {
      finalTaskId = generateShortId();
    }
    const taskData = {
      description: taskForm.description,
      status: taskForm.status,
      dueDate: taskForm.dueDate || undefined,
      startDate: taskForm.startDate || undefined,
      scheduledDate: taskForm.scheduledDate || undefined,
      priority: taskForm.priority,
      recurrence: taskForm.recurrence || undefined,
      createdDate: taskForm.createdDate || undefined,
      doneDate: taskForm.doneDate || undefined,
      cancelledDate: taskForm.cancelledDate || undefined,
      taskId: finalTaskId || undefined,
      dependsOn: taskForm.dependsOn || undefined,
    };
    if (editingTaskId) {
      setTasks(prev => prev.map(t => {
        if (t.id === editingTaskId) {
          const line = stringifyTask({ ...t, ...taskData } as ObsidianTask);
          return parseObsidianTask(line) || ({ ...t, ...taskData } as ObsidianTask);
        }
        return t;
      }));
    } else {
      const line = stringifyTask({ id: Math.random().toString(), ...taskData } as any);
      setTasks(prev => [...prev, parseObsidianTask(line)!]);
    }
    if (taskForm.hasNextAction) {
      setTaskForm({ ...INITIAL_TASK_FORM, dependsOn: finalTaskId || '' });
      setEditingTaskId(null);
    } else {
      setTaskForm(INITIAL_TASK_FORM);
      setEditingTaskId(null);
      setIsTaskModalOpen(false);
    }
  };

  const handleImport = useCallback(() => {
    const lines = inputText.split('\n');
    const newTasks: ObsidianTask[] = [];
    lines.forEach(line => {
      if (line.trim()) {
        const task = parseObsidianTask(line);
        if (task) newTasks.push(task);
      }
    });
    if (newTasks.length > 0) setTasks(prev => [...prev, ...newTasks]);
    setInputText('');
    setIsImportModalOpen(false);
  }, [inputText]);

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'open' ? 'completed' : 'open';
        const updated: ObsidianTask = {
          ...t,
          status: nextStatus,
          doneDate: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
        };
        return parseObsidianTask(stringifyTask(updated)) || updated;
      }
      return t;
    }));
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleListSortChange = (newSortBy: string) => {
    setListSortBy(newSortBy);
    // If it's a date field, default to Descending
    if (['dueDate', 'startDate', 'scheduledDate'].includes(newSortBy)) {
      setListSortDir('desc');
    }
  };

  const Quadrant = ({ title, desc, tasks: qTasks, color, data, state }: any) => (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={(e) => handleDrop(e, data || { gtdState: state })}
      className={`flex flex-col h-full min-h-[350px] border-2 border-dashed rounded-xl p-4 transition-all ${color} hover:border-solid`}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold flex items-center justify-between">
          {title} <span className="text-xs bg-white/50 px-2 rounded-full border border-current">{qTasks.length}</span>
        </h3>
        <p className="text-[10px] opacity-60 uppercase tracking-widest">{desc}</p>
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        {[...qTasks].sort((a, b) => (a.description.toLowerCase().includes('#project') ? -1 : 1)).map(t_node => (
          <TaskCard key={t_node.id} language={language} task={t_node} onToggleStatus={toggleTaskStatus} onEdit={handleOpenEdit} onDelete={handleDeleteTask} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl sm:text-2xl font-bold">M</div>
          <div><h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{t('header.title')}</h1><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('header.subtitle')}</p></div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full no-scrollbar">
          <button onClick={() => setViewMode('eisenhower')} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap ${viewMode === 'eisenhower' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}>{t('view.eisenhower')}</button>
          <button onClick={() => setViewMode('gtd')} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap ${viewMode === 'gtd' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}>{t('view.gtd')}</button>
          <button onClick={() => setViewMode('list')} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}>{t('view.list')}</button>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-center sm:justify-end">
          <button
            onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
            className="px-3 py-2 border border-slate-200 bg-white text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5"
          >
            <span className="opacity-60">🌐</span> {language.toUpperCase()}
          </button>
          <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

          <button onClick={() => { setTaskForm(INITIAL_TASK_FORM); setEditingTaskId(null); setIsTaskModalOpen(true); }} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 transition-transform active:scale-95 whitespace-nowrap">{t('actions.add_task')}</button>
          <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
          <button onClick={() => setIsImportModalOpen(true)} className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 whitespace-nowrap">{t('actions.import_md')}</button>
          <button onClick={() => setIsExportModalOpen(true)} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold rounded-xl hover:bg-indigo-100/50 whitespace-nowrap">{t('actions.export_md')}</button>
          <button onClick={handleClearAll} className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all border whitespace-nowrap ${isConfirmingClear ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-rose-100 text-rose-500 hover:bg-rose-50'}`}>{isConfirmingClear ? t('header.confirm_clear') : t('header.clear_all')}</button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-[1400px] mx-auto w-full">
        {tasks.length > 0 ? (
          viewMode === 'eisenhower' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <Quadrant title={t('quadrant.e_q1.title')} desc={t('quadrant.e_q1.desc')} tasks={e_q1} color="bg-rose-50 border-rose-200 text-rose-900" data={{ isUrgent: true, isImportant: true }} />
              <Quadrant title={t('quadrant.e_q2.title')} desc={t('quadrant.e_q2.desc')} tasks={e_q2} color="bg-emerald-50 border-emerald-200 text-emerald-900" data={{ isUrgent: false, isImportant: true }} />
              <Quadrant title={t('quadrant.e_q3.title')} desc={t('quadrant.e_q3.desc')} tasks={e_q3} color="bg-amber-50 border-amber-200 text-amber-900" data={{ isUrgent: true, isImportant: false }} />
              <Quadrant title={t('quadrant.e_q4.title')} desc={t('quadrant.e_q4.desc')} tasks={e_q4} color="bg-slate-50 border-slate-200 text-slate-600" data={{ isUrgent: false, isImportant: false }} />
            </div>
          ) : viewMode === 'gtd' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <Quadrant title={t('quadrant.g_inbox.title')} desc={t('quadrant.g_inbox.desc')} tasks={g_inbox} color="bg-sky-50 border-sky-200 text-sky-900" state="Inbox" />
              <Quadrant title={t('quadrant.g_doing.title')} desc={t('quadrant.g_doing.desc')} tasks={g_doing} color="bg-teal-50 border-teal-200 text-teal-900" state="InProgress" />
              <Quadrant title={t('quadrant.g_waiting.title')} desc={t('quadrant.g_waiting.desc')} tasks={g_waiting} color="bg-purple-50 border-purple-200 text-purple-900" state="NextActions" />
              <Quadrant title={t('quadrant.g_done.title')} desc={t('quadrant.g_done.desc')} tasks={g_done} color="bg-slate-100 border-slate-300 text-slate-500" state="Done" />
            </div>
          ) : (
            /* List View */
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('list.filter')}</label>
                  <select
                    value={listFilterStatus}
                    onChange={e => setListFilterStatus(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">{t('list.all_status')}</option>
                    <option value="open">{t('list.not_done')}</option>
                    <option value="completed">{t('list.done')}</option>
                    <option value="cancelled">{t('list.cancelled')}</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('list.sort_by')}</label>
                  <select
                    value={listSortBy}
                    onChange={e => handleListSortChange(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="manual">{t('list.manual')}</option>
                    <option value="dueDate">{t('list.due_date')}</option>
                    <option value="priority">{t('list.priority')}</option>
                    <option value="startDate">{t('list.start_date')}</option>
                    <option value="scheduledDate">{t('list.scheduled_date')}</option>
                    <option value="status">{t('list.status')}</option>
                  </select>
                </div>

                {listSortBy !== 'manual' && (
                  <button
                    onClick={() => setListSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    {listSortDir === 'asc' ? t('list.ascending') : t('list.descending')}
                  </button>
                )}

                <div className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                  {t('list.showing', { count: sortedAndFilteredTasks.length })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-2 min-h-[500px]">
                  {sortedAndFilteredTasks.map((t_row) => (
                    <div
                      key={t_row.id}
                      onDragOver={(e) => {
                        if (listSortBy === 'manual') {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }
                      }}
                      onDrop={(e) => handleDrop(e, { taskId: t_row.id })}
                      className="relative"
                    >
                      <TaskCard
                        task={t_row}
                        language={language}
                        onToggleStatus={toggleTaskStatus}
                        onEdit={handleOpenEdit}
                        onDelete={handleDeleteTask}
                      />
                    </div>
                  ))}
                  {sortedAndFilteredTasks.length === 0 && (
                    <div className="py-20 text-center text-slate-400 font-medium">No tasks match the current filters.</div>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="h-full min-h-[400px] sm:min-h-[500px] flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700 px-4">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mb-6 sm:mb-8 relative z-0">
              <div className="absolute inset-0 bg-indigo-100 rounded-full animate-pulse opacity-50 scale-125 -z-10"></div>
              <span className="text-3xl sm:text-5xl relative z-10 text-orange-500">⚡</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-3 tracking-tight">{t('empty.title')}</h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-sm mb-8 sm:mb-10 leading-relaxed font-medium">{t('empty.desc')}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <button onClick={() => setIsImportModalOpen(true)} className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl sm:shadow-2xl shadow-indigo-200 hover:scale-105 transition-all">{t('empty.import')}</button>
              <button onClick={() => { setTaskForm(INITIAL_TASK_FORM); setEditingTaskId(null); setIsTaskModalOpen(true); }} className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-4 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all">{t('empty.new_task')}</button>
            </div>
          </div>
        )}
      </main>

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white text-slate-700 rounded-3xl shadow-2xl w-full max-w-[550px] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingTaskId ? t('actions.edit_task') : t('actions.new_task')}</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-3xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleTaskSubmit} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('form.description')}</label>
                <textarea required rows={3} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} className="w-full bg-slate-50 text-slate-900 px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:bg-white outline-none text-sm shadow-inner" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('form.priority')}</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as Priority })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10">
                    <option value={Priority.None}>{t('form.priority_none')}</option>
                    <option value={Priority.Highest}>{t('priority.highest')}</option>
                    <option value={Priority.High}>{t('priority.high')}</option>
                    <option value={Priority.Medium}>{t('priority.medium')}</option>
                    <option value={Priority.Low}>{t('priority.low')}</option>
                    <option value={Priority.Lowest}>{t('priority.lowest')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('form.status')}</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value as any })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10">
                    <option value="open">{t('status.open')}</option>
                    <option value="completed">{t('status.completed')}</option>
                    <option value="cancelled">{t('status.cancelled')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">{t('form.due_date')}</label>
                  <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1 text-sky-600">{t('form.start_date')}</label>
                  <input type="date" value={taskForm.startDate} onChange={e => setTaskForm({ ...taskForm, startDate: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1 text-orange-600">{t('form.scheduled')}</label>
                  <input type="date" value={taskForm.scheduledDate} onChange={e => setTaskForm({ ...taskForm, scheduledDate: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1 text-sky-500">{t('form.recurrence')}</label>
                  <input type="text" placeholder={t('form.recurrence_placeholder')} value={taskForm.recurrence} onChange={e => setTaskForm({ ...taskForm, recurrence: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">{t('form.task_id')}</label>
                  <input type="text" placeholder={t('form.id_placeholder')} value={taskForm.taskId} onChange={e => setTaskForm({ ...taskForm, taskId: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1 text-rose-600">{t('form.dependency')}</label>
                  <input type="text" placeholder={t('form.dep_placeholder')} value={taskForm.dependsOn} onChange={e => setTaskForm({ ...taskForm, dependsOn: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10 font-mono" />
                </div>
              </div>
              <div className="pt-2 flex items-center gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <input type="checkbox" id="hasNextAction" checked={taskForm.hasNextAction} className="w-5 h-5 rounded border-slate-300 text-indigo-600 cursor-pointer" onChange={e => setTaskForm({ ...taskForm, hasNextAction: e.target.checked })} />
                <label htmlFor="hasNextAction" className="text-sm font-bold text-indigo-900 cursor-pointer">{t('form.next_action')} <span className="text-[10px] block font-normal opacity-60">{t('form.next_action_desc')}</span></label>
              </div>
              <div className="pt-6 flex gap-3">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl text-sm transition-all shadow-xl shadow-indigo-200">{t('actions.save')}</button>
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold">{t('actions.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between font-black">{t('import.title')}</div>
            <div className="p-8"><textarea value={inputText} onChange={(e) => setInputText(e.target.value)} className="w-full h-72 p-5 border border-slate-200 rounded-2xl font-mono text-xs outline-none" placeholder={t('import.placeholder')} /></div>
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3"><button onClick={() => setIsImportModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500">{t('actions.discard')}</button><button onClick={handleImport} className="px-10 py-2.5 bg-indigo-600 text-white font-black rounded-xl">{t('actions.process')}</button></div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-5 border-b flex items-center justify-between bg-white">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('export.title')}</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-3xl leading-none">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[75vh]">
              <div>
                <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">{t('export.yaml')}</label>
                <textarea
                  value={yamlHeader}
                  onChange={(e) => setYamlHeader(e.target.value)}
                  className="w-full h-44 p-4 border border-indigo-100 rounded-xl bg-indigo-50/30 font-mono text-[11px] text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('export.preview')}</label>
                <textarea
                  readOnly
                  value={generateMarkdownBody()}
                  className="w-full h-64 p-4 border border-slate-200 rounded-xl bg-slate-50 font-mono text-[10px] text-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-3">
                <button
                  onClick={handleCopyClipboard}
                  className="px-6 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                  {t('actions.copy_content')}
                </button>
                <button
                  onClick={handleDownloadMD}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                >
                  {t('actions.download_md')}
                </button>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600">{t('actions.close')}</button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-10 text-center border-t border-slate-200 bg-white">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">{t('footer.power_user')}</p>
        <p className="text-xs text-slate-500 font-medium">{t('footer.tips')}</p>
      </footer>
    </div>
  );
};

export default App;
