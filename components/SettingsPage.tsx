import React, { useState, useRef } from 'react';
import { User, NotificationPreferences } from '../types';
import { firebaseService } from '../services/firebaseService';
import { ToastType } from './Toast';

interface Props {
  user: User | null;
  onNavigate: (page: string) => void;
  showToast: (msg: string, type: ToastType) => void;
}

const SettingsPage: React.FC<Props> = ({ user, onNavigate, showToast }) => {
  if (!user) {
    onNavigate('auth');
    return null;
  }

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [avatar, setAvatar] = useState(user.avatar);
  const [prefs, setPrefs] = useState<NotificationPreferences>(user.notificationPreferences || {
    email: true,
    whatsapp: true,
    marketing: false
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to compress image
  const compressImage = (dataUrl: string, maxWidth = 512, maxHeight = 512, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await firebaseService.updateProfile(user.id, {
        name,
        phone,
        avatar,
        notificationPreferences: prefs
      });
      showToast("Profile parameters successfully updated.", 'success');
    } catch (err: any) {
      showToast("Sync Error: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      setAvatar(compressed);
    };
    reader.readAsDataURL(file);
  };

  const togglePref = (key: keyof NotificationPreferences) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 relative bg-[#050505]">
      <div className="max-w-4xl mx-auto">
        <header className="mb-14 flex items-end justify-between">
          <div>
            <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.4em] mb-4 uppercase text-[10px] text-glow italic">System Configuration</h2>
            <h1 className="text-4xl md:text-6xl font-futuristic font-bold uppercase tracking-tighter italic">USER <span className="text-glow text-white">SETTINGS</span></h1>
          </div>
          <button onClick={() => onNavigate('profile')} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-amber-500 transition-all mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to Registry
          </button>
        </header>

        <form onSubmit={handleUpdateProfile} className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="glass p-10 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row items-center gap-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-2 border-amber-500 p-1 bg-black overflow-hidden relative shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover rounded-full" />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full backdrop-blur-[2px]"
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
            <div className="flex-grow text-center md:text-left">
              <h3 className="text-xl font-bold font-futuristic text-white mb-2 uppercase italic tracking-tight">Identity Visual</h3>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest leading-relaxed">Update your avatar to sync with your digital persona.<br />Neural link supports JPEG/PNG. Autoscale active.</p>
            </div>
          </div>

          <div className="glass p-10 rounded-[2.5rem] border border-white/10 grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">Registered Name</label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-amber-500 transition-all text-xs font-futuristic italic uppercase" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">Mobile Uplink</label>
              <input 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-amber-500 transition-all text-xs font-futuristic italic uppercase" 
              />
            </div>
            <div className="space-y-2 opacity-50">
              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Terminal (Protected)</label>
              <input 
                disabled
                value={user.email}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-gray-500 cursor-not-allowed text-xs font-futuristic italic uppercase" 
              />
            </div>
          </div>

          <div className="glass p-10 rounded-[2.5rem] border border-white/10 space-y-8">
            <h3 className="text-xs font-bold font-futuristic text-amber-500 uppercase tracking-[0.4em] border-l-2 border-amber-500 pl-6 italic">Frequency Protocols</h3>
            
            <div className="space-y-6">
              {[
                { id: 'email', label: 'Email Confirmations', desc: 'Sync session details to your inbox.' },
                { id: 'whatsapp', label: 'WhatsApp Reminders', desc: 'Real-time encrypted mobile alerts.' },
                { id: 'marketing', label: 'Neural Marketing', desc: 'Receive futuristic style upgrades and deals.' }
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-500/20 transition-all">
                  <div>
                    <h4 className="text-white font-bold text-[11px] uppercase tracking-widest">{item.label}</h4>
                    <p className="text-[9px] text-gray-500 mt-1 uppercase italic tracking-tighter">{item.desc}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => togglePref(item.id as keyof NotificationPreferences)}
                    className={`w-12 h-6 rounded-full relative transition-all duration-500 ${prefs[item.id as keyof NotificationPreferences] ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-zinc-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all duration-500 ${prefs[item.id as keyof NotificationPreferences] ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-6 bg-white text-black font-bold rounded-[1.5rem] hover:bg-amber-500 transition-all disabled:opacity-30 uppercase tracking-[0.3em] text-[11px] shadow-2xl relative overflow-hidden"
          >
            {loading && <div className="absolute inset-0 flex items-center justify-center bg-amber-500"><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div></div>}
            SYNC PARAMETERS
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;