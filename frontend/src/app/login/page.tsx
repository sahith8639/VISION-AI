"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData);
      const { access_token, role } = response.data;

      // Store in localStorage for persistence
      localStorage.setItem('token', access_token);
      localStorage.setItem('role', role);
      localStorage.setItem('userEmail', email);

      // Redirect based on role
      if (role === 'teacher') {
        router.push('/dashboard/teacher');
      } else {
        router.push('/dashboard/student');
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      const detail = err.response?.data?.detail;
      setError(detail || 'Failed to login. Please ensure the backend is running and credentials are correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-3xl w-full max-w-md border-white/10"
      >
        <h2 className="text-3xl font-bold mb-2 text-center">Welcome Back</h2>
        <p className="text-slate-400 text-center mb-8 text-sm">Sign in to your account to continue</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
            <input
              type="email"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
            <input
              type="password"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-6 text-center text-slate-400 text-sm">
          Don't have an account? <Link href="/register" className="text-blue-400 hover:underline font-bold">Register Now</Link>
        </p>
      </motion.div>
    </div>
  );
}
