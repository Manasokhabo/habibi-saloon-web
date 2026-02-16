import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { firebaseService } from '../services/firebaseService';
import { GalleryItem } from '../types';

const GalleryPage: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Haircut' | 'Beard' | 'Facial'>('All');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const categories: ('All' | 'Haircut' | 'Beard' | 'Facial')[] = ['All', 'Haircut', 'Beard', 'Facial'];

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const data = await firebaseService.getGalleryItems();
        // Strictly filter to only show single 'showcase' items here
        setItems(data.filter(i => i.type === 'showcase' || i.imageUrl));
      } catch (err) {
        console.error("Gallery Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const filteredItems = activeCategory === 'All' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-2 border-amber-500/10 border-t-amber-500 rounded-full animate-spin mb-6"></div>
        <p className="text-amber-500 font-futuristic text-xs tracking-[0.4em] uppercase">Loading Royal Portfolio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12 bg-[#050505]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 text-center">
          <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.4em] mb-4 uppercase text-[10px] text-glow italic">Visual Archive</h2>
          <h1 className="text-5xl md:text-7xl font-futuristic font-bold uppercase tracking-tighter italic text-white">STYLE <span className="text-amber-500">EXHIBITION</span></h1>
          <p className="text-gray-500 text-xs md:text-sm mt-6 max-w-xl mx-auto leading-relaxed font-bold tracking-[0.2em] uppercase opacity-60">
            A curated showcase of precision, artistry, and individual royal sessions.
          </p>
        </header>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-xl font-futuristic text-[10px] tracking-widest uppercase transition-all border ${
                activeCategory === cat 
                  ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                  : 'bg-white/5 text-gray-400 border-white/10 hover:border-amber-500/50 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid - Forced Uniform Square Sizing */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                >
                  <div 
                    onClick={() => setSelectedImage(item.imageUrl || null)}
                    className="relative group cursor-pointer overflow-hidden border border-white/5 hover:border-amber-500 transition-all duration-500 bg-zinc-950 aspect-square shadow-2xl rounded-2xl"
                  >
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                      <span className="text-amber-500 text-[8px] font-bold uppercase tracking-[0.3em] mb-1">{item.category}</span>
                      <h4 className="text-white font-futuristic font-bold uppercase text-sm tracking-tight italic">{item.title}</h4>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-32 text-center text-gray-600 uppercase tracking-widest text-xs italic">
            No items found in this category archive.
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain border border-white/10"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryPage;
