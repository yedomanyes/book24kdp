import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const INLINE_CONFIG = {
  apiKey: "AIzaSyB2pqa2S0XO5CMla6mmwuwFzCOmTDZXYkk",
  authDomain: "book24-adf73.firebaseapp.com",
  projectId: "book24-adf73",
  storageBucket: "book24-adf73.firebasestorage.app",
  messagingSenderId: "1499275537",
  appId: "1:1499275537:web:15432133ae27e19d23ecb0",
  measurementId: "G-HSVG5M5F25"
};

// Check if configuration is saved in localStorage
const getFirebaseConfig = () => {
  const saved = localStorage.getItem('b24studio_firebase_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved Firebase config', e);
    }
  }
  
  // Fallback to inline config if edited
  if (INLINE_CONFIG.apiKey && INLINE_CONFIG.apiKey !== "YOUR_API_KEY") {
    return INLINE_CONFIG;
  }
  
  return null;
};

const config = getFirebaseConfig();

export const isFirebaseConfigured = (): boolean => {
  return config !== null;
};

let app: any = null;
let auth: any = null;
let db: any = null;
let functions: any = null;

if (config) {
  try {
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);
  } catch (err) {
    console.error('Firebase initialization failed:', err);
  }
}

export { app, auth, db, functions };
