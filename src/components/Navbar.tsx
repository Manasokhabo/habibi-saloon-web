import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { SALON_NAME } from '../constants';

interface Props {
  onNavigate: (page: string, params?: any) => void;
  currentPage: string;
  user: User | null;
}

const Navbar: React.FC<Props> = ({ onNavigate, currentPage, user }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Gallery', id: 'gallery' },
    { name: 'Our Story', id: 'our-story' },
    { name: 'Services', id: 'services' },
    { name: 'Packages', id: 'packages' },
    { name: 'Contact', id: 'contact' },
    { name: 'AI Stylist', id: 'ai-advisor' },
  ];

  // Logic to determine if the logged-in user is an administrator
  const isAdmin = user?.role === 'admin' || user?.email === 'admin@habibisalooon.com';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLinkClick = (id: string, params?: any) => {
    onNavigate(id, params);
    setShowMobileMenu(false);
  };

  return (
    <nav ref={navbarRef} className="fixed top-0 left-0 right-0 z-[100] bg-[#050505] border-b border-white/10 px-6 py-4 shadow-2xl">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer group shrink-0" 
          onClick={() => handleLinkClick('home')}
        >
          <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center font-bold text-black font-futuristic shadow-[0_0_15px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform text-sm">H</div>
          <span className="text-xl font-bold tracking-tighter font-futuristic text-white">HABIBI <span className="text-amber-500">SALOON</span></span>
        </div>
        
        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-8 flex-grow justify-center">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className={`transition-all font-futuristic tracking-[0.2em] uppercase text-[11px] font-bold relative py-1 ${
                currentPage === link.id ? 'text-amber-500' : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.name}
              {currentPage === link.id && (
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
              )}
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-6">
            {!user ? (
              <>
                <button 
                  onClick={() => handleLinkClick('auth', { mode: 'login' })}
                  className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors"
                >
                  Login
                </button>
                <button 
                  onClick={() => handleLinkClick('auth', { mode: 'signup' })}
                  className="text-[10px] font-bold bg-white text-black hover:bg-amber-500 uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all"
                >
                  Join Now
                </button>
              </>
            ) : isAdmin ? (
              /* Admin Specific Console Button */
              <button 
                onClick={() => handleLinkClick('admin')}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/50 rounded-xl hover:bg-amber-500 hover:text-black transition-all group"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-amber-500 group-hover:text-black uppercase tracking-widest">Admin Console</span>
              </button>
            ) : (
              /* Standard User Profile */
              <button 
                onClick={() => handleLinkClick('profile')}
                className="flex items-center gap-2 glass px-3 py-1.5 rounded-full border-amber-500/30 hover:border-amber-500 transition-all"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden border border-amber-500/50">
                  <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">{user.name.split(' ')[0]}</span>
              </button>
            )}
          </div>
          
          <button 
            onClick={() => handleLinkClick('booking')}
            className="hidden sm:block px-6 py-2.5 bg-amber-500 text-black text-[10px] font-bold rounded-xl hover:bg-white transition-all font-futuristic uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            BOOK NOW
          </button>

          {/* Mobile Toggle */}
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden w-10 h-10 glass rounded-xl flex items-center justify-center text-amber-500 border-white/10 active:scale-95 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showMobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0a0a0a] border-b border-white/10 animate-in slide-in-from-top duration-300 shadow-2xl z-[90]">
          <div className="px-6 py-10 space-y-6">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`block w-full text-left font-futuristic tracking-[0.3em] uppercase text-xs py-4 border-b border-white/5 transition-colors ${
                  currentPage === link.id ? 'text-amber-500 font-bold' : 'text-gray-300'
                }`}
              >
                {link.name}
              </button>
            ))}
            
            <div className="pt-6 space-y-4">
              {!user ? (
                <>
                  <button onClick={() => handleLinkClick('auth', { mode: 'login' })} className="w-full py-4 text-center text-white border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest bg-white/5">Login</button>
                  <button onClick={() => handleLinkClick('auth', { mode: 'signup' })} className="w-full py-4 text-center bg-white text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500">Join Now</button>
                </>
              ) : isAdmin ? (
                <button onClick={() => handleLinkClick('admin')} className="w-full py-4 text-center bg-amber-500 text-black font-bold rounded-2xl text-[10px] uppercase tracking-widest">ADMIN CONSOLE</button>
              ) : (
                <button onClick={() => handleLinkClick('profile')} className="w-full py-4 text-center glass text-white rounded-2xl text-[10px] uppercase tracking-widest">VIEW PROFILE</button>
              )}
              <button onClick={() => handleLinkClick('booking')} className="w-full py-5 bg-amber-500 text-black font-bold rounded-2xl font-futuristic uppercase tracking-widest text-xs shadow-lg">BOOK NOW</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
