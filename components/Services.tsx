import React, { useState } from 'react';
import { SERVICES } from '../constants';
import { Service } from '../types';
import { estimateCustomService } from '../services/geminiService';

interface Props {
  onBook: (service: Service) => void;
}

const Services: React.FC<Props> = ({ onBook }) => {
  const [customRequest, setCustomRequest] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customResult, setCustomResult] = useState<Partial<Service> | null>(null);

  const handleAnalyzeCustom = async () => {
    if (!customRequest.trim()) return;
    setIsAnalyzing(true);
    const result = await estimateCustomService(customRequest);
    if (result) {
      setCustomResult({
        id: 'custom-' + Date.now(),
        name: result.name,
        price: result.price,
        duration: result.estimatedDuration,
        description: result.description,
        category: 'Hair',
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400'
      });
    }
    setIsAnalyzing(false);
  };

  return (
    <section id="services" className="pt-32 pb-24 px-6 md:px-12 bg-[#050505]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div>
            <h2 className="text-amber-500 font-futuristic font-bold tracking-widest mb-4 uppercase text-xs">Royal Grooming Menu</h2>
            <h3 className="text-4xl md:text-6xl font-futuristic font-bold leading-tight uppercase tracking-tighter italic">INDIVIDUAL <br /><span className="text-glow">UPGRADES</span></h3>
          </div>
          <div className="max-w-sm glass p-8 rounded-3xl border-amber-500/20">
            <p className="text-gray-400 text-sm italic font-light">"Grooming is the secret language of confidence. Speak it fluently with amader expert stylists."</p>
            <div className="mt-6 flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/20"></span>
            </div>
          </div>
        </div>

        {/* Custom Service Section */}
        <div className="mb-20 glass rounded-[3rem] p-6 md:p-12 border border-amber-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6 text-center md:text-left">
              <div>
                <h4 className="text-xl md:text-2xl font-futuristic font-bold text-white mb-2 uppercase tracking-tighter italic"> Bespoke Styling </h4>
                <p className="text-gray-500 text-xs italic uppercase tracking-widest font-bold">Protocol Analysis Required</p>
              </div>
              <div className="px-5 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full">
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest animate-pulse">Neural AI Processor Active</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-10">
              <input 
                type="text"
                placeholder="Example: Mid-fade with royal gold highlights..."
                className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-amber-500 transition-all font-futuristic uppercase text-xs tracking-widest"
                value={customRequest}
                onChange={(e) => setCustomRequest(e.target.value)}
              />
              <button 
                onClick={handleAnalyzeCustom}
                disabled={isAnalyzing || !customRequest}
                className="px-10 py-4 bg-white text-black font-bold rounded-2xl hover:bg-amber-500 transition-all disabled:opacity-30 font-futuristic text-[10px] tracking-widest uppercase shadow-xl"
              >
                {isAnalyzing ? 'Analyzing...' : 'ESTIMATE PRICE'}
              </button>
            </div>

            {customResult && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 p-8 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Protocol Recommended</span>
                    <div className="h-px w-20 bg-amber-500/30"></div>
                  </div>
                  <h5 className="text-2xl font-bold font-futuristic text-white mb-3 italic uppercase">{customResult.name}</h5>
                  <p className="text-gray-400 text-sm max-w-lg italic font-light leading-relaxed">"{customResult.description}"</p>
                </div>
                <div className="flex flex-col items-center md:items-end gap-3 min-w-[180px]">
                  <span className="text-4xl font-bold font-futuristic text-white">₹{customResult.price}</span>
                  <span className="text-xs text-gray-500 mb-4 uppercase tracking-widest font-bold">{customResult.duration}</span>
                  <button 
                    onClick={() => onBook(customResult as Service)}
                    className="w-full px-8 py-3.5 bg-amber-500 text-black font-bold rounded-xl text-[10px] hover:bg-white transition-all uppercase tracking-widest shadow-lg"
                  >
                    INITIATE SESSION
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Individual Services Grid */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {SERVICES.map((s) => (
            <div key={s.id} className="group glass rounded-[2.5rem] p-4 md:p-6 border border-white/5 hover:border-amber-500/40 transition-all duration-700 flex flex-col md:flex-row gap-8">
              <div className="relative w-full md:w-48 h-56 md:h-48 rounded-[2rem] overflow-hidden flex-shrink-0 shadow-xl">
                <img src={s.image} alt={s.name} className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-110 transition-all duration-1000" />
                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              
              <div className="flex flex-col justify-between py-2 flex-grow">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[8px] font-bold text-amber-500 tracking-[0.3em] uppercase bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">{s.category}</span>
                    <span className="text-[9px] text-gray-500 font-futuristic uppercase tracking-widest font-bold">{s.duration}</span>
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold font-futuristic mb-3 group-hover:text-amber-500 transition-colors uppercase tracking-tight italic leading-tight">{s.name}</h4>
                  <p className="text-gray-400 text-xs leading-relaxed mb-6 font-light line-clamp-3 italic">"{s.description}"</p>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <span className="text-2xl font-bold font-futuristic tracking-tighter">₹{s.price}</span>
                  <button 
                    onClick={() => onBook(s)}
                    className="px-8 py-3 bg-white text-black font-bold rounded-xl text-[9px] hover:bg-amber-500 transition-all uppercase tracking-widest shadow-lg"
                  >
                    RESERVE SLOT
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;