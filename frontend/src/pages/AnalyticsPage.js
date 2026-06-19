import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subMonths } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { format as fmtDate } from 'date-fns';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

function HeatmapCell({ level }) {
  const colors = ['#1f2937', '#312e81', '#4338ca', '#6366f1', '#818cf8'];
  return (
    <div
      className="w-3 h-3 rounded-sm transition-all"
      style={{ background: colors[level] || colors[0] }}
    />
  );
}

export default function AnalyticsPage() {
  const { isGuest } = useAuth();
  const { tasks, habits, fetchTasks, fetchHabits } = useTasks();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (isGuest) {
      loadGuestAnalytics();
    } else {
      loadAnalytics();
    }
  }, [currentMonth]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/monthly', {
        params: { month: currentMonth.getMonth() + 1, year: currentMonth.getFullYear() }
      });
      setAnalytics(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const loadGuestAnalytics = async () => {
    setLoading(true);
    const allTasks = await fetchTasks({ month: currentMonth.getMonth() + 1, year: currentMonth.getFullYear() });
    const allHabits = await fetchHabits();
    const total = allTasks.length;
    const done = allTasks.filter(t => t.completed).length;
    const rate = total > 0 ? Math.round(done / total * 100) : 0;

    // Build daily data
    const dailyMap = {};
    allTasks.forEach(t => {
      if (!dailyMap[t.date]) dailyMap[t.date] = { total: 0, done: 0 };
      dailyMap[t.date].total++;
      if (t.completed) dailyMap[t.date].done++;
    });

    const dailyCompletion = {};
    Object.entries(dailyMap).forEach(([d, v]) => {
      dailyCompletion[d] = v.total > 0 ? Math.round(v.done / v.total * 100) : 0;
    });

    setAnalytics({
      month: currentMonth.getMonth() + 1, year: currentMonth.getFullYear(),
      dailyCompletion, weeklyData: [], totalTasks: total, completedTasks: done,
      completionRate: rate, productivityScore: rate * 0.7,
      topHabits: allHabits.slice(0, 5).map(h => ({ name: h.name, icon: h.icon, color: h.color, completions: h.totalCompleted })),
      heatmapData: [],
    });
    setLoading(false);
  };

  if (loading) return (
    <div className="p-4 space-y-4">
      {[1,2,3].map(i => (
        <div key={i} className="card h-40 shimmer" />
      ))}
    </div>
  );

  const dailyChartData = analytics ? Object.entries(analytics.dailyCompletion)
    .slice(0, 30)
    .map(([date, pct]) => ({ day: date.split('-')[2], pct })) : [];

  const categoryPie = (() => {
    const cats = {};
    (tasks || []).forEach(t => { cats[t.category] = (cats[t.category] || 0) + 1; });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  })();

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wider">Analytics</p>
          <h1 className="font-display text-xl font-bold text-white">Productivity</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="glass-hover p-2 rounded-xl text-white/70">‹</button>
          <span className="glass px-3 py-1.5 rounded-xl text-xs text-white/70">{format(currentMonth, 'MMM yyyy')}</span>
          <button onClick={() => setCurrentMonth(new Date())} className="glass-hover p-2 rounded-xl text-white/70">›</button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Tasks', value: analytics?.totalTasks || 0, icon: '📋', color: 'text-primary-400' },
          { label: 'Completed', value: analytics?.completedTasks || 0, icon: '✅', color: 'text-emerald-400' },
          { label: 'Score', value: `${Math.round(analytics?.productivityScore || 0)}`, icon: '⭐', color: 'text-amber-400' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="stat-card text-center">
            <span className="text-xl">{s.icon}</span>
            <span className={`text-xl font-bold font-display ${s.color}`}>{s.value}</span>
            <span className="text-white/30 text-xs">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Completion Rate */}
      <div className="card">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-white text-sm">Monthly Completion Rate</h3>
          <span className="text-primary-400 font-bold">{analytics?.completionRate || 0}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${analytics?.completionRate || 0}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-purple"
          />
        </div>

        {dailyChartData.length > 0 && (
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={dailyChartData}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
              <Area type="monotone" dataKey="pct" stroke="#6366f1" fill="url(#grad1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weekly bar */}
      {analytics?.weeklyData?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white text-sm mb-3">Weekly Breakdown</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={analytics.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
              <Bar dataKey="rate" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category pie */}
      {categoryPie.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white text-sm mb-3">Task Categories</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={120}>
              <PieChart>
                <Pie data={categoryPie} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value">
                  {categoryPie.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1">
              {categoryPie.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-white/60 text-xs capitalize flex-1">{cat.name}</span>
                  <span className="text-white/40 text-xs">{cat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top habits */}
      {analytics?.topHabits?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white text-sm mb-3">Top Habits This Month</h3>
          <div className="space-y-2">
            {analytics.topHabits.map((h, i) => (
              <div key={h.name} className="flex items-center gap-3">
                <span className="text-lg">{h.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white/70 text-xs">{h.name}</span>
                    <span className="text-white/40 text-xs">{h.completions}x</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (h.completions / 30) * 100)}%` }}
                      transition={{ delay: i * 0.1, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: h.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      {analytics?.heatmapData?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white text-sm mb-3">Activity Heatmap (90 days)</h3>
          <div className="flex flex-wrap gap-1">
            {analytics.heatmapData.slice().reverse().map((d, i) => (
              <HeatmapCell key={i} level={d.level} />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-white/30 text-xs">Less</span>
            {[0,1,2,3,4].map(l => <HeatmapCell key={l} level={l} />)}
            <span className="text-white/30 text-xs">More</span>
          </div>
        </div>
      )}
    </div>
  );
}
