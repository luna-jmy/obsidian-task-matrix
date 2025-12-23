import React, { useState, useCallback, useMemo } from 'react';
import { ObsidianTask, ViewMode, Priority, GTDState } from './types';
import { parseObsidianTask, stringifyTask } from './utils/parser';
import { TaskCard } from './components/TaskCard';

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
  dependsOn: ''
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<ObsidianTask[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('eisenhower');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  const [inputText, setInputText] = useState('');
  const [exportText, setExportText] = useState('');
  const [exportTitle, setExportTitle] = useState('');
  const [taskForm, setTaskForm] = useState(INITIAL_TASK_FORM);

  const handleImport = () => {
    const lines = inputText.split('\n');
    const parsed = lines
      .map(line => parseObsidianTask(line))
      .filter((t): t is ObsidianTask => t !== null);
    setTasks(prev => [...prev, ...parsed]);
    setIsImportModalOpen(false);
    setInputText('');
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
      dependsOn: task.dependsOn || ''
    });
    setIsTaskModalOpen(true);
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  }, []);

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.description.trim()) return;

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
      taskId: taskForm.taskId || undefined,
      dependsOn: taskForm.dependsOn || undefined,
    };

    setTasks(prev => prev.map(t => {
      if (t.id === (editingTaskId || '')) {
        const line = stringifyTask({ ...t, ...taskData } as ObsidianTask);
        const parsed = parseObsidianTask(line);
        return parsed || { ...t, ...taskData };
      }
      return t;
    }));

    if (!editingTaskId) {
      const line = stringifyTask({ id: Math.random().toString(), ...taskData } as any);
      const newTask = parseObsidianTask(line)!;
      setTasks(prev => [...prev, newTask]);
    }

    setTaskForm(INITIAL_TASK_FORM);
    setEditingTaskId(null);
    setIsTaskModalOpen(false);
  };

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'open' ? 'completed' : 'open';
        const updated = { ...t, status: nextStatus };
        return parseObsidianTask(stringifyTask(updated as ObsidianTask)) || updated;
      }
      return t;
    }));
  }, []);

  const handleDrop = (e: React.DragEvent, targetData: any) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thresholdDate = new Date(today);
    thresholdDate.setDate(today.getDate() + 3);
    
    const soonDate = new Date(today);
    soonDate.setDate(today.getDate() + 2);
    const urgentStr = soonDate.toISOString().split('T')[0];

    if (viewMode === 'eisenhower') {
      const { isUrgent, isImportant } = targetData;
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          const updatedPriority = isImportant ? Priority.High : Priority.None;
          let updatedDueDate = task.dueDate;
          
          if (isUrgent) {
            const currentDue = task.dueDate ? new Date(task.dueDate) : null;
            if (currentDue) currentDue.setHours(0,0,0,0);
            
            // Check if task is already overdue
            const isOverdue = currentDue && currentDue < today;
            
            if (!isOverdue) {
              if (!currentDue || currentDue > thresholdDate) {
                updatedDueDate = urgentStr;
              }
            }
            // If overdue, we keep updatedDueDate as task.dueDate (no change)
          } else {
            const currentDue = task.dueDate ? new Date(task.dueDate) : null;
            if (currentDue) currentDue.setHours(0,0,0,0);
            if (currentDue && currentDue <= thresholdDate) {
              updatedDueDate = undefined;
            }
          }

          const updated = { ...task, priority: updatedPriority, dueDate: updatedDueDate };
          return parseObsidianTask(stringifyTask(updated as ObsidianTask)) || updated;
        }
        return task;
      }));
    } else {
      const { gtdState } = targetData;
      if (gtdState === 'Done') {
        toggleTaskStatus(taskId);
      } else if (gtdState === 'NextActions') {
        alert("已处理/授权：请添加具有 ⛔ 依赖关系的任务或相关标签：#waiting #delegated #blocked）");
        handleOpenEdit(targetTask);
      } else if (gtdState === 'InProgress') {
        alert("执行中：请添加开始日期 🛫 或计划日期 ⏳ ，日期需在今天或之前。");
        handleOpenEdit(targetTask);
      } else {
        setTasks(prev => prev.map(task => {
          if (task.id === taskId) {
            const updated = { ...task, startDate: undefined, scheduledDate: undefined, dependsOn: undefined };
            return parseObsidianTask(stringifyTask(updated as ObsidianTask)) || updated;
          }
          return task;
        }));
      }
    }
  };

  const sortTasks = (taskList: ObsidianTask[]) => {
    return [...taskList].sort((a, b) => {
      const aProj = a.description.toLowerCase().includes('#project') ? 1 : 0;
      const bProj = b.description.toLowerCase().includes('#project') ? 1 : 0;
      if (aProj !== bProj) return bProj - aProj;
      return a.description.localeCompare(b.description);
    });
  };

  const EisenhowerMatrix = useMemo(() => {
    const q1 = tasks.filter(t => t.isImportant && t.isUrgent && t.status === 'open');
    const q2 = tasks.filter(t => t.isImportant && !t.isUrgent && t.status === 'open');
    const q3 = tasks.filter(t => !t.isImportant && t.isUrgent && t.status === 'open');
    const q4 = tasks.filter(t => !t.isImportant && !t.isUrgent && t.status === 'open');
    
    const Quadrant = ({ title, desc, tasks: qTasks, color, data }: any) => (
      <div 
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={(e) => handleDrop(e, data)}
        className={`flex flex-col h-full min-h-[350px] border-2 border-dashed rounded-xl p-4 transition-all ${color} hover:border-solid hover:shadow-inner`}
      >
        <div className="mb-4">
          <h3 className="text-lg font-bold flex items-center justify-between">
            {title} <span className="text-xs bg-white/50 px-2 rounded-full border border-current">{qTasks.length}</span>
          </h3>
          <p className="text-[10px] opacity-60 uppercase tracking-widest">{desc}</p>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          {sortTasks(qTasks).map(t => <TaskCard key={t.id} task={t} onToggleStatus={toggleTaskStatus} onEdit={handleOpenEdit} onDelete={handleDeleteTask} />)}
          {qTasks.length === 0 && <div className="h-24 flex items-center justify-center border border-dashed rounded-lg opacity-30 text-xs font-medium">拖拽至此</div>}
        </div>
      </div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        <Quadrant title="重要且紧急 🔴" desc="Priority High + Due <= 3 days" tasks={q1} color="bg-rose-50 border-rose-200 text-rose-900" data={{isUrgent: true, isImportant: true}} />
        <Quadrant title="重要不紧急 🟢" desc="Priority High + No Due / Due > 3" tasks={q2} color="bg-emerald-50 border-emerald-200 text-emerald-900" data={{isUrgent: false, isImportant: true}} />
        <Quadrant title="不重要但紧急 🟡" desc="Normal Priority + Due <= 3 days" tasks={q3} color="bg-amber-50 border-amber-200 text-amber-900" data={{isUrgent: true, isImportant: false}} />
        <Quadrant title="不重要不紧急 ⚪" desc="Normal Priority + No Due / Due > 3" tasks={q4} color="bg-slate-50 border-slate-200 text-slate-600" data={{isUrgent: false, isImportant: false}} />
      </div>
    );
  }, [tasks, toggleTaskStatus, viewMode, handleOpenEdit, handleDeleteTask]);

  const GTDMatrix = useMemo(() => {
    const inbox = tasks.filter(t => t.gtdState === 'Inbox' && t.status === 'open');
    const processed = tasks.filter(t => t.gtdState === 'NextActions' && t.status === 'open');
    const inProgress = tasks.filter(t => t.gtdState === 'InProgress' && t.status === 'open');
    const done = tasks.filter(t => t.status === 'completed');

    const Quadrant = ({ title, desc, tasks: qTasks, color, state }: any) => (
      <div 
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={(e) => handleDrop(e, { gtdState: state })}
        className={`flex flex-col h-full min-h-[350px] border-2 border-dashed rounded-xl p-4 transition-all ${color} hover:border-solid hover:shadow-inner`}
      >
        <div className="mb-4">
          <h3 className="text-lg font-bold flex items-center justify-between">
            {title} <span className="text-xs bg-white/50 px-2 rounded-full border border-current">{qTasks.length}</span>
          </h3>
          <p className="text-[10px] opacity-60 uppercase tracking-widest">{desc}</p>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          {sortTasks(qTasks).map(t => <TaskCard key={t.id} task={t} onToggleStatus={toggleTaskStatus} onEdit={handleOpenEdit} onDelete={handleDeleteTask} />)}
          {qTasks.length === 0 && <div className="h-24 flex items-center justify-center border border-dashed rounded-lg opacity-30 text-xs font-medium">拖拽至此</div>}
        </div>
      </div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        <Quadrant title="收集箱 (Inbox)" desc="未处理的任务 / 默认分类" tasks={inbox} color="bg-sky-50 border-sky-200 text-sky-900" state="Inbox" />
        <Quadrant title="已处理/授权" desc="Waiting / Dependencies / Blocked" tasks={processed} color="bg-purple-50 border-purple-200 text-purple-900" state="NextActions" />
        <Quadrant title="执行中" desc="Started / Scheduled (Date <= Today)" tasks={inProgress} color="bg-teal-50 border-teal-200 text-teal-900" state="InProgress" />
        <Quadrant title="已完成" desc="已勾选完成的任务" tasks={done} color="bg-slate-100 border-slate-300 text-slate-500" state="Done" />
      </div>
    );
  }, [tasks, toggleTaskStatus, viewMode, handleOpenEdit, handleDeleteTask]);

  const generateMarkdown = () => {
    const genMdQuad = (title: string, taskList: ObsidianTask[]) => {
      if (taskList.length === 0) return '';
      const sorted = sortTasks(taskList);
      const tasksMd = sorted.map(t => stringifyTask(t)).join('\n');
      return `### ${title}\n${tasksMd}\n\n`;
    };

    let mdList = '';
    let tableHeader = '';

    if (viewMode === 'eisenhower') {
      tableHeader = `| | |\n| ----------------- | ------------ |\n| ![[#重要且紧急 🔴]] | ![[#重要不紧急 🟢]] |\n| ![[#不重要但紧急 🟡]] | ![[#不重要不紧急 ⚪]] |\n| | |\n\n`;

      mdList += genMdQuad("重要且紧急 🔴", tasks.filter(t => t.isImportant && t.isUrgent && t.status === 'open'));
      mdList += genMdQuad("重要不紧急 🟢", tasks.filter(t => t.isImportant && !t.isUrgent && t.status === 'open'));
      mdList += genMdQuad("不重要但紧急 🟡", tasks.filter(t => !t.isImportant && t.isUrgent && t.status === 'open'));
      mdList += genMdQuad("不重要不紧急 ⚪", tasks.filter(t => !t.isImportant && !t.isUrgent && t.status === 'open'));
    } else {
      tableHeader = `| | |\n| ----------------- | ------------ |\n| ![[#收集箱 (Inbox)]] | ![[#已处理/授权]] |\n| ![[#执行中]] | ![[#已完成]] |\n| | |\n\n`;

      mdList += genMdQuad("收集箱 (Inbox)", tasks.filter(t => t.gtdState === 'Inbox' && t.status === 'open'));
      mdList += genMdQuad("已处理/授权", tasks.filter(t => t.gtdState === 'NextActions' && t.status === 'open'));
      mdList += genMdQuad("执行中", tasks.filter(t => t.gtdState === 'InProgress' && t.status === 'open'));
      mdList += genMdQuad("已完成", tasks.filter(t => t.status === 'completed'));
    }
    
    return (tableHeader + mdList).trim();
  };

  const handleExportTasks = () => {
    setExportTitle('Export Obsidian Tasks (Grouped Markdown List)');
    setExportText(generateMarkdown());
    setIsExportModalOpen(true);
  };

  const handleExportNote = () => {
    const today = new Date().toISOString().split('T')[0];
    const content = generateMarkdown();
    const title = viewMode === 'eisenhower' ? 'Eisenhower Matrix' : 'GTD Flow';
    
    const noteContent = `---
cssclasses:
  - matrix
obsidianUIMode: preview
created: ${today}
aliases:
area:
type: task
status: active
due_date:
priority: 3
tags:
source:
keywords:
---

# ${title}

${content}`;

    setExportTitle('Export Full Note (YAML + Content)');
    setExportText(noteContent);
    setIsExportModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-200">M</div>
          <div><h1 className="text-xl font-bold text-slate-900 leading-tight">Obsidian Matrix</h1><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tasks Dashboard</p></div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button onClick={() => setViewMode('eisenhower')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${viewMode === 'eisenhower' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}>Eisenhower</button>
          <button onClick={() => setViewMode('gtd')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${viewMode === 'gtd' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}>GTD Flow</button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => { setTaskForm(INITIAL_TASK_FORM); setEditingTaskId(null); setIsTaskModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">+ Add Task</button>
          <button onClick={() => setIsImportModalOpen(true)} className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all">Import MD</button>
          <button onClick={handleExportTasks} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-all">Export Tasks</button>
          <button onClick={handleExportNote} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-all">Export Note</button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full">
        {tasks.length > 0 ? (viewMode === 'eisenhower' ? EisenhowerMatrix : GTDMatrix) : (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mb-8"><span className="text-5xl">⚡</span></div>
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">No Tasks Loaded</h2>
            <p className="text-slate-500 max-sm-sm mb-10 leading-relaxed font-medium">Get started by importing your Markdown task list from Obsidian or creating a new one.</p>
            <div className="flex gap-4">
              <button onClick={() => setIsImportModalOpen(true)} className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all">Import List</button>
              <button onClick={() => setIsTaskModalOpen(true)} className="px-10 py-4 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all">New Task</button>
            </div>
          </div>
        )}
      </main>

      {/* Task Edit/Create Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] text-[#cccccc] rounded-2xl shadow-2xl w-full max-w-[550px] overflow-hidden flex flex-col border border-[#333333] animate-in zoom-in duration-200">
            <div className="p-5 flex items-center justify-between border-b border-[#333333] bg-[#252525]">
              <h3 className="text-base font-bold text-white tracking-tight">{editingTaskId ? 'Edit Obsidian Task' : 'Create New Task'}</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-[#999999] hover:text-white text-2xl transition-colors">&times;</button>
            </div>
            <form onSubmit={handleTaskSubmit} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-black text-[#666666] uppercase tracking-widest mb-2">Task Description</label>
                <textarea
                  required
                  rows={3}
                  value={taskForm.description}
                  onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Task content... (use #project for pinning)"
                  className="w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl border border-[#3e3e3e] focus:border-indigo-500 outline-none text-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#666666] uppercase tracking-widest mb-2">Priority</label>
                  <select 
                    value={taskForm.priority}
                    onChange={e => setTaskForm({...taskForm, priority: e.target.value as Priority})}
                    className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-xl px-3 py-2 text-xs outline-none text-white h-10 appearance-none focus:border-indigo-500"
                  >
                    <option value={Priority.None}>No Priority (Normal)</option>
                    <option value={Priority.Highest}>🔺 Highest</option>
                    <option value={Priority.High}>⏫ High</option>
                    <option value={Priority.Medium}>🔼 Medium</option>
                    <option value={Priority.Low}>🔽 Low</option>
                    <option value={Priority.Lowest}>⏬ Lowest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#666666] uppercase tracking-widest mb-2">Status</label>
                  <select 
                    value={taskForm.status}
                    onChange={e => setTaskForm({...taskForm, status: e.target.value as any})}
                    className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-xl px-3 py-2 text-xs outline-none text-white h-10 appearance-none focus:border-indigo-500"
                  >
                    <option value="open">Todo [ ]</option>
                    <option value="completed">Done [x]</option>
                    <option value="cancelled">Cancelled [-]</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#666666] uppercase tracking-widest mb-2">📅 Due Date</label>
                  <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-xl px-3 py-2 text-xs outline-none text-white h-10 focus:border-indigo-500 color-scheme-dark" style={{colorScheme: 'dark'}}/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#666666] uppercase tracking-widest mb-2">🛫 Start Date</label>
                  <input type="date" value={taskForm.startDate} onChange={e => setTaskForm({...taskForm, startDate: e.target.value})} className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-xl px-3 py-2 text-xs outline-none text-white h-10 focus:border-indigo-500 color-scheme-dark" style={{colorScheme: 'dark'}}/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#666666] uppercase tracking-widest mb-2">⏳ Scheduled</label>
                  <input type="date" value={taskForm.scheduledDate} onChange={e => setTaskForm({...taskForm, scheduledDate: e.target.value})} className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-xl px-3 py-2 text-xs outline-none text-white h-10 focus:border-indigo-500 color-scheme-dark" style={{colorScheme: 'dark'}}/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#666666] uppercase tracking-widest mb-2">🔁 Recurrence</label>
                  <input type="text" placeholder="every day" value={taskForm.recurrence} onChange={e => setTaskForm({...taskForm, recurrence: e.target.value})} className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-xl px-3 py-2 text-xs outline-none text-white h-10 focus:border-indigo-500"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#666666] uppercase tracking-widest mb-2">🆔 Task ID</label>
                  <input type="text" value={taskForm.taskId} onChange={e => setTaskForm({...taskForm, taskId: e.target.value})} className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-xl px-3 py-2 text-xs outline-none text-white h-10 focus:border-indigo-500"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#666666] uppercase tracking-widest mb-2">⛔ Dependency (ID)</label>
                  <input type="text" value={taskForm.dependsOn} onChange={e => setTaskForm({...taskForm, dependsOn: e.target.value})} className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-xl px-3 py-2 text-xs outline-none text-white h-10 focus:border-indigo-500"/>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-indigo-900/20">{editingTaskId ? 'Save Task' : 'Add to List'}</button>
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-8 py-3.5 bg-[#2a2a2a] hover:bg-[#333333] text-[#999999] rounded-xl text-sm font-bold transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Bulk Import Markdown</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl transition-all">&times;</button>
            </div>
            <div className="p-8">
              <p className="text-sm text-slate-500 mb-5 font-medium leading-relaxed">Paste your Markdown tasks list below. Each task should start with <code>- [ ]</code>, <code>- [x]</code>, or <code>- [-]</code>.</p>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="- [ ] Sample task 📅 2025-12-30"
                className="w-full h-72 p-5 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setIsImportModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:text-slate-800 transition-all">Discard</button>
              <button onClick={handleImport} className="px-10 py-2.5 bg-indigo-600 text-white font-black rounded-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Process Tasks</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="p-6 border-b flex items-center justify-between bg-white">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{exportTitle}</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl transition-all">&times;</button>
            </div>
            <div className="p-8">
              <textarea
                readOnly
                value={exportText}
                className="w-full h-80 p-5 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-[10px] outline-none leading-relaxed text-slate-700"
              />
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <button 
                onClick={() => { navigator.clipboard.writeText(exportText); alert('Export copied! Paste this back into your Obsidian vault.'); }}
                className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all"
              >
                Copy Content
              </button>
              <button onClick={() => setIsExportModalOpen(false)} className="px-8 py-3 font-bold text-slate-500 hover:text-slate-800 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-10 text-center border-t border-slate-200 bg-white">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Power User Controls</p>
        <p className="text-xs text-slate-500 font-medium">Drag items to prioritize. Use <span className="text-indigo-600 font-bold">#project</span> to pin tasks to the top.</p>
      </footer>
    </div>
  );
};

export default App;