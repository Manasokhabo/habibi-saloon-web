import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, doc, deleteDoc, onSnapshot } from "firebase/firestore";
// Vercel Build Error Fix: path and casing checked
import { db } from "../firebaseConfig"; 
import { User, HeroImage, Review, GalleryItem, ContactSubmission } from '../types';
import { firebaseService } from '../services/firebaseService';
import { TIMESLOTS, OWNER_WHATSAPP } from '../constants';

const IMGBB_API_KEY = "7a3f74aef6df57ab41ef9fb0c1b161d6";

const AdminDashboard: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('ganapati_admin_auth') === 'true';
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

  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  const heroInputRef = useRef<HTMLInputElement>(null);
  const showcaseInputRef = useRef<HTMLInputElement>(null);
  
  const initialLoadRef = useRef(true);
  const newBookingAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  const approveAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'));
  const cancelAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'));

  const [newGalleryItem, setNewGalleryItem] = useState({ imageUrl: '', beforeUrl: '', afterUrl: '', title: '', category: 'Infrastructure' as any });

  useEffect(() => {
    [newBookingAudio, approveAudio, cancelAudio].forEach(a => { 
      a.current.volume = 0.5;
      a.current.load();
    });
  }, []);

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
    // Updated Login Credentials to match your brand
    if (adminUser.toLowerCase().trim() === 'admin@ganapatitelecom.com' && adminPass === 'GANAPATI_ADMIN_2026') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('ganapati_admin_auth', 'true');
    } else {
      alert("UNAUTHORIZED ACCESS: INVALID CREDENTIALS");
    }
  };

  const handleLogout = () => { 
    setIsAdminAuthenticated(false); 
    sessionStorage.removeItem('ganapati_admin_auth'); 
    setAdminUser('');
    setAdminPass('');
  };

  const handleApprove = async (booking: any) => {
    try {
      await firebaseService.updateBookingStatus(booking.firebaseId, booking.userId, booking.id, 'approved');
      approveAudio.current.play().catch(() => {});
      const cleanPhone = booking.phone.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      const message = encodeURIComponent(`Your request for ${booking.serviceName} has been confirmed. Our team will contact you shortly. - Ganapati Telecom`);
      window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank');
    } catch (err) { alert("Approval Error"); }
  };

  const handleDelete = async (coll: string, id: string) => {
    if (confirm("Permanently delete?")) await deleteDoc(doc(db, coll, id));
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 py-32">
        <div className="bg-black border border-amber-500/30 p-8 w-full max-w-sm rounded-none">
          <h1 className="text-white font-futuristic font-bold text-center uppercase tracking-widest mb-6 italic">Ganapati Admin</h1>
          <form onSubmit={handleAdminAuth} className="space-y-4">
            <input required type="email" placeholder="ADMIN ID" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3 text-white text-[10px] outline-none focus:border-amber-500 rounded-none" />
            <input required type="password" placeholder="SECURITY KEY" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3 text-white text-[10px] outline-none focus:border-amber-500 rounded-none" />
            <button className="w-full py-3 bg-amber-500 text-black font-bold uppercase text-[10px] tracking-widest hover:bg-white transition-all rounded-none">Access Terminal</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex pt-20">
      <aside onMouseEnter={() => setSidebarOpen(true)} onMouseLeave={() => setSidebarOpen(false)} className={`bg-black border-r border-white/10 flex flex-col transition-all duration-300 z-50 sticky top-20 h-[calc(100vh-5rem)] ${sidebarOpen ? 'w-52' : 'w-12 md:w-14'}`}>
        <div className="flex flex-col gap-1 mt-4">
          {[
            { id: 'bookings', label: 'Projects', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'customers', label: 'Clients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
            { id: 'hero', label: 'Banners', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14' },
            { id: 'leads', label: 'Leads', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8' },
            { id: 'settings', label: 'Config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id as any)} className={`w-full text-left px-4 py-3 text-[9px] uppercase tracking-widest font-bold flex items-center transition-all ${view === tab.id ? 'bg-amber-500 text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              <svg className="w-4 h-4 shrink-0 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path></svg>
              {sidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-end border-b border-white/5 pb-4">
          <div>
             <h1 className="text-3xl font-futuristic font-bold uppercase italic leading-none">Ganapati <span className="text-amber-500">Telecom</span></h1>
             <p className="text-[7px] text-gray-500 uppercase tracking-[0.5em] mt-2">Control Terminal Operational</p>
          </div>
        </header>

        {loading ? <div className="py-20 text-center text-amber-500 text-[10px] tracking-widest animate-pulse uppercase">Connecting to Database...</div> : (
          <div className="animate-in fade-in duration-500">
            {view === 'bookings' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {bookings.map(b => (
                  <div key={b.firebaseId} className="bg-black border border-white/10 p-3 relative hover:border-amber-500/40 transition-all flex flex-col h-full">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[7px] px-1.5 py-0.5 font-bold uppercase border ${b.status === 'approved' ? 'text-green-500 border-green-500/20' : 'text-gray-500 border-white/10'}`}>{b.status}</span>
                      <button onClick={() => handleDelete('bookings', b.firebaseId)} className="text-red-500/20 hover:text-red-500">×</button>
                    </div>
                    <h4 className="text-white font-bold text-[9px] uppercase italic truncate">{b.serviceName}</h4>
                    <p className="text-gray-500 text-[8px] uppercase font-bold mb-2 truncate">{b.name}</p>
                    <div className="bg-zinc-900 p-1.5 text-[8px] font-mono text-gray-500 mb-3 flex justify-between">
                       <span>{b.date}</span><span>{b.time}</span>
                    </div>
                    <button onClick={() => handleApprove(b)} className="w-full py-1.5 bg-amber-500 text-black font-bold text-[8px] uppercase hover:bg-white transition-colors">Action</button>
                  </div>
                ))}
              </div>
            )}
            {/* Additional views like settings can be handled similarly */}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
