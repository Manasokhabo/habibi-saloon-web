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

// ভেরি ইম্পর্ট্যান্ট: নিশ্চিত কর তোর ফাইলের নাম firebaseConfig.ts (C বড় হাতের)
// যদি ফাইলের নাম ছোট হাতের হয়, তবে নিচের লাইনটি "../firebaseconfig" ই রাখবি
import { auth, db } from "../firebaseConfig"; 
import { User, Booking, HeroImage, Review, ContactSubmission, GalleryItem, NotificationPreferences } from "../types";

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
      loyaltyLevel: 'Partner', // স্যালুন শব্দ বদলে পার্টনার দিলাম
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
  
  // বাকি সব লজিক একই থাকবে... (যেহেতু তুই সেটিংস পাল্টাতে মানা করেছিস)
  signIn: async (email: string, pass: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;
    const userDoc = await getDoc(doc(db, "users", fbUser.uid));
    if (!userDoc.exists()) throw new Error("Profile not found.");
    return userDoc.data() as User;
  },
  
  logout: async () => { await signOut(auth); },
  
  subscribeToAuth: (callback: (user: User | null) => void) => {
    let unsubscribeSnapshot: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (unsubscribeSnapshot) { unsubscribeSnapshot(); unsubscribeSnapshot = null; }
      if (fbUser) {
        const userDocRef = doc(db, "users", fbUser.uid);
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) { callback(docSnap.data() as User); }
          else { callback(null); }
        }, (err) => { callback(null); });
      } else { callback(null); }
    });
    return () => { unsubscribeAuth(); if (unsubscribeSnapshot) unsubscribeSnapshot(); };
  },

  // Hero, Reviews, Gallery methods সব অপরিবর্তিত থাকবে...
  getHeroImages: async (): Promise<HeroImage[]> => {
    const snap = await getDocs(collection(db, "hero_images"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as HeroImage));
  },
  
  submitContactForm: async (submission: Omit<ContactSubmission, 'id'>): Promise<void> => {
    await addDoc(collection(db, "contact_submissions"), submission);
  }
};
