"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        email,
        full_name: fullName,
        password,
        role
      });
      router.push('/login');
    } catch (err: any) {
      console.error("Registration Error:", err);
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail[0].msg);
      } else {
        setError(detail || 'Registration failed. Please ensure the backend is running.');
      }
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
        <h2 className="text-3xl font-bold mb-2 text-center">Create Account</h2>
        <p className="text-slate-400 text-center mb-8 text-sm">Join the intelligent classroom monitoring system</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
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
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Role</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-3 rounded-xl font-bold border transition-all ${role === 'student' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`py-3 rounded-xl font-bold border transition-all ${role === 'teacher' ? 'bg-purple-600/10 border-purple-500 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
              >
                Teacher
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Creating Account...' : 'Get Started'}
          </button>
        </form>
        <p className="mt-6 text-center text-slate-400 text-sm">
          Already have an account? <Link href="/login" className="text-blue-400 hover:underline font-bold">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
