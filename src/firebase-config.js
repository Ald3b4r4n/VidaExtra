/**
 * Firebase Configuration
 * VidaExtra® - Calculadora AC-4
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPugPTvTeRhb4wwan-lssyC7b58t9fXuY",
  authDomain: "vidaextra-8db27.firebaseapp.com",
  projectId: "vidaextra-8db27",
  storageBucket: "vidaextra-8db27.firebasestorage.app",
  messagingSenderId: "286306256976",
  appId: "1:286306256976:web:4094e4cc1dae115ffea955",
  measurementId: "G-YS8DC42EMJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Export for use in other modules
export { app, auth, db, analytics };
