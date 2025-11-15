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

console.log("firebase-config.js: Iniciando carregamento..."); // DEBUG

// Variáveis exportadas (serão populadas após init)
let app, auth, db, analytics;
let isInitialized = false;

// Buscar configuração e inicializar
const firebasePromise = (async () => {
  try {
    console.log("Buscando config de /api/firebase-config..."); // DEBUG
    const response = await fetch("/api/firebase-config");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const firebaseConfig = await response.json();
    console.log("Firebase config carregado via API"); // DEBUG

    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    analytics = getAnalytics(app);
    isInitialized = true;

    console.log("Firebase inicializado com sucesso!"); // DEBUG
    return { app, auth, db, analytics };
  } catch (error) {
    console.error("ERRO ao inicializar Firebase:", error);
    throw error;
  }
})();

// Export for use in other modules
export { app, auth, db, analytics, firebasePromise, isInitialized };
