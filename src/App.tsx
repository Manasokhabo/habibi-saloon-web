import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import AiAssistant from './components/AiAssistant';
import Footer from './components/Footer';
import BookingPage from './components/BookingPage';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import AdminDashboard from './components/AdminDashboard';
import OurStory from './components/OurStory';
import ContactPage from './components/ContactPage';
import ReviewSection from './components/ReviewSection';
import GallerySection from './components/GallerySection';
import GalleryPage from './components/GalleryPage';
import SettingsPage from './components/SettingsPage';
import Toast, { ToastType } from './components/Toast';
import { PACKAGES, SALON_NAME } from './constants';
import { Service, User } from './types';
import { firebaseService } from './services/firebaseService';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [selectedForBooking, setSelectedForBooking] = useState<Service | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeToAuth((fbUser) => {
      setUser(fbUser);
      setInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const navigateToBooking = (service?: Service) => {
    if (service) setSelectedForBooking(service);
    setCurrentPage('booking');
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    try {
      await firebaseService.logout();
      setCurrentPage('home');
      showToast("Signed out successfully.", 'info');
    } catch (err) {
      showToast("Error during sign out.", 'error');
    }
  };

  const setPage = (page: string, params?: any) => {
    if (page === 'auth' && params?.mode) {
      setAuthMode(params.mode);
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-2 border-amber-500/10 border-t-amber-500 rounded-full animate-spin mb-6"></div>
        <p className="text-amber-500 font-futuristic text-xs tracking-[0.4em] uppercase">Initializing Royal Hub...</p>
      </div>
    );
  }

  const renderPageContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <Hero onNavigate={setPage} />
            
            <GallerySection />

            {/* Why Choose Us Section - Tight Spacing */}
            <section className="py-10 px-6 overflow-hidden bg-[#050505]">
              <div className="max-w-7xl mx-auto">
                 <div className="glass p-8 md:p-14 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-center gap-12 relative shadow-2xl">
                    <div className="absolute -top-12 -left-12 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full"></div>
                    <div className="md:w-1/2">
                       <h2 className="text-3xl md:text-5xl font-futuristic font-bold mb-8 italic tracking-tighter uppercase">WHY CHOOSE <span className="text-amber-500 text-glow">HABIBI?</span></h2>
                       <ul className="space-y-8">
                          <li className="flex gap-6">
                             <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-sm font-bold font-futuristic border border-amber-500/20 shadow-lg">01</div>
                             <div>
                                <span className="text-white font-bold uppercase tracking-widest text-xs block mb-1">Smart Bookings</span>
                                <p className="text-gray-500 text-sm leading-relaxed font-light italic">"Effortless scheduling in under 60 seconds."</p>
                             </div>
                          </li>
                          <li className="flex gap-6">
                             <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-sm font-bold font-futuristic border border-amber-500/20 shadow-lg">02</div>
                             <div>
                                <span className="text-white font-bold uppercase tracking-widest text-xs block mb-1">AI Style Advisor</span>
                                <p className="text-gray-500 text-sm leading-relaxed font-light italic">"Neural-enhanced recommendations for your best look."</p>
                             </div>
                          </li>
                          <li className="flex gap-6">
                             <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 text-sm font-bold font-futuristic border border-amber-500/20 shadow-lg">03</div>
                             <div>
                                <span className="text-white font-bold uppercase tracking-widest text-xs block mb-1">Luxury Environment</span>
                                <p className="text-gray-500 text-sm leading-relaxed font-light italic">"Premium amenities in a high-tech royal hub."</p>
                             </div>
                          </li>
                       </ul>
                    </div>
                    <div className="md:w-1/2 relative aspect-square rounded-[2.5rem] overflow-hidden glass border border-white/10 p-3 shadow-2xl">
                       <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800" alt="Interior" className="w-full h-full object-cover rounded-[2rem] grayscale group-hover:grayscale-0 transition-all duration-1000" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent pointer-events-none"></div>
                       <div className="absolute bottom-10 left-10">
                          <span className="text-amber-500 font-futuristic font-bold text-xs uppercase tracking-[0.3em] block mb-2">Established 2020</span>
                          <span className="text-white font-bold text-2xl uppercase tracking-tighter">Premium Experience</span>
                       </div>
                    </div>
                 </div>
              </div>
            </section>
          </>
        );
      case 'gallery':
        return <GalleryPage />;
      case 'our-story':
        return <OurStory />;
      case 'contact':
        return <ContactPage showToast={showToast} />;
      case 'services':
        return <Services onBook={navigateToBooking} />;
      case 'packages':
        return (
          <section className="pt-32 pb-24 px-6 bg-[#050505]">
            <div className="max-w-7xl mx-auto">
              <header className="mb-20 text-center md:text-left">
                <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.4em] mb-4 uppercase text-[10px] text-glow">Curated Services</h2>
                <h3 className="text-4xl md:text-6xl font-futuristic font-bold mb-8 tracking-tighter uppercase">SPECIAL <br /><span className="text-glow italic">PACKAGES</span></h3>
              </header>

              <div className="grid md:grid-cols-3 gap-10">
                {PACKAGES.map((p) => (
                  <div key={p.id} className="glass rounded-[2.5rem] border border-white/10 hover:border-amber-500/50 transition-all group overflow-hidden flex flex-col">
                    <div className="relative h-72 overflow-hidden">
                      <img src={p.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" />
                      <div className="absolute bottom-6 left-8">
                        <span className="text-3xl font-bold font-futuristic tracking-tighter">₹{p.price}</span>
                      </div>
                    </div>
                    <div className="p-10 flex flex-col flex-grow">
                      <h4 className="text-xl font-bold font-futuristic mb-4 group-hover:text-amber-500 transition-colors uppercase tracking-tight">{p.name}</h4>
                      <p className="text-gray-500 text-sm mb-10 flex-grow leading-relaxed italic line-clamp-3">"{p.description}"</p>
                      <button 
                        onClick={() => navigateToBooking(p)}
                        className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all font-futuristic uppercase tracking-[0.2em] text-[9px]"
                      >
                        SELECT PACKAGE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'ai-advisor':
        return <AiAssistant />;
      case 'booking':
        return <BookingPage initialService={selectedForBooking} onNavigate={setPage} loggedInUser={user} showToast={showToast} />;
      case 'auth':
        return <AuthPage initialMode={authMode} onLogin={(u) => { setUser(u); setPage('profile'); }} onNavigate={setPage} showToast={showToast} />;
      case 'profile':
        return <ProfilePage user={user} onLogout={handleLogout} onNavigate={setPage} />;
      case 'settings':
        return <SettingsPage user={user} onNavigate={setPage} showToast={showToast} />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Hero onNavigate={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30">
      <Navbar onNavigate={setPage} currentPage={currentPage} user={user} />
      <main className="animate-in fade-in duration-700">
        {renderPageContent()}
        {currentPage === 'home' && <ReviewSection />}
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Footer onNavigate={setPage} />
    </div>
  );
};

export default App;