import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Home' },
  { to: '/calendar', icon: '📅', label: 'Tasks' },
  { to: '/habits', icon: '⚡', label: 'Habits' },
  { to: '/analytics', icon: '📊', label: 'Analytics' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col max-w-md mx-auto relative">
      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass border-t border-white/10 bottom-nav z-50">
        <div className="flex items-center justify-around px-2 pt-2">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-item ${isActive
                  ? 'text-primary-400 bg-primary-500/10'
                  : 'text-white/40 hover:text-white/70'}`
              }
            >
              {({ isActive }) => (
                <>
                  <motion.span
                    className="text-xl"
                    animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {icon}
                  </motion.span>
                  <span className="text-[10px]">{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 w-8 h-0.5 bg-primary-500 rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
