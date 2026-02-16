import React from 'react';
import { SALON_NAME, SALON_ADDRESS } from '../constants';

interface Props {
  onNavigate: (page: string) => void;
}

const Footer: React.FC<Props> = ({ onNavigate }) => {
  return (
    <footer className="bg-black border-t border-white/5 py-16 px-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 relative z-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center font-bold text-black font-futuristic text-xs">H</div>
            <span className="text-xl font-bold tracking-tighter font-futuristic text-white uppercase">HABIBI <span className="text-amber-500">SALOON</span></span>
          </div>
          <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
            The ultimate destination for premium grooming. Where tradition meets future tech to sculpt the royal you.
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 animate-pulse">Stay Styled • Stay Royal</span>
          </div>
        </div>
        
        <div>
          <h4 className="font-futuristic font-bold text-white mb-6 uppercase tracking-widest text-sm">Navigation</h4>
          <ul className="space-y-4 text-gray-500 text-sm">
            <li><button onClick={() => onNavigate('our-story')} className="hover:text-amber-500 transition-colors uppercase tracking-widest text-[10px] font-bold">Our Story</button></li>
            <li><button onClick={() => onNavigate('services')} className="hover:text-amber-500 transition-colors uppercase tracking-widest text-[10px] font-bold">Services</button></li>
            <li><button onClick={() => onNavigate('packages')} className="hover:text-amber-500 transition-colors uppercase tracking-widest text-[10px] font-bold">Packages</button></li>
            <li><button onClick={() => onNavigate('contact')} className="hover:text-amber-500 transition-colors uppercase tracking-widest text-[10px] font-bold">Contact</button></li>
          </ul>
        </div>

        <div>
          <h4 className="font-futuristic font-bold text-white mb-6 uppercase tracking-widest text-sm">Location</h4>
          <p className="text-gray-500 text-[11px] leading-relaxed uppercase tracking-tighter">
            {SALON_ADDRESS}<br /><br />
            <span className="text-amber-500 font-bold">Open Daily: 10:00 - 21:00</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] text-gray-600 uppercase tracking-widest">
        <div className="flex items-center gap-1">
          <span 
            onClick={() => onNavigate('admin')} 
            className="cursor-pointer hover:text-amber-500 transition-all select-none duration-300"
            title="System Override"
          >
            ©
          </span> 
          2025 {SALON_NAME}. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;