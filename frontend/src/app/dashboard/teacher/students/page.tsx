"use client";
import Sidebar from '@/components/Dashboard/Sidebar';
import { Search, Filter, MoreVertical, Mail, Download, UserPlus } from 'lucide-react';

const students = [
  { id: 1, name: 'Sahith Sai', email: 'sahith@example.com', attendance: '95%', avgEngagement: '88%', status: 'Active' },
  { id: 2, name: 'John Doe', email: 'john@example.com', attendance: '82%', avgEngagement: '65%', status: 'Active' },
  { id: 3, name: 'Alice Smith', email: 'alice@example.com', attendance: '98%', avgEngagement: '92%', status: 'Active' },
  { id: 4, name: 'Bob Johnson', email: 'bob@example.com', attendance: '70%', avgEngagement: '45%', status: 'Inactive' },
];

export default function StudentsPage() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 pt-12 lg:pt-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Students Management</h1>
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold border border-slate-700 transition-all">
              <Download size={18}/>
              Export
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all">
              <UserPlus size={18}/>
              Add Student
            </button>
          </div>
        </header>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <Filter size={18} />
            <span className="text-sm font-medium">Filter</span>
          </button>
        </div>

        {/* Desktop View Table */}
        <div className="hidden md:block glass rounded-3xl overflow-hidden border-white/5">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-6 font-bold">Student</th>
                <th className="p-6 font-bold">Attendance</th>
                <th className="p-6 font-bold">Avg. Engagement</th>
                <th className="p-6 font-bold">Status</th>
                <th className="p-6 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-slate-800 hover:bg-white/5 transition-colors group">
                  <td className="p-6">
                    <div>
                      <div className="font-bold text-slate-200">{student.name}</div>
                      <div className="text-xs text-slate-500">{student.email}</div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: student.attendance }} />
                      </div>
                      <span className="text-sm font-bold">{student.attendance}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`text-sm font-bold ${parseInt(student.avgEngagement) < 70 ? 'text-red-400' : 'text-green-400'}`}>
                      {student.avgEngagement}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${student.status === 'Active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-blue-500/10 rounded-lg text-slate-400 hover:text-blue-400 transition-all"><Mail size={16}/></button>
                      <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"><MoreVertical size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="md:hidden space-y-4">
          {students.map((student) => (
            <div key={student.id} className="glass p-5 rounded-2xl border-white/5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-bold">{student.name}</div>
                  <div className="text-xs text-slate-500">{student.email}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${student.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-500'}`}>
                  {student.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-slate-900/50 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Attendance</div>
                  <div className="text-lg font-bold text-blue-400">{student.attendance}</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Engagement</div>
                  <div className="text-lg font-bold text-green-400">{student.avgEngagement}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
