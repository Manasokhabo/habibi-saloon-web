import React from 'react';

const OurStory: React.FC = () => {
  return (
    <div className="min-h-screen pt-32 pb-24 px-6 relative overflow-hidden bg-black">
      
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          
          {/* Left Image Section */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-amber-500/5 rounded-[3rem] blur-3xl group-hover:bg-amber-500/10 transition-all duration-1000"></div>
            
            <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/10 bg-zinc-950 p-2 shadow-2xl">
              
              <img 
                src="https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=800" 
                alt="Ganapati Telecom Infrastructure" 
                className="w-full h-full object-cover rounded-[2rem] grayscale contrast-[1.1] brightness-[0.9] hover:grayscale-0 transition-all duration-1000" 
              />
              
              <div className="absolute bottom-8 left-8 right-8 bg-black/90 backdrop-blur-2xl p-6 rounded-2xl border border-amber-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                 <h3 className="text-xl font-futuristic font-bold text-white uppercase tracking-tighter">
                   GANAPATI TELECOM
                 </h3>
                 <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                   Infrastructure Supply Partner
                 </p>
              </div>
            </div>
          </div>

          {/* Right Content Section */}
          <div className="space-y-8">
            
            <header>
              <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.4em] mb-4 uppercase text-[10px] text-glow">
                Company Overview
              </h2>
              <h1 className="text-5xl md:text-7xl font-futuristic font-bold uppercase tracking-tighter italic">
                BUILDING <br />
                <span className="text-glow text-white">STRONG FOUNDATIONS</span>
              </h1>
            </header>

            <div className="space-y-6 text-gray-400 text-lg leading-relaxed font-light">
              <p>
                Ganapati Telecom operates as a professional infrastructure supply company specializing in construction equipment and road safety products. We support contractors, developers, and infrastructure companies with dependable, performance-driven materials.
              </p>
              <p>
                With practical industry understanding and strong sourcing capabilities, we ensure every product delivered meets modern engineering standards for durability, efficiency, and operational reliability.
              </p>
              <p>
                We believe that strong infrastructure begins with reliable materials — and our goal is not just to supply products, but to become a dependable long-term partner in your project success.
              </p>
            </div>

            <div className="pt-8 border-t border-white/10">
               <div className="flex items-center gap-6">
                  
                  <div className="glass p-5 rounded-2xl border border-amber-500/10 text-center flex-1 bg-white/5">
                     <div className="text-2xl font-bold font-futuristic text-white">Quality</div>
                     <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">
                       Assured Products
                     </div>
                  </div>
                  
                  <div className="glass p-5 rounded-2xl border border-amber-500/10 text-center flex-1 bg-white/5">
                     <div className="text-2xl font-bold font-futuristic text-white">Timely</div>
                     <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">
                       Delivery Schedule
                     </div>
                  </div>
                  
                  <div className="glass p-5 rounded-2xl border border-amber-500/10 text-center flex-1 bg-white/5">
                     <div className="text-2xl font-bold font-futuristic text-white">Trusted</div>
                     <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">
                       Business Relationships
                     </div>
                  </div>

               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default OurStory;
