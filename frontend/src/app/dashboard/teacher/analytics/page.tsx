"use client";
import Sidebar from '@/components/Dashboard/Sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const classEngagementData = [
  { name: 'Mon', score: 82 },
  { name: 'Tue', score: 75 },
  { name: 'Wed', score: 88 },
  { name: 'Thu', score: 91 },
  { name: 'Fri', score: 84 },
];

const distractionData = [
  { name: 'Attentive', value: 70 },
  { name: 'Looking Away', value: 15 },
  { name: 'Phone Usage', value: 10 },
  { name: 'Absent', value: 5 },
];

const COLORS = ['#3b82f6', '#eab308', '#ef4444', '#64748b'];

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 pt-12 lg:pt-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Classroom Analytics</h1>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          <div className="glass p-6 md:p-8 rounded-3xl">
            <h3 className="text-lg md:text-xl font-bold mb-6">Weekly Engagement Average</h3>
            <div className="h-[300px] md:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classEngagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{fill: '#1e293b', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  />
                  <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass p-6 md:p-8 rounded-3xl">
            <h3 className="text-lg md:text-xl font-bold mb-6">Distraction Breakdown (Overall)</h3>
            <div className="flex flex-col sm:flex-row items-center justify-around gap-8">
              <div className="h-[250px] md:h-[300px] w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distractionData}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {distractionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4 w-full sm:w-auto">
                {distractionData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between sm:justify-start gap-4 p-3 bg-slate-900/50 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-sm text-slate-400 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
