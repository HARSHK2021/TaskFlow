import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: '📅', title: 'Smart Calendar', desc: 'Organize tasks by day, week, and month with visual completion tracking' },
  { icon: '⚡', title: 'Habit Tracker', desc: 'Build powerful habits with streaks, history, and progress insights' },
  { icon: '📊', title: 'Analytics', desc: 'Beautiful charts showing your productivity trends and patterns' },
  { icon: '🏆', title: 'Gamification', desc: 'Earn XP, level up, and unlock achievement badges' },
];

export default function LandingPage() {
  const { continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleGuest = () => {
    continueAsGuest();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-dark-900 overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-6xl mb-4 inline-block"
          >
            ✨
          </motion.div>
          <h1 className="font-display text-4xl font-bold mb-3">
            <span className="text-gradient">TaskFlow</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Your AI-powered productivity companion for tasks, habits, and goals
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.3 }}
              className="card text-center"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-sm text-white mb-1">{f.title}</h3>
              <p className="text-white/40 text-xs leading-snug">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <Link to="/register" className="block btn-primary text-center w-full">
            Get Started Free
          </Link>
          <Link to="/login" className="block btn-ghost text-center w-full">
            Sign In
          </Link>
          <button
            onClick={handleGuest}
            className="w-full text-white/40 hover:text-white/70 text-sm py-2 transition-colors"
          >
            Continue as Guest →
          </button>
        </motion.div>

        <p className="text-center text-white/20 text-xs mt-8">
          No credit card required · Free forever
        </p>
      </div>
    </div>
  );
}
