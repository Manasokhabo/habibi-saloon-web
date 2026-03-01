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
import { User, Booking } from "../types";

export const firebaseService = {

  // ================= AUTH =================

  signUp: async (
    email: string,
    pass: string,
    name: string,
    phone: string
  ): Promise<User> => {

    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;

    const newUser: User = {
      id: fbUser.uid,
      name,
      email,
      phone,
      credits: 100,
      loyaltyLevel: "Novice",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      bookings: [],
      role: "user",
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
    if (!userDoc.exists()) {
      throw new Error("User profile not found");
    }

    return userDoc.data() as User;
  },

  logout: async () => {
    await signOut(auth);
  },

  resetPassword: async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  },

  // ================= REALTIME AUTH =================

  subscribeToAuth: (callback: (user: User | null) => void) => {

    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
// ================= GALLERY =================

getGalleryItems: async () => {
  const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
},
      if (fbUser) {
        const userRef = doc(db, "users", fbUser.uid);

        unsubscribeSnapshot = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            callback(snap.data() as User);
          } else {
            callback(null);
          }
        });
      } else {
        callback(null);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }

};
