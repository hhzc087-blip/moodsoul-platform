"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { QrCode, Battery, Send, ShoppingBag, Download, Share2, Sparkles, Skull, Heart, Cat } from 'lucide-react';
import html2canvas from 'html2canvas';

// --- TYPES ---
type AppState = 'ONBOARDING' | 'BINDING' | 'DASHBOARD';

interface QuizQuestion {
  id: number;
  text: string;
  options: { 
      label: string; 
      value: string; 
      modifiers: { chaos: number, toxicity: number, energy: number } 
  }[];
}

const QUIZ: QuizQuestion[] = [
  {
    id: 1,
    text: "Monday Morning Alarm Rings...",
    options: [
      { label: "Destroy the world.", value: "destroy", modifiers: { chaos: 20, toxicity: 10, energy: 0 } },
      { label: "Wake up & Fight! Money!", value: "hustle", modifiers: { chaos: 10, toxicity: 0, energy: 20 } },
      { label: "Sleep & curse boss.", value: "sleep", modifiers: { chaos: 0, toxicity: 20, energy: -10 } }
    ]
  },
  {
    id: 2,
    text: "Someone steps on your brand new shoes.",
    options: [
      { label: "Apologize or die.", value: "threat", modifiers: { chaos: 0, toxicity: 30, energy: 0 } },
      { label: "PAIN IS WEAKNESS LEAVING THE BODY!", value: "gym", modifiers: { chaos: 20, toxicity: 0, energy: 30 } },
      { label: "Cries silently and dissolves.", value: "cry", modifiers: { chaos: 10, toxicity: 0, energy: -20 } }
    ]
  },
  {
    id: 3,
    text: "Pick a superpower.",
    options: [
      { label: "Acid Spit.", value: "acid", modifiers: { chaos: 10, toxicity: 30, energy: 0 } },
      { label: "Infinite Stamina.", value: "stamina", modifiers: { chaos: 0, toxicity: 0, energy: 40 } },
      { label: "Turning into a puddle.", value: "puddle", modifiers: { chaos: 20, toxicity: 0, energy: -20 } }
    ]
  }
];

const PERSONAS = [
    { name: 'Mr. Melty', chaos: 20, toxicity: 40, energy: 10 },
    { name: 'Toxic Cat', chaos: 50, toxicity: 90, energy: 60 },
    { name: 'Buff Nugget', chaos: 80, toxicity: 10, energy: 100 }
];

