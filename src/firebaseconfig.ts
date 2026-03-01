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
import { auth, db } from "../firebaseconfig";
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
    if (!userDoc.exists()) throw new Error("Profile not found in Firestore.");
    
    return userDoc.data() as User;
  },

  resetPassword: async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending reset email: ", error);
      throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  updateAvatar: async (userId: string, avatarDataUrl: string): Promise<void> => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      avatar: avatarDataUrl
    });
  },

  updateProfile: async (userId: string, data: Partial<User>): Promise<void> => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, data);
  },

  subscribeToAuth: (callback: (user: User | null) => void) => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      // Clean up previous snapshot listener if it exists
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (fbUser) {
        const userDocRef = doc(db, "users", fbUser.uid);
        // Establish real-time listener for the user's Firestore document
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            callback(docSnap.data() as User);
          } else {
            callback(null);
          }
        }, (err) => {
          console.error("User document stream error:", err);
          callback(null);
        });
      } else {
        callback(null);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  },

  // Bookings
  addBooking: async (userId: string, booking: Booking): Promise<void> => {
    const bookingData = {
      ...booking,
      status: 'pending', 
      userId,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "bookings"), bookingData);
    const updatedBooking = { ...bookingData, firebaseDocId: docRef.id };

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      bookings: arrayUnion(updatedBooking)
    });
  },

  getBookingsByDate: async (date: string): Promise<string[]> => {
    try {
      const q = query(
        collection(db, "bookings"), 
        where("date", "==", date),
        where("status", "!=", "canceled")
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data().time);
    } catch (err) {
      console.error("Availability Check Error:", err);
      return [];
    }
  },

  deleteBooking: async (bookingDocId: string): Promise<void> => {
    if (!bookingDocId) throw new Error("Missing Document ID for deletion.");
    await deleteDoc(doc(db, "bookings", bookingDocId));
  },

  deleteUserCompletely: async (userId: string): Promise<void> => {
    const q = query(collection(db, "bookings"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    await deleteDoc(doc(db, "users", userId));
  },

  clearUserHistory: async (userId: string): Promise<void> => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { bookings: [] });
    const q = query(collection(db, "bookings"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  },

  updateBookingStatus: async (bookingDocId: string, userId: string, customId: string, newStatus: 'approved' | 'canceled'): Promise<void> => {
    const docRef = doc(db, "bookings", bookingDocId);
    await updateDoc(docRef, { status: newStatus });

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data() as User;
      const updatedBookings = userData.bookings.map(b => 
        b.id === customId ? { ...b, status: newStatus } : b
      );
      await updateDoc(userRef, { bookings: updatedBookings });
    }
  },

  updateBookingDetails: async (bookingDocId: string, userId: string, customId: string, date: string, time: string): Promise<void> => {
    const docRef = doc(db, "bookings", bookingDocId);
    await updateDoc(docRef, { date, time });

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data() as User;
      const updatedBookings = userData.bookings.map(b => 
        b.id === customId ? { ...b, date, time } : b
      );
      await updateDoc(userRef, { bookings: updatedBookings });
    }
  },

  // Hero Image Management
  getHeroImages: async (): Promise<HeroImage[]> => {
    const snap = await getDocs(collection(db, "hero_images"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as HeroImage));
  },

  addHeroImage: async (url: string): Promise<void> => {
    await addDoc(collection(db, "hero_images"), { url, active: true });
  },

  deleteHeroImage: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "hero_images", id));
  },

  // Review Management
  getReviews: async (): Promise<Review[]> => {
    const snap = await getDocs(collection(db, "reviews"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
  },

  addReview: async (review: Omit<Review, 'id'>): Promise<void> => {
    await addDoc(collection(db, "reviews"), review);
  },

  deleteReview: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "reviews", id));
  },

  // Gallery Management
  getGalleryItems: async (): Promise<GalleryItem[]> => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem));
  },

  addGalleryItem: async (item: Omit<GalleryItem, 'id' | 'createdAt'>): Promise<void> => {
    await addDoc(collection(db, "gallery"), {
      ...item,
      createdAt: new Date().toISOString()
    });
  },

  deleteGalleryItem: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "gallery", id));
  },

  // Contact Form
  submitContactForm: async (submission: Omit<ContactSubmission, 'id'>): Promise<void> => {
    await addDoc(collection(db, "contact_submissions"), submission);
  },

  // Salon Settings
  getSalonSettings: async (): Promise<any> => {
    const docSnap = await getDoc(doc(db, "settings", "salon_config"));
    if (docSnap.exists()) return docSnap.data();
    return null;
  },

  updateSalonSettings: async (data: any): Promise<void> => {
    await setDoc(doc(db, "settings", "salon_config"), data, { merge: true });
  }
};
