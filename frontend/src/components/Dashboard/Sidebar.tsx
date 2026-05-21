"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, BarChart, Settings, LogOut, Video, Menu, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: <Home size={20}/>, path: '/dashboard/teacher' },
    { name: 'Live Class', icon: <Video size={20}/>, path: '/dashboard/teacher/live' },
    { name: 'Students', icon: <Users size={20}/>, path: '/dashboard/teacher/students' },
    { name: 'Analytics', icon: <BarChart size={20}/>, path: '/dashboard/teacher/analytics' },
    { name: 'Settings', icon: <Settings size={20}/>, path: '/dashboard/teacher/settings' },
  ];

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
      >
        {isOpen ? <X size={24}/> : <Menu size={24}/>}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Vision AI
          </h2>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                  isActive ? "bg-blue-600/10 text-blue-400" : "hover:bg-slate-800 text-slate-400 hover:text-white"
                )}
              >
                <span className={cn("transition-colors", isActive ? "text-blue-400" : "group-hover:text-blue-400")}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-900/20 text-red-400 transition-colors"
          >
            <LogOut size={20}/>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
