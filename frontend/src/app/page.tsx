"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Camera, BarChart2, Shield, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-4xl"
      >
        <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Vision AI
        </h1>
        <p className="text-xl text-slate-400 mb-10">
          Next-generation AI-powered Student Analysis & Intelligent Classroom Monitoring System.
          Enhancing online education through real-time engagement tracking.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <FeatureCard
            icon={<Camera className="w-8 h-8 text-blue-400" />}
            title="AI Monitoring"
            description="Real-time distraction and engagement detection."
          />
          <FeatureCard
            icon={<BarChart2 className="w-8 h-8 text-purple-400" />}
            title="Live Analytics"
            description="Comprehensive dashboards for teacher insights."
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-green-400" />}
            title="Secure System"
            description="Role-based access and data encryption."
          />
          <FeatureCard
            icon={<Users className="w-8 h-8 text-yellow-400" />}
            title="Collaboration"
            description="Interactive live classes with WebRTC."
          />
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/login" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold transition-all">
            Login
          </Link>
          <Link href="/register" className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full font-semibold transition-all">
            Register
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass p-6 rounded-2xl text-left hover:scale-105 transition-transform">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}
