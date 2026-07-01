import { auth, hasFirebaseConfig } from "../firebase.js";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

export function requireFirebaseConfig() {
  if (!hasFirebaseConfig) throw new Error("Firebase config пустой. Вставьте настройки проекта в firebase.js.");
}
export async function login(email, password) { requireFirebaseConfig(); return signInWithEmailAndPassword(auth, email, password); }
export async function register(email, password) { requireFirebaseConfig(); return createUserWithEmailAndPassword(auth, email, password); }
export async function logout() { requireFirebaseConfig(); return signOut(auth); }
export function watchAuth(callback) { if (!hasFirebaseConfig) { callback(null); return () => {}; } return onAuthStateChanged(auth, callback); }
