import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  orderBy,
  writeBatch,
  onSnapshot
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { User, Booking, HeroImage, Review, ContactSubmission, GalleryItem } from "../types";

export const firebaseService = {
  // Authentication
  signUp: async (email: string, pass: string, name: string, phone: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;

    const newUser: User = {
      id: fbUser.uid,
      name,
      email,
      phone,
      credits: 100,
      loyaltyLevel: 'Novice',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      bookings: [],
      role: 'user',
      notificationPreferences: {
        email: true,
        whatsapp: true,
        marketing: false
      }
    };

    await setDoc(doc(db, "users", fbUser.uid), newUser);
    return newUser;
  },

  signIn: async (email: string, pass: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;
    const userDoc = await getDoc(doc(db, "users", fbUser.uid));
    if (!userDoc.exists()) throw new Error("Profile not found.");
    return userDoc.data() as User;
  },

  resetPassword: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  },

  logout: async () => {
    await signOut(auth);
  },

  // Add updateProfile method to fix the error in SettingsPage.tsx
  updateProfile: async (userId: string, data: Partial<User>): Promise<void> => {
    await updateDoc(doc(db, "users", userId), data);
  },

  subscribeToAuth: (callback: (user: User | null) => void) => {
    let unsubscribeSnapshot: (() => void) | null = null;
    return onAuthStateChanged(auth, (fbUser) => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (fbUser) {
        unsubscribeSnapshot = onSnapshot(doc(db, "users", fbUser.uid), (docSnap) => {
          if (docSnap.exists()) callback(docSnap.data() as User);
          else callback(null);
        });
      } else {
        callback(null);
      }
    });
  },

  // Availability Logic
  getBookingsByDate: async (date: string): Promise<string[]> => {
    const q = query(collection(db, "bookings"), where("date", "==", date), where("status", "!=", "canceled"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data().time);
  },

  addBooking: async (userId: string, booking: Booking): Promise<void> => {
    const docRef = await addDoc(collection(db, "bookings"), { ...booking, userId, createdAt: new Date().toISOString() });
    await updateDoc(doc(db, "users", userId), { bookings: arrayUnion({ ...booking, firebaseId: docRef.id }) });
  },

  updateBookingStatus: async (bookingId: string, userId: string, customId: string, status: 'approved' | 'canceled'): Promise<void> => {
    await updateDoc(doc(db, "bookings", bookingId), { status });
    const userSnap = await getDoc(doc(db, "users", userId));
    if (userSnap.exists()) {
      const updated = (userSnap.data() as User).bookings.map(b => b.id === customId ? { ...b, status } : b);
      await updateDoc(doc(db, "users", userId), { bookings: updated });
    }
  },

  updateBookingDetails: async (bookingId: string, userId: string, customId: string, date: string, time: string): Promise<void> => {
    await updateDoc(doc(db, "bookings", bookingId), { date, time });
    const userSnap = await getDoc(doc(db, "users", userId));
    if (userSnap.exists()) {
      const updated = (userSnap.data() as User).bookings.map(b => b.id === customId ? { ...b, date, time } : b);
      await updateDoc(doc(db, "users", userId), { bookings: updated });
    }
  },

  // CMS Methods
  getHeroImages: async () => (await getDocs(collection(db, "hero_images"))).docs.map(d => ({ id: d.id, ...d.data() } as HeroImage)),
  addHeroImage: async (url: string) => { await addDoc(collection(db, "hero_images"), { url, active: true }); },
  getReviews: async () => (await getDocs(collection(db, "reviews"))).docs.map(d => ({ id: d.id, ...d.data() } as Review)),
  addReview: async (rev: any) => { await addDoc(collection(db, "reviews"), rev); },
  getGalleryItems: async () => (await getDocs(query(collection(db, "gallery"), orderBy("createdAt", "desc")))).docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem)),
  addGalleryItem: async (item: any) => { await addDoc(collection(db, "gallery"), { ...item, createdAt: new Date().toISOString() }); },
  submitContactForm: async (form: any) => { await addDoc(collection(db, "contact_submissions"), form); },
  getSalonSettings: async () => (await getDoc(doc(db, "settings", "salon_config"))).data(),
  updateSalonSettings: async (data: any) => { await setDoc(doc(db, "settings", "salon_config"), data, { merge: true }); }
};
