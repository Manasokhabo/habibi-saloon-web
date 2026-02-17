import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, doc, deleteDoc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { User, HeroImage, Review, GalleryItem, ContactSubmission } from '../types';
import { firebaseService } from '../services/firebaseService';
import { TIMESLOTS, OWNER_WHATSAPP } from '../constants';

const IMGBB_API_KEY = "7a3f74aef6df57ab41ef9fb0c1b161d6";

const AdminDashboard: React.FC = () => {
  // Persistence logic: Check session storage for existing auth
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('habibi_admin_auth') === 'true';
  });
  
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  
  const [view, setView] = useState<'bookings' | 'settings' | 'leads' | 'customers' | 'hero' | 'reviews' | 'showcase' | 'transformations'>('bookings');
  
  // Data States
  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<ContactSubmission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  
  const [hubWpNumber, setHubWpNumber] = useState(OWNER_WHATSAPP);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isHeroUploading, setIsHeroUploading] = useState(false);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [isReviewUploading, setIsReviewUploading] = useState(false);

  // Edit states
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  // Refs for hidden inputs
  const heroInputRef = useRef<HTMLInputElement>(null);
  const showcaseInputRef = useRef<HTMLInputElement>(null);
  const transBeforeRef = useRef<HTMLInputElement>(null);
  const transAfterRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initialLoadRef = useRef(true);

  // New Item States
  const [newGalleryItem, setNewGalleryItem] = useState({ 
    imageUrl: '', 
    beforeUrl: '', 
    afterUrl: '', 
    title: '', 
    category: 'Haircut' as any 
  });
  
  const [newReview, setNewReview] = useState({
    clientName: '',
    comment: '',
    rating: 5,
    avatar: ''
  });

  const compressImage = (dataUrl: string, maxWidth = 1920, maxHeight = 1080, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const uploadToImgBB = async (base64Data: string): Promise<string> => {
    if (!base64Data) return '';
    const base64Image = base64Data.split(',')[1] || base64Data;
    const formData = new FormData();
    formData.append('image', base64Image);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (data.success) return data.data.display_url;
    throw new Error(data.error.message || 'ImgBB Upload Failed');
  };

  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.8;
    audioRef.current = audio;
  }, []);

  const playNotification = () => {
    if (isSoundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      setLoading(true);
      
      const fetchSettings = async () => {
        const settings = await firebaseService.getSalonSettings();
        if (settings?.ownerWhatsapp) setHubWpNumber(settings.ownerWhatsapp);
      };
      fetchSettings();
      
      // Real-time Listeners
      const unsubBookings = onSnapshot(query(collection(db, "bookings"), orderBy("createdAt", "desc")), (snap) => {
        setBookings(snap.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id })));
        if (!initialLoadRef.current) playNotification();
        initialLoadRef.current = false;
        setLoading(false);
      });

      const unsubLeads = onSnapshot(query(collection(db, "contact_submissions"), orderBy("timestamp", "desc")), (snap) => {
        setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() } as ContactSubmission)));
      });

      const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
      });

      const unsubHero = onSnapshot(collection(db, "hero_images"), (snap) => {
        setHeroImages(snap.docs.map(d => ({ id: d.id, ...d.data() } as HeroImage)));
      });

      const unsubReviews = onSnapshot(query(collection(db, "reviews"), orderBy("rating", "desc")), (snap) => {
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
      });

      const unsubGallery = onSnapshot(query(collection(db, "gallery"), orderBy("createdAt", "desc")), (snap) => {
        setGalleryItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem)));
      });

      return () => {
        unsubBookings(); unsubLeads(); unsubUsers(); unsubHero(); unsubReviews(); unsubGallery();
      };
    }
  }, [isAdminAuthenticated]);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser.toLowerCase().trim() === 'admin@habibisalooon.com' && adminPass === 'HABIBI_ADMIN_2025') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('habibi_admin_auth', 'true');
    } else {
      alert("UNAUTHORIZED: Invalid Credentials.");
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('habibi_admin_auth');
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleStatusUpdate = async (booking: any, status: 'approved' | 'canceled') => {
    try {
      await firebaseService.updateBookingStatus(booking.firebaseId, booking.userId, booking.id, status);
    } catch (err) {
      alert("Status update failed.");
    }
  };

  const handleDelete = async (collectionName: string, docId: string) => {
    if (!docId || !confirm("Erase this entry permanently from the neural database?")) return;
    try { await deleteDoc(doc(db, collectionName, docId)); }
    catch (err) { alert('Deletion failure.'); }
  };

  const handleSaveBookingEdit = async (booking: any) => {
    try {
      await firebaseService.updateBookingDetails(booking.firebaseId, booking.userId, booking.id, editDate, editTime);
      setEditingBookingId(null);
    } catch (err) { alert("Update failed."); }
  };

  const handleAddGalleryItem = async (type: 'showcase' | 'transformation') => {
    if (!newGalleryItem.title) return alert("Title required.");
    setIsGalleryUploading(true);
    try {
      let data: any = { title: newGalleryItem.title, category: newGalleryItem.category, type };
      if (type === 'showcase') {
        if (!newGalleryItem.imageUrl) throw new Error("Please select an exhibit image.");
        data.imageUrl = await uploadToImgBB(newGalleryItem.imageUrl);
      } else {
        if (!newGalleryItem.beforeUrl || !newGalleryItem.afterUrl) throw new Error("Neural shift requires both Before and After frames.");
        data.beforeUrl = await uploadToImgBB(newGalleryItem.beforeUrl);
        data.afterUrl = await uploadToImgBB(newGalleryItem.afterUrl);
      }
      await firebaseService.addGalleryItem(data);
      setNewGalleryItem({ imageUrl: '', beforeUrl: '', afterUrl: '', title: '', category: 'Haircut' });
    } catch (err: any) { alert(err.message); }
    finally { setIsGalleryUploading(false); }
  };

  const handleAddReview = async () => {
    if (!newReview.clientName || !newReview.comment) return alert("Details required.");
    setIsReviewUploading(true);
    try {
      const avatarUrl = newReview.avatar ? await uploadToImgBB(newReview.avatar) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${newReview.clientName}`;
      await firebaseService.addReview({ clientName: newReview.clientName, comment: newReview.comment, rating: newReview.rating, avatar: avatarUrl });
      setNewReview({ clientName: '', comment: '', rating: 5, avatar: '' });
    } catch (err: any) { alert(err.message); }
    finally { setIsReviewUploading(false); }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(customerSearch.toLowerCase()) || u.phone.includes(customerSearch));

  const BookingCard: React.FC<{ b: any }> = ({ b }) => (
    <div className="glass p-4 rounded-[1.5rem] border border-white/5 flex flex-col h-full relative group hover:border-amber-500/30 transition-all duration-300">
      <div className="flex justify-between items-start mb-2.5">
         <span className={`px-2 py-0.5 rounded-lg text-[7px] font-bold uppercase border ${
           b.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
           b.status === 'canceled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
           'bg-white/5 text-gray-500 border-white/10'
         }`}>{b.status}</span>
         <button onClick={() => handleDelete('bookings', b.firebaseId)} className="text-red-500/20 hover:text-red-500 transition-colors p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      </div>
      <h4 className="text-white font-bold text-[11px] uppercase italic truncate mb-0.5">{b.serviceName}</h4>
      <p className="text-[10px] text-gray-500 uppercase tracking-widest truncate font-bold mb-4">{b.name}</p>
      
      {editingBookingId === b.firebaseId ? (
        <div className="space-y-2 mb-4">
           <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full bg-black/50 border border-amber-500/30 rounded-lg p-2 text-[9px] text-white" />
           <select value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-full bg-black/50 border border-amber-500/30 rounded-lg p-2 text-[9px] text-white">
              {TIMESLOTS.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
        </div>
      ) : (
        <div className="flex justify-between items-center mb-5 text-[9px] font-mono text-gray-500 uppercase bg-white/5 p-2 rounded-xl">
           <span className="flex items-center gap-1.5"><span className="text-amber-500">📅</span> {b.date}</span>
           <span className="flex items-center gap-1.5"><span className="text-amber-500">⏰</span> {b.time}</span>
        </div>
      )}

      <div className="mt-auto space-y-2">
        {editingBookingId === b.firebaseId ? (
          <div className="flex gap-1.5">
            <button onClick={() => handleSaveBookingEdit(b)} className="flex-1 py-2 bg-amber-500 text-black font-bold rounded-xl text-[9px] uppercase">SAVE</button>
            <button onClick={() => setEditingBookingId(null)} className="px-3 py-2 bg-white/5 text-white rounded-xl text-[9px]">X</button>
          </div>
        ) : (
          <>
            {b.status === 'pending' && (
              <div className="flex gap-1.5 mb-2">
                <button onClick={() => handleStatusUpdate(b, 'approved')} className="flex-1 py-2 bg-green-500 text-black font-bold rounded-xl text-[9px] uppercase hover:bg-green-400">APPROVE</button>
                <button onClick={() => handleStatusUpdate(b, 'canceled')} className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl text-[9px] uppercase hover:bg-red-400">DECLINE</button>
              </div>
            )}
            <div className="flex gap-1.5 pt-2 border-t border-white/5">
              <button onClick={() => handleCall(b.phone)} className="flex-1 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] uppercase hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                CALL
              </button>
              <button onClick={() => { setEditingBookingId(b.firebaseId); setEditDate(b.date); setEditTime(b.time); }} className="flex-1 py-2 bg-white/5 border border-white/10 text-gray-400 rounded-xl text-[9px] uppercase hover:bg-white/10">EDIT</button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505]">
        <div className="glass p-12 rounded-[3.5rem] border border-amber-500/30 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <h1 className="text-2xl font-futuristic font-bold text-white mb-2 uppercase tracking-[0.3em] italic">Admin Terminal</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-8 font-bold">Managerial Override Required</p>
          <form onSubmit={handleAdminAuth} className="space-y-4">
            <input type="email" placeholder="ADMIN ID" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-amber-500 font-futuristic text-xs" />
            <input type="password" placeholder="NEURAL KEY" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-amber-500 font-futuristic text-xs" />
            <button className="w-full py-5 bg-amber-500 text-black font-bold rounded-2xl uppercase tracking-[0.3em] text-[11px] hover:bg-white transition-all shadow-xl">INITIATE UPLINK</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 md:px-8 bg-[#050505] flex">
      {/* Sidebar Navigation */}
      <aside className="fixed left-4 top-32 bottom-24 w-64 hidden lg:block z-50">
        <div className="glass h-full rounded-[2.5rem] border border-white/10 p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-6 border-b border-white/5 mb-4">
             <h3 className="text-amber-500 font-futuristic font-bold tracking-[0.4em] uppercase text-[9px] italic mb-1">Hub Control</h3>
             <p className="text-white font-futuristic font-bold text-xs uppercase tracking-widest">Navigation</p>
          </div>
          {[
            { id: 'bookings', label: 'Nodes (Bookings)' },
            { id: 'customers', label: 'Registry (Clients)' },
            { id: 'hero', label: 'Hero Feed' },
            { id: 'showcase', label: 'Exhibits' },
            { id: 'transformations', label: 'Neural Shift (B&A)' },
            { id: 'leads', label: 'Leads' },
            { id: 'reviews', label: 'Testimonials' },
            { id: 'settings', label: 'Protocol Config' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { setView(tab.id as any); setSelectedCustomer(null); }} 
              className={`w-full px-5 py-4 rounded-xl font-futuristic text-[9px] tracking-[0.2em] uppercase transition-all text-left flex items-center gap-3 ${
                view === tab.id 
                  ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${view === tab.id ? 'bg-black' : 'bg-amber-500/20'}`}></div>
              {tab.label}
            </button>
          ))}
          <div className="mt-auto pt-6 border-t border-white/5 px-4">
            <button onClick={handleLogout} className="text-[9px] font-bold text-gray-500 hover:text-red-500 uppercase tracking-widest transition-all">TERMINATE SESSION</button>
          </div>
        </div>
      </aside>

      <div className="flex-grow lg:ml-72">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.5em] uppercase text-[9px]">Hub Ops Protocol</h2>
              <div className="h-px w-12 bg-amber-500/30"></div>
              <button onClick={handleLogout} className="lg:hidden text-[8px] font-bold text-gray-600 hover:text-red-500 uppercase tracking-widest transition-all">TERMINATE SESSION</button>
            </div>
            <h1 className="text-4xl md:text-6xl font-futuristic font-bold uppercase tracking-tighter italic text-white leading-none">ADMIN <span className="text-amber-500 text-glow">CONSOLE</span></h1>
          </div>
          
          {/* Mobile Tab List (Visible only on smaller screens) */}
          <div className="flex lg:hidden glass p-1.5 rounded-2xl border-white/10 overflow-x-auto no-scrollbar scroll-smooth w-full">
            {[
              { id: 'bookings', label: 'Nodes' },
              { id: 'customers', label: 'Registry' },
              { id: 'hero', label: 'Feed' },
              { id: 'showcase', label: 'Exhibits' },
              { id: 'transformations', label: 'B&A' },
              { id: 'leads', label: 'Leads' },
              { id: 'reviews', label: 'Reviews' },
              { id: 'settings', label: 'Config' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setView(tab.id as any); setSelectedCustomer(null); }} 
                className={`px-5 py-3.5 rounded-xl font-futuristic text-[9px] tracking-[0.2em] uppercase transition-all whitespace-nowrap ${view === tab.id ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="py-24 text-center">
             <div className="w-12 h-12 border-2 border-amber-500/10 border-t-amber-500 rounded-full animate-spin mx-auto mb-6"></div>
             <p className="text-amber-500 text-[10px] tracking-[0.6em] uppercase animate-pulse">Establishing neural stream...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-700">
            {/* BOOKINGS VIEW */}
            {view === 'bookings' && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {bookings.map(b => <BookingCard key={b.firebaseId} b={b} />)}
                {bookings.length === 0 && <div className="col-span-full py-32 text-center opacity-20 uppercase text-[10px] tracking-[0.5em] italic">Registry Null: No active nodes detected</div>}
              </div>
            )}

            {/* HUB SETTINGS VIEW */}
            {view === 'settings' && (
              <div className="max-w-md mx-auto">
                <div className="glass p-12 rounded-[3rem] border border-amber-500/20 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl"></div>
                   <h3 className="text-xl font-futuristic font-bold text-white mb-8 italic uppercase tracking-widest border-b border-white/5 pb-4">Protocol Config</h3>
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] uppercase tracking-[0.4em] text-gray-500 font-bold ml-1">Primary WhatsApp Routing</label>
                        <input value={hubWpNumber} onChange={(e) => setHubWpNumber(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-amber-500 outline-none text-xs font-futuristic" />
                      </div>
                      <button onClick={async () => { setIsSavingSettings(true); await firebaseService.updateSalonSettings({ ownerWhatsapp: hubWpNumber }); setIsSavingSettings(false); alert("PROTOCOL SYNCED."); }} disabled={isSavingSettings} className="w-full py-5 bg-amber-500 text-black font-bold rounded-2xl uppercase tracking-widest shadow-xl hover:bg-white transition-all text-[11px]">
                        {isSavingSettings ? 'SYNCING...' : 'SYNC HUB SETTINGS'}
                      </button>
                   </div>
                </div>
              </div>
            )}

            {/* CUSTOMERS VIEW */}
            {view === 'customers' && (
              selectedCustomer ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setSelectedCustomer(null)} className="flex items-center gap-2 text-amber-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Back to Registry
                    </button>
                    <button onClick={() => handleCall(selectedCustomer.phone)} className="px-6 py-2.5 bg-amber-500 text-black rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                       Contact Identity
                    </button>
                  </div>
                  
                  <div className="glass p-10 rounded-[3rem] border border-amber-500/20 mb-12 flex flex-col md:flex-row items-center gap-10">
                    <div className="w-32 h-32 rounded-3xl border-2 border-amber-500 p-1.5 bg-black overflow-hidden shadow-2xl shrink-0">
                        <img src={selectedCustomer.avatar} className="w-full h-full object-cover rounded-2xl" />
                    </div>
                    <div className="text-center md:text-left flex-grow">
                      <h2 className="text-3xl font-futuristic font-bold text-white uppercase italic tracking-tighter leading-none mb-3">{selectedCustomer.name}</h2>
                      <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                        <span className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 font-bold text-[9px] uppercase tracking-widest">{selectedCustomer.loyaltyLevel} Tier</span>
                        <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 font-bold text-[9px] uppercase tracking-widest">Credits: {selectedCustomer.credits}</span>
                      </div>
                      <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold font-mono">ID: {selectedCustomer.id}</p>
                    </div>
                  </div>

                  <h3 className="text-xs font-bold font-futuristic text-white uppercase tracking-[0.4em] border-l-2 border-amber-500 pl-6 italic mb-8">Node History Pipeline</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookings.filter(b => b.userId === selectedCustomer.id).length > 0 ? (
                      bookings.filter(b => b.userId === selectedCustomer.id).map(b => <BookingCard key={b.firebaseId} b={b} />)
                    ) : (
                      <div className="col-span-full py-20 text-center opacity-30 text-[9px] uppercase tracking-widest font-bold">No historical nodes recorded for this identity.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <h3 className="text-xs font-bold font-futuristic text-white uppercase tracking-widest italic flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Client Registry
                     </h3>
                     <div className="relative max-w-sm w-full">
                        <input type="text" placeholder="SEARCH IDENTITY (NAME/PHONE)..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white outline-none focus:border-amber-500 text-[10px] font-futuristic italic tracking-widest" />
                        <svg className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map(u => (
                      <div key={u.id} onClick={() => setSelectedCustomer(u)} className="glass p-5 rounded-[2rem] border border-white/5 hover:border-amber-500/40 transition-all group cursor-pointer flex items-center gap-5">
                         <div className="w-14 h-14 rounded-2xl border border-white/10 p-0.5 bg-black group-hover:border-amber-500 transition-colors shrink-0 overflow-hidden shadow-xl">
                            <img src={u.avatar} className="w-full h-full object-cover rounded-xl" />
                         </div>
                         <div className="min-w-0 flex-grow">
                            <h4 className="text-white font-bold uppercase text-[11px] truncate italic group-hover:text-amber-500 transition-colors">{u.name}</h4>
                            <p className="text-amber-500 text-[8px] font-bold mt-1 tracking-widest">{u.loyaltyLevel} STATUS</p>
                            <p className="text-gray-600 text-[8px] truncate mt-1">{u.phone}</p>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); handleDelete('users', u.id); }} className="text-red-500/10 hover:text-red-500 p-2 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && <div className="col-span-full py-32 text-center opacity-20 uppercase text-[10px] tracking-[0.5em] italic">Search Registry: No identities found.</div>}
                  </div>
                </div>
              )
            )}

            {/* HERO FEED VIEW */}
            {view === 'hero' && (
              <div className="space-y-12">
                <div className="glass p-12 rounded-[3.5rem] border border-amber-500/20 max-w-xl bg-gradient-to-br from-amber-500/5 to-transparent relative group">
                   <div className="absolute top-10 right-10 text-[7px] text-gray-500 font-bold uppercase tracking-widest border border-white/5 px-2 py-1 rounded">Protocol: 1920x1080 (16:9)</div>
                   <h3 className="text-white font-futuristic font-bold text-xl uppercase italic mb-8 border-l-2 border-amber-500 pl-4">Visual Loop Uplink</h3>
                   
                   <div 
                    onClick={() => heroInputRef.current?.click()}
                    className={`aspect-video w-full rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden mb-8 ${isHeroUploading ? 'border-amber-500 animate-pulse bg-amber-500/10' : 'border-white/10 bg-white/5 hover:border-amber-500/40 hover:bg-white/10'}`}
                   >
                     <input type="file" ref={heroInputRef} className="hidden" accept="image/*" onChange={async (e) => { 
                       const f = e.target.files?.[0]; 
                       if (f) { 
                         setIsHeroUploading(true);
                         const r = new FileReader();
                         r.onloadend = async () => {
                           const comp = await compressImage(r.result as string, 1920, 1080, 0.85);
                           await firebaseService.addHeroImage(comp);
                           setIsHeroUploading(false);
                           alert("Neural Frame Synchronized.");
                         };
                         r.readAsDataURL(f);
                       }
                     }} />
                     {isHeroUploading ? (
                       <span className="text-amber-500 font-futuristic text-[11px] tracking-[0.4em] uppercase font-bold">Synchronizing...</span>
                     ) : (
                       <>
                         <svg className="w-10 h-10 text-gray-600 mb-4 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                         <span className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Drop neural frame or browse gallery</span>
                       </>
                     )}
                   </div>
                   <p className="text-gray-600 text-[8px] uppercase tracking-widest font-bold text-center italic">Optimal Specs: 1920x1080px • Aspect Ratio 16:9 • High Fidelity</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {heroImages.map(img => (
                    <div key={img.id} className="relative aspect-video rounded-3xl overflow-hidden group border border-white/10 bg-zinc-950 shadow-2xl">
                       <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                       <button onClick={() => handleDelete('hero_images', img.id)} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500 transition-opacity duration-300 z-10"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SHOWCASE VIEW */}
            {view === 'showcase' && (
              <div className="space-y-12">
                <div className="glass p-12 rounded-[3.5rem] border border-amber-500/20 max-w-xl bg-gradient-to-br from-amber-500/5 to-transparent">
                   <h3 className="text-white font-futuristic font-bold text-xl uppercase italic mb-8 border-l-2 border-amber-500 pl-4">Exhibit Registry</h3>
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <input value={newGalleryItem.title} onChange={(e) => setNewGalleryItem({...newGalleryItem, title: e.target.value})} placeholder="EXHIBIT ID" className="bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-[11px] outline-none font-futuristic italic" />
                        <select value={newGalleryItem.category} onChange={(e) => setNewGalleryItem({...newGalleryItem, category: e.target.value as any})} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-[11px] font-futuristic uppercase">
                           <option value="Haircut" className="bg-zinc-900">HAIRCUT</option><option value="Beard" className="bg-zinc-900">BEARD</option><option value="Facial" className="bg-zinc-900">FACIAL</option><option value="Other" className="bg-zinc-900">OTHER</option>
                        </select>
                      </div>
                      <div 
                        onClick={() => showcaseInputRef.current?.click()} 
                        className={`aspect-square w-40 rounded-[2.5rem] border-2 border-dashed transition-all flex items-center justify-center cursor-pointer overflow-hidden mx-auto group ${isGalleryUploading ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:border-amber-500/40'}`}
                      >
                         <input type="file" ref={showcaseInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewGalleryItem({...newGalleryItem, imageUrl: r.result as string}); r.readAsDataURL(f); } }} />
                         {newGalleryItem.imageUrl ? <img src={newGalleryItem.imageUrl} className="w-full h-full object-cover" /> : <svg className="w-10 h-10 text-gray-700 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <p className="text-gray-600 text-[8px] uppercase tracking-widest font-bold text-center italic">Pro-Tip: Use Square (1080x1080px) for optimal display.</p>
                      <button onClick={() => handleAddGalleryItem('showcase')} disabled={isGalleryUploading} className="w-full py-5 bg-amber-500 text-black font-bold rounded-2xl uppercase tracking-[0.3em] text-[11px] shadow-xl hover:bg-white transition-all">
                        {isGalleryUploading ? 'ESTABLISHING...' : 'SYNC EXHIBIT'}
                      </button>
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {galleryItems.filter(i => i.type === 'showcase' || i.imageUrl).map(item => (
                    <div key={item.id} className="glass p-2.5 rounded-[2rem] border border-white/10 group relative bg-zinc-950 shadow-2xl">
                       <img src={item.imageUrl} className="w-full aspect-square object-cover rounded-[1.5rem] transition-transform duration-500 group-hover:scale-105" />
                       <button onClick={() => handleDelete('gallery', item.id)} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500 transition-opacity duration-300 z-10"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                       <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                         <p className="text-[7px] text-white font-bold uppercase truncate">{item.title}</p>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TRANSFORMATIONS VIEW */}
            {view === 'transformations' && (
              <div className="space-y-12">
                <div className="glass p-12 rounded-[3.5rem] border border-amber-500/20 max-w-2xl bg-gradient-to-br from-amber-500/5 to-transparent">
                   <h3 className="text-white font-futuristic font-bold text-xl uppercase italic mb-8 border-l-2 border-amber-500 pl-4">Shift Registry Pipeline</h3>
                   <div className="space-y-8">
                      <input value={newGalleryItem.title} onChange={(e) => setNewGalleryItem({...newGalleryItem, title: e.target.value})} placeholder="SHIFT IDENTIFIER ID" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-[11px] font-futuristic outline-none" />
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <label className="block text-[8px] text-gray-500 font-bold uppercase tracking-widest text-center">Protocol: Before</label>
                            <div onClick={() => transBeforeRef.current?.click()} className="aspect-square rounded-[2.5rem] border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden hover:border-amber-500/40 transition-all group">
                               {newGalleryItem.beforeUrl ? <img src={newGalleryItem.beforeUrl} className="w-full h-full object-cover" /> : <span className="text-[8px] font-bold text-gray-700 uppercase group-hover:text-amber-500">UPLOAD</span>}
                            </div>
                         </div>
                         <div className="space-y-4">
                            <label className="block text-[8px] text-gray-500 font-bold uppercase tracking-widest text-center">Protocol: After</label>
                            <div onClick={() => transAfterRef.current?.click()} className="aspect-square rounded-[2.5rem] border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden hover:border-amber-500/40 transition-all group">
                               {newGalleryItem.afterUrl ? <img src={newGalleryItem.afterUrl} className="w-full h-full object-cover" /> : <span className="text-[8px] font-bold text-gray-700 uppercase group-hover:text-amber-500">UPLOAD</span>}
                            </div>
                         </div>
                      </div>
                      <input type="file" ref={transBeforeRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewGalleryItem({...newGalleryItem, beforeUrl: r.result as string}); r.readAsDataURL(f); } }} />
                      <input type="file" ref={transAfterRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewGalleryItem({...newGalleryItem, afterUrl: r.result as string}); r.readAsDataURL(f); } }} />
                      <p className="text-gray-600 text-[8px] uppercase tracking-widest font-bold text-center italic">Neural Target: Match perspectives in both frames (1:1 Aspect Recommended).</p>
                      <button onClick={() => handleAddGalleryItem('transformation')} disabled={isGalleryUploading} className="w-full py-6 bg-amber-500 text-black font-bold rounded-2xl uppercase tracking-[0.4em] text-[11px] shadow-2xl hover:bg-white transition-all">
                         {isGalleryUploading ? 'UPLOADING...' : 'SYNC SHIFT SEQUENCE'}
                      </button>
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {galleryItems.filter(i => i.type === 'transformation' || (i.beforeUrl && i.afterUrl)).map(item => (
                    <div key={item.id} className="glass p-3 rounded-[2.5rem] border border-white/10 relative group bg-zinc-950 shadow-2xl overflow-hidden">
                       <img src={item.afterUrl} className="w-full aspect-square object-cover rounded-[2rem] transition-transform duration-700 group-hover:scale-105" />
                       <button onClick={() => handleDelete('gallery', item.id)} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500 transition-opacity duration-300 z-10"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                       <div className="absolute bottom-5 left-5 right-5 text-[8px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity truncate bg-black/40 backdrop-blur-md p-2 rounded-lg">{item.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LEADS VIEW */}
            {view === 'leads' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {leads.map(lead => (
                  <div key={lead.id} className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col group relative bg-gradient-to-br from-white/5 to-transparent">
                     <div className="flex justify-between items-center mb-5">
                        <h4 className="text-white font-bold uppercase text-[12px] italic tracking-tight">{lead.name}</h4>
                        <button onClick={() => handleDelete('contact_submissions', lead.id!)} className="text-red-500/10 hover:text-red-500 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                     </div>
                     <p className="text-amber-500 text-[10px] font-bold mb-6 tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-xl self-start">{lead.email}</p>
                     <div className="bg-black/40 p-5 rounded-2xl flex-grow mb-6 border border-white/5">
                        <p className="text-gray-400 text-[11px] leading-relaxed italic">"{lead.message}"</p>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-[7px] text-gray-700 font-mono uppercase tracking-[0.2em]">{new Date(lead.timestamp).toLocaleDateString()} • {new Date(lead.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <a href={`mailto:${lead.email}`} className="text-amber-500 text-[8px] font-bold uppercase tracking-widest hover:text-white transition-all underline decoration-amber-500/30">Initiate Reply</a>
                     </div>
                  </div>
                ))}
              </div>
            )}

            {/* REVIEWS VIEW */}
            {view === 'reviews' && (
              <div className="space-y-12">
                <div className="glass p-12 rounded-[3.5rem] border border-amber-500/20 max-w-xl bg-gradient-to-br from-amber-500/5 to-transparent">
                   <h3 className="text-white font-futuristic font-bold text-xl uppercase italic mb-8 border-l-2 border-amber-500 pl-4">Post Testimonial</h3>
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                         <input value={newReview.clientName} onChange={(e) => setNewReview({...newReview, clientName: e.target.value})} placeholder="CLIENT IDENTITY" className="bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-[11px] outline-none font-futuristic" />
                         <select value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-[11px] font-futuristic">
                            <option value="5">5 STARS (Elite)</option><option value="4">4 STARS (Royal)</option><option value="3">3 STARS (Good)</option>
                         </select>
                      </div>
                      <textarea value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} placeholder="CONTENT PROTOCOL..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-[11px] h-36 font-futuristic resize-none outline-none focus:border-amber-500" />
                      <button onClick={handleAddReview} disabled={isReviewUploading} className="w-full py-5 bg-amber-500 text-black font-bold rounded-2xl text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-white transition-all">
                        {isReviewUploading ? 'UPLOADING...' : 'ESTABLISH TESTIMONIAL'}
                      </button>
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {reviews.map(rev => (
                    <div key={rev.id} className="glass p-6 rounded-[2rem] border border-white/5 relative group bg-gradient-to-b from-white/5 to-transparent">
                       <div className="flex items-center gap-4 mb-4">
                          <img src={rev.avatar} className="w-10 h-10 rounded-2xl border border-white/10 bg-black shadow-lg" />
                          <h4 className="text-white font-bold text-[10px] uppercase truncate italic">{rev.clientName}</h4>
                       </div>
                       <p className="text-gray-500 text-[10px] italic leading-relaxed line-clamp-4">"{rev.comment}"</p>
                       <div className="flex gap-1 mt-5">
                          {[...Array(5)].map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < rev.rating ? 'bg-amber-500 shadow-[0_0_5px_#f59e0b]' : 'bg-gray-800'}`}></div>)}
                       </div>
                       <button onClick={() => handleDelete('reviews', rev.id)} className="absolute top-2 right-2 p-1.5 text-red-500/10 hover:text-red-500 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                  {reviews.length === 0 && <div className="col-span-full py-32 text-center opacity-20 uppercase text-[10px] tracking-[0.5em] italic">Review registry is empty.</div>}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
