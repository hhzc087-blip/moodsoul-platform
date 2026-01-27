'use client';

import { useState, useEffect, Suspense } from 'react';
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

function AdminContent() {
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-800">
          <h1 className="text-xl font-bold mb-4">Admin Access Required</h1>
          <p className="text-slate-500 text-sm">Please provide the secret key in the URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 pb-24">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
            <div>
                <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                    GOD MODE
                </h1>
                <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">System Administration</p>
            </div>
            <div className="flex gap-4">
                <button onClick={fetchData} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <Activity size={20} className="text-slate-400" />
                </button>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 1. PERSONA EDITOR */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <Database className="text-blue-500" size={20} />
                    <h2 className="text-xl font-bold">Persona Database</h2>
                </div>

                {/* Editor Form */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">{editingId ? 'Edit Persona' : 'Create New Persona'}</h3>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Name</label>
                                <input 
                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-black border border-slate-700 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Mode</label>
                                <select 
                                    value={formData.mode} 
                                    onChange={e => setFormData({...formData, mode: e.target.value as any})}
                                    className="w-full bg-black border border-slate-700 rounded-lg p-2 text-sm"
                                >
                                    <option value="PET">Pet Mode</option>
                                    <option value="MOOD">Mood Mode</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 block mb-1">System Prompt</label>
                            <textarea 
                                value={formData.system_prompt} onChange={e => setFormData({...formData, system_prompt: e.target.value})}
                                className="w-full bg-black border border-slate-700 rounded-lg p-2 text-sm h-32 font-mono"
                                placeholder="You are a helper..."
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Voice ID</label>
                            <input 
                                value={formData.voice_id} onChange={e => setFormData({...formData, voice_id: e.target.value})}
                                className="w-full bg-black border border-slate-700 rounded-lg p-2 text-sm"
                            />
                        </div>

                        <button 
                            onClick={handleSavePersona}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={16} />
                            {loading ? 'Saving...' : (editingId ? 'Update Persona' : 'Create Persona')}
                        </button>

                        {editingId && (
                            <button 
                                onClick={() => { setEditingId(null); setFormData({name:'', description:'', mode:'PET', system_prompt:'', voice_id:'BV001_streaming', icon_url:''})}}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-2 rounded-lg transition-colors text-xs"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </div>

                {/* Persona List */}
                <div className="space-y-3">
                    {personas.map(p => (
                        <div key={p.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center group hover:border-blue-500/50 transition-colors">
                            <div>
                                <h3 className="font-bold text-white">{p.name}</h3>
                                <div className="flex gap-2 text-xs text-slate-500 mt-1">
                                    <span className={`px-2 py-0.5 rounded-full ${p.mode === 'PET' ? 'bg-orange-500/10 text-orange-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                        {p.mode}
                                    </span>
                                    <span>{p.voice_id}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(p)} className="p-2 bg-slate-800 hover:bg-blue-600 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeletePersona(p.id)} className="p-2 bg-slate-800 hover:bg-red-600 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. DEVICE MONITOR */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Monitor className="text-green-500" size={20} />
                    <h2 className="text-xl font-bold">Active Souls</h2>
                </div>

                <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-900 text-slate-200 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4">Device ID</th>
                                <th className="p-4">Active Persona</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {devices.map(d => (
                                <tr key={d.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 font-mono text-white">{d.device_id}</td>
                                    <td className="p-4 text-blue-400">{d.personas?.name || 'Unknown'}</td>
                                    <td className="p-4">
                                        <span className="flex items-center gap-2 text-green-500 text-xs font-bold">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            ONLINE
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {devices.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-600 italic">No devices found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <AdminContent />
    </Suspense>
  );
}
