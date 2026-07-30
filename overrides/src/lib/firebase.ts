import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Firebase config for the gucut-store project.
// The apiKey here is a public client identifier (not a secret) — it is
// restricted by Firebase's authorized-domains list and security rules,
// so it is safe to ship in client-side code.
const firebaseConfig = {
  apiKey: "AIzaSyCPRr4RLLjH97lncriA74r0sq-64a9U0yI",
  authDomain: "gucut-store.firebaseapp.com",
  projectId: "gucut-store",
  storageBucket: "gucut-store.firebasestorage.app",
  messagingSenderId: "392446850505",
  appId: "1:392446850505:web:6d1526bd29e71705a5a418",
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

// Lazily initialize on the client only — this file may be imported by
// server-rendered code paths during static export, and Firebase's Auth
// SDK requires a browser environment (window, etc).
export function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("Firebase auth is only available in the browser");
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  if (!auth) {
    auth = getAuth(app);
  }
  return auth;
}
