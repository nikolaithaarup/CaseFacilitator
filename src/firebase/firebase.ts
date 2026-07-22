// src/firebase/firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  connectAuthEmulator,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";

// 🔥 Your Firebase web config
const deployedFirebaseConfig = {
  apiKey: "AIzaSyATGKw7iPS1cp1YbMe_JdQ_ob6W3p136wM",
  authDomain: "casefacilitator.firebaseapp.com",
  projectId: "casefacilitator",
  storageBucket: "casefacilitator.firebasestorage.app",
  messagingSenderId: "342657384184",
  appId: "1:342657384184:web:344cf94d55eb635113450d",
  measurementId: "G-LVV4FY9KFN",
};

const emulatorOnly = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === "true";
const firebaseConfig = emulatorOnly
  ? {
      apiKey: "demo-api-key",
      authDomain: "127.0.0.1",
      projectId: "demo-synapse-facilitator",
      storageBucket: "demo-synapse-facilitator.appspot.com",
      messagingSenderId: "000000000000",
      appId: "1:000000000000:web:demo",
    }
  : deployedFirebaseConfig;

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
} catch {
  auth = getAuth(app);
}

if (emulatorOnly) {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  } catch {
    // Fast refresh can revisit this module after the emulator is already connected.
  }
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  } catch {
    // Fast refresh can revisit this module after the emulator is already connected.
  }
}

export { auth };
