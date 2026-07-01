import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBLbsjqT6Jmvif9Mrt4oYtJny3lXTJREtE",
  authDomain: "ixsayz-shop-4920d.firebaseapp.com",
  databaseURL: "https://ixsayz-shop-4920d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ixsayz-shop-4920d",
  storageBucket: "ixsayz-shop-4920d.firebasestorage.app",
  messagingSenderId: "154521085904",
  appId: "1:154521085904:web:977ebb026ce6e9d391bbd5",
  measurementId: "G-GFMY3NN4CG"
};

export const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
export const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

if (db) {
  enableIndexedDbPersistence(db).catch(() => {});
}
