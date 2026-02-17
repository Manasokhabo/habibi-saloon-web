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
  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<ContactSubmission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  
  const [hubWpNumber, setHubWpNumber] = useState(OWNER_WHATSAPP);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isHeroUploading, setIsHeroUploading] = useState(false);

  // Edit states
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  const heroInputRef = useRef<HTMLInputElement>(null);
  const showcaseInputRef = useRef<HTMLInputElement>(null);
  const transBeforeRef = useRef<HTMLInputElement>(null);
  const transAfterRef = useRef<HTMLInputElement>(null);
  const reviewAvatarRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initialLoadRef = useRef(true);

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
    avatar: '',
    reviewImage: ''
  });
  
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [isReviewUploading, setIsReviewUploading] = useState(false);

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
    audio.preload = 'auto';
    audioRef.current = audio;
  }, []);

  const playNotification = () => {
    if (isSoundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
        console.warn("Audio play failed. Awaiting user interaction.", e);
      });
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      setLoading(true);
      
      const fetchSettings = async () => {
        const settings = await firebaseService.getSalonSettings();
        if (settings?.ownerWhatsapp) {
          setHubWpNumber(settings.ownerWhatsapp);
        }
      };
      fetchSettings();
      
      const qBookings = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
      const unsubscribeBookings = onSnapshot(qBookings, (snapshot) => {
        const bookingsData = snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
        setBookings(bookingsData);
        if (!initialLoadRef.current) {
          snapshot.docChanges().forEach((change) => { 
            if (change.type === "added") {
              playNotification();
            }
          });
        }
        initialLoadRef.current = false;
        setLoading(false);
      });

      const qLeads = query(collection(db, "contact_submissions"), orderBy("timestamp", "desc"));
      const unsubscribeLeads = onSnapshot(qLeads, (snapshot) => {
        setLeads(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ContactSubmission)));
      });

      const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User)));
      });

      const unsubscribeHero = onSnapshot(collection(db, "hero_images"), (snapshot) => {
        setHeroImages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HeroImage)));
      });

      const unsubscribeReviews = onSnapshot(collection(db, "reviews"), (snapshot) => {
        setReviews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
      });

      const qGallery = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
      const unsubscribeGallery = onSnapshot(qGallery, (snapshot) => {
        setGalleryItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem)));
      });

      return () => {
        unsubscribeBookings(); unsubscribeLeads(); unsubscribeUsers(); unsubscribeHero(); unsubscribeReviews(); unsubscribeGallery();
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

  const handleUpdateHubSettings = async () => {
    setIsSavingSettings(true);
    try {
      await firebaseService.updateSalonSettings({ ownerWhatsapp: hubWpNumber });
      alert("HUB PROTOCOL UPDATED: Client booking confirmation requests will now route to: " + hubWpNumber);
    } catch (err) {
      alert("Settings sync failure.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleApprove = async (booking: any) => {
    const cleanPhone = booking.phone?.replace(/\D/g, '') || '';
    const whatsappNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const msg = encodeURIComponent(`Greetings from Habibi Saloon. Your appointment for ${booking.serviceName} scheduled on ${booking.date} at ${booking.time} has been CONFIRMED. Total Payable: ₹${booking.price}. We look forward to your visit.`);
    const waUrl = `https://wa.me/${whatsappNumber}?text=${msg}`;
    window.open(waUrl, '_blank');
    try {
      await firebaseService.updateBookingStatus(booking.firebaseId, booking.userId, booking.id, 'approved');
    } catch (err) {
      console.error("Approval status sync failed:", err);
    }
  };

  const handleSaveEdit = async (booking: any) => {
    try {
      await firebaseService.updateBookingDetails(booking.firebaseId, booking.userId, booking.id, editDate, editTime);
      setEditingBookingId(null);
    } catch (err) {
      alert("Failed to update booking nodes.");
    }
  };

  const handleDelete = async (collectionName: string, docId: string, item?: any) => {
    if (!docId) return;
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      if (collectionName === 'bookings' && item?.userId && item?.id) {
        const userRef = doc(db, 'users', item.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as User;
          const filtered = (userData.bookings || []).filter(b => b.id !== item.id);
          await updateDoc(userRef, { bookings: filtered });
        }
      }
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const handleAddGalleryItem = async (type: 'showcase' | 'transformation') => {
    if (!newGalleryItem.title) return alert("Enter a title.");
    setIsGalleryUploading(true);
    try {
      let uploadedUrls: any = {};
      if (type === 'showcase') {
        if (!newGalleryItem.imageUrl) throw new Error("No image selected.");
        uploadedUrls.imageUrl = await uploadToImgBB(newGalleryItem.imageUrl);
      } else {
        if (!newGalleryItem.beforeUrl || !newGalleryItem.afterUrl) throw new Error("Missing B&A frames.");
        uploadedUrls.beforeUrl = await uploadToImgBB(newGalleryItem.beforeUrl);
        uploadedUrls.afterUrl = await uploadToImgBB(newGalleryItem.afterUrl);
      }
      await firebaseService.addGalleryItem({ title: newGalleryItem.title, category: newGalleryItem.category, type, ...uploadedUrls });
      setNewGalleryItem({ imageUrl: '', beforeUrl: '', afterUrl: '', title: '', category: 'Haircut' });
      alert("Exhibit synced successfully.");
    } catch (err: any) {
      alert("Sync failure: " + err.message);
    } finally {
      setIsGalleryUploading(false);
    }
  };

  const handleAddReview = async () => {
    if (!newReview.clientName || !newReview.comment) return alert("Client name and comment required.");
    setIsReviewUploading(true);
    try {
      const avatarUrl = newReview.avatar ? await uploadToImgBB(newReview.avatar) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${newReview.clientName}`;
      await firebaseService.addReview({ clientName: newReview.clientName, comment: newReview.comment, rating: newReview.rating, avatar: avatarUrl });
      setNewReview({ clientName: '', comment: '', rating: 5, avatar: '', reviewImage: '' });
      alert("Testimonial established.");
    } catch (err: any) {
      alert("Review creation failure: " + err.message);
    } finally {
      setIsReviewUploading(false);
    }
  };

  const BookingCard: React.FC<{ b: any }> = ({ b }) => {
    const isEditing = editingBookingId === b.firebaseId;
    return (
      <div className="glass p-3 rounded-xl border border-white/5 hover:border-amber-500/30 transition-all flex flex-col h-full relative group">
        <div className="flex justify-between items-start mb-1.5 relative z-10">
          <span className={`px-1.5 py-0.5 rounded-md text-[6px] font-bold uppercase tracking-[0.2em] border ${
            b.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
            b.status === 'canceled' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
            'bg-white/5 text-gray-600 border-white/10'
          }`}>{b.status}</span>
          <button onClick={() => handleDelete('bookings', b.firebaseId, b)} className="text-red-500/40 hover:text-red-500 p-1 transition-colors relative z-20"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
        <div className="mb-2">
          <h4 className="text-white font-bold text-[10px] uppercase truncate italic leading-tight">{b.serviceName}</h4>
          <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest truncate">{b.name}</p>
        </div>
        {isEditing ? (
          <div className="space-y-2 mb-3 animate-in fade-in duration-300">
            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full bg-white/5 border border-amber-500/30 rounded px-1.5 py-1 text-[7px] text-white focus:outline-none" />
            <select value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-full bg-black/40 border border-amber-500/30 rounded px-1.5 py-1 text-[7px] text-white focus:outline-none">
              {TIMESLOTS.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
            </select>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-3 text-[8px] font-mono text-gray-400">
            <div><span className="text-amber-500">📅</span> {b.date}</div>
            <div><span className="text-amber-500">⏰</span> {b.time}</div>
          </div>
        )}
        <div className="mt-auto flex gap-1 pt-2 border-t border-white/5 relative z-10">
          {isEditing ? (
            <><button onClick={() => handleSaveEdit(b)} className="flex-1 py-1 bg-amber-500 text-black font-bold rounded text-[7px] uppercase">SAVE</button><button onClick={() => setEditingBookingId(null)} className="flex-none px-2 py-1 bg-white/5 text-gray-500 rounded text-[7px] border border-white/5">X</button></>
          ) : (
            <>{b.status === 'pending' && <button onClick={() => handleApprove(b)} className="flex-1 py-1 bg-green-500 text-black font-bold rounded text-[7px] uppercase">OK</button>}<button onClick={() => { setEditingBookingId(b.firebaseId); setEditDate(b.date); setEditTime(b.time); }} className="flex-1 py-1 bg-white/5 text-blue-400 border border-white/5 rounded text-[7px] uppercase hover:bg-white/10">EDIT</button></>
          )}
          <div className="shrink-0 pl-1 flex items-center"><span className="text-[10px] font-bold text-white">₹{b.price}</span></div>
        </div>
      </div>
    );
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505]">
        <div className="glass p-8 md:p-12 rounded-[2.5rem] border border-amber-500/30 max-w-md w-full text-center">
          <h1 className="text-xl font-futuristic font-bold text-white mb-8 uppercase tracking-[0.3em] italic">Admin Terminal</h1>
          <form onSubmit={handleAdminAuth} className="space-y-4">
            <input type="email" placeholder="Email" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white focus:border-amber-500 outline-none text-xs" required />
            <input type="password" placeholder="Key" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white focus:border-amber-500 outline-none text-xs" required />
            <button className="w-full py-4 bg-amber-500 text-black font-bold rounded-xl hover:bg-white transition-all font-futuristic text-[10px] tracking-widest uppercase">Sync Link</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 md:px-8 bg-[#050505]">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.3em] uppercase text-[9px]">Hub Ops</h2>
              <h1 className="text-3xl md:text-5xl font-futuristic font-bold uppercase tracking-tighter italic">DASHBOARD</h1>
            </div>
            <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className={`p-2 rounded-full border transition-all ${isSoundEnabled ? 'border-amber-500/50 bg-amber-500/10 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border-white/10 bg-white/5 text-gray-700'}`}>
              {isSoundEnabled ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
          </div>
          <div className="flex glass p-1 rounded-xl border-white/10 overflow-x-auto no-scrollbar">
            {[
              { id: 'bookings', label: 'Bookings' },
              { id: 'settings', label: 'HUB SETTINGS' },
              { id: 'hero', label: 'HERO CAROUSEL' },
              { id: 'showcase', label: 'SHOWCASE' },
              { id: 'transformations', label: 'B&A TRANSF.' },
              { id: 'leads', label: 'Leads' },
              { id: 'customers', label: 'Customers' },
              { id: 'reviews', label: 'Reviews' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setView(tab.id as any); setSelectedCustomer(null); }} 
                className={`px-4 py-2 rounded-lg font-futuristic text-[8px] tracking-[0.2em] uppercase transition-all whitespace-nowrap ${view === tab.id ? 'bg-amber-500 text-black font-bold' : 'text-gray-500 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="py-20 text-center text-amber-500 uppercase tracking-widest text-[8px] animate-pulse">Establishing Stream...</div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* HERO CAROUSEL VIEW - OVERHAULED */}
            {view === 'hero' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Upload Card */}
                  <div className="glass p-8 rounded-[2.5rem] border border-amber-500/20 shadow-2xl bg-gradient-to-br from-amber-500/5 to-transparent">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div>
                        <h3 className="text-white font-futuristic font-bold text-lg uppercase italic tracking-tighter leading-none">Hero Uplink</h3>
                        <p className="text-amber-500 text-[8px] uppercase tracking-widest mt-1 font-bold">New Visual Sequence</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                       <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                          <h4 className="text-gray-400 text-[9px] uppercase tracking-[0.3em] font-bold mb-3 italic">Technical Specifications</h4>
                          <ul className="space-y-2 text-[8px] text-gray-500 uppercase tracking-widest leading-relaxed">
                             <li className="flex justify-between"><span>Resolution:</span> <span className="text-white">1920 x 1080 (HD)</span></li>
                             <li className="flex justify-between"><span>Aspect Ratio:</span> <span className="text-white">16:9 or 4:5 (Portrait)</span></li>
                             <li className="flex justify-between"><span>Format:</span> <span className="text-white">JPEG / PNG / WEBP</span></li>
                             <li className="flex justify-between"><span>Max Size:</span> <span className="text-white">5MB Per Frame</span></li>
                          </ul>
                       </div>

                       <input 
                         type="file" 
                         ref={heroInputRef} 
                         className="hidden" 
                         accept="image/*" 
                         onChange={async (e) => { 
                           const file = e.target.files?.[0]; 
                           if (file) { 
                             setIsHeroUploading(true);
                             try {
                               const reader = new FileReader(); 
                               reader.onloadend = async () => { 
                                 const compressed = await compressImage(reader.result as string, 1920, 1080, 0.9);
                                 await firebaseService.addHeroImage(compressed); 
                                 setIsHeroUploading(false);
                                 alert("Hero Frame Synchronized.");
                               }; 
                               reader.readAsDataURL(file); 
                             } catch (err) {
                               alert("Uplink failed.");
                               setIsHeroUploading(false);
                             }
                           } 
                         }} 
                       />
                       <button 
                         onClick={() => heroInputRef.current?.click()} 
                         disabled={isHeroUploading}
                         className={`w-full py-5 rounded-2xl font-futuristic font-bold text-[10px] tracking-[0.3em] uppercase transition-all shadow-xl ${isHeroUploading ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse' : 'bg-amber-500 text-black hover:bg-white'}`}
                       >
                         {isHeroUploading ? 'UPLOADING DATA...' : 'INITIATE FRAME UPLOAD'}
                       </button>
                    </div>
                  </div>

                  {/* Status Card */}
                  <div className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-center bg-black/40">
                    <div className="text-center">
                       <div className="text-4xl md:text-6xl font-futuristic font-bold text-white mb-2 italic tracking-tighter">{heroImages.length}</div>
                       <p className="text-amber-500 text-[10px] uppercase tracking-[0.4em] font-bold">Active Frames in Loop</p>
                       <div className="mt-8 flex justify-center gap-1.5">
                          {heroImages.map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500/30"></div>)}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
                  {heroImages.map(img => (
                    <div key={img.id} className="relative aspect-video rounded-3xl overflow-hidden group border border-white/10 shadow-lg bg-zinc-950">
                        <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 z-20">
                            <span className="text-[7px] text-amber-500 font-bold uppercase tracking-[0.5em] animate-pulse">TERMINATE FRAME</span>
                            <button onClick={() => handleDelete('hero_images', img.id)} className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                        </div>
                    </div>
                  ))}
                  {heroImages.length === 0 && <div className="col-span-full py-20 text-center opacity-20 uppercase text-[10px] tracking-[0.5em] italic">No active visual feed in carousel database.</div>}
                </div>
              </div>
            )}

            {/* SETTINGS VIEW */}
            {view === 'settings' && (
              <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-10">
                <div className="glass p-8 rounded-[2.5rem] border border-amber-500/20 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.747-2.874-2.512-2.96-2.626-.087-.115-.708-.943-.708-1.799 0-.856.448-1.277.608-1.438.16-.16.348-.2.464-.2.115 0 .232.001.332.005.107.005.251-.04.393.303.144.35.492 1.203.535 1.289.043.086.072.186.015.301-.058.115-.087.186-.174.287-.087.101-.183.225-.261.301-.087.086-.178.18-.077.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.115.434-.505.549-.68.115-.174.232-.144.39-.087.158.058 1.012.477 1.185.564.174.086.289.13.332.202.045.072.045.419-.1.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.18L2 22l5.002-1.314A9.97 9.97 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
                    </div>
                    <h3 className="text-xl font-futuristic font-bold text-white italic uppercase tracking-tighter">Hub Protocols</h3>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.4em] text-gray-500 mb-2 font-bold">Owner WhatsApp Uplink</label>
                      <input 
                        type="text" 
                        value={hubWpNumber}
                        onChange={(e) => setHubWpNumber(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-amber-500 text-xs font-futuristic italic" 
                      />
                    </div>
                    <button 
                      onClick={handleUpdateHubSettings}
                      disabled={isSavingSettings}
                      className="w-full py-5 bg-amber-500 text-black font-bold rounded-2xl hover:bg-white transition-all uppercase tracking-[0.3em] text-[10px] shadow-xl disabled:opacity-50"
                    >
                      {isSavingSettings ? 'SYNCING...' : 'SYNC HUB SETTINGS'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* BOOKINGS VIEW */}
            {view === 'bookings' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {bookings.map(b => <BookingCard key={b.firebaseId} b={b} />)}
                {bookings.length === 0 && <div className="col-span-full py-20 text-center opacity-20 uppercase text-[8px] tracking-[0.5em]">No Active Nodes</div>}
              </div>
            )}

            {/* LEADS VIEW */}
            {view === 'leads' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leads.map(lead => (
                  <div key={lead.id} className="glass p-4 rounded-xl border border-white/5 flex flex-col group relative">
                    <div className="flex justify-between items-center mb-3 relative z-10">
                       <h4 className="text-white font-bold text-[10px] uppercase tracking-tight italic">{lead.name}</h4>
                       <button onClick={() => handleDelete('contact_submissions', lead.id!)} className="text-red-500/30 hover:text-red-500 transition-colors relative z-20"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                    <p className="text-amber-500 text-[8px] font-bold mb-3 tracking-widest">{lead.email}</p>
                    <div className="bg-black/40 p-3 rounded-lg border border-white/5 flex-grow">
                      <p className="text-gray-400 text-[10px] italic leading-relaxed">"{lead.message}"</p>
                    </div>
                    <span className="mt-3 text-[7px] text-gray-700 font-mono uppercase self-end">{new Date(lead.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* SHOWCASE VIEW - Broadened Filtering to fix missing images */}
            {view === 'showcase' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
                <div className="glass p-8 rounded-[2.5rem] border border-amber-500/20 max-w-lg bg-gradient-to-br from-amber-500/5 to-transparent">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div>
                        <h3 className="text-white font-futuristic font-bold text-lg uppercase italic tracking-tighter leading-none">Style Archive</h3>
                        <p className="text-amber-500 text-[8px] uppercase tracking-widest mt-1 font-bold">Exhibit Registry</p>
                      </div>
                   </div>
                   
                   <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={newGalleryItem.title} onChange={(e) => setNewGalleryItem({...newGalleryItem, title: e.target.value})} placeholder="PROTOCOL TITLE" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[9px] outline-none font-futuristic italic tracking-widest focus:border-amber-500 transition-all" />
                        <select value={newGalleryItem.category} onChange={(e) => setNewGalleryItem({...newGalleryItem, category: e.target.value as any})} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[9px] outline-none font-futuristic uppercase tracking-widest appearance-none">
                           <option value="Haircut" className="bg-zinc-900">HAIRCUT</option><option value="Beard" className="bg-zinc-900">BEARD</option><option value="Facial" className="bg-zinc-900">FACIAL</option><option value="Other" className="bg-zinc-900">OTHER</option>
                        </select>
                      </div>
                      <div onClick={() => showcaseInputRef.current?.click()} className="aspect-square w-32 rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center cursor-pointer overflow-hidden mx-auto group hover:border-amber-500 transition-all">
                         {newGalleryItem.imageUrl ? <img src={newGalleryItem.imageUrl} className="w-full h-full object-cover" /> : (
                           <>
                             <svg className="w-6 h-6 text-gray-700 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                             <span className="text-[7px] text-gray-700 font-bold uppercase mt-2 tracking-widest">Select Frame</span>
                           </>
                         )}
                      </div>
                      <input type="file" ref={showcaseInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => { if (r.result) { compressImage(r.result as string, 1080, 1080, 0.9).then(compressed => setNewGalleryItem(p => ({ ...p, imageUrl: compressed }))); } }; r.readAsDataURL(f); } }} />
                      <button onClick={() => handleAddGalleryItem('showcase')} disabled={isGalleryUploading} className={`w-full py-4 rounded-2xl font-bold text-[9px] uppercase tracking-[0.3em] transition-all shadow-xl ${isGalleryUploading ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse' : 'bg-amber-500 text-black hover:bg-white'}`}>
                        {isGalleryUploading ? 'UPLOADING...' : 'ESTABLISH EXHIBIT'}
                      </button>
                   </div>
                </div>

                {/* Broader filter: Show anything with an imageUrl that doesn't look like a transformation */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                   {galleryItems.filter(i => (i.type === 'showcase' || i.imageUrl) && !i.beforeUrl).map(item => (
                     <div key={item.id} className="glass p-2 rounded-2xl border border-white/10 group relative bg-zinc-950 shadow-lg">
                       <img src={item.imageUrl} className="w-full aspect-square object-cover rounded-xl transition-transform duration-500 group-hover:scale-105" />
                       <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                          <button onClick={() => handleDelete('gallery', item.id)} className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-2xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                       </div>
                       <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center pointer-events-none opacity-40">
                          <span className="text-[6px] text-white font-bold truncate pr-1">{item.title}</span>
                          <span className="text-amber-500 text-[5px] font-bold uppercase">{item.category}</span>
                       </div>
                     </div>
                   ))}
                   {galleryItems.filter(i => (i.type === 'showcase' || i.imageUrl) && !i.beforeUrl).length === 0 && <div className="col-span-full py-20 text-center opacity-20 uppercase text-[9px] tracking-[0.4em] italic">Archive feed empty.</div>}
                </div>
              </div>
            )}

            {/* TRANSFORMATIONS VIEW - Broadened Filtering to fix missing images */}
            {view === 'transformations' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
                <div className="glass p-8 rounded-[2.5rem] border border-amber-500/20 max-w-lg bg-gradient-to-br from-amber-500/5 to-transparent">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div>
                        <h3 className="text-white font-futuristic font-bold text-lg uppercase italic tracking-tighter leading-none">Neural Shift</h3>
                        <p className="text-amber-500 text-[8px] uppercase tracking-widest mt-1 font-bold">B&A Sequences</p>
                      </div>
                   </div>
                   
                   <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={newGalleryItem.title} onChange={(e) => setNewGalleryItem({...newGalleryItem, title: e.target.value})} placeholder="TRANSFORMATION ID" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[9px] outline-none font-futuristic italic tracking-widest focus:border-amber-500 transition-all" />
                        <select value={newGalleryItem.category} onChange={(e) => setNewGalleryItem({...newGalleryItem, category: e.target.value as any})} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[9px] outline-none font-futuristic uppercase tracking-widest appearance-none">
                           <option value="Haircut" className="bg-zinc-900">HAIRCUT</option><option value="Beard" className="bg-zinc-900">BEARD</option><option value="Facial" className="bg-zinc-900">FACIAL</option><option value="Other" className="bg-zinc-900">OTHER</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4 max-w-[280px] mx-auto">
                         <div onClick={() => transBeforeRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-amber-500/50">
                           {newGalleryItem.beforeUrl ? <img src={newGalleryItem.beforeUrl} className="w-full h-full object-cover" /> : <span className="text-[7px] font-bold text-gray-700 uppercase tracking-widest">Before</span>}
                         </div>
                         <div onClick={() => transAfterRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-amber-500/50">
                           {newGalleryItem.afterUrl ? <img src={newGalleryItem.afterUrl} className="w-full h-full object-cover" /> : <span className="text-[7px] font-bold text-gray-700 uppercase tracking-widest">After</span>}
                         </div>
                      </div>
                      <input type="file" ref={transBeforeRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => { if (r.result) { compressImage(r.result as string, 1080, 1080, 0.9).then(compressed => setNewGalleryItem(p => ({ ...p, beforeUrl: compressed }))); } }; r.readAsDataURL(f); } }} />
                      <input type="file" ref={transAfterRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => { if (r.result) { compressImage(r.result as string, 1080, 1080, 0.9).then(compressed => setNewGalleryItem(p => ({ ...p, afterUrl: compressed }))); } }; r.readAsDataURL(f); } }} />
                      <button onClick={() => handleAddGalleryItem('transformation')} disabled={isGalleryUploading} className={`w-full py-4 rounded-2xl font-bold text-[9px] uppercase tracking-[0.3em] transition-all shadow-xl ${isGalleryUploading ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse' : 'bg-amber-500 text-black hover:bg-white'}`}>
                        {isGalleryUploading ? 'UPLOADING...' : 'SYNC TRANSFORMATION'}
                      </button>
                   </div>
                </div>

                {/* Broader filter: Show anything with both before and after URLs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                   {galleryItems.filter(i => i.type === 'transformation' || (i.beforeUrl && i.afterUrl)).map(item => (
                     <div key={item.id} className="glass p-2 rounded-2xl border border-white/10 group relative bg-zinc-950 shadow-lg">
                       <img src={item.afterUrl} className="w-full aspect-square object-cover rounded-xl" />
                       <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                          <button onClick={() => handleDelete('gallery', item.id)} className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-2xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                       </div>
                       <div className="absolute top-2 left-2 flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                       </div>
                       <div className="absolute bottom-2 left-2 right-2 flex flex-col pointer-events-none opacity-40">
                          <span className="text-[6px] text-white font-bold truncate">{item.title}</span>
                       </div>
                     </div>
                   ))}
                   {galleryItems.filter(i => i.type === 'transformation' || (i.beforeUrl && i.afterUrl)).length === 0 && <div className="col-span-full py-20 text-center opacity-20 uppercase text-[9px] tracking-[0.4em] italic">Transformation logs empty.</div>}
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
