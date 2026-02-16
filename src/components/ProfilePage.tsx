import React from 'react';
import { User } from '../types';

interface Props {
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: string, params?: any) => void;
}

const ProfilePage: React.FC<Props> = ({ user, onLogout, onNavigate }) => {
  if (!user) {
    onNavigate('auth', { mode: 'login' });
    return null;
  }

  const visibleBookings = user.bookings?.filter(b => b.status === 'approved' || b.status === 'canceled') || [];

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 relative bg-[#050505]">
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-amber-500/5 blur-[150px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-12 relative z-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="glass rounded-[3rem] p-10 border border-white/10 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-amber-200 to-amber-500"></div>
            
            <div className="relative inline-block mb-8 group cursor-pointer" onClick={() => onNavigate('settings')}>
              <div className="w-32 h-32 rounded-full border-2 border-amber-500 p-1 bg-black overflow-hidden mx-auto relative shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full transition-all duration-500" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full backdrop-blur-[2px]">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-amber-500 text-black text-[9px] font-bold rounded-full uppercase tracking-[0.2em] shadow-lg">
                {user.loyaltyLevel} Status
              </div>
            </div>

            <h2 className="text-2xl font-futuristic font-bold text-white mb-2 uppercase tracking-tight italic">{user.name}</h2>
            <p className="text-gray-500 text-[10px] font-bold tracking-[0.3em] mb-10 uppercase">{user.phone}</p>
            
            <div className="space-y-3">
              <button onClick={() => onNavigate('settings')} className="text-[10px] font-bold text-amber-500 hover:text-white uppercase tracking-widest transition-all border border-amber-500/20 hover:bg-amber-500 hover:text-black px-8 py-3 rounded-2xl w-full">
                CONFIGURATION
              </button>
              <button onClick={onLogout} className="text-[10px] font-bold text-red-500 hover:text-white uppercase tracking-widest transition-all border border-red-500/20 hover:bg-red-500 px-8 py-3 rounded-2xl w-full">
                TERMINATE SESSION
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.3em] mb-3 uppercase text-[10px]">Registry Logs</h2>
              <h1 className="text-4xl md:text-6xl font-futuristic font-bold uppercase tracking-tighter leading-none italic">YOUR <span className="text-glow">SESSIONS</span></h1>
            </div>
            <button onClick={() => onNavigate('booking')} className="px-8 py-4 bg-white text-black text-[10px] font-bold rounded-2xl hover:bg-amber-500 transition-all font-futuristic uppercase tracking-widest shadow-xl">
              SECURE NEW SESSION
            </button>
          </div>

          <div className="space-y-8">
            <h3 className="text-xs font-bold font-futuristic text-white uppercase tracking-[0.4em] border-l-2 border-amber-500 pl-6 italic">Protocol History</h3>
            {visibleBookings.length > 0 ? (
              <div className="grid gap-6">
                {visibleBookings.map(booking => (
                  <div key={booking.id} className={`glass rounded-3xl p-8 border transition-all ${booking.status === 'canceled' ? 'border-red-500/20 opacity-50 grayscale' : 'border-white/5 hover:border-amber-500/30'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-8">
                        <div className={`w-14 h-14 shrink-0 rounded-[1.5rem] flex flex-col items-center justify-center border shadow-lg ${booking.status === 'approved' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                           <span className={`text-[11px] font-bold uppercase tracking-tight leading-none ${booking.status === 'approved' ? 'text-amber-500' : 'text-red-500'}`}>{booking.date.split('-')[2]}</span>
                           <span className="text-[9px] text-gray-500 uppercase leading-none mt-1.5 font-bold">{new Date(booking.date).toLocaleString('default', { month: 'short' })}</span>
                        </div>
                        <div>
                          <h4 className="text-white font-bold font-futuristic uppercase tracking-tight text-lg mb-1.5 italic">{booking.serviceName}</h4>
                          <div className="flex items-center gap-4">
                             <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{booking.time} Node</span>
                             <span className="w-1 h-1 rounded-full bg-white/20"></span>
                             <span className="text-[11px] text-amber-500 font-bold uppercase tracking-widest">₹{booking.price}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-5 py-2 border rounded-2xl shrink-0 text-center ${booking.status === 'approved' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                         <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{booking.status === 'approved' ? 'SECURED' : 'VOIDED'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass rounded-[3rem] p-16 border border-white/5 text-center flex flex-col items-center justify-center opacity-40">
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-6">
                   <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500">Null data stream detected</p>
                <p className="text-[9px] text-gray-700 mt-2 uppercase italic tracking-widest">Awaiting royal appointment registry...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;