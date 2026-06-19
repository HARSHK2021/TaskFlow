import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import api from '../services/api';

const MOTIVATIONAL = [
  "Every day is a new opportunity to grow! 🌱",
  "Small steps lead to big achievements! 👣",
  "You're doing amazing! Keep the momentum going! 🔥",
  "Consistency beats perfection every time! ⚡",
  "Your future self will thank you for today! 🚀",
];

function ProgressRing({ percent, size = 80, stroke = 6, color = '#6366f1' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="progress-ring__circle"
      />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

export default function DashboardPage() {
  const { user, isGuest, clearGuest } = useAuth();
  const { fetchTasks, fetchHabits, tasks, habits } = useTasks();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const motivational = MOTIVATIONAL[today.getDate() % MOTIVATIONAL.length];

  useEffect(() => {
    fetchTasks({ date: todayStr });
    fetchHabits();
    if (!isGuest) loadAnalytics();
  }, []);

  useEffect(() => {
    setTodayTasks(tasks.filter(t => t.date === todayStr));
  }, [tasks]);

  const loadAnalytics = async () => {
    try {
      const [analyticsRes, insightsRes] = await Promise.all([
        api.get('/analytics/monthly', { params: { month: today.getMonth() + 1, year: today.getFullYear() } }),
        api.get('/analytics/insights'),
      ]);
      setAnalytics(analyticsRes.data);
      setInsights(insightsRes.data.insights || []);
    } catch {}
  };

  const completedToday = todayTasks.filter(t => t.completed).length;
  const totalToday = todayTasks.length;
  const completionPct = totalToday > 0 ? Math.round(completedToday / totalToday * 100) : 0;

  const todayHabits = habits.filter(h => {
    const dayOfWeek = today.getDay();
    const targetDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return h.targetDays?.includes(targetDay);
  });
  const completedHabits = todayHabits.filter(h => h.completionHistory?.[todayStr]);

  const stats = [
    { label: 'Tasks Done', value: completedToday, icon: '✅', color: 'text-emerald-400' },
    { label: 'Pending', value: totalToday - completedToday, icon: '⏳', color: 'text-amber-400' },
    { label: 'Habits', value: `${completedHabits.length}/${todayHabits.length}`, icon: '⚡', color: 'text-primary-400' },
    { label: 'Score', value: analytics ? `${analytics.productivityScore}` : '--', icon: '🏆', color: 'text-accent-pink' },
  ];

  return (
    <div className="p-4 pb-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-white/40 text-sm">{format(today, 'EEEE, MMMM d')}</p>
            <h1 className="font-display text-xl font-bold text-white">
              {isGuest ? 'Hey, Explorer! 👋' : `Hey, ${user?.name?.split(' ')[0] || 'there'}! 👋`}
            </h1>
          </div>
          <Link to="/profile">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white font-bold text-sm">
              {isGuest ? '🌟' : (user?.name?.[0] || '?').toUpperCase()}
            </div>
          </Link>
        </div>
        <p className="text-white/30 text-xs">{motivational}</p>
      </motion.div>

      {/* Guest banner */}
      {isGuest && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="glass rounded-xl p-3 border border-primary-500/30 flex items-center gap-3">
          <span className="text-2xl">🔓</span>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">Guest Mode</p>
            <p className="text-white/40 text-xs">Create an account to sync across devices</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { clearGuest(); navigate('/login'); }}
              className="text-white/60 text-xs font-semibold hover:text-white"
            >Log In</button>
            <button
              onClick={() => { clearGuest(); navigate('/register'); }}
              className="text-primary-400 text-xs font-semibold"
            >Sign Up</button>
          </div>
        </motion.div>
      )}

      {/* Today's progress */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className="card flex items-center gap-6">
        <ProgressRing percent={completionPct} />
        <div className="flex-1">
          <h2 className="font-semibold text-white mb-1">Today's Progress</h2>
          <p className="text-white/50 text-sm">
            {completedToday} of {totalToday} tasks completed
          </p>
          {analytics && (
            <div className="flex gap-4 mt-2">
              <span className="text-xs text-white/40">
                🔥 <span className="text-white/70">{user?.currentStreak || 0} day streak</span>
              </span>
              <span className="text-xs text-white/40">
                ⭐ <span className="text-white/70">Lv.{user?.level || 1}</span>
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="stat-card">
            <span className="text-2xl">{s.icon}</span>
            <span className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</span>
            <span className="text-white/40 text-xs">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Today's Tasks */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">Today's Tasks</h2>
          <Link to="/calendar" className="text-primary-400 text-sm">See all →</Link>
        </div>
        {todayTasks.length === 0 ? (
          <div className="card text-center py-8">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-white/40 text-sm">No tasks for today</p>
            <Link to="/calendar" className="text-primary-400 text-sm mt-2 inline-block">Add tasks →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.slice(0, 4).map((task, i) => (
              <motion.div key={task.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-lg">{task.icon || '✅'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-white/30' : 'text-white'}`}>
                    {task.title}
                  </p>
                  <p className="text-white/30 text-xs capitalize">{task.category}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-emerald-400' : 'bg-white/20'}`} />
              </motion.div>
            ))}
            {todayTasks.length > 4 && (
              <Link to="/calendar" className="block text-center text-primary-400 text-sm py-2">
                +{todayTasks.length - 4} more tasks
              </Link>
            )}
          </div>
        )}
      </motion.div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h2 className="section-title">AI Insights ✨</h2>
          <div className="space-y-2">
            {insights.slice(0, 2).map((insight, i) => (
              <div key={i} className="glass rounded-xl p-3 border-l-2 border-primary-500 flex gap-3">
                <span className="text-lg mt-0.5">💡</span>
                <p className="text-white/70 text-sm leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Habits today */}
      {todayHabits.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title mb-0">Habits Today</h2>
            <Link to="/habits" className="text-primary-400 text-sm">Manage →</Link>
          </div>
          <div className="space-y-2">
            {todayHabits.slice(0, 3).map((habit, i) => {
              const done = habit.completionHistory?.[todayStr];
              return (
                <div key={habit.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-xl">{habit.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${done ? 'line-through text-white/30' : 'text-white'}`}>{habit.name}</p>
                    <p className="text-white/30 text-xs">🔥 {habit.currentStreak} day streak</p>
                  </div>
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs
                    ${done ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                    {done ? '✓' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
