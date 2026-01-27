import Link from 'next/link';
import { Ghost, ArrowRight, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-2xl text-center space-y-8">
        
        {/* Logo Animation */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-purple-600 blur-3xl opacity-30 animate-pulse"></div>
          <Ghost className="w-24 h-24 text-white relative z-10 mx-auto" />
        </div>

        <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
          MOOD//SOUL
        </h1>
        
        <p className="text-xl text-slate-400 max-w-lg mx-auto leading-relaxed">
          The next-generation AI hardware companion platform. 
          Switch between sarcastic pets and emotional support demons.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <Link 
            href="/dashboard"
            className="group relative px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-purple-50 transition-all flex items-center gap-2"
          >
            Launch Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link 
            href="/admin?secret=admin123"
            className="px-8 py-4 bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-full hover:border-slate-700 hover:text-white transition-all flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Admin Console
          </Link>
        </div>

        <div className="mt-24 pt-8 border-t border-slate-900 text-slate-600 text-sm font-mono">
          SYSTEM_STATUS: ONLINE // VERSION 2.0.4
        </div>
      </div>
    </div>
  );
}
