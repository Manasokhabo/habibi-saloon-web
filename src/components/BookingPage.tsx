import React, { useState, useEffect, useRef } from 'react';
import { Service, User, Booking } from '../types';
import { SERVICES, PACKAGES, TIMESLOTS, OWNER_WHATSAPP } from '../constants';
import { firebaseService } from '../services/firebaseService';
import { ToastType } from './Toast';

interface Props {
  initialService?: Service | null;
  onNavigate: (page: string, params?: any) => void;
  loggedInUser?: User | null;
  showToast: (msg: string, type: ToastType) => void;
}

const BookingPage: React.FC<Props> = ({ initialService, onNavigate, loggedInUser, showToast }) => {
  const [step, setStep] = useState(initialService ? 2 : 1);
  const [selectedService, setSelectedService] = useState<Service | null>(initialService || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    name: loggedInUser?.name || '',
    phone: loggedInUser?.phone || ''
  });
  const [hubWpNumber, setHubWpNumber] = useState(OWNER_WHATSAPP);

  const successAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    successAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    successAudioRef.current.volume = 0.5;
    successAudioRef.current.load();
    
    // Fetch live hub WP number
    const fetchHubSettings = async () => {
      const settings = await firebaseService.getSalonSettings();
      if (settings?.ownerWhatsapp) {
        setHubWpNumber(settings.ownerWhatsapp);
      }
    };
    fetchHubSettings();
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      setFormData(prev => ({
        ...prev,
        name: loggedInUser.name,
        phone: loggedInUser.phone
      }));
    }
  }, [loggedInUser]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) {
      showToast("Sign in required to finalize royal booking.", 'info');
      onNavigate('auth', { mode: 'login' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const serviceName = selectedService?.name || 'Custom Grooming';
      const price = selectedService?.price || 0;
      const newBooking: Booking = {
        id: 'bk-' + Date.now(),
        serviceId: selectedService?.id || 'custom',
        serviceName: serviceName,
        date: formData.date,
        time: formData.time,
        price: price,
        status: 'pending',
        name: formData.name,
        phone: formData.phone
      };

      await firebaseService.addBooking(loggedInUser.id, newBooking);
      
      if (successAudioRef.current) {
        successAudioRef.current.play().catch(e => console.warn("Audio play blocked", e));
      }

      showToast("Royal Session successfully secured.", 'success');
      
      const message = `Greetings Habibi Saloon. I would like to confirm my appointment for ${serviceName} on ${formData.date} at ${formData.time}. Client: ${formData.name}. Total amount: ₹${price}. Please acknowledge this request.`;
      const encodedMsg = encodeURIComponent(message);
      window.open(`https://wa.me/${hubWpNumber}?text=${encodedMsg}`, '_blank');
      
      onNavigate('profile');
    } catch (err: any) {
      showToast("Booking Failure: " + (err.message || "Unknown error"), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allAvailable = [...SERVICES, ...PACKAGES];

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 relative bg-[#050505]">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto">
        <header className="mb-14 text-center">
          <h1 className="text-4xl md:text-6xl font-futuristic font-bold mb-4 uppercase tracking-tighter italic">SECURE <span className="text-amber-500 text-glow">APPOINTMENT</span></h1>
          <p className="text-gray-500 text-[10px] font-bold tracking-[0.4em] uppercase opacity-80">Phase {step} of 3 • Terminal Protocols</p>
        </header>

        <div className="glass rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl relative">
          {isSubmitting && (
             <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center backdrop-blur-md">
                <div className="w-12 h-12 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-6"></div>
                <p className="text-amber-500 font-futuristic text-[10px] uppercase tracking-widest animate-pulse">Establishing Neural Link...</p>
             </div>
          )}

          <div className="flex w-full h-1.5 bg-white/5">
            <div className={`h-full bg-amber-500 transition-all duration-700 shadow-[0_0_10px_#f59e0b] ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
          </div>

          <div className="p-8 md:p-14">
            {step === 1 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
                <h3 className="text-xl font-bold font-futuristic text-amber-500 flex items-center gap-4 uppercase italic">
                  <span className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-xs border border-amber-500/20">01</span>
                  CHOOSE ROYAL SERVICE
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                  {allAvailable.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedService(s)}
                      className={`p-6 rounded-[2rem] border text-left transition-all group ${
                        selectedService?.id === s.id ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-bold font-futuristic uppercase text-[10px] tracking-widest group-hover:text-white transition-colors">{s.name}</span>
                        <span className="text-xs text-amber-500 font-bold font-futuristic">₹{s.price}</span>
                      </div>
                      <p className="text-[10px] opacity-70 line-clamp-2 leading-relaxed italic">"{s.description}"</p>
                    </button>
                  ))}
                </div>
                <button 
                  disabled={!selectedService}
                  onClick={() => setStep(2)}
                  className="w-full py-5 bg-white text-black font-bold rounded-[1.5rem] hover:bg-amber-500 transition-all disabled:opacity-30 uppercase tracking-[0.2em] text-[10px] shadow-lg"
                >
                  NEXT PHASE: CALENDAR
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
                <h3 className="text-xl font-bold font-futuristic text-amber-500 flex items-center gap-4 uppercase italic">
                  <span className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-xs border border-amber-500/20">02</span>
                  APPOINTMENT SLOT
                </h3>
                
                <div className="grid md:grid-cols-2 gap-10">
                  <div>
                    <label className="block text-[9px] uppercase tracking-[0.3em] text-gray-500 mb-3 font-bold">Chronometer: Select Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-amber-500 text-xs font-futuristic shadow-inner"
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-[0.3em] text-gray-500 mb-3 font-bold">Select Time Node</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {TIMESLOTS.map(t => (
                        <button 
                          key={t}
                          onClick={() => setFormData({...formData, time: t})}
                          className={`text-[9px] py-3 rounded-xl border transition-all font-bold tracking-tight uppercase ${formData.time === t ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-5">
                   <button onClick={() => setStep(1)} className="flex-1 py-5 glass text-white font-bold rounded-2xl hover:bg-white/10 uppercase text-[9px] tracking-widest transition-all">Previous</button>
                   <button 
                    disabled={!formData.date || !formData.time}
                    onClick={() => setStep(3)}
                    className="flex-[2] py-5 bg-amber-500 text-black font-bold rounded-2xl hover:bg-white transition-all disabled:opacity-30 uppercase text-[9px] tracking-widest shadow-xl"
                  >
                    REVIEW PROTOCOL
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleComplete} className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
                <h3 className="text-xl font-bold font-futuristic text-amber-500 flex items-center gap-4 uppercase italic">
                  <span className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-xs border border-amber-500/20">03</span>
                  FINAL CLEARANCE
                </h3>
                <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/20 shadow-inner">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Session Objective:</span>
                    <span className="text-white font-bold text-sm uppercase italic">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Coordinate:</span>
                    <span className="text-white font-bold text-[10px] uppercase tracking-widest">{formData.date} @ {formData.time}</span>
                  </div>
                  
                  {/* Notification Status Logic */}
                  <div className="pt-6 border-t border-white/10 mb-6">
                    <span className="text-gray-500 text-[9px] uppercase tracking-[0.2em] block mb-3 font-bold">Notification Protocols:</span>
                    <div className="flex gap-4">
                      {loggedInUser?.notificationPreferences?.email ? (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[8px] font-bold text-green-500 uppercase">Email Active</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-[8px] font-bold text-gray-500 uppercase">Email Muted</span>
                        </div>
                      )}
                      {loggedInUser?.notificationPreferences?.whatsapp ? (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[8px] font-bold text-green-500 uppercase">WhatsApp Active</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-[8px] font-bold text-gray-500 uppercase">WhatsApp Muted</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-white/10">
                    <span className="text-amber-500 font-bold text-[10px] uppercase tracking-widest">Royal Fee:</span>
                    <span className="text-3xl font-bold font-futuristic text-glow">₹{selectedService?.price}</span>
                  </div>
                </div>
                <div className="flex gap-5">
                   <button type="button" onClick={() => setStep(2)} className="flex-1 py-5 glass text-white font-bold rounded-2xl hover:bg-white/10 uppercase text-[9px] tracking-widest transition-all">Reschedule</button>
                   <button 
                    type="submit"
                    className="flex-[2] py-5 bg-white text-black font-bold rounded-2xl hover:bg-amber-500 transition-all uppercase text-[10px] tracking-[0.3em] shadow-2xl"
                  >
                    CONFIRM ROYAL SESSION
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
