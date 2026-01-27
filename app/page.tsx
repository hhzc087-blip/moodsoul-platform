'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Soul } from '@/types/soul';
import { Settings, Save, Smartphone, Cat, Ghost, Skull, Dumbbell, Heart } from 'lucide-react';

export default function Dashboard() {
  const [deviceId, setDeviceId] = useState('');
  const [soul, setSoul] = useState<Soul | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form State
  const [mode, setMode] = useState<'PET_MODE' | 'MOOD_MODE'>('PET_MODE');
  const [archetype, setArchetype] = useState('toxic_cat');
  const [name, setName] = useState('');

  const fetchSoul = async () => {
    if (!deviceId) return;
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase
        .from('souls')
        .select('*')
        .eq('device_id', deviceId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      if (data) {
        setSoul(data);
        setMode(data.current_mode);
        setArchetype(data.archetype);
        setName(data.name || '');
        setMessage('Soul found! Loaded configuration.');
      } else {
        setSoul(null);
        setMessage('No existing Soul found for this Device ID. Ready to create new.');
      }
    } catch (err: any) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!deviceId) {
      setMessage('Please enter a Device ID');
      return;
    }
    setLoading(true);
    
    try {
      const soulData = {
        device_id: deviceId,
        name,
        current_mode: mode,
        archetype,
      };

      const { error } = await supabase
        .from('souls')
        .upsert(soulData, { onConflict: 'device_id' })
        .select();

      if (error) throw error;

      setMessage('Soul Synced Successfully!');
      await fetchSoul();
    } catch (err: any) {
      console.error(err);
      setMessage(`Sync Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <div className="p-3 bg-purple-600 rounded-lg shadow-lg shadow-purple-900/20">
            <Ghost className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              MoodSoul Control Center
            </h1>
            <p className="text-slate-400">Manage your AI hardware companion</p>
          </div>
        </div>

        {/* Device Connection */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-xl font-semibold flex items-center text-slate-100">
            <Smartphone className="w-5 h-5 mr-2 text-blue-400" />
            Device Connection
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter Device ID (e.g. device_001)"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
            />
            <button
              onClick={fetchSoul}
              disabled={loading || !deviceId}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Connect
            </button>
          </div>
          {message && (
            <div className={`text-sm p-3 rounded-lg ${message.includes('Error') ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
              {message}
            </div>
          )}
        </div>

        {/* Configuration */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 space-y-8 relative overflow-hidden">
          {loading && <div className="absolute inset-0 bg-slate-900/50 z-10 animate-pulse" />}
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center text-slate-100">
              <Settings className="w-5 h-5 mr-2 text-purple-400" />
              Soul Configuration
            </h2>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Soul Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="e.g. Mr. Whiskers"
              />
            </div>

            {/* Mode Switcher */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">Operation Mode</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('PET_MODE')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    mode === 'PET_MODE'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-200'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Cat className="w-8 h-8" />
                  <span className="font-semibold">Pet Mode</span>
                  <span className="text-xs opacity-70">Funny translations</span>
                </button>
                
                <button
                  onClick={() => setMode('MOOD_MODE')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    mode === 'MOOD_MODE'
                      ? 'border-pink-500 bg-pink-500/10 text-pink-200'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Heart className="w-8 h-8" />
                  <span className="font-semibold">Mood Mode</span>
                  <span className="text-xs opacity-70">Emotional support</span>
                </button>
              </div>
            </div>

            {/* Archetype Selector (Only for Mood Mode) */}
            <div className={`transition-all duration-300 ${mode === 'MOOD_MODE' ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
              <label className="block text-sm font-medium text-slate-400 mb-1">Persona Archetype</label>
              <select
                value={archetype}
                onChange={(e) => setArchetype(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none"
              >
                <option value="toxic_cat">Toxic Cat (Sarcastic & Judgmental)</option>
                <option value="mr_melty">Mr. Melty (Anxious & Soft)</option>
                <option value="gym_bro">Buff Nugget (Motivational Gym Bro)</option>
                <option value="golden_retriever">Golden Boy (Overly Optimistic)</option>
              </select>
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save className="w-5 h-5" />
            Sync Soul to Hardware
          </button>
        </div>
      </div>
    </div>
  );
}
