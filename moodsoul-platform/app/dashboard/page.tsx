'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap, Wifi, Battery, Skull, Heart, Cat, Loader2, CheckCircle2, LogOut, Timer, Hammer, Sparkles, Dices } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Persona {
  id: string;
  name: string;
  description: string;
  mode: 'PET' | 'MOOD';
  icon_url?: string;
}

const APP_CAPSULES = [
  { id: 'POMODORO', name: 'Toxic Pomodoro', icon: Timer, color: 'text-red-400', desc: 'Focus or get roasted.' },
  { id: 'WOODEN_FISH', name: 'Cyber Zen', icon: Hammer, color: 'text-yellow-400', desc: 'Tap for digital merit.' },
  { id: 'FORTUNE', name: 'Fortune Teller', icon: Sparkles, color: 'text-purple-400', desc: 'See your future.' },
  { id: 'TRUTH_DARE', name: 'Truth or Dare', icon: Dices, color: 'text-pink-400', desc: 'Spin the wheel.' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState('');
  const [isBinding, setIsBinding] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activeTab, setActiveTab] = useState<'PET' | 'MOOD' | 'APPS'>('PET');
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [activeFeature, setActiveFeature] = useState<string>('NONE');
  const [injecting, setInjecting] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Initial fetch of personas
  useEffect(() => {
    const fetchPersonas = async () => {
      const { data } = await supabase.from('personas').select('*');
      if (data) setPersonas(data);
    };
    fetchPersonas();
  }, []);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchDeviceStatus = async (id: string) => {
    const { data } = await supabase
      .from('souls')
      .select('active_persona_id, current_feature') // Removed last_seen_at
      .eq('device_id', id)
      .single();
    
    if (data) {
      setActivePersonaId(data.active_persona_id);
      setActiveFeature(data.current_feature || 'NONE');
      // last_seen_at removed from DB, defaulting to true for now to avoid confusion or false if preferred
      // setIsOnline(false); 
      setIsOnline(true); // Assume online if bound successfully
    }
  };

  const handleBind = async () => {
    if (!deviceId) return;
    setIsBinding(true);

    // Register device if it doesn't exist
    try {
      await fetch('/api/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, ownerName: 'Dashboard User' })
      });
    } catch (e) {
      console.error("Bind error", e);
    }

    await fetchDeviceStatus(deviceId);
    setIsBinding(false);
    showNotification("DEVICE LINKED");
  };

  const handleLaunchFeature = async (featureId: string) => {
    if (!deviceId) return alert("BIND DEVICE FIRST!");
    
    setInjecting(featureId);
    const prevFeature = activeFeature;
    setActiveFeature(featureId);
    
    const { error } = await supabase
      .from('souls')
      .update({ current_feature: featureId })
      .eq('device_id', deviceId);

    if (error) {
      setActiveFeature(prevFeature);
      alert("Feature Launch Failed");
    } else {
      showNotification(`LAUNCHING: ${featureId}`);
    }
    setInjecting(null);
  };

  const handleInjectSoul = async (persona: Persona) => {
    if (!deviceId) {
      alert("BIND DEVICE FIRST!");
      return;
    }
    
    setInjecting(persona.id);
    const prevPersonaId = activePersonaId;
    setActivePersonaId(persona.id);
    setActiveFeature('NONE'); 
    
    setTimeout(async () => {
      const { error } = await supabase
        .from('souls')
        .update({ 
          active_persona_id: persona.id,
          current_mode: persona.mode,
          current_feature: 'NONE'
        })
        .eq('device_id', deviceId);

      if (error) {
        console.error("Injection failed", error);
        setActivePersonaId(prevPersonaId);
        alert("Injection Failed: " + error.message);
      } else {
        showNotification(`SOUL INJECTED: ${persona.name.toUpperCase()}`);
      }
      
      setInjecting(null);
    }, 1500);
  };
  
  const filteredPersonas = personas.filter(p => p.mode === activeTab);

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono p-4 md:p-8 pb-24 selection:bg-cyan-900 selection:text-white max-w-7xl mx-auto transition-all duration-300 overflow-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-cyan-500 text-cyan-400 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="font-bold tracking-widest text-sm">{toastMessage}</span>
            <div className="absolute bottom-0 left-0 h-1 bg-cyan-500 animate-[width_3s_linear_forwards]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-cyan-900/50 pb-6 mb-6 md:mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent mb-2">
            MOOD//SOUL
          </h1>
          <div className="flex items-center space-x-2 text-xs md:text-sm">
            <Wifi className={`w-3 h-3 md:w-4 md:h-4 ${isOnline ? 'text-green-500' : 'text-red-500 animate-pulse'}`} />
            <span className={isOnline ? 'text-green-500' : 'text-red-500'}>
              {isOnline ? 'ONLINE' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        <div className="relative group w-full md:w-auto">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 blur"></div>
          <div className="relative flex bg-black rounded-lg p-1">
            <input
              type="text"
              placeholder="ENTER DEVICE ID"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full md:w-64 bg-black text-white px-3 py-2 text-sm md:text-base outline-none placeholder-cyan-900/50 uppercase tracking-widest"
            />
            <button 
              onClick={handleBind}
              disabled={isBinding}
              className="bg-cyan-900/30 hover:bg-cyan-800 text-cyan-300 px-4 py-2 rounded text-xs md:text-sm font-bold uppercase transition-all border-l border-cyan-800 shrink-0"
            >
              {isBinding ? <Loader2 className="animate-spin w-3 h-3 md:w-4 md:h-4" /> : 'LINK'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mode Tabs */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex space-x-2 md:space-x-4 mb-6 md:mb-10 overflow-x-auto pb-2"
      >
        <button onClick={() => setActiveTab('PET')} className={`flex-1 py-3 md:py-4 border-b-2 flex justify-center items-center gap-2 transition-all relative ${activeTab === 'PET' ? 'border-cyan-500 text-cyan-400' : 'border-cyan-900/30 text-cyan-900'}`}>
          <Cat className="w-4 h-4 md:w-6 md:h-6" /> <span className="font-bold tracking-widest text-xs md:text-lg">PET_MODE</span>
        </button>
        <button onClick={() => setActiveTab('MOOD')} className={`flex-1 py-3 md:py-4 border-b-2 flex justify-center items-center gap-2 transition-all relative ${activeTab === 'MOOD' ? 'border-purple-500 text-purple-400' : 'border-purple-900/30 text-purple-900'}`}>
          <Heart className="w-4 h-4 md:w-6 md:h-6" /> <span className="font-bold tracking-widest text-xs md:text-lg">MOOD_MODE</span>
        </button>
        <button onClick={() => setActiveTab('APPS')} className={`flex-1 py-3 md:py-4 border-b-2 flex justify-center items-center gap-2 transition-all relative ${activeTab === 'APPS' ? 'border-yellow-500 text-yellow-400' : 'border-yellow-900/30 text-yellow-900'}`}>
          <Zap className="w-4 h-4 md:w-6 md:h-6" /> <span className="font-bold tracking-widest text-xs md:text-lg">APPS</span>
        </button>
      </motion.div>

      {/* Grid Content */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        <AnimatePresence mode="popLayout">
          {activeTab === 'APPS' ? (
            APP_CAPSULES.map((app) => {
              const isActive = activeFeature === app.id;
              const isInjecting = injecting === app.id;
              return (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLaunchFeature(app.id)}
                  className={`relative overflow-hidden rounded-xl border-2 p-4 cursor-pointer transition-colors duration-300 group ${
                    isActive 
                      ? 'border-yellow-500 bg-yellow-900/10 shadow-[0_0_30px_-5px_rgba(234,179,8,0.3)]' 
                      : 'border-yellow-900/30 bg-black hover:border-yellow-500/50'
                  }`}
                >
                   {/* Injecting Overlay */}
                   {isInjecting && (
                    <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                    </div>
                   )}
                  
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-slate-900 ${app.color}`}>
                      <app.icon size={24} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold uppercase ${isActive ? 'text-yellow-400' : 'text-slate-300'}`}>{app.name}</h3>
                      <p className="text-xs text-slate-500">{app.desc}</p>
                    </div>
                  </div>
                  {isActive && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-yellow-500 font-bold tracking-widest uppercase">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" /> Running
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            filteredPersonas.map((persona) => {
              const isActive = activePersonaId === persona.id;
              const isInjecting = injecting === persona.id;

              return (
                <motion.div 
                  key={persona.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleInjectSoul(persona)}
                  className={`relative overflow-hidden rounded-xl border-2 p-4 cursor-pointer transition-colors duration-300 group ${
                    isActive 
                      ? 'border-green-500 bg-green-900/10 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]' 
                      : 'border-cyan-900/30 bg-black hover:border-cyan-500/50 hover:shadow-[0_0_20px_-5px_rgba(34,211,238,0.2)]'
                  }`}
                >
                  {/* Scanline Effect */}
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
                  
                  {/* Injecting Overlay */}
                  <AnimatePresence>
                    {isInjecting && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm"
                      >
                        <Zap className="w-12 h-12 text-yellow-400 animate-bounce" />
                        <span className="text-yellow-400 font-bold animate-pulse mt-2 tracking-widest">INJECTING...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <h3 className={`text-lg font-bold uppercase tracking-wider ${isActive ? 'text-green-400' : 'text-cyan-200'}`}>
                        {persona.name}
                      </h3>
                      <p className="text-xs text-cyan-600/80 mt-1 max-w-[80%] leading-relaxed line-clamp-2">
                        {persona.description}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-cyan-900/20 text-cyan-700'}`}>
                      {persona.mode === 'PET' ? <Cat size={20} /> : <Skull size={20} />}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-ping' : 'bg-cyan-900'}`}></div>
                      <span className={`text-[10px] uppercase tracking-widest ${isActive ? 'text-green-500' : 'text-cyan-900'}`}>
                        {isActive ? 'ACTIVE LINK' : 'STANDBY'}
                      </span>
                    </div>
                    {isActive && <Battery className="w-4 h-4 text-green-500" />}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Action / Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent pointer-events-none">
        <div className="text-center text-[10px] text-cyan-900 font-bold tracking-[0.3em]">
          SYSTEM VERSION 2.0.4 // MOODSOUL CORP
        </div>
      </div>
    </div>
  );
}
