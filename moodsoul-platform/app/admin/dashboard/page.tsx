"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
// import { Slider } from '@/components/ui/slider'; // Removed missing import, using native input range
import { Activity, Globe, Radio, Zap, Sliders, MessageSquare, Map, Save, Terminal, Send } from 'lucide-react';

// Types
interface AdminPersona {
  id: string;
  name: string;
  toxicity_level: number;
  energy_level: number;
  chaos_level: number;
  base_prompt_template: string;
}

interface InteractionLog {
  id: string;
  created_at: string;
  user_image_desc: string;
  ai_response_text: string;
  device_id: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'TUNING' | 'BROADCAST' | 'MONITOR'>('TUNING');
  const [personas, setPersonas] = useState<AdminPersona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<AdminPersona | null>(null);
  
  // Tuning State
  const [simInput, setSimInput] = useState("I just failed my math test.");
  const [simOutput, setSimOutput] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  // Broadcast State
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Monitor State
  const [recentLogs, setRecentLogs] = useState<InteractionLog[]>([]);
  const [activeDevices, setActiveDevices] = useState(0);

  useEffect(() => {
    fetchPersonas();
    fetchStats();
    // In real app, subscribe to realtime logs here
    const channel = supabase
      .channel('admin-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'interaction_logs' }, (payload) => {
          setRecentLogs(prev => [payload.new as InteractionLog, ...prev].slice(0, 10));
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPersonas = async () => {
    const { data } = await supabase.from('personas').select('*');
    if (data) {
        setPersonas(data);
        if (data.length > 0) setSelectedPersona(data[0]);
    }
  };

  const fetchStats = async () => {
    const { count } = await supabase.from('souls').select('*', { count: 'exact', head: true });
    setActiveDevices(count || 0);
    
    const { data } = await supabase.from('interaction_logs').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) setRecentLogs(data);
  };

  // 1. Tuning Logic
  const handleSimulate = async () => {
    if (!selectedPersona) return;
    setIsSimulating(true);
    
    const res = await fetch('/api/admin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            persona: selectedPersona, 
            input: simInput 
        })
    });
    const data = await res.json();
    setSimOutput(data.response);
    setIsSimulating(false);
  };

  const handleSavePersona = async () => {
      if (!selectedPersona) return;
      const { error } = await supabase
        .from('personas')
        .update({
            toxicity_level: selectedPersona.toxicity_level,
            energy_level: selectedPersona.energy_level,
            chaos_level: selectedPersona.chaos_level,
            base_prompt_template: selectedPersona.base_prompt_template
        })
        .eq('id', selectedPersona.id);
        
      if (!error) alert("Persona Saved!");
  };

  // 2. Broadcast Logic
  const handleBroadcast = async () => {
      if (!broadcastMsg) return;
      setIsBroadcasting(true);
      
      const { error } = await supabase
        .from('global_events')
        .insert({
            message: broadcastMsg,
            target_mode: 'ALL',
            active: true
        });
        
      if (!error) {
          alert(`Broadcasted to ${activeDevices} devices!`);
          setBroadcastMsg("");
      }
      setIsBroadcasting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="text-purple-400" />
            <h1 className="font-bold text-lg tracking-wider text-white">MOODSOUL <span className="text-purple-400">MASTER_CONSOLE</span></h1>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                <span className="text-green-400">{activeDevices} ACTIVE NODES</span>
            </div>
            <div className="text-slate-500">SYS_STATUS: ONLINE</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">
        
        {/* Sidebar Navigation */}
        <aside className="col-span-2 space-y-2">
            <NavBtn active={activeTab === 'TUNING'} onClick={() => setActiveTab('TUNING')} icon={Sliders} label="Soul Tuning" />
            <NavBtn active={activeTab === 'BROADCAST'} onClick={() => setActiveTab('BROADCAST')} icon={Radio} label="Global Broadcast" />
            <NavBtn active={activeTab === 'MONITOR'} onClick={() => setActiveTab('MONITOR')} icon={Activity} label="Device Monitor" />
        </aside>

        {/* Main Content Area */}
        <section className="col-span-10 bg-slate-900/50 border border-slate-800 rounded-xl p-6 min-h-[600px] relative overflow-hidden">
            
            {activeTab === 'TUNING' && selectedPersona && (
                <div className="grid grid-cols-2 gap-8 h-full">
                    {/* Controls */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Zap className="text-yellow-400" size={20}/> Tuning: {selectedPersona.name}
                            </h2>
                            <select 
                                className="bg-slate-800 border border-slate-700 rounded p-1 text-sm"
                                onChange={(e) => {
                                    const p = personas.find(p => p.id === e.target.value);
                                    if(p) setSelectedPersona(p);
                                }}
                                value={selectedPersona.id}
                            >
                                {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-4 bg-slate-950/50 p-6 rounded-lg border border-slate-800">
                            <SliderControl 
                                label="Toxicity Level" 
                                value={selectedPersona.toxicity_level} 
                                color="text-red-400"
                                onChange={(v) => setSelectedPersona({...selectedPersona, toxicity_level: v})} 
                            />
                            <SliderControl 
                                label="Energy Level" 
                                value={selectedPersona.energy_level} 
                                color="text-yellow-400"
                                onChange={(v) => setSelectedPersona({...selectedPersona, energy_level: v})} 
                            />
                            <SliderControl 
                                label="Chaos Level" 
                                value={selectedPersona.chaos_level} 
                                color="text-purple-400"
                                onChange={(v) => setSelectedPersona({...selectedPersona, chaos_level: v})} 
                            />
                        </div>

                        <div>
                            <label className="text-xs uppercase tracking-widest text-slate-500 mb-2 block">Base Prompt Template</label>
                            <textarea 
                                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm font-mono text-slate-300 focus:border-purple-500 outline-none resize-none"
                                value={selectedPersona.base_prompt_template || ""}
                                onChange={(e) => setSelectedPersona({...selectedPersona, base_prompt_template: e.target.value})}
                                placeholder="You are a helper..."
                            />
                        </div>

                        <button 
                            onClick={handleSavePersona}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> SAVE CONFIGURATION
                        </button>
                    </div>

                    {/* Simulation */}
                    <div className="flex flex-col h-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                        <div className="bg-slate-900 p-3 border-b border-slate-800 font-mono text-xs text-slate-400">
                            SIMULATION_ENV_V1
                        </div>
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                             <div className="flex justify-end">
                                 <div className="bg-slate-800 text-white p-3 rounded-l-xl rounded-tr-xl max-w-[80%] text-sm">
                                     {simInput}
                                 </div>
                             </div>
                             {simOutput && (
                                 <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="flex justify-start">
                                     <div className="bg-purple-900/30 border border-purple-500/30 text-purple-200 p-3 rounded-r-xl rounded-tl-xl max-w-[80%] text-sm shadow-[0_0_15px_-5px_rgba(168,85,247,0.3)]">
                                         {simOutput}
                                     </div>
                                 </motion.div>
                             )}
                             {isSimulating && (
                                 <div className="text-xs text-slate-500 animate-pulse">Generative Engine Processing...</div>
                             )}
                        </div>
                        <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                            <input 
                                className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 text-sm focus:outline-none focus:border-purple-500"
                                value={simInput}
                                onChange={(e) => setSimInput(e.target.value)}
                            />
                            <button onClick={handleSimulate} className="bg-purple-600 p-2 rounded text-white hover:bg-purple-500">
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'BROADCAST' && (
                <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-8">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/50 animate-pulse">
                        <Radio className="w-10 h-10 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Global Override System</h2>
                        <p className="text-slate-400">
                            This message will instantly override ALL active devices regardless of their current mode.
                            Use with caution.
                        </p>
                    </div>
                    <div className="w-full space-y-4">
                        <textarea 
                            className="w-full h-32 bg-slate-950 border border-red-900/50 rounded-xl p-4 text-lg font-bold text-red-400 placeholder-red-900/50 focus:border-red-500 outline-none text-center"
                            placeholder="ENTER SYSTEM BROADCAST..."
                            value={broadcastMsg}
                            onChange={(e) => setBroadcastMsg(e.target.value)}
                        />
                        <button 
                            onClick={handleBroadcast}
                            disabled={isBroadcasting || !broadcastMsg}
                            className="w-full py-6 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xl tracking-widest rounded-xl transition-all shadow-[0_0_30px_-5px_rgba(220,38,38,0.5)]"
                        >
                            {isBroadcasting ? 'TRANSMITTING...' : 'INITIATE BROADCAST'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'MONITOR' && (
                <div className="grid grid-cols-3 gap-6 h-full">
                    <div className="col-span-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
                        {/* Placeholder Map */}
                        <div className="absolute inset-0 opacity-20" 
                             style={{backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                        <div className="text-center">
                            <Globe className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-slate-500 font-mono">GLOBAL_NODE_MAP_OFFLINE</h3>
                            <p className="text-xs text-slate-600 mt-2">Visualization Module Loading...</p>
                        </div>
                        {/* Mock Dots */}
                        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-purple-500 rounded-full animate-ping delay-300"></div>
                        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-700"></div>
                    </div>
                    
                    <div className="bg-slate-950 rounded-xl border border-slate-800 flex flex-col">
                        <div className="p-4 border-b border-slate-800 font-bold text-sm flex items-center gap-2">
                            <MessageSquare size={16} className="text-blue-400"/> SOUL STREAM
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {recentLogs.map((log) => (
                                <div key={log.id} className="text-xs space-y-1 border-l-2 border-slate-800 pl-3 py-1">
                                    <div className="flex justify-between text-slate-500 font-mono">
                                        <span>{log.device_id.substring(0,8)}...</span>
                                        <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-slate-300 line-clamp-2">"{log.user_image_desc}"</div>
                                    <div className="text-blue-400 line-clamp-2">→ {log.ai_response_text}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </section>
      </main>
    </div>
  );
}

// Sub-components
const NavBtn = ({ active, onClick, icon: Icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm ${
            active ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
        }`}
    >
        <Icon size={18} /> {label}
    </button>
);

const SliderControl = ({ label, value, onChange, color }: any) => (
    <div>
        <div className="flex justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
            <span className={`text-xs font-mono font-bold ${color}`}>{value}%</span>
        </div>
        <input 
            type="range" 
            min="0" max="100" 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
    </div>
);
