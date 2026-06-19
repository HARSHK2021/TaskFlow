import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleGoogleCallback = async (response) => {
      try {
        setLoading(true);
        await loginWithGoogle(response.credential);
        toast.success('Account created! 🎉');
        navigate('/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Google registration failed');
      } finally {
        setLoading(false);
      }
    };

    const initializeGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('googleBtn'),
        { theme: 'filled_black', size: 'large', width: '100%' }
      );
    };

    const scriptExists = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!scriptExists) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, [loginWithGoogle, navigate]);

  const update = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Please fill all fields'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-6 py-12">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-accent-purple/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🚀</div>
          <h1 className="font-display text-2xl font-bold text-white">Create account</h1>
          <p className="text-white/40 mt-1">Start your productivity journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="text-white/60 text-sm mb-1.5 block">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={update(key)}
                placeholder={placeholder}
                className="input-field"
              />
            </div>
          ))}

          <div>
            <label className="text-white/60 text-sm mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder="Min. 6 characters"
                className="input-field pr-12"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-white/60 text-sm mb-1.5 block">Confirm Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={form.confirm}
              onChange={update('confirm')}
              placeholder="Repeat password"
              className="input-field"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating account...
              </>
            ) : 'Create Account'}
          </motion.button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-dark-900 px-2 text-white/40">Or continue with</span>
          </div>
        </div>

        <div id="googleBtn" className="w-full flex justify-center" />

        <div className="mt-6 text-center space-y-3">
          <p className="text-white/40 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
          <Link to="/" className="block text-white/30 hover:text-white/50 text-sm">← Back to home</Link>
        </div>
      </motion.div>
    </div>
  );
}
