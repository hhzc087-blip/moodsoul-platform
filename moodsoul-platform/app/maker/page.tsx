"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Sparkles, Save, Upload, Dna, Zap, Flame, Smile } from 'lucide-react';

const ZODIAC_SIGNS = [
  "Aries ♈️", "Taurus ♉️", "Gemini ♊️", "Cancer ♋️", 
  "Leo ♌️", "Virgo ♍️", "Libra ♎️", "Scorpio ♏️", 
  "Sagittarius ♐️", "Capricorn ♑️", "Aquarius ♒️", "Pisces ♓️"
];

const MBTI_TYPES = [
  "INTJ - Architect", "INTP - Logician", "ENTJ - Commander", "ENTP - Debater",
  "INFJ - Advocate", "INFP - Mediator", "ENFJ - Protagonist", "ENFP - Campaigner",
  "ISTJ - Logistician", "ISFJ - Defender", "ESTJ - Executive", "ESFJ - Consul",
  "ISTP - Virtuoso", "ISFP - Adventurer", "ESTP - Entrepreneur", "ESFP - Entertainer"
];

export default function SoulMakerLab() {
  const [identity, setIdentity] = useState({ name: "", avatarUrl: "" });
  const [dna, setDna] = useState({ zodiac: ZODIAC_SIGNS[0], mbti: MBTI_TYPES[0], emotion: "Chill", catchphrase: "" });
  const [stats, setStats] = useState({ sassiness: 50, empathy: 50, chaos: 50 });
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
      if(!identity.name) return alert("Please name your soul!");
      setIsPublishing(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Mapping sliders to DB columns
      // Sassiness -> toxicity_level
      // Empathy -> energy_level (using energy field for now, though conceptually different, serves as a stat slot)
      // Chaos -> chaos_level

      const { error } = await supabase.from('personas').insert({
          name: identity.name,
          icon_url: identity.avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=" + identity.name,
          zodiac_sign: dna.zodiac,
          mbti_type: dna.mbti,
          core_emotion: dna.emotion,
          catchphrase: dna.catchphrase,
          toxicity_level: stats.sassiness,
          energy_level: stats.empathy, // Storing Empathy in Energy slot for MVP schema reuse
          chaos_level: stats.chaos,
          is_public: true,
          creator_id: user?.id
      });
      
      if (!error) {
          alert("Soul Created & Published to Market!");
          // Redirect or Reset
      } else {
          alert("Error: " + error.message);
      }
      setIsPublishing(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 pb-24 selection:bg-pink-500">
        <header className="mb-10 text-center">
            <h1 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 mb-2">
                DNA LAB
            </h1>
            <p className="text-slate-500 font-mono text-xs tracking-widest uppercase">Synthesize a New Soul</p>
        </header>

        <div className="max-w-xl mx-auto space-y-8">
            
            {/* 1. IDENTITY CARD */}
            <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><User size={18}/></div>
                    <h2 className="text-lg font-bold">Identity Protocol</h2>
                </div>
                
                <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 cursor-pointer hover:border-blue-500 transition-colors group">
                        {identity.avatarUrl ? (
                            <img src={identity.avatarUrl} className="w-full h-full object-cover rounded-2xl"/>
                        ) : (
                            <Upload className="text-slate-600 group-hover:text-blue-400" />
                        )}
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Soul Name</label>
                        <input 
                            value={identity.name}
                            onChange={(e) => setIdentity({...identity, name: e.target.value})}
                            placeholder="e.g. Cyber Punk 2099"
                            className="w-full bg-black border border-slate-700 rounded-xl p-3 focus:border-blue-500 outline-none font-bold"
                        />
                    </div>
                </div>
            </motion.div>

            {/* 2. DNA CARD */}
            <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.1}} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><Dna size={18}/></div>
                    <h2 className="text-lg font-bold">Soul DNA</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Zodiac</label>
                        <select 
                            value={dna.zodiac} onChange={(e) => setDna({...dna, zodiac: e.target.value})}
                            className="w-full bg-black border border-slate-700 rounded-xl p-3 text-sm focus:border-purple-500 outline-none appearance-none"
                        >
                            {ZODIAC_SIGNS.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">MBTI</label>
                        <select 
                            value={dna.mbti} onChange={(e) => setDna({...dna, mbti: e.target.value})}
                            className="w-full bg-black border border-slate-700 rounded-xl p-3 text-sm focus:border-purple-500 outline-none appearance-none"
                        >
                            {MBTI_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="mb-4">
                     <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Core Vibe</label>
                     <div className="flex gap-2 flex-wrap">
                         {["Chill", "Hype", "Emo", "Toxic", "Zen"].map(emo => (
                             <button 
                                key={emo}
                                onClick={() => setDna({...dna, emotion: emo})}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${dna.emotion === emo ? 'bg-purple-600 border-purple-500 text-white' : 'bg-black border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                             >
                                 {emo}
                             </button>
                         ))}
                     </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Catchphrase</label>
                    <input 
                        value={dna.catchphrase}
                        onChange={(e) => setDna({...dna, catchphrase: e.target.value})}
                        placeholder="e.g. 'Whatever, loser.'"
                        className="w-full bg-black border border-slate-700 rounded-xl p-3 focus:border-purple-500 outline-none text-sm"
                    />
                </div>
            </motion.div>

            {/* 3. PARAMETER CARD */}
            <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay:0.2}} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400"><Sparkles size={18}/></div>
                    <h2 className="text-lg font-bold">Behavior Matrix</h2>
                </div>

                <div className="space-y-6">
                    <SliderItem 
                        label="Sassiness" icon={<Flame size={14}/>} color="text-purple-400" accent="accent-purple-500"
                        value={stats.sassiness} onChange={(v:number) => setStats({...stats, sassiness: v})}
                    />
                    <SliderItem 
                        label="Empathy" icon={<Smile size={14}/>} color="text-green-400" accent="accent-green-500"
                        value={stats.empathy} onChange={(v:number) => setStats({...stats, empathy: v})}
                    />
                    <SliderItem 
                        label="Chaos" icon={<Zap size={14}/>} color="text-red-400" accent="accent-red-500"
                        value={stats.chaos} onChange={(v:number) => setStats({...stats, chaos: v})}
                    />
                </div>
            </motion.div>

            <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-full py-5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl font-black text-lg shadow-xl shadow-purple-900/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                {isPublishing ? "SYNTHESIZING..." : "PUBLISH SOUL"} <Dna />
            </button>

        </div>
    </div>
  );
}

const SliderItem = ({ label, icon, value, onChange, color, accent }: any) => (
    <div>
        <div className="flex justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">{icon} {label}</span>
            <span className={`text-xs font-mono font-bold ${color}`}>{value}%</span>
        </div>
        <input 
            type="range" min="0" max="100" value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer ${accent}`}
        />
    </div>
);
