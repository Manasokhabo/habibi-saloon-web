import React, { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';
import { Review } from '../types';
import { FALLBACK_REVIEWS } from '../constants';

const ReviewSection: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const fetched = await firebaseService.getReviews();
        let combined = [...fetched];
        if (combined.length < 9) {
          const needed = 9 - combined.length;
          combined = [...combined, ...FALLBACK_REVIEWS.slice(0, needed)];
        }
        setReviews(combined.slice(0, 9));
      } catch (err) {
        setReviews(FALLBACK_REVIEWS.slice(0, 9));
      }
    };
    load();
  }, []);

  const itemsPerPage = isMobile ? 1 : 3;
  const totalPages = Math.ceil(reviews.length / itemsPerPage);

  useEffect(() => {
    if (reviews.length <= itemsPerPage) return;
    const timer = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }, 5000);
    return () => clearInterval(timer);
  }, [reviews, totalPages, itemsPerPage]);

  if (reviews.length === 0) return null;

  const paginatedReviews = [];
  for (let i = 0; i < reviews.length; i += itemsPerPage) {
    paginatedReviews.push(reviews.slice(i, i + itemsPerPage));
  }

  return (
    <section className="py-12 px-6 relative overflow-hidden bg-[#050505]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 border-b border-white/5 pb-4">
          <div className="text-center md:text-left">
            <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.3em] uppercase text-[8px] italic mb-1">Elite Testimonials</h2>
            <h3 className="text-2xl font-futuristic font-bold uppercase tracking-tighter italic">ROYAL <span className="text-white text-glow">REVIEWS</span></h3>
          </div>
          <div className="flex gap-1.5 mt-4 md:mt-0">
            {paginatedReviews.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentPage(i)}
                className={`h-0.5 rounded-full transition-all duration-700 ${i === currentPage ? 'w-10 bg-amber-500' : 'w-2 bg-white/10'}`}
              />
            ))}
          </div>
        </div>
        
        <div className="relative overflow-hidden h-[160px] md:h-[130px]">
          <div 
            className="flex transition-transform duration-700 absolute inset-0"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {paginatedReviews.map((group, groupIdx) => (
              <div key={groupIdx} className="w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                {group.map((rev) => (
                  <div 
                    key={rev.id} 
                    className="glass border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-amber-500/20 transition-colors h-full"
                  >
                    <div className="shrink-0">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-zinc-900 shadow-lg">
                        <img src={rev.reviewImage || rev.avatar} className="w-full h-full object-cover block" alt={rev.clientName} />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <h4 className="text-white font-bold text-[10px] uppercase tracking-widest mb-0.5 truncate">{rev.clientName}</h4>
                      <p className="text-gray-400 italic text-[10px] leading-tight mb-1.5 line-clamp-2 pr-2">"{rev.comment}"</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-2.5 h-2.5 ${i < rev.rating ? 'text-amber-500' : 'text-gray-800'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
