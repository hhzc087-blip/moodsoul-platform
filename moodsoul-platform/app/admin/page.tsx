'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';
import { Save, Plus, Trash2, Edit2, Database, Monitor, Activity, DollarSign } from 'lucide-react';

interface Persona {
  id: string;
  name: string;
  description: string;
  mode: 'PET' | 'MOOD';
  system_prompt: string;
  voice_id: string;
  icon_url?: string;
}

interface Device {
  id: string;
  device_id: string;
  active_persona_id: string;
  personas?: { name: string };
}

export default function AdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Data State
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Persona>>({
    name: '',
    description: '',
    mode: 'PET',
    system_prompt: '',
    voice_id: 'BV001_streaming',
    icon_url: ''
  });

  // Auth Check
  useEffect(() => {
    const secret = searchParams.get('secret');
    if (secret === 'admin123') {
      setIsAuthenticated(true);
      fetchData();
    }
  }, [searchParams]);

  const fetchData = async () => {
    const { data: personaData } = await supabase.from('personas').select('*').order('created_at', { ascending: false });
    if (personaData) setPersonas(personaData);

    const { data: deviceData } = await supabase
      .from('souls')
      .select('*, personas(name)')
      .order('created_at', { ascending: false });
      
    // @ts-ignore - Supabase types join workaround
    if (deviceData) setDevices(deviceData);
  };

  const handleSavePersona = async () => {
    setLoading(true);
    if (editingId) {
      await supabase.from('personas').update(formData).eq('id', editingId);
    } else {
      await supabase.from('personas').insert([formData]);
    }
    
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      mode: 'PET',
      system_prompt: '',
      voice_id: 'BV001_streaming',
      icon_url: ''
    });
    await fetchData();
    setLoading(false);
  };

  const handleDeletePersona = async (id: string) => {
    if (!confirm('Are you sure? This might break devices using this persona.')) return;
    await supabase.from('personas').delete().eq('id', id);
    await fetchData();
  };

  const startEdit = (persona: Persona) => {
    setEditingId(persona.id);
    setFormData(persona);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Access Denied. Please provide the secret key.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Database className="text-purple-500" />
              MoodSoul Admin
            </h1>
            <p className="text-slate-500 mt-1">System Control & Brain Surgery</p>
          </div>
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm font-mono">System Healthy</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Monitor /></div>
              <span className="text-xs text-slate-500 uppercase font-bold">Total Devices</span>
            </div>
            <div className="text-3xl font-bold text-white">{devices.length}</div>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Database /></div>
              <span className="text-xs text-slate-500 uppercase font-bold">Active Personas</span>
            </div>
            <div className="text-3xl font-bold text-white">{personas.length}</div>
          </div>
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><DollarSign /></div>
              <span className="text-xs text-slate-500 uppercase font-bold">Est. Cost Today</span>
            </div>
            <div className="text-3xl font-bold text-white">$0.42</div>
            <p className="text-xs text-slate-500 mt-2">Based on Gemini + Volcengine usage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Persona Manager */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Persona Manager</h2>
                <button 
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: '', description: '', mode: 'PET', system_prompt: '', voice_id: 'BV001_streaming' });
                  }}
                  className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> New
                </button>
              </div>
              
              {/* Editor Form */}
              <div className="p-6 bg-slate-900/50 border-b border-slate-800 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Name</label>
                    <input 
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm focus:border-purple-500 outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Mr. Melty"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Mode</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm focus:border-purple-500 outline-none"
                      value={formData.mode}
                      onChange={e => setFormData({...formData, mode: e.target.value as any})}
                    >
                      <option value="PET">Pet Mode</option>
                      <option value="MOOD">Mood Mode</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Voice ID (Volcengine)</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm focus:border-purple-500 outline-none"
                      value={formData.voice_id}
                      onChange={e => setFormData({...formData, voice_id: e.target.value})}
                    >
                      <option value="BV001_streaming">BV001 (Standard Female)</option>
                      <option value="BV002_streaming">BV002 (Standard Male)</option>
                      <option value="BV004_streaming">BV004 (Emotional Female)</option>
                      <option value="BV056_streaming">BV056 (Cute Boy)</option>
                      <option value="BV406_streaming">BV406 (Vibrant Male)</option>
                      <option value="BV407_streaming">BV407 (Vibrant Female)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Icon URL</label>
                    <input 
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm focus:border-purple-500 outline-none"
                      value={formData.icon_url || ''}
                      onChange={e => setFormData({...formData, icon_url: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Description</label>
                  <input 
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm focus:border-purple-500 outline-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description for the dashboard card"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 uppercase font-bold mb-1">System Prompt (The Brain)</label>
                  <textarea 
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded p-2 text-sm font-mono text-green-400 focus:border-purple-500 outline-none"
                    value={formData.system_prompt}
                    onChange={e => setFormData({...formData, system_prompt: e.target.value})}
                    placeholder="You are..."
                  />
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handleSavePersona}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                  >
                    <Save className="w-4 h-4" /> {editingId ? 'Update Persona' : 'Create Persona'}
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-slate-800">
                {personas.map(p => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {p.name}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.mode === 'PET' ? 'bg-cyan-900 text-cyan-300' : 'bg-pink-900 text-pink-300'}`}>
                          {p.mode}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-md">{p.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(p)} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeletePersona(p.id)} className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Device Monitor */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white">Device Monitor</h2>
              </div>
              <div className="divide-y divide-slate-800">
                {devices.map(d => (
                  <div key={d.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm text-purple-400">{d.device_id}</div>
                      <div className="text-xs text-slate-500">
                        Active: <span className="text-slate-300">{d.personas?.name || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                ))}
                {devices.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">No devices connected.</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
