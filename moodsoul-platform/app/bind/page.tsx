"use client";
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QrCode, Link, CheckCircle, Smartphone } from 'lucide-react';

export default function BindingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const deviceId = searchParams.get('deviceId');
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'CONNECTING' | 'FORM' | 'BINDING' | 'SUCCESS'>('CONNECTING');

  useEffect(() => {
    if (deviceId) {
      // Simulate connection delay
      setTimeout(() => setStatus('FORM'), 1500);
    }
  }, [deviceId]);

  const handleBind = async () => {
    if (!name) return alert("Please enter your name");
    
    setStatus('BINDING');
    
    try {
      const res = await fetch('/api/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, ownerName: name, email })
      });
      
      if (res.ok) {
        setStatus('SUCCESS');
        setTimeout(() => {
            router.push('/dashboard');
        }, 2000);
      } else {
        alert("Binding failed. Please try again.");
        setStatus('FORM');
      }
    } catch (e) {
      alert("Error connecting to server.");
      setStatus('FORM');
    }
  };

  if (!deviceId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
        <p className="text-slate-500">No Device ID detected. Please scan the QR code on your SoulCube.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none" />
        
        <div className="z-10 w-full max-w-sm">
            
            {/* 1. CONNECTING ANIMATION */}
            {status === 'CONNECTING' && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-8 relative">
                        <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping" />
                        <Smartphone size={40} className="text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Searching for SoulCube...</h2>
                    <p className="text-slate-500 font-mono text-xs">{deviceId}</p>
                </motion.div>
            )}

            {/* 2. BINDING FORM */}
            {status === 'FORM' && (
                <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl"
                >
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4 text-green-400">
                            <Link size={24} />
                        </div>
                        <h1 className="text-2xl font-black italic">DEVICE FOUND</h1>
                        <p className="text-slate-400 text-sm mt-2">Let's give this soul a home.</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Your Name</label>
                            <input 
                                className="w-full bg-black border border-slate-700 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-all"
                                placeholder="What should I call you?"
                                value={name} onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Email (Optional)</label>
                            <input 
                                className="w-full bg-black border border-slate-700 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-all"
                                placeholder="For your backup key"
                                value={email} onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleBind}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                    >
                        CONFIRM BINDING
                    </button>
                </motion.div>
            )}

            {/* 3. LOADING / SUCCESS */}
            {(status === 'BINDING' || status === 'SUCCESS') && (
                <motion.div className="text-center">
                    {status === 'BINDING' ? (
                        <div className="animate-pulse">
                            <div className="w-20 h-20 mx-auto border-t-4 border-blue-500 rounded-full animate-spin mb-6" />
                            <h2 className="text-xl font-bold">Injecting Owner Data...</h2>
                        </div>
                    ) : (
                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                            <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
                            <h2 className="text-3xl font-black italic text-green-400">SUCCESS!</h2>
                            <p className="text-slate-500 mt-2">Redirecting to Dashboard...</p>
                        </motion.div>
                    )}
                </motion.div>
            )}

        </div>
    </div>
  );
}
