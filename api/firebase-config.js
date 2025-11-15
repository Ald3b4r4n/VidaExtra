/**
 * Firebase Configuration Endpoint
 * VidaExtra® - Calculadora AC-4
 *
 * Retorna configuração do Firebase de forma segura usando variáveis de ambiente
 */

export default function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Permitir apenas GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Configuração do Firebase a partir de variáveis de ambiente
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  };

  // Validar se todas as variáveis estão presentes
  const missingVars = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error("Missing Firebase environment variables:", missingVars);
    return res.status(500).json({
      error: "Firebase configuration incomplete",
      missing: missingVars,
    });
  }

  // Retornar configuração
  res.status(200).json(firebaseConfig);
}
