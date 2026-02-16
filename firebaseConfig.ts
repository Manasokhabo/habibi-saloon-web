import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// সরাসরি হার্ডকোড করে দিলাম যাতে Vercel সেটিংস এর ঝামেলা শেষ হয়ে যায়
const firebaseConfig = {
  apiKey: "AIzaSyCvHe7rC6kKYlHtVS6gwk0aAzQ0e1koe30",
  authDomain: "habibi-saloon-api.firebaseapp.com",
  projectId: "habibi-saloon-api",
  storageBucket: "habibi-saloon-api.firebasestorage.app",
  messagingSenderId: "905753420486",
  appId: "1:905753420486:web:a81d939d6b031ead38edc7",
  measurementId: "G-L727BLBJX3"
};

// Initialize Firebase (Check if already initialized)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Services
// experimentalForceLongPolling: true ব্যবহার করা হয়েছে ফায়ারওয়াল বা নেটওয়ার্ক জট এড়াতে
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const auth = getAuth(app);

// Export instances
export { auth, db };
export default app;
