import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { firebaseService } from '../services/firebaseService';
import { ToastType } from './Toast';

interface Props {
  initialMode?: 'login' | 'signup';
  onLogin: (userData: User) => void;
  onNavigate: (page: string, params?: any) => void;
  showToast: (msg: string, type: ToastType) => void;
}

type AuthView = 'login' | 'signup' | 'forgot';

const AuthPage: React.FC<Props> = ({ initialMode = 'login', onLogin, onNavigate, showToast }) => {
  const [view, setView] = useState<AuthView>(initialMode as AuthView);
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    setView(initialMode as AuthView);
  }, [initialMode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === 'login') {
        const userData = await firebaseService.signIn(email, password);
        onLogin(userData);
      } else if (view === 'signup') {
        if (!name || !phone) {
          showToast("Please provide all required profile details.", 'error');
          setLoading(false);
          return;
        }
        const userData = await firebaseService.signUp(email, password, name, phone);
        onLogin(userData);
      } else if (view === 'forgot') {
        if (!email) {
          showToast("Identification Error: Please enter a valid email.", 'error');
          setLoading(false);
          return;
        }
        await firebaseService.resetPassword(email);
        showToast("Reset instructions dispatched to your terminal.", 'success');
        setView('login');
      }
    } catch (err: any) {
      showToast(err.message || "Credential verification failed.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center relative bg-[#050505]">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-amber-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.4em] mb-4 uppercase text-[10px] text-glow italic">Royal Authentication</h2>
          <h1 className="text-4xl font-futuristic font-bold mb-2 uppercase tracking-tighter italic text-white">
            {view === 'login' ? 'HABIBI LOGIN' : view === 'signup' ? 'JOIN THE SALOON' : 'RECOVERY HUB'}
          </h1>
        </div>

        <div className="glass rounded-[2.5rem] p-8 md:p-10 border border-white/10 shadow-2xl overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center px-6">
              <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4"></div>
              <span className="text-amber-500 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse font-futuristic">Verifying...</span>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-6">
            {view === 'signup' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Identity Name</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-amber-500 transition-all text-xs font-futuristic" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">Mobile Link</label>
                  <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-amber-500 transition-all text-xs font-futuristic" />
                </div>
              </>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Terminal</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-amber-500 transition-all text-xs font-futuristic" />
            </div>

            {view !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Secret Access Key</label>
                  {view === 'login' && (
                    <button type="button" onClick={() => setView('forgot')} className="text-[8px] font-bold text-amber-500 uppercase tracking-widest hover:text-white transition-colors">Lost Access?</button>
                  )}
                </div>
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-amber-500 transition-all text-xs font-futuristic" />
              </div>
            )}

            <button type="submit" className={`w-full py-5 bg-amber-500 text-black font-bold rounded-2xl hover:scale-[1.01] transition-all font-futuristic text-[11px] tracking-[0.2em] uppercase mt-4 shadow-xl`}>
              {view === 'login' ? 'ENTER SALOON' : view === 'signup' ? 'ESTABLISH IDENTITY' : 'SEND RECOVERY LINK'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-gray-400 hover:text-amber-500 font-bold uppercase text-[9px] tracking-[0.2em] transition-colors block w-full">
              {view === 'login' ? "NEW HABIBI? JOIN THE SALOON" : "ALREADY A MEMBER? SIGN IN"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;