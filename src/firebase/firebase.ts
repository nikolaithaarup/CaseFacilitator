import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import { publicEnvironment } from "../config/env";

const app = getApps().length
  ? getApp()
  : initializeApp(publicEnvironment.firebase);

export const db = getFirestore(app);

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence:
      Platform.OS === "web"
        ? browserLocalPersistence
        : getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

if (publicEnvironment.useFirebaseEmulators) {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  } catch {
    // Fast refresh can revisit this module after the emulator is already connected.
  }
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
  } catch {
    // Fast refresh can revisit this module after the emulator is already connected.
  }
}

export { auth };
