import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, doc, deleteDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { User, HeroImage, Review, GalleryItem, ContactSubmission } from '../types';
import { firebaseService } from '../services/firebaseService';
import { TIMESLOTS, OWNER_WHATSAPP } from '../constants';

const IMGBB_API_KEY = "7a3f74aef6df57ab41ef9fb0c1b161d6";

const AdminDashboard: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('habibi_admin_auth') === 'true';
  });
  
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [view, setView] = useState<'bookings' | 'settings' | 'leads' | 'customers' | 'hero' | 'reviews' | 'showcase' | 'transformations'>('bookings');
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [leads, setLeads] = useState<ContactSubmission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [hubWpNumber, setHubWpNumber] = useState(OWNER_WHATSAPP);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isHeroUploading, setIsHeroUploading] = useState(false);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [isReviewUploading, setIsReviewUploading] = useState(false);

  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  const heroInputRef = useRef<HTMLInputElement>(null);
  const showcaseInputRef = useRef<HTMLInputElement>(null);
  const transBeforeRef = useRef<HTMLInputElement>(null);
  const transAfterRef = useRef<HTMLInputElement>(null);
  
  const initialLoadRef = useRef(true);
  const newBookingAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  const approveAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'));
  const cancelAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'));

  const [newGalleryItem, setNewGalleryItem] = useState({ imageUrl: '', beforeUrl: '', afterUrl: '', title: '', category: 'Haircut' as any });
  const [newReview, setNewReview] = useState({ clientName: '', comment: '', rating: 5, avatar: '' });

  useEffect(() => {
    [newBookingAudio, approveAudio, cancelAudio].forEach(a => { 
      a.current.volume = 0.5;
      a.current.load();
    });
  }, []);

  const compressImage = (dataUrl: string, maxWidth = 1080, maxHeight = 1080, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } }
        else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const uploadToImgBB = async (base64Data: string): Promise<string> => {
    const base64Image = base64Data.split(',')[1] || base64Data;
    const formData = new FormData();
    formData.append('image', base64Image);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
    const data = await response.json();
    if (data.success) return data.data.display_url;
    throw new Error('Upload Failed');
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      setLoading(true);
      firebaseService.getSalonSettings().then(s => s?.ownerWhatsapp && setHubWpNumber(s.ownerWhatsapp));
      
      const unsubB = onSnapshot(query(collection(db, "bookings"), orderBy("createdAt", "desc")), (snap) => {
        if (!initialLoadRef.current && snap.docChanges().some(c => c.type === 'added')) {
          newBookingAudio.current.play().catch(() => {});
        }
        setBookings(snap.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id })));
        initialLoadRef.current = false;
        setLoading(false);
      });
      const unsubL = onSnapshot(query(collection(db, "contact_submissions"), orderBy("timestamp", "desc")), (snap) => setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() } as ContactSubmission))));
      const unsubU = onSnapshot(collection(db, "users"), (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User))));
      const unsubH = onSnapshot(collection(db, "hero_images"), (snap) => setHeroImages(snap.docs.map(d => ({ id: d.id, ...d.data() } as HeroImage))));
      const unsubR = onSnapshot(query(collection(db, "reviews"), orderBy("rating", "desc")), (snap) => setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review))));
      const unsubG = onSnapshot(query(collection(db, "gallery"), orderBy("createdAt", "desc")), (snap) => setGalleryItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem))));

      return () => { unsubB(); unsubL(); unsubU(); unsubH(); unsubR(); unsubG(); };
    }
  }, [isAdminAuthenticated]);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser.toLowerCase().trim() === 'admin@habibisalooon.com' && adminPass === 'HABIBI_ADMIN_2025') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('habibi_admin_auth', 'true');
    } else {
      alert("UNAUTHORIZED ACCESS: INVALID CREDENTIALS");
    }
  };

  const handleLogout = () => { 
    setIsAdminAuthenticated(false); 
    sessionStorage.removeItem('habibi_admin_auth'); 
    setAdminUser('');
    setAdminPass('');
  };

  const handleApprove = async (booking: any) => {
    try {
      await firebaseService.updateBookingStatus(booking.firebaseId, booking.userId, booking.id, 'approved');
      approveAudio.current.play().catch(() => {});
      const cleanPhone = booking.phone.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      const message = encodeURIComponent(`Your appointment for ${booking.serviceName} on ${booking.date} at ${booking.time} is confirmed. See you soon at Habibi Saloon!`);
      window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank');
    } catch (err) { alert("Approval Error"); }
  };

  const handleDecline = async (booking: any) => {
    if (confirm("Decline this booking?")) {
      await firebaseService.updateBookingStatus(booking.firebaseId, booking.userId, booking.id, 'canceled');
      cancelAudio.current.play().catch(() => {});
    }
  };

  const handleEditBooking = (booking: any) => {
    setEditingBookingId(booking.firebaseId);
    setEditDate(booking.date);
    setEditTime(booking.time);
  };

  const handleSaveEdit = async (booking: any) => {
    try {
      await firebaseService.updateBookingDetails(booking.firebaseId, booking.userId, booking.id, editDate, editTime);
      setEditingBookingId(null);
      alert("Booking Rescheduled.");
    } catch (err) { alert("Update failed."); }
  };

  const handleDelete = async (coll: string, id: string) => {
    if (confirm("Permanently delete?")) await deleteDoc(doc(db, coll, id));
  };

  const handleAddGalleryItem = async (type: 'showcase' | 'transformation') => {
    if (!newGalleryItem.title) return alert("Title required");
    setIsGalleryUploading(true);
    try {
      let data: any = { title: newGalleryItem.title, category: newGalleryItem.category, type };
      if (type === 'showcase') data.imageUrl = await uploadToImgBB(newGalleryItem.imageUrl);
      else {
        data.beforeUrl = await uploadToImgBB(newGalleryItem.beforeUrl);
        data.afterUrl = await uploadToImgBB(newGalleryItem.afterUrl);
      }
      await firebaseService.addGalleryItem(data);
      setNewGalleryItem({ imageUrl: '', beforeUrl: '', afterUrl: '', title: '', category: 'Haircut' });
    } catch (err: any) { alert(err.message); }
    finally { setIsGalleryUploading(false); }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(customerSearch.toLowerCase()) || u.phone.includes(customerSearch));

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
        <div className="bg-black border border-amber-500/30 p-8 w-full max-w-sm">
          <h1 className="text-white font-futuristic font-bold text-center uppercase tracking-widest mb-6">Admin Access</h1>
          <form onSubmit={handleAdminAuth} className="space-y-4">
            <input required type="email" placeholder="ADMIN ID" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3 text-white text-[10px] outline-none focus:border-amber-500" />
            <input required type="password" placeholder="NEURAL KEY" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3 text-white text-[10px] outline-none focus:border-amber-500" />
            <button className="w-full py-3 bg-amber-500 text-black font-bold uppercase text-[10px] tracking-widest hover:bg-white transition-all">Connect</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden">
      {/* SIDEBAR - LEFT, SQUARE, NON-OVERLAPPING */}
      <aside 
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        className={`bg-black border-r border-white/10 flex flex-col pt-24 transition-all duration-300 z-[100] sticky top-0 h-screen ${sidebarOpen ? 'w-52' : 'w-12 md:w-14'}`}
      >
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 text-amber-500 hover:text-white transition-colors self-center lg:hidden"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>

        <div className="flex flex-col gap-1 mt-4">
          {[
            { id: 'bookings', label: 'Nodes', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'customers', label: 'Registry', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            { id: 'hero', label: 'Hero', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'showcase', label: 'Exhibits', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
            { id: 'transformations', label: 'Shift', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
            { id: 'leads', label: 'Leads', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
            { id: 'reviews', label: 'Reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' },
            { id: 'settings', label: 'Config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { setView(tab.id as any); setSelectedCustomer(null); }} 
              className={`w-full text-left px-4 py-3 text-[9px] uppercase tracking-widest font-bold flex items-center transition-all ${view === tab.id ? 'bg-amber-500 text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <svg className="w-4 h-4 shrink-0 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path></svg>
              {sidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </div>
        <button onClick={handleLogout} className="mt-auto p-4 text-[8px] text-red-500 font-bold uppercase hover:text-white transition-colors border-t border-white/5 flex items-center">
          <svg className="w-4 h-4 mr-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          {sidebarOpen && <span>Exit</span>}
        </button>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-grow p-4 md:p-8 pt-24 max-w-[1600px] overflow-y-auto">
        <header className="mb-8 flex justify-between items-end border-b border-white/5 pb-4">
          <h1 className="text-3xl font-futuristic font-bold uppercase italic leading-none">Admin <span className="text-amber-500">Console</span></h1>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] text-white font-bold uppercase tracking-widest">Admin Operator</p>
                <p className="text-[8px] text-amber-500 font-bold">habibi@neural_hub</p>
             </div>
             <button onClick={() => setView('settings')} className="text-gray-500 hover:text-amber-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
             </button>
          </div>
        </header>

        {loading ? <div className="py-20 text-center text-amber-500 text-[10px] tracking-widest animate-pulse uppercase">Syncing Registry...</div> : (
          <div className="animate-in fade-in duration-500">
            {view === 'bookings' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {bookings.map(b => (
                  <div key={b.firebaseId} className="bg-black border border-white/10 p-3 relative group hover:border-amber-500/40 transition-all flex flex-col h-full">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[7px] px-1.5 py-0.5 font-bold uppercase border ${b.status === 'approved' ? 'text-green-500 border-green-500/20' : b.status === 'canceled' ? 'text-red-500 border-red-500/20' : 'text-gray-500 border-white/10'}`}>{b.status}</span>
                      <button onClick={() => handleDelete('bookings', b.firebaseId)} className="text-red-500/20 hover:text-red-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                    
                    <h4 className="text-white font-bold text-[9px] uppercase italic truncate">{b.serviceName}</h4>
                    <p className="text-gray-500 text-[8px] uppercase font-bold mb-2 truncate">{b.name}</p>
                    
                    {editingBookingId === b.firebaseId ? (
                      <div className="space-y-1 mb-3">
                         <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full bg-zinc-900 border border-amber-500/30 text-[8px] p-1 text-white" />
                         <select value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-full bg-zinc-900 border border-amber-500/30 text-[8px] p-1 text-white">
                            {TIMESLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                         <div className="flex gap-1">
                            <button onClick={() => handleSaveEdit(b)} className="flex-1 py-1 bg-amber-500 text-black text-[7px] font-bold uppercase">Save</button>
                            <button onClick={() => setEditingBookingId(null)} className="flex-1 py-1 bg-white/10 text-white text-[7px] font-bold uppercase">Cancel</button>
                         </div>
                      </div>
                    ) : (
                      <div className="bg-zinc-900 p-1.5 text-[8px] font-mono text-gray-500 mb-3 flex justify-between">
                         <span>{b.date}</span><span>{b.time}</span>
                      </div>
                    )}

                    <div className="mt-auto space-y-1">
                      {b.status === 'pending' && !editingBookingId && (
                        <div className="flex gap-1">
                          <button onClick={() => handleApprove(b)} className="flex-1 py-1.5 bg-green-500 text-black font-bold text-[8px] uppercase hover:bg-green-400 transition-colors">Approve</button>
                          <button onClick={() => handleDecline(b)} className="flex-1 py-1.5 bg-red-500 text-white font-bold text-[8px] uppercase hover:bg-red-400 transition-colors">Decline</button>
                        </div>
                      )}
                      
                      <div className="flex gap-1">
                        <button onClick={() => window.location.href=`tel:${b.phone}`} className="flex-1 py-1.5 border border-white/10 text-white font-bold text-[8px] uppercase hover:bg-white hover:text-black transition-all flex items-center justify-center gap-1.5">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                           Call
                        </button>
                        {!editingBookingId && (
                          <button onClick={() => handleEditBooking(b)} className="flex-1 py-1.5 border border-white/10 text-gray-400 font-bold text-[8px] uppercase hover:bg-white/5">Edit</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === 'settings' && (
              <div className="max-w-xs">
                <div className="bg-black border border-white/10 p-5">
                   <h3 className="text-xs font-futuristic font-bold mb-4 uppercase text-amber-500">Hub Controller</h3>
                   <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[7px] uppercase text-gray-500 font-bold">Uplink WhatsApp Target</label>
                        <input value={hubWpNumber} onChange={(e) => setHubWpNumber(e.target.value)} className="w-full bg-zinc-900 border border-white/10 p-2 text-white text-[10px] outline-none focus:border-amber-500" />
                      </div>
                      <button onClick={async () => { setIsSavingSettings(true); await firebaseService.updateSalonSettings({ ownerWhatsapp: hubWpNumber }); setIsSavingSettings(false); alert("SYNCED"); }} className="w-full py-3 bg-amber-500 text-black font-bold uppercase text-[8px] tracking-widest">{isSavingSettings ? 'Syncing...' : 'Update Config'}</button>
                   </div>
                </div>
              </div>
            )}

            {view === 'customers' && (
              selectedCustomer ? (
                <div className="animate-in fade-in duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setSelectedCustomer(null)} className="text-amber-500 text-[8px] uppercase font-bold tracking-widest flex items-center gap-2">
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                       Return to Registry
                    </button>
                  </div>
                  <div className="bg-black border border-white/10 p-4 flex items-center gap-6 mb-8">
                     <img src={selectedCustomer.avatar} className="w-16 h-16 bg-zinc-900 border border-white/10 p-1" />
                     <div>
                        <h2 className="text-xl font-bold uppercase italic text-white">{selectedCustomer.name}</h2>
                        <p className="text-amber-500 text-[8px] font-bold uppercase tracking-widest">{selectedCustomer.loyaltyLevel} Status</p>
                        <p className="text-gray-500 text-[8px] mt-1">{selectedCustomer.phone}</p>
                     </div>
                  </div>
                  <h3 className="text-[9px] font-bold uppercase text-gray-500 mb-4 tracking-[0.3em]">Historical Node stream</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {/* FILTERED BOOKINGS BY USER ID */}
                    {bookings.filter(b => b.userId === selectedCustomer.id).length > 0 ? (
                      bookings.filter(b => b.userId === selectedCustomer.id).map(b => (
                         <div key={b.firebaseId} className="bg-zinc-950 border border-white/5 p-3 flex justify-between items-center group hover:border-amber-500/20 transition-all">
                            <div>
                               <p className="text-white text-[9px] font-bold uppercase truncate">{b.serviceName}</p>
                               <p className="text-gray-500 text-[7px] uppercase">{b.date} @ {b.time}</p>
                            </div>
                            <span className={`text-[7px] px-1.5 py-0.5 border uppercase font-bold ${b.status === 'approved' ? 'text-green-500 border-green-500/20' : b.status === 'canceled' ? 'text-red-500 border-red-500/20' : 'text-gray-500 border-white/5'}`}>{b.status}</span>
                         </div>
                      ))
                    ) : (
                      <p className="col-span-full text-gray-700 text-[8px] uppercase italic text-center py-10">No history logged for this entity.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <input type="text" placeholder="Registry ID Search..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="bg-zinc-900 border border-white/10 p-2 text-white text-[10px] outline-none focus:border-amber-500 w-full max-w-xs" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {filteredUsers.map(u => (
                      <div key={u.id} onClick={() => setSelectedCustomer(u)} className="bg-black border border-white/10 p-3 flex flex-col items-center text-center gap-2 cursor-pointer hover:border-amber-500/40 transition-all group">
                         <img src={u.avatar} className="w-12 h-12 bg-zinc-900 border border-white/5 transition-transform group-hover:scale-105" />
                         <div className="min-w-0 w-full">
                            <h4 className="text-white font-bold text-[8px] uppercase truncate">{u.name}</h4>
                            <p className="text-amber-500 text-[6px] font-bold uppercase">{u.loyaltyLevel}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {view === 'hero' && (
              <div className="space-y-4">
                <div className="bg-black border border-white/10 p-4 max-w-xs">
                   <h3 className="text-[9px] font-bold uppercase mb-3">Feed Loop Synchronizer</h3>
                   <input type="file" ref={heroInputRef} className="hidden" accept="image/*" onChange={async (e) => { 
                     const f = e.target.files?.[0]; 
                     if (f) { 
                       setIsHeroUploading(true);
                       const r = new FileReader();
                       r.onloadend = async () => {
                         const comp = await compressImage(r.result as string, 1920, 1080);
                         await firebaseService.addHeroImage(comp);
                         setIsHeroUploading(false);
                       };
                       r.readAsDataURL(f);
                     }
                   }} />
                   <button onClick={() => heroInputRef.current?.click()} className="w-full py-3 border border-dashed border-white/10 text-[8px] uppercase font-bold text-gray-500 hover:border-amber-500 hover:text-amber-500 transition-all">{isHeroUploading ? 'SYNCING...' : 'Upload New Frame'}</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                  {heroImages.map(img => (
                    <div key={img.id} className="relative aspect-video bg-zinc-900 border border-white/10 overflow-hidden group">
                       <img src={img.url} className="w-full h-full object-cover" />
                       <button onClick={() => handleDelete('hero_images', img.id)} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500 transition-opacity"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'showcase' && (
              <div className="space-y-4">
                <div className="bg-black border border-white/10 p-4 max-w-xs">
                   <h3 className="text-[9px] font-bold uppercase mb-3 text-amber-500">Exhibit Registry</h3>
                   <div className="space-y-2">
                      <input value={newGalleryItem.title} onChange={(e) => setNewGalleryItem({...newGalleryItem, title: e.target.value})} placeholder="Title" className="w-full bg-zinc-900 border border-white/10 p-2 text-white text-[9px] outline-none" />
                      <div onClick={() => showcaseInputRef.current?.click()} className="aspect-square w-16 bg-zinc-900 border border-dashed border-white/10 flex items-center justify-center cursor-pointer mx-auto group">
                         {newGalleryItem.imageUrl ? <img src={newGalleryItem.imageUrl} className="w-full h-full object-cover" /> : <span className="text-[12px] text-gray-700 group-hover:text-amber-500">+</span>}
                      </div>
                      <input type="file" ref={showcaseInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewGalleryItem({...newGalleryItem, imageUrl: r.result as string}); r.readAsDataURL(f); } }} />
                      <button onClick={() => handleAddGalleryItem('showcase')} className="w-full py-2 bg-amber-500 text-black font-bold text-[8px] uppercase">{isGalleryUploading ? 'UPLOADING...' : 'SAVE TO GALLERY'}</button>
                   </div>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                  {galleryItems.filter(i => i.type === 'showcase').map(item => (
                    <div key={item.id} className="relative aspect-square border border-white/5 group bg-zinc-950 overflow-hidden">
                       <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                       <button onClick={() => handleDelete('gallery', item.id)} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'transformations' && (
              <div className="space-y-4">
                <div className="bg-black border border-white/10 p-4 max-w-xs">
                   <h3 className="text-[9px] font-bold uppercase mb-3 text-amber-500">Neural Shift (B&A)</h3>
                   <div className="space-y-2">
                      <input value={newGalleryItem.title} onChange={(e) => setNewGalleryItem({...newGalleryItem, title: e.target.value})} placeholder="Identity" className="w-full bg-zinc-900 border border-white/10 p-2 text-white text-[9px] outline-none" />
                      <div className="flex gap-2">
                         <div onClick={() => transBeforeRef.current?.click()} className="flex-1 aspect-square bg-zinc-900 border border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden group">
                            {newGalleryItem.beforeUrl ? <img src={newGalleryItem.beforeUrl} className="w-full h-full object-cover" /> : <span className="text-[6px] text-gray-700 group-hover:text-amber-500">BEFORE</span>}
                         </div>
                         <div onClick={() => transAfterRef.current?.click()} className="flex-1 aspect-square bg-zinc-900 border border-dashed border-white/10 flex items-center justify-center cursor-pointer overflow-hidden group">
                            {newGalleryItem.afterUrl ? <img src={newGalleryItem.afterUrl} className="w-full h-full object-cover" /> : <span className="text-[6px] text-gray-700 group-hover:text-amber-500">AFTER</span>}
                         </div>
                      </div>
                      <input type="file" ref={transBeforeRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewGalleryItem({...newGalleryItem, beforeUrl: r.result as string}); r.readAsDataURL(f); } }} />
                      <input type="file" ref={transAfterRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewGalleryItem({...newGalleryItem, afterUrl: r.result as string}); r.readAsDataURL(f); } }} />
                      <button onClick={() => handleAddGalleryItem('transformation')} className="w-full py-2 bg-amber-500 text-black font-bold text-[8px] uppercase">{isGalleryUploading ? 'UPLOADING...' : 'ESTABLISH SHIFT'}</button>
                   </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {galleryItems.filter(i => i.type === 'transformation').map(item => (
                    <div key={item.id} className="relative aspect-square border border-white/5 group bg-zinc-950 overflow-hidden">
                       <img src={item.afterUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                       <button onClick={() => handleDelete('gallery', item.id)} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500 transition-opacity"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'leads' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {leads.map(lead => (
                  <div key={lead.id} className="bg-black border border-white/10 p-3 flex flex-col hover:border-amber-500/20 transition-all">
                     <div className="flex justify-between items-center mb-2">
                        <h4 className="text-white font-bold uppercase text-[8px]">{lead.name}</h4>
                        <button onClick={() => handleDelete('contact_submissions', lead.id!)} className="text-red-500/20 hover:text-red-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                     </div>
                     <p className="text-amber-500 text-[7px] font-bold mb-2">{lead.email}</p>
                     <div className="bg-zinc-900 p-2 mb-2 flex-grow">
                        <p className="text-gray-400 text-[9px] italic leading-tight">"{lead.message}"</p>
                     </div>
                     <span className="text-[6px] text-gray-700 uppercase font-mono">{new Date(lead.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}

            {view === 'reviews' && (
              <div className="space-y-4">
                <div className="bg-black border border-white/10 p-4 max-w-xs">
                   <h3 className="text-[9px] font-bold uppercase mb-3 text-amber-500">Testimonial Entry</h3>
                   <div className="space-y-2">
                      <input value={newReview.clientName} onChange={(e) => setNewReview({...newReview, clientName: e.target.value})} placeholder="Client Identity" className="w-full bg-zinc-900 border border-white/10 p-2 text-white text-[9px] outline-none" />
                      <textarea value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} placeholder="Neural Feedback" className="w-full bg-zinc-900 border border-white/10 p-2 text-white text-[9px] h-16 outline-none resize-none" />
                      <button onClick={async () => {
                         if (!newReview.clientName || !newReview.comment) return alert("Params missing.");
                         setIsReviewUploading(true);
                         await firebaseService.addReview({ clientName: newReview.clientName, comment: newReview.comment, rating: newReview.rating, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newReview.clientName}` });
                         setNewReview({ clientName: '', comment: '', rating: 5, avatar: '' });
                         setIsReviewUploading(false);
                      }} className="w-full py-2 bg-amber-500 text-black font-bold text-[8px] uppercase">{isReviewUploading ? 'UPLOADING...' : 'POST'}</button>
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {reviews.map(rev => (
                    <div key={rev.id} className="bg-black border border-white/5 p-3 relative group hover:border-amber-500/20 transition-all">
                       <h4 className="text-white font-bold text-[8px] uppercase mb-1">{rev.clientName}</h4>
                       <p className="text-gray-500 text-[8px] italic line-clamp-2">"{rev.comment}"</p>
                       <button onClick={() => handleDelete('reviews', rev.id)} className="absolute top-1 right-1 text-red-500/10 hover:text-red-500 p-1"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
