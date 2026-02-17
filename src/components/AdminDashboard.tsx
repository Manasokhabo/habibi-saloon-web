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
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  
  const [hubWpNumber, setHubWpNumber] = useState(OWNER_WHATSAPP);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isHeroUploading, setIsHeroUploading] = useState(false);

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
      audioRef.current.play().catch(e => console.warn("Audio play blocked", e));
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
      
      const qBookings = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
      const unsubscribeBookings = onSnapshot(qBookings, (snapshot) => {
        const bookingsData = snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
        setBookings(bookingsData);
        if (!initialLoadRef.current) {
          snapshot.docChanges().forEach((change) => { if (change.type === "added") playNotification(); });
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

      const qReviews = query(collection(db, "reviews"), orderBy("rating", "desc"));
      const unsubscribeReviews = onSnapshot(qReviews, (snapshot) => {
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
      alert("HUB PROTOCOL UPDATED.");
    } catch (err) { alert("Settings sync failure."); }
    finally { setIsSavingSettings(false); }
  };

  const handleDelete = async (collectionName: string, docId: string) => {
    if (!docId) return;
    try { await deleteDoc(doc(db, collectionName, docId)); }
    catch (err) { alert('Delete failed.'); }
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
      alert("Exhibit synced.");
    } catch (err: any) { alert("Sync failure: " + err.message); }
    finally { setIsGalleryUploading(false); }
  };

  const handleAddReview = async () => {
    if (!newReview.clientName || !newReview.comment) return alert("Details required.");
    setIsReviewUploading(true);
    try {
      const avatarUrl = newReview.avatar ? await uploadToImgBB(newReview.avatar) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${newReview.clientName}`;
      await firebaseService.addReview({ clientName: newReview.clientName, comment: newReview.comment, rating: newReview.rating, avatar: avatarUrl });
      setNewReview({ clientName: '', comment: '', rating: 5, avatar: '', reviewImage: '' });
      alert("Testimonial established.");
    } catch (err: any) { alert("Review failure: " + err.message); }
    finally { setIsReviewUploading(false); }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    u.phone.includes(customerSearch)
  );

  const BookingCard: React.FC<{ b: any }> = ({ b }) => (
    <div className="glass p-3 rounded-xl border border-white/5 flex flex-col h-full relative group">
      <div className="flex justify-between items-start mb-1.5">
        <span className={`px-1.5 py-0.5 rounded-md text-[6px] font-bold uppercase tracking-[0.2em] border ${b.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-white/5 text-gray-600 border-white/10'}`}>{b.status}</span>
        <button onClick={() => handleDelete('bookings', b.firebaseId)} className="text-red-500/40 hover:text-red-500 p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
      </div>
      <h4 className="text-white font-bold text-[10px] uppercase truncate italic">{b.serviceName}</h4>
      <p className="text-[8px] text-gray-500 font-bold uppercase truncate">{b.name}</p>
      <div className="mt-auto pt-2 flex justify-between items-center border-t border-white/5">
         <span className="text-[10px] font-bold text-white">₹{b.price}</span>
         <span className="text-[8px] text-gray-500">{b.date}</span>
      </div>
    </div>
  );

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
          <div>
            <h2 className="text-amber-500 font-futuristic font-bold tracking-[0.4em] uppercase text-[9px]">Hub Ops</h2>
            <h1 className="text-3xl md:text-5xl font-futuristic font-bold uppercase tracking-tighter italic">DASHBOARD</h1>
          </div>
          <div className="flex glass p-1 rounded-xl border-white/10 overflow-x-auto no-scrollbar">
            {[
              { id: 'bookings', label: 'Bookings', count: bookings.length },
              { id: 'settings', label: 'HUB SETTINGS' },
              { id: 'customers', label: 'Customers', count: users.length },
              { id: 'hero', label: 'HERO FEED', count: heroImages.length },
              { id: 'showcase', label: 'SHOWCASE', count: galleryItems.filter(i => (i.type === 'showcase' || i.imageUrl) && !i.beforeUrl).length },
              { id: 'transformations', label: 'B&A', count: galleryItems.filter(i => i.type === 'transformation' || (i.beforeUrl && i.afterUrl)).length },
              { id: 'leads', label: 'Leads', count: leads.length },
              { id: 'reviews', label: 'Reviews', count: reviews.length }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setView(tab.id as any); setSelectedCustomer(null); }} 
                className={`px-4 py-2 rounded-lg font-futuristic text-[8px] tracking-[0.2em] uppercase transition-all whitespace-nowrap flex items-center gap-2 ${view === tab.id ? 'bg-amber-500 text-black font-bold' : 'text-gray-500 hover:text-white'}`}
              >
                {tab.label}
                {tab.count !== undefined && <span className={`px-1 rounded-md text-[6px] ${view === tab.id ? 'bg-black/20' : 'bg-white/5'}`}>{tab.count}</span>}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="py-20 text-center text-amber-500 uppercase tracking-widest text-[8px] animate-pulse">Establishing Stream...</div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* LEADS VIEW */}
            {view === 'leads' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leads.map(lead => (
                    <div key={lead.id} className="glass p-4 rounded-xl border border-white/5 flex flex-col group relative">
                      <div className="flex justify-between items-center mb-3">
                         <h4 className="text-white font-bold text-[10px] uppercase tracking-tight italic">{lead.name}</h4>
                         <button onClick={() => handleDelete('contact_submissions', lead.id!)} className="text-red-500/30 hover:text-red-500 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                      </div>
                      <p className="text-amber-500 text-[8px] font-bold mb-3 tracking-widest">{lead.email}</p>
                      <div className="bg-black/40 p-3 rounded-lg border border-white/5 flex-grow">
                        <p className="text-gray-400 text-[10px] italic leading-relaxed">"{lead.message}"</p>
                      </div>
                    </div>
                  ))}
                  {leads.length === 0 && <div className="col-span-full py-20 text-center opacity-20 uppercase text-[10px] tracking-[0.4em] italic">Lead Feed Empty</div>}
                </div>
              </div>
            )}

            {/* REVIEWS VIEW */}
            {view === 'reviews' && (
              <div className="space-y-8">
                <div className="glass p-8 rounded-[2.5rem] border border-amber-500/20 max-w-lg">
                   <h3 className="text-xs font-bold mb-6 uppercase tracking-widest italic text-amber-500">Add Testimonial</h3>
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={newReview.clientName} onChange={(e) => setNewReview({...newReview, clientName: e.target.value})} placeholder="CLIENT NAME" className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[9px] outline-none" />
                        <select value={newReview.rating} onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[9px] outline-none">
                           <option value="5">5 STARS</option><option value="4">4 STARS</option><option value="3">3 STARS</option>
                        </select>
                      </div>
                      <textarea value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} placeholder="TESTIMONIAL CONTENT..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[9px] outline-none h-24" />
                      <button onClick={handleAddReview} disabled={isReviewUploading} className="w-full py-4 bg-amber-500 text-black font-bold rounded-2xl text-[9px] uppercase tracking-widest shadow-xl">
                        {isReviewUploading ? 'UPLOADING...' : 'SAVE REVIEW'}
                      </button>
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {reviews.map(rev => (
                    <div key={rev.id} className="glass p-3 rounded-xl border border-white/5 relative group">
                      <div className="flex items-center gap-3 mb-2">
                        <img src={rev.avatar} className="w-8 h-8 rounded-full border border-amber-500/20" />
                        <h4 className="text-white font-bold text-[9px] uppercase truncate">{rev.clientName}</h4>
                      </div>
                      <p className="text-gray-500 text-[8px] italic line-clamp-2">"{rev.comment}"</p>
                      <button onClick={() => handleDelete('reviews', rev.id)} className="absolute top-1 right-1 p-1 text-red-500/20 hover:text-red-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                  {reviews.length === 0 && <div className="col-span-full py-20 text-center opacity-20 uppercase text-[10px] tracking-[0.4em] italic">Review Registry Empty</div>}
                </div>
              </div>
            )}

            {/* CUSTOMERS VIEW */}
            {view === 'customers' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <h3 className="text-xs font-bold font-futuristic text-white uppercase tracking-widest italic">Client Registry</h3>
                   <div className="relative max-w-sm w-full">
                      <input type="text" placeholder="SEARCH CLIENT..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white outline-none text-[8px]" />
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="glass p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                      <img src={u.avatar} className="w-10 h-10 rounded-xl bg-black" />
                      <div className="min-w-0 flex-grow">
                        <h4 className="text-white font-bold uppercase truncate text-[10px]">{u.name}</h4>
                        <p className="text-amber-500 text-[8px] font-bold">{u.loyaltyLevel}</p>
                      </div>
                      <button onClick={() => handleDelete('users', u.id)} className="p-2 text-red-500/10 hover:text-red-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Default Other Views */}
            {view === 'bookings' && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {bookings.map(b => <BookingCard key={b.firebaseId} b={b} />)}
              </div>
            )}
            
            {/* ... other views like showcase/transformations ... */}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
