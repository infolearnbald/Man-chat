// Firebase Modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// CONFIG DO TEU FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDrziQM8nHq6h7m5zHnZi3E1w9DwmkeLvI",
  authDomain: "npl-devs.firebaseapp.com",
  projectId: "npl-devs",
  storageBucket: "npl-devs.firebasestorage.app",
  messagingSenderId: "721966132336",
  appId: "1:721966132336:web:8be6df97fe6c9dd41158b5"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { onAuthStateChanged };
