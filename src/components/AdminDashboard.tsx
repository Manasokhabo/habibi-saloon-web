import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, doc, deleteDoc, onSnapshot } from "firebase/firestore";
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

  const [newGalleryItem, setNewGalleryItem] = useState({ imageUrl: '', beforeUrl: '', afterUrl: '', title: '', category: 'Haircut' as any });
  const [newReview, setNewReview] = useState({ clientName: '', comment: '', rating: 5, avatar: '' });

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
        setBookings(snap.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id })));
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
    } else alert("INVALID");
  };

  const handleLogout = () => { setIsAdminAuthenticated(false); sessionStorage.removeItem('habibi_admin_auth'); };

  const handleApprove = async (booking: any) => {
    try {
      await firebaseService.updateBookingStatus(booking.firebaseId, booking.userId, booking.id, 'approved');
      const cleanPhone = booking.phone.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      const message = encodeURIComponent(`Your appointment for ${booking.serviceName} on ${booking.date} at ${booking.time} is confirmed. See you soon at Habibi Saloon!`);
      window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank');
    } catch (err) { alert("Approval Error"); }
  };

  const handleDecline = async (booking: any) => {
    if (confirm("Decline this booking?")) {
      await firebaseService.updateBookingStatus(booking.firebaseId, booking.userId, booking.id, 'canceled');
    }
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
            <input type="email" placeholder="ID" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3 text-white text-xs outline-none focus:border-amber-500" />
            <input type="password" placeholder="KEY" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3 text-white text-xs outline-none focus:border-amber-500" />
            <button className="w-full py-3 bg-amber-500 text-black font-bold uppercase text-[10px] tracking-widest hover:bg-white transition-all">Connect</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* FIXED SIDEBAR - LEFT SIDE, SQUARE */}
      <aside className="fixed left-0 top-0 bottom-0 w-52 bg-black border-r border-white/10 z-[100] flex flex-col pt-24">
        <div className="px-4 py-4 border-b border-white/5 mb-2">
          <p className="text-[8px] text-amber-500 font-bold uppercase tracking-widest">Protocol Hub</p>
        </div>
        {[
          { id: 'bookings', label: 'Bookings' },
          { id: 'customers', label: 'Clients' },
          { id: 'hero', label: 'Hero' },
          { id: 'showcase', label: 'Showcase' },
          { id: 'transformations', label: 'B&A' },
          { id: 'leads', label: 'Leads' },
          { id: 'reviews', label: 'Reviews' },
          { id: 'settings', label: 'Settings' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => { setView(tab.id as any); setSelectedCustomer(null); }} 
            className={`w-full text-left px-5 py-3 text-[9px] uppercase tracking-widest font-bold transition-all ${view === tab.id ? 'bg-amber-500 text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            {tab.label}
          </button>
        ))}
        <button onClick={handleLogout} className="mt-auto p-5 text-[8px] text-red-500 font-bold uppercase hover:text-white transition-colors border-t border-white/5">Exit Terminal</button>
      </aside>

      {/* CONTENT AREA */}
      <main className="ml-52 flex-grow p-8 pt-32 max-w-[1600px]">
        <header className="mb-10 flex justify-between items-end border-b border-white/5 pb-4">
          <h1 className="text-4xl font-futuristic font-bold uppercase italic leading-none">Admin <span className="text-amber-500">Console</span></h1>
        </header>

        {loading ? <div className="py-20 text-center text-amber-500 text-[10px] tracking-widest animate-pulse">Syncing...</div> : (
          <div className="animate-in fade-in duration-500">
            {view === 'bookings' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {bookings.map(b => (
                  <div key={b.firebaseId} className="bg-white/5 border border-white/10 p-4 relative group hover:border-amber-500/40 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[7px] px-1.5 py-0.5 font-bold uppercase border ${b.status === 'approved' ? 'text-green-500 border-green-500/20' : b.status === 'canceled' ? 'text-red-500 border-red-500/20' : 'text-gray-500 border-white/10'}`}>{b.status}</span>
                      <button onClick={() => handleDelete('bookings', b.firebaseId)} className="text-red-500/20 hover:text-red-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                    <h4 className="text-white font-bold text-[10px] uppercase italic truncate">{b.serviceName}</h4>
                    <p className="text-gray-500 text-[9px] uppercase font-bold mb-3 truncate">{b.name}</p>
                    <div className="bg-black/40 p-2 text-[8px] font-mono text-gray-500 mb-4 uppercase flex justify-between">
                       <span>{b.date}</span><span>{b.time}</span>
                    </div>
                    <div className="flex gap-1">
                      {b.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(b)} className="flex-1 py-2 bg-green-500 text-black font-bold text-[8px] uppercase hover:bg-green-400">Approve</button>
                          <button onClick={() => handleDecline(b)} className="flex-1 py-2 bg-red-500 text-white font-bold text-[8px] uppercase">Decline</button>
                        </>
                      )}
                      {b.status !== 'pending' && <button onClick={() => window.location.href=`tel:${b.phone}`} className="flex-1 py-2 border border-white/10 text-white font-bold text-[8px] uppercase hover:bg-white hover:text-black">Call Client</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === 'settings' && (
              <div className="max-w-sm">
                <div className="bg-white/5 border border-white/10 p-6">
                   <h3 className="text-sm font-futuristic font-bold mb-6 uppercase text-amber-500">Config Protocol</h3>
                   <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase text-gray-500 font-bold">Primary WhatsApp Routing</label>
                        <input value={hubWpNumber} onChange={(e) => setHubWpNumber(e.target.value)} className="w-full bg-black border border-white/10 p-3 text-white text-xs outline-none focus:border-amber-500" />
                      </div>
                      <button onClick={async () => { setIsSavingSettings(true); await firebaseService.updateSalonSettings({ ownerWhatsapp: hubWpNumber }); setIsSavingSettings(false); alert("SYNCED"); }} className="w-full py-4 bg-amber-500 text-black font-bold uppercase text-[9px] tracking-widest">{isSavingSettings ? 'Syncing...' : 'Sync Config'}</button>
                   </div>
                </div>
              </div>
            )}

            {view === 'customers' && (
              <div className="space-y-6">
                <input type="text" placeholder="Search Identity..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="bg-white/5 border border-white/10 p-3 text-white text-xs outline-none focus:border-amber-500 w-full max-w-sm" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="bg-white/5 border border-white/10 p-3 flex flex-col items-center text-center gap-2 group">
                       <img src={u.avatar} className="w-10 h-10 bg-black border border-white/5" />
                       <div className="min-w-0 w-full">
                          <h4 className="text-white font-bold text-[9px] uppercase truncate">{u.name}</h4>
                          <p className="text-amber-500 text-[7px] font-bold uppercase">{u.loyaltyLevel}</p>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'hero' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 p-6 max-w-sm">
                   <h3 className="text-xs font-bold uppercase mb-4">Feed Uplink</h3>
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
                   <button onClick={() => heroInputRef.current?.click()} className="w-full py-4 border-2 border-dashed border-white/10 text-[9px] uppercase font-bold text-gray-500 hover:border-amber-500 hover:text-amber-500 transition-all">{isHeroUploading ? 'UPLOADING...' : 'Add New Frame'}</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {heroImages.map(img => (
                    <div key={img.id} className="relative aspect-video bg-zinc-950 border border-white/10 overflow-hidden group">
                       <img src={img.url} className="w-full h-full object-cover" />
                       <button onClick={() => handleDelete('hero_images', img.id)} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500 transition-opacity"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'showcase' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 p-6 max-w-sm">
                   <h3 className="text-xs font-bold uppercase mb-4">Add Showcase (1080x1080)</h3>
                   <div className="space-y-3">
                      <input value={newGalleryItem.title} onChange={(e) => setNewGalleryItem({...newGalleryItem, title: e.target.value})} placeholder="Title" className="w-full bg-black border border-white/10 p-3 text-white text-[9px]" />
                      <div onClick={() => showcaseInputRef.current?.click()} className="aspect-square w-20 bg-white/5 border border-dashed border-white/10 flex items-center justify-center cursor-pointer mx-auto">
                         {newGalleryItem.imageUrl ? <img src={newGalleryItem.imageUrl} className="w-full h-full object-cover" /> : <span className="text-[10px]">+</span>}
                      </div>
                      <input type="file" ref={showcaseInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewGalleryItem({...newGalleryItem, imageUrl: r.result as string}); r.readAsDataURL(f); } }} />
                      <button onClick={() => handleAddGalleryItem('showcase')} className="w-full py-3 bg-amber-500 text-black font-bold text-[9px] uppercase">{isGalleryUploading ? 'Uploading...' : 'Save'}</button>
                   </div>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {galleryItems.filter(i => i.type === 'showcase').map(item => (
                    <div key={item.id} className="relative aspect-square border border-white/5 group">
                       <img src={item.imageUrl} className="w-full h-full object-cover" />
                       <button onClick={() => handleDelete('gallery', item.id)} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'transformations' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 p-6 max-w-sm">
                   <h3 className="text-xs font-bold uppercase mb-4">Add B&A Protocol</h3>
                   <div className="space-y-3">
                      <input value={newGalleryItem.title} onChange={(e) => setNewGalleryItem({...newGalleryItem, title: e.target.value})} placeholder="Identity" className="w-full bg-black border border-white/10 p-3 text-white text-[9px]" />
                      <div className="flex gap-2">
                         <div onClick={() => transBeforeRef.current?.click()} className="flex-1 aspect-square bg-white/5 border border-dashed border-white/10 flex items-center justify-center cursor-pointer">
                            {newGalleryItem.beforeUrl ? <img src={newGalleryItem.beforeUrl} className="w-full h-full object-cover" /> : <span className="text-[7px]">BEFORE</span>}
                         </div>
                         <div onClick={() => transAfterRef.current?.click()} className="flex-1 aspect-square bg-white/5 border border-dashed border-white/10 flex items-center justify-center cursor-pointer">
                            {newGalleryItem.afterUrl ? <img src={newGalleryItem.afterUrl} className="w-full h-full object-cover" /> : <span className="text-[7px]">AFTER</span>}
                         </div>
                      </div>
                      <input type="file" ref={transBeforeRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewGalleryItem({...newGalleryItem, beforeUrl: r.result as string}); r.readAsDataURL(f); } }} />
                      <input type="file" ref={transAfterRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setNewGalleryItem({...newGalleryItem, afterUrl: r.result as string}); r.readAsDataURL(f); } }} />
                      <button onClick={() => handleAddGalleryItem('transformation')} className="w-full py-3 bg-amber-500 text-black font-bold text-[9px] uppercase">{isGalleryUploading ? 'Processing...' : 'Sync Sequence'}</button>
                   </div>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {galleryItems.filter(i => i.type === 'transformation').map(item => (
                    <div key={item.id} className="relative aspect-square border border-white/5 group">
                       <img src={item.afterUrl} className="w-full h-full object-cover" />
                       <button onClick={() => handleDelete('gallery', item.id)} className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-500 transition-opacity"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'leads' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leads.map(lead => (
                  <div key={lead.id} className="bg-white/5 border border-white/10 p-5">
                     <div className="flex justify-between items-center mb-3">
                        <h4 className="text-white font-bold uppercase text-[9px]">{lead.name}</h4>
                        <button onClick={() => handleDelete('contact_submissions', lead.id!)} className="text-red-500/20 hover:text-red-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                     </div>
                     <p className="text-amber-500 text-[8px] font-bold mb-3">{lead.email}</p>
                     <p className="text-gray-400 text-[10px] italic bg-black/30 p-3 mb-2">"{lead.message}"</p>
                     <span className="text-[7px] text-gray-700 uppercase font-mono">{new Date(lead.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}

            {view === 'reviews' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 p-6 max-w-sm">
                   <h3 className="text-xs font-bold uppercase mb-4">Manual Testimonial</h3>
                   <div className="space-y-3">
                      <input value={newReview.clientName} onChange={(e) => setNewReview({...newReview, clientName: e.target.value})} placeholder="Client" className="w-full bg-black border border-white/10 p-3 text-white text-[9px]" />
                      <textarea value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} placeholder="Feedback" className="w-full bg-black border border-white/10 p-3 text-white text-[9px] h-20" />
                      <button onClick={async () => {
                         if (!newReview.clientName || !newReview.comment) return alert("Fill all");
                         setIsReviewUploading(true);
                         await firebaseService.addReview({ clientName: newReview.clientName, comment: newReview.comment, rating: newReview.rating, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newReview.clientName}` });
                         setNewReview({ clientName: '', comment: '', rating: 5, avatar: '' });
                         setIsReviewUploading(false);
                      }} className="w-full py-3 bg-amber-500 text-black font-bold text-[9px] uppercase">{isReviewUploading ? 'Saving...' : 'Post Review'}</button>
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {reviews.map(rev => (
                    <div key={rev.id} className="bg-white/5 border border-white/5 p-4 relative group">
                       <h4 className="text-white font-bold text-[9px] uppercase mb-1">{rev.clientName}</h4>
                       <p className="text-gray-500 text-[9px] italic line-clamp-2">"{rev.comment}"</p>
                       <button onClick={() => handleDelete('reviews', rev.id)} className="absolute top-2 right-2 text-red-500/10 hover:text-red-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
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
