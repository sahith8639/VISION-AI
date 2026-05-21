"use client";
import Sidebar from '@/components/Dashboard/Sidebar';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, TrendingUp, Activity, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useState, useEffect } from 'react';

const data = [
  { time: '10:00', engagement: 85 },
  { time: '10:10', engagement: 78 },
  { time: '10:20', engagement: 92 },
  { time: '10:30', engagement: 65 },
  { time: '10:40', engagement: 88 },
  { time: '10:50', engagement: 82 },
];

export default function TeacherDashboard() {
  const [userName, setUserName] = useState('Teacher');

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      setUserName(email.split('@')[0]);
    }
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pt-12 lg:pt-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-slate-400 text-sm">Welcome back, {userName}</p>
          </div>
          <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
            <Plus size={18}/>
            Start Live Class
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatCard icon={<Users className="text-blue-400"/>} title="Total Students" value="42" change="+2 today" />
          <StatCard icon={<Activity className="text-green-400"/>} title="Avg. Engagement" value="84%" change="+5% vs last class" />
          <StatCard icon={<AlertTriangle className="text-yellow-400"/>} title="Total Alerts" value="12" change="3 high priority" />
          <StatCard icon={<TrendingUp className="text-purple-400"/>} title="Attendance" value="98%" change="Stable" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
          <div className="xl:col-span-2 glass p-4 md:p-6 rounded-3xl">
            <h3 className="text-xl font-bold mb-6">Class Engagement Trend</h3>
            <div className="h-[300px] md:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="engagement" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEngage)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass p-4 md:p-6 rounded-3xl h-full">
            <h3 className="text-xl font-bold mb-6">Live Alerts</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <AlertItem type="distraction" name="John Doe" message="Looking away for 30s" time="2m ago" />
              <AlertItem type="phone" name="Alice Smith" message="Mobile phone detected" time="5m ago" />
              <AlertItem type="absence" name="Bob Johnson" message="Student absent" time="10m ago" />
              <AlertItem type="distraction" name="Sarah Williams" message="Multiple people in frame" time="12m ago" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value, change }: any) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass p-6 rounded-2xl border-white/5"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-slate-800 rounded-xl">{icon}</div>
        <span className="text-slate-400 text-sm font-medium">{title}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-xs text-green-400 mb-1 font-medium">{change}</span>
      </div>
    </motion.div>
  );
}

function AlertItem({ type, name, message, time }: any) {
  const colors: any = {
    distraction: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    phone: 'bg-red-500/10 text-red-500 border-red-500/20',
    absence: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  };
  return (
    <div className={`p-4 rounded-xl border ${colors[type]}`}>
      <div className="flex justify-between items-start mb-1">
        <span className="font-bold text-sm">{name}</span>
        <span className="text-[10px] opacity-60 font-medium">{time}</span>
      </div>
      <p className="text-sm opacity-90">{message}</p>
    </div>
  );
}
