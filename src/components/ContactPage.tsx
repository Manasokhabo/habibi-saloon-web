import React, { useState } from 'react';
import { firebaseService } from '../services/firebaseService';
import { SALON_ADDRESS, OWNER_WHATSAPP } from '../constants';
import { ToastType } from './Toast';

interface Props {
  showToast: (msg: string, type: ToastType) => void;
}

const ContactPage: React.FC<Props> = ({ showToast }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await firebaseService.submitContactForm({
        ...formData,
        timestamp: new Date().toISOString()
      });
      showToast("Message sent! We'll get back to you soon.", 'success');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      showToast("Failed to send message. Please try again.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hello Habibi Saloon! I'm interested in booking a session. Can you help me?`);
    window.open(`https://wa.me/${OWNER_WHATSAPP}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 relative bg-[#050505]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 text-center lg:text-left">
          <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.4em] mb-4 uppercase text-[10px] text-glow">Communication Terminal</h2>
          <h1 className="text-5xl md:text-7xl font-futuristic font-bold uppercase tracking-tighter leading-none">GET IN <span className="text-glow italic">TOUCH</span></h1>
        </header>

        {/* Layout: Form on Left, Map on Right */}
        <div className="grid lg:grid-cols-2 gap-10 items-stretch">
          {/* Left Side: Form */}
          <div className="glass p-8 md:p-12 rounded-[2.5rem] border border-white/10 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[60px] pointer-events-none"></div>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">Your Identity</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none text-xs transition-all font-futuristic" 
                  placeholder="EX: Rohit Sharma"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Terminal</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none text-xs transition-all font-futuristic" 
                  placeholder="rohit@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest ml-1">Protocol Details</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none text-xs transition-all resize-none font-futuristic" 
                  placeholder="Tell us what you need..."
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4.5 bg-white text-black font-bold rounded-2xl hover:bg-amber-500 transition-all font-futuristic text-[10px] tracking-[0.2em] uppercase shadow-xl disabled:opacity-50"
              >
                {isSubmitting ? 'TRANSMITTING...' : 'SEND MESSAGE'}
              </button>

              <div className="pt-6 border-t border-white/5">
                 <button 
                  type="button"
                  onClick={handleWhatsApp}
                  className="w-full py-4 bg-green-500/10 border border-green-500/30 text-green-400 font-bold rounded-2xl hover:bg-green-500 hover:text-black transition-all font-futuristic text-[10px] tracking-[0.2em] uppercase flex items-center justify-center gap-3"
                 >
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.747-2.874-2.512-2.96-2.626-.087-.115-.708-.943-.708-1.799 0-.856.448-1.277.608-1.438.16-.16.348-.2.464-.2.115 0 .232.001.332.005.107.005.251-.04.393.303.144.35.492 1.203.535 1.289.043.086.072.186.015.301-.058.115-.087.186-.174.287-.087.101-.183.225-.261.301-.087.086-.178.18-.077.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.115.434-.505.549-.68.115-.174.232-.144.39-.087.158.058 1.012.477 1.185.564.174.086.289.13.332.202.045.072.045.419-.1.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.18L2 22l5.002-1.314A9.97 9.97 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" /></svg>
                   Chat via WhatsApp
                 </button>
              </div>
            </form>
          </div>

          {/* Right Side: Map */}
          <div className="space-y-8 flex flex-col h-full">
            <div className="glass rounded-[2.5rem] overflow-hidden border border-white/10 flex-grow min-h-[400px]">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.7502127274094!2d77.6710!3d12.85!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae134000000001%3A0x0!2zMTLCsDUxJzAwLjAiTiA3N8KwNDAnMTUuNiJF!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: 'grayscale(1) invert(0.9) contrast(1.2)' }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            
            <div className="glass p-8 rounded-[2rem] border border-white/5">
              <h4 className="text-amber-500 font-bold text-[10px] uppercase tracking-widest mb-4">Physical Location</h4>
              <p className="text-white font-medium text-sm leading-relaxed mb-6 italic">{SALON_ADDRESS}</p>
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <h5 className="text-gray-500 text-[9px] uppercase font-bold mb-1 tracking-widest">Service Hours</h5>
                    <p className="text-xs text-white font-futuristic">10:00 AM - 09:00 PM</p>
                 </div>
                 <div>
                    <h5 className="text-gray-500 text-[9px] uppercase font-bold mb-1 tracking-widest">Available Days</h5>
                    <p className="text-xs text-white font-futuristic">Monday - Sunday</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;