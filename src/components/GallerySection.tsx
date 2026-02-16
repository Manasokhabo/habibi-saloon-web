import React, { useState, useEffect, useRef } from 'react';
import { firebaseService } from '../services/firebaseService';
import { GalleryItem } from '../types';

const GallerySection: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const data = await firebaseService.getGalleryItems();
        // Strictly only show items that are transformations (B&A)
        setItems(data.filter(i => i.type === 'transformation' || (i.beforeUrl && i.afterUrl)));
      } catch (err) {
        console.error("Gallery Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <section className="py-12 md:py-20 px-3 md:px-6 bg-[#050505] overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-10 md:mb-16 fade-in-up">
          <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.4em] mb-3 uppercase text-[8px] md:text-[10px] text-glow italic">
            Artistry in Motion
          </h2>
          <h3 className="text-2xl md:text-5xl font-futuristic font-bold mb-4 uppercase tracking-tighter italic">
            SIGNATURE <span className="text-amber-500 text-glow">TRANSFORMATIONS</span>
          </h3>
          <p className="text-gray-500 text-[8px] md:text-[11px] uppercase tracking-[0.2em] font-bold opacity-60 max-w-2xl mx-auto leading-relaxed">
            Witness the definitive shift from raw to refined. Slide the comparison node to witness how our master barbers redefine the standard of excellence.
          </p>
        </div>

        {/* 4-column grid for transformations */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {items.map((item) => (
            <TransformationCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

const TransformationCard: React.FC<{ item: GalleryItem }> = ({ item }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(x, 100)));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  return (
    <div className="group relative fade-in-up">
      <div className="mb-2 flex items-center gap-2">
        <div className="w-1 h-3 md:w-1.5 md:h-4 bg-amber-500"></div>
        <h4 className="text-white font-futuristic font-bold uppercase tracking-widest text-[7px] md:text-[10px] italic truncate">
          {item.title}
        </h4>
      </div>

      <div 
        ref={containerRef}
        className="relative aspect-square overflow-hidden bg-zinc-950 border border-white/5 cursor-col-resize select-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={item.beforeUrl} 
            alt="Before" 
            className="w-full h-full object-cover"
          />
        </div>

        <div 
          className="absolute inset-0 w-full h-full z-10"
          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
        >
          <img 
            src={item.afterUrl} 
            alt="After" 
            className="absolute inset-0 w-full h-full object-cover saturate-[1.1] brightness-[1.05] contrast-[1.05]"
          />
        </div>

        <div 
          className="absolute inset-y-0 w-0.5 md:w-1 bg-amber-500 z-20 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 md:w-6 md:h-10 bg-black border border-amber-500 flex flex-col items-center justify-center gap-1 shadow-2xl">
            <div className="w-0.5 h-3 bg-amber-500/30"></div>
            <div className="w-0.5 h-3 bg-amber-500"></div>
            <div className="w-0.5 h-3 bg-amber-500/30"></div>
          </div>
        </div>

        <div className="absolute top-2 left-2 z-30 pointer-events-none">
          <span className="px-1 py-0.5 bg-black/80 text-[6px] md:text-[8px] font-bold text-gray-400 uppercase tracking-widest border border-white/10">BEFORE</span>
        </div>
        <div className="absolute top-2 right-2 z-30 pointer-events-none">
          <span className="px-1 py-0.5 bg-amber-500/80 text-[6px] md:text-[8px] font-bold text-black uppercase tracking-widest">AFTER</span>
        </div>
      </div>
    </div>
  );
};

export default GallerySection;