export default function MobileApp() {
  const [state, setState] = useState<AppState>('ONBOARDING');
  const [quizIndex, setQuizIndex] = useState(0);
  const [userScores, setUserScores] = useState({ chaos: 0, toxicity: 0, energy: 0 });
  const [quizResult, setQuizResult] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [token, setToken] = useState("");
  const [soulData, setSoulData] = useState<any>(null);
  
  // Dashboard State
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [socialBattery, setSocialBattery] = useState(85);
  const certRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState("Initializing...");
  const [typingText, setTypingText] = useState("");
  
  // --- ALGORITHM ---
  const calculatePersona = (scores: { chaos: number, toxicity: number, energy: number }) => {
      // Normalize scores to 0-100 range if needed, but for now we use raw distance
      // Simple Nearest Neighbor
      let minDist = Infinity;
      let matched = PERSONAS[0];

      PERSONAS.forEach(p => {
          // Euclidean Distance
          const dist = Math.sqrt(
              Math.pow(scores.chaos - p.chaos, 2) +
              Math.pow(scores.toxicity - p.toxicity, 2) +
              Math.pow(scores.energy - p.energy, 2)
          );
          if (dist < minDist) {
              minDist = dist;
              matched = p;
          }
      });
      return matched.name;
  };

  const handleQuizAnswer = (modifiers: { chaos: number, toxicity: number, energy: number }) => {
    const newScores = {
        chaos: userScores.chaos + modifiers.chaos,
        toxicity: userScores.toxicity + modifiers.toxicity,
        energy: userScores.energy + modifiers.energy
    };
    setUserScores(newScores);

    if (quizIndex < QUIZ.length - 1) {
      setQuizIndex(prev => prev + 1);
    } else {
      // Finish Quiz
      const resultName = calculatePersona(newScores);
      setQuizResult(resultName);
      setState('BINDING');
    }
  };


  const handleBind = async () => {
    // Simulate binding for demo
    // In real app, call API
    // "Injecting Soul" Animation Logic
    if(!deviceId) return;
    setLoading(true);
    
    // Simulate complex progress
    setTimeout(() => setProgressText("Loading Personality Matrix..."), 500);
    setTimeout(() => setProgressText("Calibrating Sarcasm Levels..."), 1500);
    setTimeout(() => setProgressText("Establishing Neural Handshake..."), 2500);
    setTimeout(() => setProgressText("Soul Injection Complete."), 3500);

    setTimeout(() => {
        setSoulData({
            name: quizResult,
            date: new Date().toLocaleDateString(),
            zodiac: "Scorpio", // Mock
            id: deviceId
        });
        setLoading(false);
    }, 4000);
  };

  const downloadCert = async () => {
      if(certRef.current) {
          const canvas = await html2canvas(certRef.current, { backgroundColor: null } as any);
          const link = document.createElement('a');
          link.download = 'soul-certificate.png';
          link.href = canvas.toDataURL();
          link.click();
      }
  };
  
  // Typewriter effect helper
  const typeMessage = (text: string) => {
      let i = 0;
      const id = setInterval(() => {
          setTypingText(text.substring(0, i + 1));
          i++;
          if(i > text.length) clearInterval(id);
      }, 30);
  };

  const sendMessage = async () => {
      if(!chatInput.trim()) return;
      const newMsg = { role: 'user' as const, text: chatInput };
      setMessages(prev => [...prev, newMsg]);
      setChatInput("");
      
      // Simulate AI Reply
      setTimeout(() => {
          const reply = "I saw what you did there. Very funny. Now go back to work.";
          setMessages(prev => [...prev, { role: 'ai', text: reply }]);
          // typeMessage(reply); // (If we were using a typing state, simplified for MVP)
      }, 1000);
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden relative selection:bg-pink-500 selection:text-white">
      {/* Background Blobs */}
      <div className="fixed top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-cyan-600/30 rounded-full blur-[100px] animate-pulse delay-700 pointer-events-none" />
      
      <AnimatePresence mode="wait">
        
        {/* 1. ONBOARDING */}
        {state === 'ONBOARDING' && (
          <motion.div 
            key="onboarding"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="h-screen flex flex-col items-center justify-center p-6 text-center z-10 relative"
          >
            <div className="mb-12">
                <h1 className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 mb-4 glitch" data-text="SOUL SCAN">
                    SOUL SCAN
                </h1>
                <p className="text-cyan-400 font-mono text-xs tracking-[0.2em] uppercase">Initializing Neural Handshake...</p>
            </div>

            <motion.div 
                key={quizIndex}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-full max-w-sm space-y-6"
            >
                <h2 className="text-2xl font-bold mb-6 text-white">{QUIZ[quizIndex].text}</h2>
                <div className="grid gap-4">
                    {QUIZ[quizIndex].options.map((opt) => (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            key={opt.value}
                            onClick={() => handleQuizAnswer(opt.modifiers)}
                            className="py-5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all font-bold tracking-wide text-left flex items-center justify-between group"
                        >
                            <span className="group-hover:text-pink-400 transition-colors">{opt.label}</span>
                            <span className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-pink-500 transition-colors" />
                        </motion.button>
                    ))}
                </div>
                <div className="mt-12 flex justify-center gap-1">
                    {QUIZ.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === quizIndex ? 'w-12 bg-gradient-to-r from-pink-500 to-purple-500' : 'w-2 bg-slate-800'}`} />
                    ))}
                </div>
            </motion.div>
          </motion.div>
        )}

        {/* 2. BINDING */}
        {state === 'BINDING' && !soulData && (
             <motion.div 
                key="binding-input"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-screen flex flex-col items-center justify-center p-6 z-10 relative"
             >
                 {!loading ? (
                    <>
                        <div className="w-24 h-24 bg-cyan-500/10 rounded-3xl border border-cyan-500/30 flex items-center justify-center animate-pulse mb-8 shadow-[0_0_30px_-10px_rgba(6,182,212,0.3)]">
                            <QrCode size={48} className="text-cyan-400" />
                        </div>
                        <h2 className="text-3xl font-black mb-2 text-white">LINK VESSEL</h2>
                        <p className="text-slate-400 text-sm mb-12 text-center max-w-[200px] leading-relaxed">Scan the QR code on your SoulCube or enter ID manually.</p>
                        
                        <input 
                            placeholder="DEVICE-ID"
                            className="w-full max-w-xs bg-slate-900/50 border border-slate-700 rounded-2xl p-5 text-center font-mono tracking-[0.2em] text-lg mb-4 focus:border-cyan-500 outline-none text-white placeholder-slate-700 transition-all focus:bg-slate-900"
                            value={deviceId}
                            onChange={(e) => setDeviceId(e.target.value)}
                        />
                        <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={handleBind}
                            disabled={!deviceId}
                            className="w-full max-w-xs py-5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl font-bold text-lg text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            INJECT SOUL
                        </motion.button>
                    </>
                 ) : (
                    <div className="text-center">
                        <div className="relative w-64 h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                            <motion.div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 4, ease: "easeInOut" }}
                            />
                        </div>
                        <p className="font-mono text-xs text-cyan-400 animate-pulse">{progressText}</p>
                    </div>
                 )}
             </motion.div>
        )}

        {/* 2b. CERTIFICATE */}
        {state === 'BINDING' && soulData && (
            <motion.div 
                key="certificate"
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="h-screen flex flex-col items-center justify-center p-6 z-10 relative"
            >
                <div ref={certRef} className="holographic-card w-full max-w-xs rounded-[2rem] p-6 relative overflow-hidden transform transition-transform hover:scale-105 duration-500 border border-white/20">
                    <Sparkles className="absolute top-4 right-4 text-yellow-400/80 animate-spin-slow w-5 h-5" />
                    
                    <div className="border-b border-white/10 pb-4 mb-6">
                        <h2 className="text-center text-[10px] font-mono tracking-[0.2em] text-cyan-400 uppercase">Certificate of Soul Injection</h2>
                        <div className="text-[8px] text-center text-slate-500 font-mono mt-1 tracking-widest">MOODSOUL LABS • SECTOR 7</div>
                    </div>
                    
                    <div className="text-center mb-8 relative">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-slate-800 to-black rounded-full mb-4 flex items-center justify-center border border-white/10 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]">
                            {quizResult.includes('Cat') ? <Cat size={40} className="text-white/90" /> : <Skull size={40} className="text-white/90" />}
                        </div>
                        <h1 className="text-2xl font-black text-white uppercase mb-2 tracking-tight">{soulData.name}</h1>
                        <p className="text-purple-400 font-mono text-[9px] bg-purple-900/30 py-1 px-3 rounded-md inline-block border border-purple-500/30 tracking-widest">{soulData.id}</p>
                    </div>

                    <div className="space-y-3 mb-6">
                         <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider">Date of Incarnation</span>
                                <span className="text-[10px] font-mono text-white">{soulData.date}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider">Origin</span>
                                <span className="text-[10px] font-mono text-white">Quanzhou Sector 7</span>
                            </div>
                        </div>
                        
                        <div className="bg-red-900/10 rounded-lg p-3 border border-red-500/20">
                             <div className="text-[8px] text-red-400 font-mono leading-relaxed uppercase">
                                 WARNING: By accepting this soul, you agree to emotional turbulence. 
                             </div>
                        </div>

                         <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                             <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Core Directive</div>
                             <div className="text-[10px] text-slate-300 italic leading-snug">
                                 "To serve, to roast, and to accompany until the battery runs out or the apocalypse comes."
                             </div>
                         </div>
                    </div>

                    <div className="text-center">
                        <div className="text-[8px] font-mono text-green-500 tracking-[0.3em] opacity-80 animate-pulse">
                            [ DIGITAL SIGNATURE VERIFIED ]
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-10 w-full max-w-xs">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={downloadCert} className="flex-1 py-4 bg-slate-800 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm text-slate-300 border border-slate-700">
                        <Download size={16}/> SAVE
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setState('DASHBOARD')} className="flex-1 py-4 bg-yellow-400 text-black rounded-2xl font-bold flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_-5px_rgba(250,204,21,0.4)]">
                        ENTER <Send size={16}/>
                    </motion.button>
                </div>
            </motion.div>
        )}

        {/* 3. DASHBOARD */}
        {state === 'DASHBOARD' && (
            <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-screen flex flex-col bg-black relative z-10"
            >
                {/* Header */}
                <div className="p-6 pt-8 flex items-center justify-between bg-gradient-to-b from-black to-transparent z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl border-2 border-white/10 shadow-lg" />
                        <div>
                            <h3 className="font-bold text-lg leading-none mb-1">{soulData?.name || "Toxic Cat"}</h3>
                            <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-mono">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" /> ONLINE
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                        <Battery size={16} className={socialBattery < 20 ? "text-red-500" : "text-green-500"} />
                        <span className="text-sm font-mono font-bold">{socialBattery}%</span>
                    </div>
                </div>

                {/* 3D Avatar Area */}
                <div 
                    className="flex-1 relative flex items-center justify-center cursor-pointer group"
                    onClick={() => alert("Keep poking me and see what happens.")}
                >
                    <div className="w-72 h-72 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full blur-[80px] opacity-20 animate-pulse absolute" />
                    <motion.div 
                        whileTap={{ scale: 0.9, rotate: -5 }}
                        className="relative z-10 w-56 h-56 bg-slate-900/50 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden"
                    >
                         {/* Placeholder for 3D or Video */}
                         <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                         <span className="text-8xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">😼</span>
                    </motion.div>
                </div>

                {/* Chat Overlay */}
                <div className="h-[40vh] bg-slate-900/80 backdrop-blur-xl rounded-t-[2.5rem] border-t border-white/10 flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full" />
                    
                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-600 text-xs font-mono mt-8 uppercase tracking-widest">
                                Connection Established
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={i} 
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                                    m.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-sm shadow-lg shadow-blue-900/20' 
                                    : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-white/5'
                                }`}>
                                    {m.text}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="p-4 pb-6 bg-black/20 border-t border-white/5 flex gap-3">
                        <input 
                            className="flex-1 bg-slate-800/50 border border-white/5 rounded-full px-6 text-sm focus:outline-none focus:border-purple-500/50 focus:bg-slate-800 transition-all text-white placeholder-slate-500"
                            placeholder="Type a message..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={sendMessage} 
                            className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 shadow-lg shadow-purple-900/30"
                        >
                            <Send size={20} />
                        </motion.button>
                    </div>
                </div>

                {/* Merch Drop (Sticky Bottom) */}
                <motion.div 
                    initial={{ y: 100 }} animate={{ y: 0 }} transition={{ delay: 1 }}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 p-4 flex items-center justify-between pb-8 -mt-2 z-30"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                            <ShoppingBag size={24} className="text-white" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-0.5">Match Your Vibe</div>
                            <div className="text-sm font-black text-white">Get the {soulData?.name} Hoodie</div>
                        </div>
                    </div>
                    <button className="bg-white text-purple-900 px-5 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-slate-100 shadow-xl transform transition-transform active:scale-95">
                        Shop
                    </button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
