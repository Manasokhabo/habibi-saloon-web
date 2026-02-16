import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
// ইমপোর্ট স্টাইলটা হুবহু এইটা দিবি
import { GoogleGenerativeAI } from "@google/generative-ai"; 

const firebaseConfig = {
  apiKey: "AIzaSyCvHe7rC6kKYlHtVS6gwk0aAzQ0e1koe30",
  authDomain: "habibi-saloon-api.firebaseapp.com",
  projectId: "habibi-saloon-api",
  storageBucket: "habibi-saloon-api.firebasestorage.app",
  messagingSenderId: "905753420486",
  appId: "1:905753420486:web:a81d939d6b031ead38edc7",
  measurementId: "G-L727BLBJX3" 
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const auth = getAuth(app); 

// Gemini Configuration
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export { auth, db, model }; 
export default app;
