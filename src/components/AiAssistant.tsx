import React, { useState } from 'react';
import { getStyleRecommendation } from '../services/geminiService';

const AiAssistant: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query) return;
    setLoading(true);
    const result = await getStyleRecommendation(query);
    setResponse(result || '');
    setLoading(false);
  };

  return (
    <section className="min-h-screen pt-32 pb-24 px-6 relative overflow-y-auto bg-[#050505]">
      {/* Background HUD elements */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
         <div className="absolute top-1/2 left-0 w-full h-px bg-amber-500/20"></div>
         <div className="absolute top-0 left-1/2 w-px h-full bg-amber-500/20"></div>
         <div className="absolute top-24 left-10 text-[8px] text-amber-500 font-mono uppercase tracking-[0.5em]">Neural_Link_Status: Active</div>
         <div className="absolute bottom-10 right-10 text-[8px] text-amber-500 font-mono uppercase tracking-[0.5em]">Protocol: Habibi_AI_v4.2</div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="text-center mb-16 animate-in fade-in slide-in-from-top duration-1000">
          <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.4em] mb-4 uppercase text-[10px] text-glow italic">Cognitive Analysis</h2>
          <h1 className="text-5xl md:text-7xl font-futuristic font-bold mb-8 italic tracking-tighter uppercase leading-none text-white">NEURAL <span className="text-amber-500 text-glow">STYLIST</span></h1>
          <p className="text-gray-400 text-xs md:text-sm max-w-xl mx-auto leading-relaxed font-bold tracking-widest uppercase opacity-60">
            Advanced algorithm processing your grooming parameters for the ultimate royal transformation.
          </p>
        </header>

        <div className="glass rounded-[3rem] p-2 md:p-4 border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.1)]">
          <div className="bg-black/60 rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden border border-white/5">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row gap-4 mb-12">
                <input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="DESCRIBE YOUR VIBE, MOOD, OR EVENT..."
                  className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-white focus:outline-none focus:border-amber-500 transition-all font-futuristic tracking-[0.2em] text-xs uppercase italic"
                />
                <button 
                  onClick={handleAsk}
                  disabled={loading}
                  className="px-10 py-6 bg-amber-500 text-black font-bold rounded-2xl hover:bg-white transition-all disabled:opacity-50 min-w-[200px] font-futuristic tracking-[0.3em] uppercase text-xs shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-pulse"
                >
                  {loading ? 'ANALYZING...' : 'RUN PROTOCOL'}
                </button>
              </div>

              {response ? (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="h-px flex-grow bg-gradient-to-r from-transparent to-amber-500/30"></div>
                    <span className="text-[10px] font-bold text-amber-500 tracking-[0.5em] uppercase text-glow">Result Dispatched</span>
                    <div className="h-px flex-grow bg-gradient-to-l from-transparent to-amber-500/30"></div>
                  </div>
                  <div className="glass p-10 md:p-14 rounded-[2.5rem] border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent relative shadow-2xl">
                    <div className="absolute top-6 left-6 w-3 h-3 rounded-full bg-amber-500 animate-ping"></div>
                    <p className="text-lg md:text-2xl text-gray-200 leading-relaxed font-light italic text-center md:text-left">
                      "{response}"
                    </p>
                  </div>
                  <div className="mt-12 flex justify-center">
                    <button 
                      onClick={() => setResponse('')}
                      className="text-[9px] text-amber-500 font-bold uppercase tracking-[0.4em] hover:text-white transition-all flex items-center gap-3 py-4 px-10 border border-amber-500/20 rounded-full hover:bg-amber-500/10"
                    >
                      NEW ANALYSIS
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 opacity-20 group">
                   <div className="text-4xl md:text-6xl mb-6 font-futuristic uppercase tracking-tighter italic text-white group-hover:text-amber-500 transition-colors duration-1000">WAITING FOR INPUT</div>
                   <div className="text-[10px] tracking-[0.6em] uppercase font-bold text-gray-500">Terminal ready to process royal grooming stream</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AiAssistant;