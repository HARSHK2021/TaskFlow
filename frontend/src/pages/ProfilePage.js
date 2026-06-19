import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BADGE_INFO = {
  first_task: { icon: '🎯', name: 'First Step', desc: 'Completed your first task' },
  ten_tasks: { icon: '⭐', name: 'Getting Started', desc: 'Completed 10 tasks' },
  century: { icon: '💯', name: 'Century Club', desc: 'Completed 100 tasks' },
  seven_day_streak: { icon: '🔥', name: '7 Day Discipline', desc: '7-day streak' },
  thirty_day_master: { icon: '👑', name: '30 Day Master', desc: '30-day streak' },
  habit_hero: { icon: '🦸', name: 'Habit Hero', desc: 'Created 5+ habits' },
};

function XPBar({ xp, xpInLevel, xpToNextLevel, level }) {
  const pct = Math.min(100, (xpInLevel / xpToNextLevel) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/40">Level {level}</span>
        <span className="text-white/40">{xpInLevel}/{xpToNextLevel} XP</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
        />
      </div>
      <p className="text-white/20 text-xs text-right">{xpToNextLevel - xpInLevel} XP to Level {level + 1}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isGuest, logout, fetchProfile, clearGuest } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isGuest) loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/profile');
      setProfile(res.data);
      setName(res.data.name);
    } catch {}
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.put('/profile', { name });
      await fetchProfile();
      await loadProfile();
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update'); }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isGuest) {
    return (
      <div className="p-4 space-y-5">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wider">Profile</p>
          <h1 className="font-display text-xl font-bold text-white">Guest Mode</h1>
        </div>
        <div className="card text-center py-10 space-y-4">
          <div className="text-6xl">🌟</div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">You're a Guest</h2>
            <p className="text-white/40 text-sm mt-1">Create an account to unlock all features, sync data, and earn achievements</p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={() => { clearGuest(); navigate('/register'); }}
              className="btn-primary block w-full text-center"
            >Create Free Account</button>
            <button
              onClick={() => { clearGuest(); navigate('/login'); }}
              className="btn-ghost block w-full text-center"
            >Sign In</button>
            <button onClick={handleLogout} className="w-full text-white/30 hover:text-white/50 text-sm py-2">Exit App</button>
          </div>
        </div>
        <div className="card space-y-3">
          <h3 className="font-semibold text-white text-sm">What you'll unlock 🔓</h3>
          {['Sync tasks across all your devices', 'Earn XP and level up', 'Unlock achievement badges', 'AI productivity insights', 'Unlimited history'].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-white/50">
              <span className="text-primary-400">✓</span> {f}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const p = profile || user;
  const level = p?.level || 1;
  const xp = p?.xp || 0;
  const xpInLevel = p?.xpInLevel ?? (xp % 100);
  const badges = p?.badges || [];

  return (
    <div className="p-4 space-y-5">
      <div>
        <p className="text-white/40 text-xs uppercase tracking-wider">Profile</p>
        <h1 className="font-display text-xl font-bold text-white">My Profile</h1>
      </div>

      {/* Avatar + Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-primary-500/30">
            {p?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input value={name} onChange={e => setName(e.target.value)}
                className="input-field text-sm py-2 mb-1" autoFocus />
            ) : (
              <h2 className="font-display text-lg font-bold text-white truncate">{p?.name}</h2>
            )}
            <p className="text-white/40 text-sm truncate">{p?.email}</p>
            {p?.createdAt && (
              <p className="text-white/20 text-xs mt-0.5">
                Joined {format(new Date(p.createdAt), 'MMM yyyy')}
              </p>
            )}
          </div>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="text-white/40 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={loading}
                className="text-primary-400 text-sm font-semibold">
                {loading ? '...' : 'Save'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-white/40 hover:text-white/70 text-sm">Edit</button>
          )}
        </div>

        {/* Level & XP */}
        <div className="glass rounded-xl p-3 mb-3">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-white font-semibold">Level {level}</p>
              <p className="text-white/40 text-xs">{xp} total XP earned</p>
            </div>
          </div>
          <XPBar xp={xp} xpInLevel={xpInLevel} xpToNextLevel={100} level={level} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Completed', value: p?.completedTasks || p?.totalCompleted || 0, icon: '✅' },
            { label: 'Cur. Streak', value: `${p?.currentStreak || 0}d`, icon: '🔥' },
            { label: 'Best Streak', value: `${p?.bestStreak || 0}d`, icon: '🏆' },
          ].map(s => (
            <div key={s.label} className="glass rounded-xl p-2">
              <p className="text-xl">{s.icon}</p>
              <p className="text-white font-bold text-sm">{s.value}</p>
              <p className="text-white/30 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <h2 className="section-title">Achievements 🏅</h2>
        {badges.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-white/30 text-sm">Complete tasks to earn badges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {badges.map((badge, i) => {
              const info = typeof badge === 'string' ? BADGE_INFO[badge] : badge;
              if (!info) return null;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="card text-center py-3"
                >
                  <div className="text-3xl mb-1">{info.icon}</div>
                  <p className="text-white text-sm font-semibold">{info.name}</p>
                  <p className="text-white/30 text-xs">{info.desc || info.description}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Locked badges */}
      <div>
        <h2 className="section-title">Locked Badges 🔒</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(BADGE_INFO)
            .filter(([key]) => !badges.some(b => (typeof b === 'string' ? b : b.id) === key))
            .slice(0, 4)
            .map(([key, info]) => (
              <div key={key} className="card text-center py-3 opacity-40 grayscale">
                <div className="text-3xl mb-1">{info.icon}</div>
                <p className="text-white text-sm font-semibold">{info.name}</p>
                <p className="text-white/30 text-xs">{info.desc}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="card space-y-1">
        {[
          { label: 'View Analytics', to: '/analytics', icon: '📊' },
          { label: 'View History', to: '/history', icon: '📂' },
          { label: 'Manage Habits', to: '/habits', icon: '⚡' },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-white/5 transition-colors">
            <span className="text-xl">{item.icon}</span>
            <span className="text-white/70 text-sm flex-1">{item.label}</span>
            <span className="text-white/20">›</span>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleLogout}
        className="w-full glass rounded-xl py-3 text-red-400 font-medium hover:bg-red-500/10 transition-colors"
      >
        Sign Out
      </motion.button>

      <div className="text-center">
        <p className="text-white/10 text-xs">TaskFlow v1.0.0 · Made with ❤️</p>
      </div>
    </div>
  );
}
