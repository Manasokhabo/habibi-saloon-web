
import React, { useState } from 'react';
import { Service } from '../types';
import { TIMESLOTS } from '../constants';

interface Props {
  service: Service | null;
  onClose: () => void;
}

const BookingModal: React.FC<Props> = ({ service, onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    name: '',
    phone: ''
  });

  if (!service) return null;

  const handleNext = () => setStep(step + 1);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Success! Your appointment for ${service.name} is confirmed for ${formData.date} at ${formData.time}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative glass w-full max-w-lg rounded-3xl p-8 border border-white/20 overflow-hidden shadow-2xl">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 blur-3xl"></div>

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <h3 className="text-2xl font-bold font-futuristic mb-6">Confirm {service.name}</h3>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Select Date</label>
              <input 
                type="date" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Select Time</label>
              <div className="grid grid-cols-3 gap-2">
                {TIMESLOTS.map(t => (
                  <button 
                    key={t}
                    onClick={() => setFormData({...formData, time: t})}
                    className={`text-xs py-2 rounded-lg border transition-all ${formData.time === t ? 'bg-cyan-500 border-cyan-500 text-black' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button 
              disabled={!formData.date || !formData.time}
              onClick={handleNext}
              className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50"
            >
              NEXT STEP
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Full Name</label>
              <input 
                required
                type="text" 
                placeholder="Ex: Rohit Sharma"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Contact Number</label>
              <input 
                required
                type="tel" 
                placeholder="+91 XXXXX XXXXX"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="glass p-4 rounded-xl text-sm border border-cyan-500/30">
              <div className="flex justify-between text-gray-400 mb-1">
                <span>Total Amount:</span>
                <span className="text-white font-bold">₹{service.price}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Payment Mode:</span>
                <span className="text-cyan-400">Pay at Saloon</span>
              </div>
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-cyan-500 text-black font-bold rounded-xl hover:bg-white transition-all"
            >
              CONFIRM BOOKING
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
