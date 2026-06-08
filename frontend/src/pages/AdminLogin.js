import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'kitchen') navigate('/kitchen');
      else navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 text-gray-900 dark:bg-coal dark:text-white flex items-center justify-center p-4 transition-colors duration-300">
      {/* Visual background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,107,53,0.06),transparent_34%)] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,107,53,0.18),transparent_34%),radial-gradient(circle_at_20%_80%,rgba(247,197,159,0.08),transparent_30%)]" />
      <div className="absolute inset-0 opacity-10 dark:opacity-20 [background-image:radial-gradient(rgba(0,0,0,0.1)_1px,transparent_1px)] dark:[background-image:radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:22px_22px]" />

      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="h-9 w-9 rounded-xl bg-white dark:bg-white/5 text-gray-600 dark:text-yellow-300 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-sm shadow-sm active:scale-95 transition-all"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-flame to-ember text-4xl shadow-glow-lg animate-float">
            🍴
          </div>
          <h1 className="font-display text-4xl font-extrabold bg-gradient-to-r from-flame to-ember bg-clip-text text-transparent">SmartDine</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">Premium staff command portal</p>
        </div>

        <div className="rounded-3xl border border-gray-200/50 dark:border-white/5 bg-white dark:bg-ash/95 p-8 shadow-2xl backdrop-blur-xl transition-colors duration-300">
          <h2 className="mb-6 font-display text-xl font-bold text-gray-900 dark:text-white">Sign in to continue</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-500 dark:text-gray-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@restaurant.com"
                required
                className="w-full min-h-[48px] rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111118] px-4 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-orange-500/60 focus:bg-white dark:focus:bg-[#111118] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] transition-all"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-500 dark:text-gray-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full min-h-[48px] rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111118] px-4 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-orange-500/60 focus:bg-white dark:focus:bg-[#111118] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] transition-all"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="min-h-[52px] w-full rounded-2xl bg-gradient-to-r from-flame to-ember font-black text-white shadow-glow-md hover:shadow-glow-lg active:scale-95 disabled:opacity-50 tracking-wide uppercase text-sm transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Quick Login Helper boxes */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 dark:border-white/5 pt-6 text-xs text-gray-600 dark:text-gray-400">
            <div className="rounded-2xl border border-orange-200 dark:border-orange-400/10 bg-orange-50/50 dark:bg-orange-500/5 p-3">
              <p className="font-bold text-orange-600 dark:text-orange-300 mb-0.5">Admin</p>
              <p className="font-medium">admin@restaurant.com</p>
              <p className="font-medium">admin123</p>
            </div>
            <div className="rounded-2xl border border-blue-200 dark:border-blue-400/10 bg-blue-50/50 dark:bg-blue-500/5 p-3">
              <p className="font-bold text-blue-600 dark:text-blue-300 mb-0.5">Kitchen</p>
              <p className="font-medium">kitchen@restaurant.com</p>
              <p className="font-medium">kitchen123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
