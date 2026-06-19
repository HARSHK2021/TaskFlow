import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useTasks } from '../context/TaskContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['health','study','work','personal','finance','other'];
const ICONS = ['🏃','💪','📚','💻','🧘','🥗','💧','😴','🎸','✍️','🎯','🌅','🏋️','🚴','🧹','💰','🌿','🎨'];
const COLORS = ['#6366f1','#8b5cf6','#ec4899','#10b981','#f59e0b','#06b6d4','#ef4444','#3b82f6'];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function HabitModal({ habit, onClose, onSave }) {
  const [form, setForm] = useState({
    name: habit?.name || '',
    category: habit?.category || 'health',
    icon: habit?.icon || '🎯',
    color: habit?.color || '#6366f1',
    frequency: habit?.frequency || 'daily',
    targetDays: habit?.targetDays || [0,1,2,3,4,5,6],
    reminderTime: habit?.reminderTime || '',
  });

  const toggleDay = (i) => setForm(p => ({
    ...p,
    targetDays: p.targetDays.includes(i) ? p.targetDays.filter(d => d !== i) : [...p.targetDays, i]
  }));

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Habit name required'); return; }
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
        <h2 className="font-display font-bold text-white">{habit ? 'Edit Habit' : 'New Habit'}</h2>

        {/* Icon picker */}
        <div>
          <label className="text-white/50 text-xs mb-2 block">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(icon => (
              <button key={icon} onClick={() => setForm(p => ({ ...p, icon }))}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all
                  ${form.icon === icon ? 'scale-110' : 'bg-white/5 hover:bg-white/10'}`}
                style={form.icon === icon ? { background: form.color } : {}}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-white/50 text-xs mb-2 block">Color</label>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'scale-125 ring-2 ring-white/40' : ''}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>

        <div>
          <label className="text-white/50 text-xs mb-1 block">Habit Name *</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Morning Run" className="input-field" autoFocus />
        </div>

        <div>
          <label className="text-white/50 text-xs mb-1 block">Category</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input-field capitalize">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Target days */}
        <div>
          <label className="text-white/50 text-xs mb-2 block">Target Days</label>
          <div className="flex gap-2">
            {DAYS.map((d, i) => (
              <button key={d} onClick={() => toggleDay(i)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all
                  ${form.targetDays.includes(i) ? 'text-white' : 'bg-white/5 text-white/30'}`}
                style={form.targetDays.includes(i) ? { background: form.color } : {}}>
                {d[0]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-white/50 text-xs mb-1 block">Reminder Time (optional)</label>
          <input type="time" value={form.reminderTime} onChange={e => setForm(p => ({ ...p, reminderTime: e.target.value }))}
            className="input-field" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <motion.button onClick={handleSave} whileTap={{ scale: 0.97 }} className="btn-primary flex-1">
            {habit ? 'Save' : 'Create Habit'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HabitsPage() {
  const { habits, fetchHabits, createHabit, toggleHabit, deleteHabit } = useTasks();
  const [modal, setModal] = useState(null);
  const [view, setView] = useState('today'); // today | all
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayDayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;

  useEffect(() => { fetchHabits(); }, []);

  const todayHabits = habits.filter(h => h.targetDays?.includes(todayDayIdx));
  const displayHabits = view === 'today' ? todayHabits : habits;

  const completedCount = todayHabits.filter(h => h.completionHistory?.[todayStr]).length;
  const pct = todayHabits.length > 0 ? Math.round(completedCount / todayHabits.length * 100) : 0;

  const handleSave = async (formData) => {
    await createHabit(formData);
    setModal(null);
  };

  const handleToggle = async (habit) => {
    const done = !habit.completionHistory?.[todayStr];
    await toggleHabit(habit.id, todayStr, done);
    if (done) toast.success(`${habit.icon} ${habit.name} done! 🎉`);
  };

  // Get last 7 days completion for a habit
  const getLast7 = (habit) => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const ds = format(d, 'yyyy-MM-dd');
      return habit.completionHistory?.[ds] ? 1 : 0;
    });
  };

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wider">Habits</p>
          <h1 className="font-display text-xl font-bold text-white">Habit Tracker</h1>
        </div>
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => setModal({})} className="btn-primary py-2 px-4 text-sm">
          + New
        </motion.button>
      </div>

      {/* Today's progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-white">Today's Habits</h2>
            <p className="text-white/40 text-sm">{completedCount}/{todayHabits.length} completed</p>
          </div>
          <div className="text-right">
            <p className={`font-display text-2xl font-bold ${pct === 100 ? 'text-emerald-400' : pct > 50 ? 'text-amber-400' : 'text-primary-400'}`}>
              {pct}%
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: pct === 100 ? '#10b981' : 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
          />
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 bg-white/5 rounded-xl p-1">
        {['today','all'].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
              ${view === v ? 'bg-primary-500 text-white' : 'text-white/40 hover:text-white/70'}`}>
            {v === 'today' ? `Today (${todayHabits.length})` : `All Habits (${habits.length})`}
          </button>
        ))}
      </div>

      {/* Habits list */}
      {displayHabits.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center py-10">
          <div className="text-4xl mb-2">⚡</div>
          <p className="text-white/40 text-sm">No habits yet</p>
          <p className="text-white/20 text-xs mt-1">Create your first habit to get started</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {displayHabits.map((habit, i) => {
              const done = habit.completionHistory?.[todayStr];
              const last7 = getLast7(habit);
              return (
                <motion.div key={habit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: `${habit.color}25`, border: `1px solid ${habit.color}40` }}>
                      {habit.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${done ? 'line-through text-white/40' : 'text-white'}`}>{habit.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-white/30 text-xs capitalize">{habit.category}</span>
                        {habit.currentStreak > 0 && (
                          <span className="text-xs flex items-center gap-0.5">
                            <span className="streak-fire inline-block">🔥</span>
                            <span style={{ color: habit.color }}>{habit.currentStreak}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(habit)}
                        className={`habit-check ${done ? 'checked' : ''}`}
                        style={done
                          ? { background: habit.color, borderColor: habit.color }
                          : { borderColor: `${habit.color}60` }}>
                        {done && <span className="text-white text-sm">✓</span>}
                      </button>
                      <button onClick={() => deleteHabit(habit.id)} className="text-white/20 hover:text-red-400 text-sm">×</button>
                    </div>
                  </div>

                  {/* Last 7 days mini chart */}
                  <div className="flex gap-1 items-end">
                    <span className="text-white/20 text-xs mr-1">7d</span>
                    {last7.map((val, j) => (
                      <div key={j} className={`flex-1 rounded-sm transition-all ${val ? 'h-4' : 'h-2'}`}
                        style={{ background: val ? habit.color : 'rgba(255,255,255,0.1)' }} />
                    ))}
                    <span className="text-white/40 text-xs ml-1">{last7.filter(Boolean).length}/7</span>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 mt-2 pt-2 border-t border-white/5">
                    <span className="text-white/30 text-xs">🏆 Best: <span className="text-white/60">{habit.bestStreak}d</span></span>
                    <span className="text-white/30 text-xs">✅ Total: <span className="text-white/60">{habit.totalCompleted}</span></span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modal && <HabitModal habit={modal.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />}
      </AnimatePresence>
    </div>
  );
}
