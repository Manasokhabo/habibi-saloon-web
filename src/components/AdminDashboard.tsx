import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, doc, deleteDoc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { User, HeroImage, Review, GalleryItem, ContactSubmission } from '../types';
import { firebaseService } from '../services/firebaseService';
import { TIMESLOTS, OWNER_WHATSAPP } from '../constants';

const IMGBB_API_KEY = "7a3f74aef6df57ab41ef9fb0c1b161d6";

const AdminDashboard: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
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
    } else {
      alert("UNAUTHORIZED: Invalid Credentials.");
    }
  };

  const handleApprove = async (booking: any) => {
    const cleanPhone = booking.phone?.replace(/\D/g, '') || '';
    const whatsappNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const msg = encodeURIComponent(`Greetings from Habibi Saloon. Your appointment for ${booking.serviceName} on ${booking.date} at ${booking.time} is CONFIRMED.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank');
    try {
      await firebaseService.updateBookingStatus(booking.firebaseId, booking.userId, booking.id, 'approved');
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (collectionName: string, docId: string) => {
    if (!docId || !confirm("Erase this entry permanently?")) return;
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
        data.imageUrl = await uploadToImgBB(newGalleryItem.imageUrl);
      } else {
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

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505]">
        <div className="glass p-12 rounded-[3rem] border border-amber-500/30 max-w-md w-full text-center">
          <h1 className="text-2xl font-futuristic font-bold text-white mb-8 uppercase tracking-widest italic">Admin Terminal</h1>
          <form onSubmit={handleAdminAuth} className="space-y-4">
            <input type="email" placeholder="Email" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-amber-500" />
            <input type="password" placeholder="Key" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-amber-500" />
            <button className="w-full py-5 bg-amber-500 text-black font-bold rounded-xl uppercase tracking-widest">Connect</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 md:px-8 bg-[#050505]">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.4em] uppercase text-[9px]">Hub Ops Center</h2>
            <h1 className="text-3xl md:text-5xl font-futuristic font-bold uppercase tracking-tighter italic text-white">ADMIN <span className="text-glow">PANEL</span></h1>
          </div>
          <div className="flex glass p-1 rounded-2xl border-white/10 overflow-x-auto no-scrollbar">
            {[
              { id: 'bookings', label: 'Bookings' },
              { id: 'settings', label: 'HUB SETTINGS' },
              { id: 'customers', label: 'Customers' },
              { id: 'hero', label: 'HERO FEED' },
              { id: 'showcase', label: 'SHOWCASE' },
              { id: 'transformations', label: 'B&A' },
              { id: 'leads', label: 'Leads' },
              { id: 'reviews', label: 'Reviews' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setView(tab.id as any)} 
                className={`px-5 py-3 rounded-xl font-futuristic text-[9px] tracking-[0.2em] uppercase transition-all whitespace-nowrap ${view === tab.id ? 'bg-amber-500 text-black font-bold' : 'text-gray-500 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="py-20 text-center text-amber-500 animate-pulse text-[10px] tracking-[0.5em] uppercase">Synchronizing Stream...</div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* BOOKINGS VIEW */}
            {view === 'bookings' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {bookings.map(b => (
                  <div key={b.firebaseId} className="glass p-4 rounded-2xl border border-white/10 flex flex-col group h-full relative">
                    <div className="flex justify-between items-start mb-2">
                       <span className={`px-2 py-0.5 rounded-lg text-[7px] font-bold uppercase border ${b.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-white/5 text-gray-500 border-white/10'}`}>{b.status}</span>
                       <button onClick={() => handleDelete('bookings', b.firebaseId)} className="text-red-500/30 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                    <h4 className="text-white font-bold text-xs uppercase italic truncate mb-1">{b.serviceName}</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest truncate font-bold mb-3">{b.name}</p>
                    
                    {editingBookingId === b.firebaseId ? (
                      <div className="space-y-2 mb-4">
                         <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full bg-black/50 border border-amber-500/30 rounded-lg p-2 text-[9px] text-white" />
                         <select value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-full bg-black/50 border border-amber-500/30 rounded-lg p-2 text-[9px] text-white">
                            {TIMESLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center mb-4 text-[9px] font-mono text-gray-500 uppercase">
                         <span>{b.date}</span>
                         <span>{b.time}</span>
                      </div>
                    )}

                    <div className="mt-auto flex gap-1.5 pt-3 border-t border-white/5">
                      {editingBookingId === b.firebaseId ? (
                        <>
                          <button onClick={() => handleSaveBookingEdit(b)} className="flex-1 py-2 bg-amber-500 text-black font-bold rounded-lg text-[9px] uppercase">SAVE</button>
                          <button onClick={() => setEditingBookingId(null)} className="px-3 py-2 bg-white/5 text-white rounded-lg text-[9px]">X</button>
                        </>
                      ) : (
                        <>
                          {b.status === 'pending' && <button onClick={() => handleApprove(b)} className="flex-1 py-2 bg-green-500 text-black font-bold rounded-lg text-[9px] uppercase">OK</button>}
                          <button onClick={() => { setEditingBookingId(b.firebaseId); setEditDate(b.date); setEditTime(b.time); }} className="flex-1 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-[9px] uppercase hover:bg-white/10">EDIT</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* HUB SETTINGS VIEW */}
            {view === 'settings' && (
              <div className="max-w-md mx-auto">
                <div className="glass p-10 rounded-[3rem] border border-amber-500/20 shadow-2xl">
                   <h3 className="text-xl font-futuristic font-bold text-white mb-8 italic uppercase tracking-widest">Protocol Config</h3>
                   <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2 font-bold">Primary WhatsApp Routing</label>
                        <input value={hubWpNumber} onChange={(e) => setHubWpNumber(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none text-xs font-futuristic" />
                      </div>
                      <button onClick={async () => { setIsSavingSettings(true); await firebaseService.updateSalonSettings({ ownerWhatsapp: hubWpNumber }); setIsSavingSettings(false); alert("PROTOCOL SYNCED."); }} disabled={isSavingSettings} className="w-full py-5 bg-amber-500 text-black font-bold rounded-2xl uppercase tracking-widest shadow-xl">
                        {isSavingSettings ? 'SYNCING...' : 'SYNC HUB SETTINGS'}
                      </button>
                   </div>
                </div>
              </div>
            )}

            {/* CUSTOMERS VIEW */}
            {view === 'customers' && (
              <div className="space-y-6">
                <div className="relative max-w-sm">
                   <input type="text" placeholder="SEARCH REGISTRY..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-500 text-[10px]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="glass p-4 rounded-2xl border border-white/10 flex items-center gap-4 group">
                       <img src={u.avatar} className="w-12 h-12 rounded-xl bg-black border border-white/10" />
                       <div className="min-w-0 flex-grow">
                          <h4 className="text-white font-bold uppercase text-[10px] truncate">{u.name}</h4>
                          <p className="text-amber-500 text-[8px] font-bold mt-1 tracking-widest">{u.loyaltyLevel}</p>
                       </div>
                       <button onClick={() => handleDelete('users', u.id)} className="text-red-500/20 hover:text-red-500 p-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HERO FEED VIEW */}
            {view === 'hero' && (
              <div className="space-y-8">
                <div className="glass p-8 rounded-[2.5rem] border border-amber-500/20 max-w-lg">
                   <h3 className="text-white font-futuristic font-bold text-lg uppercase italic mb-6">Visual Loop Uplink</h3>
                   <input type="file" ref={heroInputRef} className="hidden" accept="image/*" onChange={async (e) => { 
                     const f = e.target.files?.[0]; 
                     if (f) { 
                       setIsHeroUploading(true);
                       const r = new FileReader();
                       r.onloadend = async () => {
                         const comp = await compressImage(r.result as string);
                         await firebaseService.addHeroImage(comp);
                         setIsHeroUploading(false);
                       };
                       r.readAsDataURL(f);
                     }
                   }} />
                   <button onClick={() => heroInputRef.current?.click()} disabled={isHeroUploading} className="w-full py-5 bg-amber-500 text-black font-bold rounded-2xl uppercase tracking-widest shadow-xl">
                      {isHeroUploading ? 'UPLOADING...' : 'UPLOAD NEW FRAME'}
                   </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {heroImages.map(img => (
                    <div key={img.id} className="relative aspect-video rounded-2xl overflow-hidden group border border-white/10 bg-zinc-950">
                       <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                       <button onClick={() => handleDelete('hero_images', img.id)} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500 transition-opacity"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SHOWCASE VIEW */}
            {view === 'showcase' && (
              <div className="space-y-8">
                <div className="glass p-8 rounded-[2.5rem] border border-amber-500/20 max-w-lg">
                   <h3 className="text-white font-futuristic font-bold text-lg uppercase mb-6">Exhibit Entry</h3>
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={newGalleryItem.title} onChange={(e) => setNewGalleryItem({...newGalleryItem, title: e.target.value})} placeholder="EXHIBIT ID" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] outline-none" />
                        <select value={newGalleryItem.category} onChange={(e) => setNewGalleryItem({...newGalleryItem, category: e.target.value as any})} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px]">
                           <option value="Haircut">HAIRCUT</option><option value="Beard">BEARD</option><option value="Facial">FACIAL</option><option value="Other">OTHER</option>
                        </select>
                      </div>
                      <div onClick={() => showcaseInputRef.current?.click()} className="aspect-square w-32 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden mx-auto group">
                         {newGalleryItem.imageUrl ? <img src={newGalleryItem.imageUrl} className="w-full h-full object-cover" /> : <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <input type="file" ref={showcaseInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewGalleryItem({...newGalleryItem, imageUrl: r.result as string}); r.readAsDataURL(f); } }} />
                      <button onClick={() => handleAddGalleryItem('showcase')} disabled={isGalleryUploading} className="w-full py-4 bg-amber-500 text-black font-bold rounded-2xl text-[10px] uppercase shadow-xl">
                        {isGalleryUploading ? 'ESTABLISHING...' : 'SYNC EXHIBIT'}
                      </button>
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {galleryItems.filter(i => i.type === 'showcase').map(item => (
                    <div key={item.id} className="glass p-2 rounded-2xl border border-white/10 group relative bg-zinc-950">
                       <img src={item.imageUrl} className="w-full aspect-square object-cover rounded-xl" />
                       <button onClick={() => handleDelete('gallery', item.id)} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500 transition-opacity"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TRANSFORMATIONS VIEW */}
            {view === 'transformations' && (
              <div className="space-y-8">
                <div className="glass p-8 rounded-[2.5rem] border border-amber-500/20 max-w-lg">
                   <h3 className="text-white font-futuristic font-bold text-lg uppercase mb-6">Shift Registry</h3>
                   <div className="space-y-4">
                      <input value={newGalleryItem.title} onChange={(e) => setNewGalleryItem({...newGalleryItem, title: e.target.value})} placeholder="SHIFT IDENTIFIER" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px]" />
                      <div className="grid grid-cols-2 gap-4">
                         <div onClick={() => transBeforeRef.current?.click()} className="aspect-square rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden">
                            {newGalleryItem.beforeUrl ? <img src={newGalleryItem.beforeUrl} className="w-full h-full object-cover" /> : <span className="text-[8px] font-bold text-gray-500 uppercase">BEFORE</span>}
                         </div>
                         <div onClick={() => transAfterRef.current?.click()} className="aspect-square rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden">
                            {newGalleryItem.afterUrl ? <img src={newGalleryItem.afterUrl} className="w-full h-full object-cover" /> : <span className="text-[8px] font-bold text-gray-500 uppercase">AFTER</span>}
                         </div>
                      </div>
                      <input type="file" ref={transBeforeRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewGalleryItem({...newGalleryItem, beforeUrl: r.result as string}); r.readAsDataURL(f); } }} />
                      <input type="file" ref={transAfterRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewGalleryItem({...newGalleryItem, afterUrl: r.result as string}); r.readAsDataURL(f); } }} />
                      <button onClick={() => handleAddGalleryItem('transformation')} disabled={isGalleryUploading} className="w-full py-5 bg-amber-500 text-black font-bold rounded-2xl text-[10px] uppercase shadow-xl">
                         {isGalleryUploading ? 'UPLOADING...' : 'SYNC SHIFT SEQUENCE'}
                      </button>
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {galleryItems.filter(i => i.type === 'transformation').map(item => (
                    <div key={item.id} className="glass p-2 rounded-2xl border border-white/10 relative group bg-zinc-950">
                       <img src={item.afterUrl} className="w-full aspect-square object-cover rounded-xl" />
                       <button onClick={() => handleDelete('gallery', item.id)} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500 transition-opacity"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                       <div className="absolute bottom-2 left-2 text-[8px] text-white font-bold opacity-0 group-hover:opacity-100 truncate pr-4">{item.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LEADS VIEW */}
            {view === 'leads' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leads.map(lead => (
                  <div key={lead.id} className="glass p-6 rounded-2xl border border-white/10 flex flex-col group relative">
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="text-white font-bold uppercase text-[10px] italic">{lead.name}</h4>
                        <button onClick={() => handleDelete('contact_submissions', lead.id!)} className="text-red-500/20 hover:text-red-500 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                     </div>
                     <p className="text-amber-500 text-[9px] font-bold mb-4 tracking-widest">{lead.email}</p>
                     <div className="bg-white/5 p-4 rounded-xl flex-grow mb-4">
                        <p className="text-gray-400 text-[11px] leading-relaxed italic">"{lead.message}"</p>
                     </div>
                     <span className="text-[8px] text-gray-700 font-mono self-end uppercase">{new Date(lead.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* REVIEWS VIEW */}
            {view === 'reviews' && (
              <div className="space-y-10">
                <div className="glass p-8 rounded-[2.5rem] border border-amber-500/20 max-w-lg">
                   <h3 className="text-white font-futuristic font-bold text-lg uppercase mb-6">Post Testimonial</h3>
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                         <input value={newReview.clientName} onChange={(e) => setNewReview({...newReview, clientName: e.target.value})} placeholder="CLIENT IDENTITY" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px]" />
                         <select value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px]">
                            <option value="5">5 STARS</option><option value="4">4 STARS</option><option value="3">3 STARS</option>
                         </select>
                      </div>
                      <textarea value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} placeholder="CONTENT PROTOCOL..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] h-32" />
                      <button onClick={handleAddReview} disabled={isReviewUploading} className="w-full py-4 bg-amber-500 text-black font-bold rounded-2xl text-[10px] uppercase shadow-xl">
                        {isReviewUploading ? 'UPLOADING...' : 'SAVE TESTIMONIAL'}
                      </button>
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {reviews.map(rev => (
                    <div key={rev.id} className="glass p-4 rounded-xl border border-white/5 relative group">
                       <div className="flex items-center gap-3 mb-3">
                          <img src={rev.avatar} className="w-8 h-8 rounded-full border border-white/10 bg-black" />
                          <h4 className="text-white font-bold text-[9px] uppercase truncate">{rev.clientName}</h4>
                       </div>
                       <p className="text-gray-500 text-[10px] italic line-clamp-3">"{rev.comment}"</p>
                       <div className="flex gap-0.5 mt-3">
                          {[...Array(rev.rating)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>)}
                       </div>
                       <button onClick={() => handleDelete('reviews', rev.id)} className="absolute top-1 right-1 p-1 text-red-500/20 hover:text-red-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
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
