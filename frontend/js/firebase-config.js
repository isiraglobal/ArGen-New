// Import Firebase SDKs from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAhkKtJuzHP1qEqysYN_9rMsmXsm7zPiZA",
  authDomain: "argen1.firebaseapp.com",
  projectId: "argen1",
  storageBucket: "argen1.firebasestorage.app",
  messagingSenderId: "631878499249",
  appId: "1:631878499249:web:21453cb3d4a1cab84f9b90",
  measurementId: "G-75HR77L6EG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Expose to window for global access in non-module scripts
window.firebaseAuth = auth;
window.googleAuthProvider = googleProvider;
window.firebaseAuthHelpers = {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};

// Automatically sync Firebase ID token to localStorage
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const token = await user.getIdToken(true);
      localStorage.setItem('argen_token', token);
      console.log("Firebase ID Token synchronized with localStorage.");
    } catch (err) {
      console.error("Failed to retrieve Firebase ID Token:", err);
    }
  } else {
    localStorage.removeItem('argen_token');
  }
});

console.log("Firebase client-side SDK successfully loaded and initialized!");

