/**
 * Firebase Configuration
 * VidaExtra® - Calculadora AC-4
 *
 * IMPORTANTE: As variáveis são injetadas via /api/firebase-config
 * Para desenvolvimento local, use .env.local
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

    // Sanitiza authDomain caso tenha sido configurado com protocolo/ barras
    function sanitizeAuthDomain(value) {
      if (!value) return value;
      try {
        let v = String(value).trim();
        if (v.startsWith("http://") || v.startsWith("https://")) {
          const url = new URL(v);
          v = url.hostname; // remove protocolo e path
        }
        // remove possíveis barras finais
        v = v.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
        return v;
      } catch (e) {
        console.warn("authDomain inválido, usando valor original:", value);
        return value;
      }
    }

    const cleanedAuthDomain = sanitizeAuthDomain(firebaseConfig.authDomain);
    if (cleanedAuthDomain !== firebaseConfig.authDomain) {
      console.warn("FIREBASE_AUTH_DOMAIN sanitizado", {
        original: firebaseConfig.authDomain,
        cleaned: cleanedAuthDomain,
      });
    }

    const cleanConfig = { ...firebaseConfig, authDomain: cleanedAuthDomain };

    // Initialize Firebase
    app = initializeApp(cleanConfig);
    auth = getAuth(app);
    // Garante persistência estável em ambientes com restrições de cookies
    await setPersistence(auth, browserLocalPersistence);
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
