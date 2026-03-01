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

import { auth, db } from "../firebaseconfig"; // ⚠️ ছোট হাতের

import {
  User,
  Booking,
  HeroImage,
  Review,
  ContactSubmission,
  GalleryItem
} from "../types";

export const firebaseService = {
  // Authentication
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
    if (!userDoc.exists()) throw new Error("Profile not found in Firestore.");

    return userDoc.data() as User;
  },

  resetPassword: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  },

  logout: async () => {
    await signOut(auth);
  }
};
