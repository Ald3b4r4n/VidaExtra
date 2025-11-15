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
let firebaseConfig;
try {
  const response = await fetch("/api/firebase-config");
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  firebaseConfig = await response.json();
  console.log("Firebase config carregado via API");
} catch (error) {
  console.error(
    "Erro ao buscar config da API, tentando variáveis de ambiente:",
    error
  );
  // Fallback: tentar window.ENV se disponível
  if (window.ENV) {
    firebaseConfig = window.ENV;
  } else {
    throw new Error("Firebase config não disponível");
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Export for use in other modules
export { app, auth, db, analytics };
