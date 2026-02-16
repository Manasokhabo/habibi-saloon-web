import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
// ইমপোর্ট করার স্টাইলটা একটু বদলালাম যাতে এরর না দেয়
import * as GoogleGenAI from "@google/genai"; 

const firebaseConfig = {
  apiKey: "AIzaSyCvHe7rC6kKYlHtVS6gwk0aAzQ0e1koe30",
  authDomain: "habibi-saloon-api.firebaseapp.com",
  projectId: "habibi-saloon-api",
  storageBucket: "habibi-saloon-api.firebasestorage.app",
  messagingSenderId: "905753420486",
  appId: "1:905753420486:web:a81d939d6b031ead38edc7",
  measurementId: "G-L727BLBJX3" 
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const auth = getAuth(app); 

// --- Gemini AI Configuration ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
// এখানে GoogleGenAI.GoogleGenerativeAI ব্যবহার করছি
const genAI = new GoogleGenAI.GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export { auth, db, model }; 
export default app;
