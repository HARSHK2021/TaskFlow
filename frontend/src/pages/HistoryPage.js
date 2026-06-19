import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subMonths } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';

const CATEGORIES = ['all','health','study','work','personal','finance','other'];

export default function HistoryPage() {
  const { isGuest } = useAuth();
  const { fetchTasks } = useTasks();
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: 'all', completed: null, search: '' });
  const [expandedMonth, setExpandedMonth] = useState(null);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      if (isGuest) {
        const tasks = await fetchTasks({});
        const monthly = {};
        tasks.forEach(t => {
          const mk = t.date?.substring(0, 7);
          if (!monthly[mk]) monthly[mk] = { total: 0, completed: 0 };
          monthly[mk].total++;
          if (t.completed) monthly[mk].completed++;
        });
        setHistory(tasks);
        setSummary(monthly);
      } else {
        const res = await api.get('/analytics/history');
        setHistory(res.data.tasks || []);
        setSummary(res.data.monthlySummary || {});
      }
    } catch {}
    setLoading(false);
  };

  const filtered = history.filter(t => {
    if (filter.category !== 'all' && t.category !== filter.category) return false;
    if (filter.completed !== null && t.completed !== filter.completed) return false;
    if (filter.search && !t.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  // Group by month
  const grouped = {};
  filtered.forEach(t => {
    const mk = t.date?.substring(0, 7);
    if (!grouped[mk]) grouped[mk] = [];
    grouped[mk].push(t);
  });

  const months = Object.keys(grouped).sort().reverse();

  const priorityColors = { low: '#10b981', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-white/40 text-xs uppercase tracking-wider">History</p>
        <h1 className="font-display text-xl font-bold text-white">Task History</h1>
      </div>

      {/* Search */}
      <input
        placeholder="🔍 Search tasks..."
        value={filter.search}
        onChange={e => setFilter(p => ({ ...p, search: e.target.value }))}
        className="input-field"
      />

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {['all', 'completed', 'pending'].map(s => (
            <button key={s}
              onClick={() => setFilter(p => ({ ...p, completed: s === 'all' ? null : s === 'completed' }))}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize
                ${(s === 'all' && filter.completed === null) || (s === 'completed' && filter.completed === true) || (s === 'pending' && filter.completed === false)
                  ? 'bg-primary-500 text-white' : 'glass text-white/50'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(c => (
            <button key={c}
              onClick={() => setFilter(p => ({ ...p, category: c }))}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all
                ${filter.category === c ? 'bg-accent-purple text-white' : 'glass text-white/50'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-20 shimmer" />)}
        </div>
      ) : months.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-4xl mb-2">📂</div>
          <p className="text-white/40 text-sm">No history yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {months.map(month => {
            const monthTasks = grouped[month] || [];
            const ms = summary[month] || {};
            const rate = ms.total > 0 ? Math.round(ms.completed / ms.total * 100) : 0;
            const isExpanded = expandedMonth === month;

            return (
              <motion.div key={month} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                <button
                  className="w-full flex items-center justify-between"
                  onClick={() => setExpandedMonth(isExpanded ? null : month)}
                >
                  <div className="text-left">
                    <p className="font-semibold text-white">
                      {format(new Date(month + '-01'), 'MMMM yyyy')}
                    </p>
                    <p className="text-white/40 text-xs">{monthTasks.length} tasks · {rate}% completion</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-lg font-bold ${rate >= 80 ? 'text-emerald-400' : rate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {rate}%
                      </span>
                    </div>
                    <span className={`text-white/40 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {/* Mini progress bar */}
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-purple"
                    style={{ width: `${rate}%` }} />
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        {monthTasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-3 py-1.5">
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0`}
                              style={{ background: priorityColors[task.priority] || '#6366f1' }}
                            />
                            <span className="text-lg">{task.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${task.completed ? 'line-through text-white/30' : 'text-white/80'}`}>
                                {task.title}
                              </p>
                              <p className="text-white/20 text-xs">{format(new Date(task.date), 'MMM d')} · {task.category}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${task.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                              {task.completed ? '✓' : '○'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
