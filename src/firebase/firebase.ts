// src/firebase/firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from "firebase/auth";

// 🔥 Your Firebase web config
const firebaseConfig = {
  apiKey: "AIzaSyATGKw7iPS1cp1YbMe_JdQ_ob6W3p136wM",
  authDomain: "casefacilitator.firebaseapp.com",
  projectId: "casefacilitator",
  storageBucket: "casefacilitator.firebasestorage.app",
  messagingSenderId: "342657384184",
  appId: "1:342657384184:web:344cf94d55eb635113450d",
  measurementId: "G-LVV4FY9KFN",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

// ✅ React Native Auth with persistent storage
// Fast refresh safe:
// - First time: initializeAuth(...)
// - Next reloads: getAuth(app)
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e: any) {
  auth = getAuth(app);
}

export { auth };
