"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Download, Heart, User, Search, Zap } from 'lucide-react';

interface Persona {
    id: string;
    name: string;
    description: string; // Keywords
    downloads_count: number;
    toxicity_level: number;
    energy_level: number;
    chaos_level: number;
    creator_id: string; // Ideally fetch username
}

export default function CommunityMarket() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarket();
  }, []);

  const fetchMarket = async () => {
    const { data } = await supabase
        .from('personas')
        .select('*')
        .eq('is_public', true)
        .order('downloads_count', { ascending: false });
    
    if(data) setPersonas(data);
    setLoading(false);
  };

  const handleInstall = async (persona: Persona) => {
      // Logic to "Install" = Set as active persona for the user's device
      // For now, we just increment download count
      const { error } = await supabase.rpc('increment_downloads', { row_id: persona.id });
      
      if(!error) {
          alert(`Installed ${persona.name} to your SoulCube!`);
          fetchMarket(); // Refresh
      } else {
          // Fallback if RPC doesn't exist yet
          await supabase.from('personas')
            .update({ downloads_count: (persona.downloads_count || 0) + 1 })
            .eq('id', persona.id);
          alert(`Installed ${persona.name}!`);
          fetchMarket();
      }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6">
        <header className="mb-12 text-center max-w-2xl mx-auto">
            <h1 className="text-5xl font-black italic mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                SOUL MARKET
            </h1>
            <p className="text-slate-400">
                Discover personalities created by the Hive Mind. 
                <br/>Install them to your Cube instantly.
            </p>
        </header>

        {loading ? (
            <div className="text-center text-slate-600 animate-pulse">Loading Matrix...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {personas.map((p, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={p.id} 
                        className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 hover:border-slate-600 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1 text-xs font-mono text-green-400 bg-green-900/20 px-2 py-1 rounded">
                                <Download size={12}/> {p.downloads_count}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{p.name}</h2>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {p.description?.split(',').slice(0,3).map((tag, k) => (
                                    <span key={k} className="text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 px-2 py-1 rounded">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            
                            {/* Mini Stat Bars */}
                            <div className="space-y-1 opacity-60 text-[10px] font-mono">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 text-red-400">TOXIC</span>
                                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500" style={{width: `${p.toxicity_level}%`}}/>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 text-yellow-400">NRG</span>
                                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-500" style={{width: `${p.energy_level}%`}}/>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-8 text-purple-400">CHAOS</span>
                                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500" style={{width: `${p.chaos_level}%`}}/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleInstall(p)}
                            className="w-full py-3 bg-slate-800 group-hover:bg-blue-600 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <Zap size={16} className={p.energy_level > 80 ? "fill-yellow-400 text-yellow-400" : ""}/> 
                            INSTALL SOUL
                        </button>
                    </motion.div>
                ))}
            </div>
        )}
    </div>
  );
}
