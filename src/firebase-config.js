/**
 * Firebase Configuration
 * VidaExtra® - Calculadora AC-4
 *
 * IMPORTANTE: As variáveis são injetadas via /api/firebase-config
 * Para desenvolvimento local, use .env.local
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Buscar configuração do endpoint seguro
const response = await fetch("/api/firebase-config");
const firebaseConfig = await response.json();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Export for use in other modules
export { app, auth, db, analytics };
