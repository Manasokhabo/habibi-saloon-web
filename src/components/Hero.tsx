import React, { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';
import { HeroImage } from '../types';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800'
];

interface Props {
  onNavigate: (page: string) => void;
}

const Hero: React.FC<Props> = ({ onNavigate }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [images, setImages] = useState<string[]>(FALLBACK_IMAGES);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const fetched = await firebaseService.getHeroImages();
        const activeUrls = fetched.filter(i => i.active).map(i => i.url);
        if (activeUrls.length > 0) {
          setImages(activeUrls);
        } else {
          setImages(FALLBACK_IMAGES);
        }
      } catch (err) {
        console.warn("Failed to load hero images, using fallbacks.");
        setImages(FALLBACK_IMAGES);
      }
    };
    loadImages();
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images]);

  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center pt-24 pb-12 px-6 md:px-12 overflow-hidden bg-[#050505]">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side: Content */}
        <div className="text-center md:text-left order-2 md:order-1 mt-8 md:mt-0">
          {/* Tagline updated */}
          <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.4em] mb-4 uppercase text-[10px] animate-in fade-in slide-in-from-bottom duration-700">Infrastructure & Connectivity</h2>
          
          {/* Heading updated */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-futuristic font-bold leading-[1.1] mb-6 uppercase tracking-tighter animate-in fade-in slide-in-from-bottom duration-1000">
            Powering Infrastructure <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-gray-400 text-glow">Enabling Connectivity</span>
          </h1>

          {/* Description updated */}
          <p className="text-gray-400 text-sm max-w-sm mx-auto md:mx-0 mb-8 leading-relaxed font-light animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
            Ganapati Telecom is a trusted provider of construction equipment, road safety systems, and telecom infrastructure solutions across India.
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
            <button 
              onClick={() => onNavigate('services')}
              className="px-8 py-3 bg-amber-500 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-white transition-all uppercase text-[10px] tracking-widest"
            >
              OUR SERVICES
            </button>
            <button 
              onClick={() => onNavigate('our-story')}
              className="px-8 py-3 glass text-white font-bold rounded-xl hover:bg-white/10 transition-all uppercase text-[10px] tracking-widest"
            >
              OUR STORY
            </button>
          </div>
        </div>
        
        {/* Right Side: Image Slider (Image alt text updated) */}
        <div className="relative order-1 md:order-2 w-full max-w-md mx-auto md:mr-0 animate-in fade-in zoom-in duration-1000">
          <div className="absolute -inset-4 bg-amber-500/10 rounded-[3rem] blur-2xl opacity-50"></div>
          <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden glass border border-white/10 shadow-2xl">
            {images.map((img, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                  index === currentIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                }`}
              >
                <img 
                  src={img} 
                  alt={`Ganapati Telecom Project ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>
            ))}
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {images.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => setCurrentIdx(index)}
                  className={`h-1 transition-all duration-500 rounded-full ${
                    index === currentIdx ? 'w-8 bg-amber-500' : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
