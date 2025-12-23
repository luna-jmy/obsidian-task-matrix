
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ObsidianTask, ViewMode, Priority, GTDState } from './types';
import { parseObsidianTask, stringifyTask } from './utils/parser';
import { TaskCard } from './components/TaskCard';

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
  
  const [inputText, setInputText] = useState('');
  const [exportText, setExportText] = useState('');
  const [exportTitle, setExportTitle] = useState('');
  const [taskForm, setTaskForm] = useState(INITIAL_TASK_FORM);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const getDynamicGTDState = useCallback((task: ObsidianTask, allTasks: ObsidianTask[]): GTDState => {
    // 优先级 1: 已完成
    if (task.status === 'completed') return 'Done';

    const descLower = task.description.toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];

    // 检查是否有未完成的被依赖项
    const hasUnfinishedDependency = task.dependsOn && allTasks.some(t => t.taskId === task.dependsOn && t.status !== 'completed');

    // 优先级 2: 已处理/授权 (Waiting/Delegated)
    const hasWaitingTag = descLower.includes('#waiting') || descLower.includes('#delegated') || descLower.includes('#blocked');
    if (hasUnfinishedDependency || hasWaitingTag) return 'NextActions'; 

    // 优先级 3: 执行中 (In Progress)
    const hasStartedTag = descLower.includes('#started') || descLower.includes('#doing') || descLower.includes('#active') || descLower.includes('#next');
    const isStartedByDate = (task.startDate && task.startDate <= todayStr) || (task.scheduledDate && task.scheduledDate <= todayStr);
    const isWorkingStatus = task.originalLine && task.originalLine.includes('[/]');

    if (hasStartedTag || isStartedByDate || isWorkingStatus) return 'InProgress';
    
    // 优先级 4: 收集箱 (Inbox)
    return 'Inbox';
  }, []);

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

  const handleDrop = (e: React.DragEvent, targetData: any) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const todayStr = new Date().toISOString().split('T')[0];

    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        let updated = { ...task };

        if (viewMode === 'eisenhower') {
          const { isUrgent, isImportant } = targetData;
          updated.priority = isImportant ? Priority.High : Priority.None;
          // 拖拽到紧急象限时，如果没有截止日期，自动设为今天
          if (isUrgent && !task.dueDate) {
            updated.dueDate = todayStr;
          } else if (!isUrgent && task.dueDate === todayStr) {
            // 如果是从紧急拖拽出来且截止日期正好是今天，则移除
            updated.dueDate = undefined;
          }
        } else {
          const { gtdState } = targetData;
          if (gtdState === 'Done') {
            updated.status = 'completed';
            updated.doneDate = todayStr;
          } else if (gtdState === 'InProgress' || gtdState === 'NextActions') {
            // 打开编辑框处理
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

        const line = stringifyTask(updated as ObsidianTask);
        return parseObsidianTask(line) || updated;
      }
      return task;
    }));
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.description.trim()) return;

    let finalTaskId = taskForm.taskId;
    // 如果勾选了 Has Next Action 且当前没有 ID，则强制生成一个
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

    let savedTask: ObsidianTask;

    if (editingTaskId) {
      setTasks(prev => prev.map(t => {
        if (t.id === editingTaskId) {
          const line = stringifyTask({ ...t, ...taskData } as ObsidianTask);
          const updated = parseObsidianTask(line) || { ...t, ...taskData };
          savedTask = updated as ObsidianTask;
          return updated;
        }
        return t;
      }));
    } else {
      const line = stringifyTask({ id: Math.random().toString(), ...taskData } as any);
      savedTask = parseObsidianTask(line)!;
      setTasks(prev => [...prev, savedTask]);
    }

    if (taskForm.hasNextAction) {
      // 保持模态框开启，预填下一个任务
      setTaskForm({
        ...INITIAL_TASK_FORM,
        dependsOn: finalTaskId || '',
      });
      setEditingTaskId(null);
    } else {
      setTaskForm(INITIAL_TASK_FORM);
      setEditingTaskId(null);
      setIsTaskModalOpen(false);
    }
  };

  // Fix: Implement the missing handleImport function
  const handleImport = useCallback(() => {
    const lines = inputText.split('\n');
    const newTasks: ObsidianTask[] = [];
    lines.forEach(line => {
      if (line.trim()) {
        const task = parseObsidianTask(line);
        if (task) {
          newTasks.push(task);
        }
      }
    });
    
    if (newTasks.length > 0) {
      setTasks(prev => [...prev, ...newTasks]);
    }
    
    setInputText('');
    setIsImportModalOpen(false);
  }, [inputText]);

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'open' ? 'completed' : 'open';
        const updated = { ...t, status: nextStatus, doneDate: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined };
        return parseObsidianTask(stringifyTask(updated as ObsidianTask)) || updated;
      }
      return t;
    }));
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

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
        {[...qTasks].sort((a,b) => (a.description.toLowerCase().includes('#project') ? -1 : 1)).map(t => (
          <TaskCard key={t.id} task={t} onToggleStatus={toggleTaskStatus} onEdit={handleOpenEdit} onDelete={handleDeleteTask} />
        ))}
      </div>
    </div>
  );

  const e_q1 = useMemo(() => tasks.filter(t => t.isImportant && t.isUrgent && t.status === 'open'), [tasks]);
  const e_q2 = useMemo(() => tasks.filter(t => t.isImportant && !t.isUrgent && t.status === 'open'), [tasks]);
  const e_q3 = useMemo(() => tasks.filter(t => !t.isImportant && t.isUrgent && t.status === 'open'), [tasks]);
  const e_q4 = useMemo(() => tasks.filter(t => !t.isImportant && !t.isUrgent && t.status === 'open'), [tasks]);

  const g_inbox = useMemo(() => tasks.filter(t => t.status === 'open' && getDynamicGTDState(t, tasks) === 'Inbox'), [tasks, getDynamicGTDState]);
  const g_waiting = useMemo(() => tasks.filter(t => t.status === 'open' && getDynamicGTDState(t, tasks) === 'NextActions'), [tasks, getDynamicGTDState]);
  const g_doing = useMemo(() => tasks.filter(t => t.status === 'open' && getDynamicGTDState(t, tasks) === 'InProgress'), [tasks, getDynamicGTDState]);
  const g_done = useMemo(() => tasks.filter(t => t.status === 'completed'), [tasks]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">M</div>
          <div><h1 className="text-xl font-bold text-slate-900 leading-tight">Obsidian Matrix</h1><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">TASKS DASHBOARD</p></div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button onClick={() => setViewMode('eisenhower')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${viewMode === 'eisenhower' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}>EISENHOWER</button>
          <button onClick={() => setViewMode('gtd')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${viewMode === 'gtd' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}>GTD FLOW</button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => { setTaskForm(INITIAL_TASK_FORM); setEditingTaskId(null); setIsTaskModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100">+ Add Task</button>
          <button onClick={() => setIsImportModalOpen(true)} className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl">Import MD</button>
          <button onClick={() => { setExportTitle('Export Tasks'); setExportText(tasks.map(stringifyTask).join('\n')); setIsExportModalOpen(true); }} className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold rounded-xl">Export Tasks</button>
          <button onClick={() => { setExportTitle('Export Note'); setExportText(tasks.map(stringifyTask).join('\n')); setIsExportModalOpen(true); }} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl">Export Note</button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full">
        {tasks.length > 0 ? (
          viewMode === 'eisenhower' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <Quadrant title="重要且紧急 🔴" desc="Priority High + Due <= 3 days" tasks={e_q1} color="bg-rose-50 border-rose-200 text-rose-900" data={{isUrgent: true, isImportant: true}} />
              <Quadrant title="重要不紧急 🟢" desc="Priority High + No Due / Due > 3" tasks={e_q2} color="bg-emerald-50 border-emerald-200 text-emerald-900" data={{isUrgent: false, isImportant: true}} />
              <Quadrant title="不重要但紧急 🟡" desc="Normal Priority + Due <= 3 days" tasks={e_q3} color="bg-amber-50 border-amber-200 text-amber-900" data={{isUrgent: true, isImportant: false}} />
              <Quadrant title="不重要不紧急 ⚪" desc="Normal Priority + No Due / Due > 3" tasks={e_q4} color="bg-slate-50 border-slate-200 text-slate-600" data={{isUrgent: false, isImportant: false}} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <Quadrant title="收集箱 (Inbox)" desc="未处理的任务" tasks={g_inbox} color="bg-sky-50 border-sky-200 text-sky-900" state="Inbox" />
              <Quadrant title="已授权/等待" desc="Waiting / Blocked" tasks={g_waiting} color="bg-purple-50 border-purple-200 text-purple-900" state="NextActions" />
              <Quadrant title="执行中" desc="Started / Scheduled Today" tasks={g_doing} color="bg-teal-50 border-teal-200 text-teal-900" state="InProgress" />
              <Quadrant title="已完成" desc="Completed tasks" tasks={g_done} color="bg-slate-100 border-slate-300 text-slate-500" state="Done" />
            </div>
          )
        ) : (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-indigo-100 rounded-full animate-pulse opacity-50 scale-125"></div>
              <span className="text-5xl relative z-10 text-orange-500">⚡</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">No Tasks Loaded</h2>
            <p className="text-slate-500 max-w-sm mb-10 leading-relaxed font-medium">Get started by importing your Markdown task list from Obsidian or creating a new one.</p>
            <div className="flex gap-4">
              <button onClick={() => setIsImportModalOpen(true)} className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-2xl shadow-indigo-200 hover:scale-105 transition-all">Import List</button>
              <button onClick={() => { setTaskForm(INITIAL_TASK_FORM); setEditingTaskId(null); setIsTaskModalOpen(true); }} className="px-10 py-4 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all">New Task</button>
            </div>
          </div>
        )}
      </main>

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white text-slate-700 rounded-3xl shadow-2xl w-full max-w-[550px] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingTaskId ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-3xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleTaskSubmit} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">TASK DESCRIPTION</label>
                <textarea required rows={3} value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} className="w-full bg-slate-50 text-slate-900 px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:bg-white outline-none text-sm shadow-inner" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PRIORITY</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value as Priority})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10">
                    <option value={Priority.None}>No Priority (Normal)</option>
                    <option value={Priority.Highest}>🔺 Highest</option>
                    <option value={Priority.High}>⏫ High</option>
                    <option value={Priority.Medium}>🔼 Medium</option>
                    <option value={Priority.Low}>🔽 Low</option>
                    <option value={Priority.Lowest}>⏬ Lowest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">STATUS</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value as any})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10">
                    <option value="open">Todo [ ]</option>
                    <option value="completed">Done [x]</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">📅 DUE DATE</label>
                  <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1 text-sky-600">🛫 START DATE</label>
                  <input type="date" value={taskForm.startDate} onChange={e => setTaskForm({...taskForm, startDate: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1 text-orange-600">⏳ SCHEDULED</label>
                  <input type="date" value={taskForm.scheduledDate} onChange={e => setTaskForm({...taskForm, scheduledDate: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1 text-sky-500">🔁 RECURRENCE</label>
                  <input type="text" placeholder="every day" value={taskForm.recurrence} onChange={e => setTaskForm({...taskForm, recurrence: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">🆔 TASK ID</label>
                  <input type="text" placeholder="e.g. action-1" value={taskForm.taskId} onChange={e => setTaskForm({...taskForm, taskId: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10 font-mono"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1 text-rose-600">⛔ DEPENDENCY (ID)</label>
                  <input type="text" placeholder="ID of parent task" value={taskForm.dependsOn} onChange={e => setTaskForm({...taskForm, dependsOn: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none h-10 font-mono"/>
                </div>
              </div>
              <div className="pt-2 flex items-center gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <input type="checkbox" id="hasNextAction" checked={taskForm.hasNextAction} className="w-5 h-5 rounded border-slate-300 text-indigo-600 cursor-pointer" onChange={e => setTaskForm({...taskForm, hasNextAction: e.target.checked})} />
                <label htmlFor="hasNextAction" className="text-sm font-bold text-indigo-900 cursor-pointer">Has Next Action? <span className="text-[10px] block font-normal opacity-60">Automatically create dependent task after saving</span></label>
              </div>
              <div className="pt-6 flex gap-3">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl text-sm transition-all shadow-xl shadow-indigo-200">Save Changes</button>
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between font-black">Import Markdown</div>
            <div className="p-8"><textarea value={inputText} onChange={(e) => setInputText(e.target.value)} className="w-full h-72 p-5 border border-slate-200 rounded-2xl font-mono text-xs outline-none" placeholder="- [ ] Sample Task 📅 2024-12-30" /></div>
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3"><button onClick={() => setIsImportModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500">Discard</button><button onClick={handleImport} className="px-10 py-2.5 bg-indigo-600 text-white font-black rounded-xl">Process</button></div>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b font-black">{exportTitle}</div>
            <div className="p-8"><textarea readOnly value={exportText} className="w-full h-80 p-5 border border-slate-200 rounded-2xl bg-slate-50 font-mono text-[10px]" /></div>
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3"><button onClick={() => { navigator.clipboard.writeText(exportText); alert('Export copied!'); }} className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl">Copy Content</button><button onClick={() => setIsExportModalOpen(false)} className="px-8 py-3 font-bold text-slate-500">Close</button></div>
          </div>
        </div>
      )}

      <footer className="py-10 text-center border-t border-slate-200 bg-white">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">POWER USER CONTROLS</p>
        <p className="text-xs text-slate-500 font-medium">Drag items to prioritize. Use <span className="text-indigo-600 font-bold">#project</span> to pin tasks to the top.</p>
      </footer>
    </div>
  );
};

export default App;
