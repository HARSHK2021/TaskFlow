import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const TaskContext = createContext(null);

// Guest local storage helpers
const GUEST_TASKS_KEY = 'guest_tasks';
const GUEST_HABITS_KEY = 'guest_habits';

function loadGuestTasks() {
  try { return JSON.parse(localStorage.getItem(GUEST_TASKS_KEY)) || []; }
  catch { return []; }
}
function saveGuestTasks(tasks) {
  localStorage.setItem(GUEST_TASKS_KEY, JSON.stringify(tasks));
}
function loadGuestHabits() {
  try { return JSON.parse(localStorage.getItem(GUEST_HABITS_KEY)) || []; }
  catch { return []; }
}
function saveGuestHabits(habits) {
  localStorage.setItem(GUEST_HABITS_KEY, JSON.stringify(habits));
}

export function TaskProvider({ children }) {
  const { isGuest } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async (params = {}) => {
    if (isGuest) {
      let all = loadGuestTasks();
      if (params.date) all = all.filter(t => t.date === params.date);
      if (params.month && params.year) {
        const prefix = `${params.year}-${String(params.month).padStart(2,'0')}`;
        all = all.filter(t => t.date?.startsWith(prefix));
      }
      setTasks(all);
      return all;
    }
    try {
      setLoading(true);
      const res = await api.get('/tasks', { params });
      setTasks(res.data);
      return res.data;
    } catch (e) {
      toast.error('Failed to load tasks');
      return [];
    } finally {
      setLoading(false);
    }
  }, [isGuest]);

  const createTask = useCallback(async (taskData) => {
    if (isGuest) {
      const task = { ...taskData, id: Date.now().toString(), userId: 'guest', completed: false, createdAt: new Date().toISOString() };
      const all = [...loadGuestTasks(), task];
      saveGuestTasks(all);
      setTasks(prev => [...prev, task]);
      toast.success('Task created!');
      return task;
    }
    try {
      const res = await api.post('/tasks', taskData);
      setTasks(prev => [...prev, res.data]);
      toast.success('Task created!');
      return res.data;
    } catch (e) {
      toast.error('Failed to create task');
      throw e;
    }
  }, [isGuest]);

  const updateTask = useCallback(async (id, data) => {
    if (isGuest) {
      const all = loadGuestTasks().map(t => t.id === id ? { ...t, ...data } : t);
      saveGuestTasks(all);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      return;
    }
    try {
      const res = await api.put(`/tasks/${id}`, data);
      setTasks(prev => prev.map(t => t.id === id ? res.data : t));
      return res.data;
    } catch (e) {
      toast.error('Failed to update task');
      throw e;
    }
  }, [isGuest]);

  const deleteTask = useCallback(async (id) => {
    if (isGuest) {
      const all = loadGuestTasks().filter(t => t.id !== id);
      saveGuestTasks(all);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted');
      return;
    }
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted');
    } catch (e) {
      toast.error('Failed to delete task');
      throw e;
    }
  }, [isGuest]);

  const fetchHabits = useCallback(async () => {
    if (isGuest) {
      const all = loadGuestHabits();
      setHabits(all);
      return all;
    }
    try {
      const res = await api.get('/habits');
      setHabits(res.data);
      return res.data;
    } catch {
      return [];
    }
  }, [isGuest]);

  const createHabit = useCallback(async (data) => {
    if (isGuest) {
      const h = { ...data, id: Date.now().toString(), userId: 'guest', completionHistory: {}, active: true, currentStreak: 0, bestStreak: 0, totalCompleted: 0, createdAt: new Date().toISOString() };
      const all = [...loadGuestHabits(), h];
      saveGuestHabits(all);
      setHabits(prev => [...prev, h]);
      toast.success('Habit created!');
      return h;
    }
    try {
      const res = await api.post('/habits', data);
      setHabits(prev => [...prev, res.data]);
      toast.success('Habit created!');
      return res.data;
    } catch (e) {
      toast.error('Failed to create habit');
      throw e;
    }
  }, [isGuest]);

  const toggleHabit = useCallback(async (id, date, completed) => {
    if (isGuest) {
      const all = loadGuestHabits().map(h => {
        if (h.id !== id) return h;
        return { ...h, completionHistory: { ...h.completionHistory, [date]: completed } };
      });
      saveGuestHabits(all);
      setHabits(prev => prev.map(h => h.id !== id ? h : { ...h, completionHistory: { ...h.completionHistory, [date]: completed } }));
      return;
    }
    try {
      const res = await api.post(`/habits/${id}/complete`, { date, completed });
      setHabits(prev => prev.map(h => h.id === id ? res.data : h));
    } catch (e) {
      toast.error('Failed to update habit');
    }
  }, [isGuest]);

  const deleteHabit = useCallback(async (id) => {
    if (isGuest) {
      const all = loadGuestHabits().filter(h => h.id !== id);
      saveGuestHabits(all);
      setHabits(prev => prev.filter(h => h.id !== id));
      toast.success('Habit deleted');
      return;
    }
    try {
      await api.delete(`/habits/${id}`);
      setHabits(prev => prev.filter(h => h.id !== id));
      toast.success('Habit deleted');
    } catch (e) {
      toast.error('Failed to delete habit');
    }
  }, [isGuest]);

  return (
    <TaskContext.Provider value={{
      tasks, habits, loading,
      fetchTasks, createTask, updateTask, deleteTask,
      fetchHabits, createHabit, toggleHabit, deleteHabit,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTasks = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
};
