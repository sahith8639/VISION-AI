"use client";
import Sidebar from '@/components/Dashboard/Sidebar';
import { User, Bell, Shield, Monitor, Camera, Lock, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 pt-12 lg:pt-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Account Settings</h1>

        <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsSection icon={<User size={20}/>} title="Profile Information">
            <div className="space-y-4">
              <Input label="Full Name" defaultValue="Prof. Smith" />
              <Input label="Email Address" defaultValue="smith@university.edu" />
              <button className="w-full bg-blue-600 hover:bg-blue-700 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all">
                Update Profile
              </button>
            </div>
          </SettingsSection>

          <SettingsSection icon={<Lock size={20}/>} title="Security">
            <div className="space-y-4">
              <Input label="Current Password" type="password" placeholder="••••••••" />
              <Input label="New Password" type="password" placeholder="••••••••" />
              <button className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-sm font-bold border border-slate-700 transition-all">
                Change Password
              </button>
            </div>
          </SettingsSection>

          <SettingsSection icon={<Bell size={20}/>} title="Notifications">
             <div className="space-y-1">
               <Toggle label="Email alerts for low engagement" enabled />
               <Toggle label="Desktop notifications for phone detection" enabled />
               <Toggle label="Weekly performance reports" />
             </div>
          </SettingsSection>

          <SettingsSection icon={<Shield size={20}/>} title="Privacy & AI Monitoring">
             <div className="space-y-1">
               <Toggle label="Anonymize student face data" enabled />
               <Toggle label="Store engagement logs for 30 days" enabled />
               <Toggle label="Real-time alert engine" enabled />
             </div>
          </SettingsSection>
        </div>
      </main>
    </div>
  );
}

function SettingsSection({ icon, title, children }: any) {
  return (
    <div className="glass p-6 rounded-3xl border-white/5 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-800 rounded-lg text-blue-400">{icon}</div>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
      <input
        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        {...props}
      />
    </div>
  );
}

function Toggle({ label, enabled }: any) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group cursor-pointer">
      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
      <div className={`w-11 h-6 rounded-full relative transition-all duration-300 ${enabled ? 'bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-slate-700'}`}>
        <motion.div
          animate={{ x: enabled ? 22 : 4 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </div>
    </div>
  );
}
