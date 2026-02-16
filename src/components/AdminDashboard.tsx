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
  
  const [view, setView] = useState<'bookings' | 'leads' | 'customers' | 'hero' | 'reviews' | 'showcase' | 'transformations' | 'settings'>('bookings');
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

  const compressImage = (dataUrl: string, maxWidth = 1080, maxHeight = 1080, quality = 0.75): Promise<string> => {
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
      alert("Hub protocols updated. All new bookings will route to this mobile uplink.");
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
        uploadedUrls.imageUrl = await uploadToImgBB(newGalleryItem.imageUrl);
      } else {
        uploadedUrls.beforeUrl = await uploadToImgBB(newGalleryItem.beforeUrl);
        uploadedUrls.afterUrl = await uploadToImgBB(newGalleryItem.afterUrl);
      }
      await firebaseService.addGalleryItem({ title: newGalleryItem.title, category: newGalleryItem.category, type, ...uploadedUrls });
      setNewGalleryItem({ imageUrl: '', beforeUrl: '', afterUrl: '', title: '', category: 'Haircut' });
      alert("Exhibit synced.");
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
            {['bookings', 'leads', 'customers', 'hero', 'reviews', 'showcase', 'transformations', 'settings'].map(tab => (
              <button key={tab} onClick={() => { setView(tab as any); setSelectedCustomer(null); }} className={`px-4 py-2 rounded-lg font-futuristic text-[8px] tracking-[0.2em] uppercase transition-all whitespace-nowrap ${view === tab ? 'bg-amber-500 text-black font-bold' : 'text-gray-500 hover:text-white'}`}>{tab}</button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="py-20 text-center text-amber-500 uppercase tracking-widest text-[8px] animate-pulse">Establishing Stream...</div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {view === 'settings' && (
              <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-10">
                <div className="glass p-8 rounded-[2.5rem] border border-amber-500/20 shadow-2xl">
                  <h3 className="text-xl font-futuristic font-bold text-white mb-6 italic uppercase tracking-tighter">Hub Protocols</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.4em] text-gray-500 mb-2 font-bold">Owner WhatsApp Uplink</label>
                      <p className="text-[7px] text-gray-600 mb-3 uppercase tracking-widest leading-relaxed italic">This number receives all booking confirmation requests from clients. Use 91 followed by 10 digits.</p>
                      <input 
                        type="text" 
                        value={hubWpNumber}
                        onChange={(e) => setHubWpNumber(e.target.value)}
                        placeholder="Ex: 918240000000"
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
            
            {view === 'bookings' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {bookings.map(b => <BookingCard key={b.firebaseId} b={b} />)}
                {bookings.length === 0 && <div className="col-span-full py-20 text-center opacity-20 uppercase text-[8px] tracking-[0.5em]">No Active Nodes</div>}
              </div>
            )}
            {/* ... rest of the views (leads, customers, hero, reviews, showcase, transformations) remain the same ... */}
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
            {view === 'customers' && (
              selectedCustomer ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <button onClick={() => setSelectedCustomer(null)} className="mb-6 flex items-center gap-1.5 text-amber-500 text-[8px] font-bold uppercase tracking-widest hover:text-white transition-all">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Back to Registry
                  </button>
                  <div className="glass p-5 rounded-3xl border border-amber-500/20 mb-8 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full border border-amber-500 p-0.5 bg-black overflow-hidden relative shadow-lg">
                        <img src={selectedCustomer.avatar} className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div>
                      <h2 className="text-xl font-futuristic font-bold text-white uppercase italic leading-none">{selectedCustomer.name}</h2>
                      <p className="text-amber-500 text-[9px] tracking-[0.3em] uppercase mt-2">{selectedCustomer.phone}</p>
                      <p className="text-gray-600 text-[7px] uppercase tracking-widest mt-1">Tier: {selectedCustomer.loyaltyLevel}</p>
                    </div>
                  </div>
                  <h3 className="text-[10px] font-bold font-futuristic text-white uppercase tracking-[0.4em] border-l-2 border-amber-500 pl-4 italic mb-6">User Timeline</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {bookings.filter(b => b.userId === selectedCustomer.id).map(b => <BookingCard key={b.firebaseId} b={b} />)}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {users.map(u => (
                    <div key={u.id} onClick={() => setSelectedCustomer(u)} className="glass p-3 rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all flex items-center gap-3 cursor-pointer group">
                      <div className="w-10 h-10 rounded-full border border-amber-500/20 p-0.5 bg-black group-hover:border-amber-500 transition-colors shrink-0">
                        <img src={u.avatar} className="w-full h-full object-cover rounded-full" />
                      </div>
                      <div className="min-w-0 flex-grow relative z-10">
                        <h4 className="text-white font-bold uppercase truncate text-[9px] group-hover:text-amber-500 transition-colors">{u.name}</h4>
                        <p className="text-amber-500 text-[7px] font-bold uppercase tracking-widest mt-0.5">{u.loyaltyLevel}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete('users', u.id); }} className="p-1 text-red-500/20 hover:text-red-500 transition-all relative z-20"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              )
            )}
            {view === 'hero' && (
              <div className="space-y-6">
                <div className="glass p-6 rounded-2xl border border-white/10 max-w-sm">
                   <h3 className="text-amber-500 font-bold uppercase text-[9px] tracking-widest mb-4 italic">Carousel Feed</h3>
                   <input type="file" ref={heroInputRef} className="hidden" accept="image/*" onChange={async (e) => { 
                     const file = e.target.files?.[0]; 
                     if (file) { 
                       const reader = new FileReader(); 
                       reader.onloadend = async () => { 
                         const compressed = await compressImage(reader.result as string);
                         await firebaseService.addHeroImage(compressed); 
                       }; 
                       reader.readAsDataURL(file); 
                     } 
                   }} />
                   <button onClick={() => heroInputRef.current?.click()} className="w-full py-4 glass border-amber-500/30 text-white font-bold rounded-xl text-[9px] uppercase tracking-widest">UPLOAD FRAME</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {heroImages.map(img => (
                    <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden group border border-white/10">
                        <img src={img.url} className="w-full h-full object-cover" />
                        <button onClick={() => handleDelete('hero_images', img.id)} className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-500 z-20"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {view === 'reviews' && (
              <div className="space-y-6">
                <div className="glass p-6 rounded-2xl border border-amber-500/20 max-w-lg">
                   <h3 className="text-xs font-bold mb-4 uppercase tracking-widest italic text-amber-500">Post New Testimonial</h3>
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={newReview.clientName} onChange={(e) => setNewReview({...newReview, clientName: e.target.value})} placeholder="Client Name" className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-white text-[9px] outline-none" />
                        <select value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-white text-[9px] outline-none">
                           <option value="5" className="bg-zinc-900">5 Stars</option><option value="4" className="bg-zinc-900">4 Stars</option><option value="3" className="bg-zinc-900">3 Stars</option><option value="2" className="bg-zinc-900">2 Stars</option><option value="1" className="bg-zinc-900">1 Star</option>
                        </select>
                      </div>
                      <textarea value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} placeholder="Testimonial comment..." className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-[9px] outline-none min-h-[80px]" />
                      <div className="flex items-center gap-4">
                         <div onClick={() => reviewAvatarRef.current?.click()} className="w-12 h-12 rounded-lg border border-dashed border-white/20 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden">
                           {newReview.avatar ? <img src={newReview.avatar} className="w-full h-full object-cover" /> : <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                         </div>
                         <input type="file" ref={reviewAvatarRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => { if (r.result) { compressImage(r.result as string, 200, 200).then(compressed => setNewReview(p => ({ ...p, avatar: compressed }))); } }; r.readAsDataURL(f); } }} />
                         <span className="text-[7px] text-gray-500 uppercase tracking-widest font-bold">Avatar Hub</span>
                      </div>
                      <button onClick={handleAddReview} disabled={isReviewUploading} className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl text-[9px] uppercase tracking-widest shadow-lg">
                        {isReviewUploading ? 'TRANSMITTING...' : 'ESTABLISH TESTIMONIAL'}
                      </button>
                   </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {reviews.map(rev => (
                    <div key={rev.id} className="glass p-3 rounded-xl border border-white/5 flex items-center gap-4 relative group hover:border-amber-500/20 transition-all">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-amber-500/20 shrink-0 shadow-lg">
                          <img src={rev.avatar} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow min-w-0 relative z-10">
                        <h4 className="text-white font-bold text-[10px] uppercase truncate italic">{rev.clientName}</h4>
                        <div className="flex gap-0.5 my-1">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-2 h-2 ${i < rev.rating ? 'text-amber-500' : 'text-gray-800'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          ))}
                        </div>
                        <p className="text-gray-500 text-[8px] italic line-clamp-2">"{rev.comment}"</p>
                      </div>
                      <button onClick={() => handleDelete('reviews', rev.id)} className="absolute top-1 right-1 p-1 text-red-500/20 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 z-20"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {view === 'showcase' && (
              <div className="space-y-6">
                <div className="glass p-6 rounded-2xl border border-amber-500/20 max-w-lg">
                   <h3 className="text-xs font-bold mb-4 uppercase tracking-widest italic text-amber-500">Add Gallery Showcase Item</h3>
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={newGalleryItem.title} onChange={(e) => setNewGalleryItem({...newGalleryItem, title: e.target.value})} placeholder="Title" className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-white text-[9px] outline-none" />
                        <select value={newGalleryItem.category} onChange={(e) => setNewGalleryItem({...newGalleryItem, category: e.target.value as any})} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-white text-[9px] outline-none">
                           <option value="Haircut" className="bg-zinc-900">Haircut</option><option value="Beard" className="bg-zinc-900">Beard</option><option value="Facial" className="bg-zinc-900">Facial</option><option value="Other" className="bg-zinc-900">Other</option>
                        </select>
                      </div>
                      <div onClick={() => showcaseInputRef.current?.click()} className="aspect-square w-24 rounded-lg border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden mx-auto">
                         {newGalleryItem.imageUrl ? <img src={newGalleryItem.imageUrl} className="w-full h-full object-cover" /> : <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <input type="file" ref={showcaseInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => { if (r.result) { compressImage(r.result as string).then(compressed => setNewGalleryItem(p => ({ ...p, imageUrl: compressed }))); } }; r.readAsDataURL(f); } }} />
                      <button onClick={() => handleAddGalleryItem('showcase')} disabled={isGalleryUploading} className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl text-[9px] uppercase tracking-widest">
                        {isGalleryUploading ? 'UPLOADING...' : 'SYNC SHOWCASE'}
                      </button>
                   </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                   {galleryItems.filter(i => i.type === 'showcase').map(item => (
                     <div key={item.id} className="glass p-2 rounded-lg border border-white/5 group relative">
                       <img src={item.imageUrl} className="w-full aspect-square object-cover rounded-md" />
                       <button onClick={() => handleDelete('gallery', item.id)} className="absolute top-1 right-1 p-1 bg-black/60 rounded opacity-0 group-hover:opacity-100 text-red-500 transition-opacity z-20"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                     </div>
                   ))}
                </div>
              </div>
            )}
            {view === 'transformations' && (
              <div className="space-y-6">
                <div className="glass p-6 rounded-2xl border border-amber-500/20 max-w-lg">
                   <h3 className="text-xs font-bold mb-4 uppercase tracking-widest italic text-amber-500">Add Signature Transformation (B&A)</h3>
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={newGalleryItem.title} onChange={(e) => setNewGalleryItem({...newGalleryItem, title: e.target.value})} placeholder="Title" className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-white text-[9px] outline-none" />
                        <select value={newGalleryItem.category} onChange={(e) => setNewGalleryItem({...newGalleryItem, category: e.target.value as any})} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-white text-[9px] outline-none">
                           <option value="Haircut" className="bg-zinc-900">Haircut</option><option value="Beard" className="bg-zinc-900">Beard</option><option value="Facial" className="bg-zinc-900">Facial</option><option value="Other" className="bg-zinc-900">Other</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3 max-w-[200px] mx-auto">
                         <div onClick={() => transBeforeRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden">{newGalleryItem.beforeUrl ? <img src={newGalleryItem.beforeUrl} className="w-full h-full object-cover" /> : <span className="text-[6px] font-bold">BEFORE</span>}</div>
                         <div onClick={() => transAfterRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden">{newGalleryItem.afterUrl ? <img src={newGalleryItem.afterUrl} className="w-full h-full object-cover" /> : <span className="text-[6px] font-bold">AFTER</span>}</div>
                      </div>
                      <input type="file" ref={transBeforeRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => { if (r.result) { compressImage(r.result as string).then(compressed => setNewGalleryItem(p => ({ ...p, beforeUrl: compressed }))); } }; r.readAsDataURL(f); } }} />
                      <input type="file" ref={transAfterRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => { if (r.result) { compressImage(r.result as string).then(compressed => setNewGalleryItem(p => ({ ...p, afterUrl: compressed }))); } }; r.readAsDataURL(f); } }} />
                      <button onClick={() => handleAddGalleryItem('transformation')} disabled={isGalleryUploading} className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl text-[9px] uppercase tracking-widest">
                        {isGalleryUploading ? 'UPLOADING...' : 'SYNC TRANSFORMATION'}
                      </button>
                   </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                   {galleryItems.filter(i => i.type === 'transformation').map(item => (
                     <div key={item.id} className="glass p-2 rounded-lg border border-white/5 group relative">
                       <img src={item.afterUrl} className="w-full aspect-square object-cover rounded-md" />
                       <button onClick={() => handleDelete('gallery', item.id)} className="absolute top-1 right-1 p-1 bg-black/60 rounded opacity-0 group-hover:opacity-100 text-red-500 transition-opacity z-20"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
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
