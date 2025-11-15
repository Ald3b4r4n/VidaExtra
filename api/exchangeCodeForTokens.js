/**
 * Vercel Serverless Function
 * Exchange OAuth code for access/refresh tokens
 */

const admin = require("firebase-admin");
const { google } = require("googleapis");

// Initialize Firebase Admin (singleton pattern) de forma resiliente
let db = null;
try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT || "{}"
    );
    if (serviceAccount && serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      db = admin.firestore();
    }
  } else {
    db = admin.firestore();
  }
} catch (e) {
  console.warn("Firebase Admin não inicializado (service account ausente)", e);
}

/**
 * Exchange authorization code for tokens
 */
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code, userId, email, displayName, photoURL } = req.body;

    if (!code || !userId) {
      return res
        .status(400)
        .json({ error: "Missing required fields: code, userId" });
    }

    // Configure OAuth2 client
    const APP_URL = process.env.APP_URL || "https://vidaextra-calculadora-ac4.vercel.app";
    const origin = req.headers.origin;
    const redirectUri =
      process.env.OAUTH_REDIRECT_URI || `${(origin || APP_URL)}/pages/oauth2callback.html`;
    const oauth2Client = new google.auth.OAuth2(
      process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLIENT_SECRET,
      redirectUri
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return res
        .status(500)
        .json({ error: "Failed to obtain tokens from Google" });
    }

    // Save user data and tokens to Firestore se Admin estiver disponível
    if (db) {
      await db
        .collection("users")
        .doc(userId)
        .set(
          {
            email: email,
            displayName: displayName || "",
            photoURL: photoURL || "",
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenExpiry: tokens.expiry_date || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    } else {
      console.warn(
        "Pulando persistência em Firestore: service account não configurado"
      );
    }

    console.log(`✅ Tokens saved for user: ${email}`);

    // Return success with tokens
    return res.status(200).json({
      success: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      message: "Credentials saved successfully",
    });
  } catch (error) {
    console.error("❌ Error exchanging code for tokens:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};
