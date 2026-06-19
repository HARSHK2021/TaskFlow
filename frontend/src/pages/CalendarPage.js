import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths, getDaysInMonth } from 'date-fns';
import { useTasks } from '../context/TaskContext';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };
const CATEGORIES = ['personal', 'health', 'study', 'work', 'finance', 'other'];
const TASK_TYPES = ['one_time', 'daily_habit', 'goal', 'reminder'];
const ICONS = ['✅', '💪', '📚', '💼', '🎯', '🏃', '🧘', '💡', '⭐', '🔥', '🎓', '💰'];

function TaskModal({ task, date, onClose, onSave, onDelete }) {
  const isNew = !task?.id;
  const [form, setForm] = useState({
    title: task?.title || '',
    category: task?.category || 'personal',
    priority: task?.priority || 'medium',
    taskType: task?.taskType || 'one_time',
    notes: task?.notes || '',
    icon: task?.icon || '✅',
    color: task?.color || '#6366f1',
    date: task?.date || date,
  });

  const update = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('Task title required'); return; }
    onSave(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-dark-700 rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto pb-28"
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2" />
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-white">{isNew ? 'New Task' : 'Edit Task'}</h2>
          {!isNew && (
            <button onClick={onDelete} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
          )}
        </div>

        {/* Icon picker */}
        <div>
          <label className="text-white/50 text-xs mb-2 block">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(icon => (
              <button key={icon} onClick={() => setForm(p => ({ ...p, icon }))}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all
                  ${form.icon === icon ? 'bg-primary-500 scale-110' : 'bg-white/5 hover:bg-white/10'}`}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-white/50 text-xs mb-1 block">Task Title *</label>
          <input value={form.title} onChange={update('title')} placeholder="What do you want to do?" className="input-field" autoFocus />
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-white/50 text-xs mb-1 block">Category</label>
            <select value={form.category} onChange={update('category')} className="input-field capitalize">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-white/50 text-xs mb-1 block">Priority</label>
            <select value={form.priority} onChange={update('priority')} className="input-field">
              {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="text-white/50 text-xs mb-1 block">Type</label>
          <select value={form.taskType} onChange={update('taskType')} className="input-field">
            {TASK_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="text-white/50 text-xs mb-1 block">Notes</label>
          <textarea value={form.notes} onChange={update('notes')} placeholder="Add notes..." rows={2}
            className="input-field resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <motion.button onClick={handleSave} whileTap={{ scale: 0.97 }} className="btn-primary flex-1">
            {isNew ? 'Create Task' : 'Save Changes'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CalendarPage() {
  const { tasks, fetchTasks, createTask, updateTask, deleteTask } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allTasks, setAllTasks] = useState([]);
  const [modal, setModal] = useState(null); // null | { task?, date }
  const selectedStr = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    loadMonthTasks();
  }, [currentDate]);

  const loadMonthTasks = async () => {
    const data = await fetchTasks({ month: currentDate.getMonth() + 1, year: currentDate.getFullYear() });
    setAllTasks(data);
  };

  const dayTasks = allTasks.filter(t => t.date === selectedStr);

  // Build calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;
  const padDays = Array(startPad).fill(null);

  const getDayStatus = (date) => {
    const ds = format(date, 'yyyy-MM-dd');
    const dt = allTasks.filter(t => t.date === ds);
    if (dt.length === 0) return 'empty';
    const done = dt.filter(t => t.completed).length;
    return done === dt.length ? 'all-done' : done > 0 ? 'partial' : 'has-tasks';
  };

  const handleSave = async (formData) => {
    try {
      if (modal.task?.id) {
        await updateTask(modal.task.id, formData);
        toast.success('Task updated');
      } else {
        await createTask({ ...formData, date: selectedStr });
      }
      setModal(null);
      loadMonthTasks();
    } catch {}
  };

  const handleDelete = async () => {
    if (!modal?.task?.id) return;
    await deleteTask(modal.task.id);
    setModal(null);
    loadMonthTasks();
  };

  const toggleTask = async (task) => {
    await updateTask(task.id, { completed: !task.completed });
    loadMonthTasks();
    if (!task.completed) toast.success('Task completed! 🎉');
  };

  const priorityClass = (p) => ({ low: 'bg-emerald-500/20 text-emerald-400', medium: 'bg-amber-500/20 text-amber-400', high: 'bg-orange-500/20 text-orange-400', urgent: 'bg-red-500/20 text-red-400' }[p] || '');

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wider">Calendar</p>
          <h1 className="font-display text-xl font-bold text-white">
            {format(currentDate, 'MMMM yyyy')}
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="glass-hover p-2 rounded-xl">
            ‹
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="glass px-3 py-1.5 rounded-xl text-xs text-primary-400 font-medium">
            Today
          </button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="glass-hover p-2 rounded-xl">
            ›
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="card p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="text-center text-white/30 text-xs font-medium py-1">{d}</div>
          ))}
        </div>
        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {padDays.map((_, i) => <div key={`pad-${i}`} />)}
          {days.map(day => {
            const status = getDayStatus(day);
            const isSel = isSameDay(day, selectedDate);
            const isT = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`cal-day relative mx-auto
                  ${isSel ? 'selected' : ''}
                  ${isT && !isSel ? 'today' : ''}
                  ${status === 'has-tasks' ? 'has-tasks' : ''}
                  ${status === 'all-done' ? 'all-done' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-white">{format(selectedDate, 'EEEE, MMM d')}</h2>
            <p className="text-white/40 text-xs">{dayTasks.length} tasks</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setModal({ date: selectedStr })}
            className="btn-primary py-2 px-4 text-sm"
          >
            + Add Task
          </motion.button>
        </div>

        {dayTasks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center py-10">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-white/40 text-sm">No tasks for this day</p>
            <p className="text-white/20 text-xs mt-1">Tap + to add a task</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {dayTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTask(task)}
                      className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
                        ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20 hover:border-primary-500'}`}
                    >
                      {task.completed && '✓'}
                    </button>
                    <div className="flex-1 min-w-0" onClick={() => setModal({ task })}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{task.icon}</span>
                        <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-white/30' : 'text-white'}`}>
                          {task.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${priorityClass(task.priority)}`}>{task.priority}</span>
                        <span className="text-white/30 text-xs capitalize">{task.category}</span>
                      </div>
                    </div>
                    <button onClick={() => setModal({ task })} className="text-white/20 hover:text-white/60 text-lg px-1">
                      ⋮
                    </button>
                  </div>
                  {task.notes && (
                    <p className="text-white/30 text-xs mt-2 pl-10 truncate">{task.notes}</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <TaskModal
            task={modal.task}
            date={selectedStr}
            onClose={() => setModal(null)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
