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
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT || "{}";
    let serviceAccount = {};
    try {
      serviceAccount = JSON.parse(raw);
    } catch (e) {
      console.warn("Service account JSON inválido", e);
    }
    if (serviceAccount && serviceAccount.project_id) {
      const pk = typeof serviceAccount.private_key === "string"
        ? serviceAccount.private_key.replace(/\\n/g, "\n")
        : serviceAccount.private_key;
      const saNorm = {
        project_id: serviceAccount.project_id,
        client_email: serviceAccount.client_email,
        private_key: pk,
      };
      admin.initializeApp({
        credential: admin.credential.cert(saNorm),
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
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch {}
    } else if (Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString()); } catch {}
    }
    if (!body || typeof body !== "object") body = {};

    const { code, userId, email, displayName, photoURL } = body;

    if (!code || !userId) {
      return res
        .status(400)
        .json({ error: "Missing required fields: code, userId" });
    }

    // Configure OAuth2 client
    const APP_URL = process.env.APP_URL || "https://www.vidaextra.xyz";
    const bodyRedirect = (body && body.redirectUri) || null;
    const envRedirect = process.env.OAUTH_REDIRECT_URI || null;
    const redirectUri = bodyRedirect || envRedirect || `${APP_URL}/pages/oauth2callback.html`;
    if (!process.env.OAUTH_CLIENT_ID || !process.env.OAUTH_CLIENT_SECRET) {
      return res.status(500).json({ error: "missing_oauth_credentials", redirectUri });
    }
    const oauth2Client = new google.auth.OAuth2(
      process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLIENT_SECRET,
      redirectUri
    );

    // Exchange code for tokens
    let tokens;
    try {
      const resp = await oauth2Client.getToken(code);
      tokens = resp.tokens || {};
    } catch (err) {
      const detail = {
        error: err.message || String(err),
        response: err.response?.data || null,
        status: err.response?.status || null,
      };
      return res.status(500).json({ error: "oauth_exchange_failed", detail, redirectUri });
    }

    if (!tokens.access_token) {
      return res.status(500).json({ error: "Failed to obtain access_token from Google" });
    }

    // Save user data and tokens to Firestore se Admin estiver disponível
    if (db) {
      let ts;
      try {
        ts = admin?.firestore?.FieldValue?.serverTimestamp
          ? admin.firestore.FieldValue.serverTimestamp()
          : null;
      } catch {}
      try {
        await db
          .collection("users")
          .doc(userId)
          .set(
            {
              email: email,
              displayName: displayName || "",
              photoURL: photoURL || "",
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token || null,
              tokenExpiry: tokens.expiry_date || null,
              updatedAt: ts || new Date(),
              createdAt: ts || new Date(),
            },
            { merge: true }
          );
      } catch (persistErr) {
        console.warn("Falha ao salvar no Firestore, seguindo com sucesso:", persistErr?.message || String(persistErr));
      }
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
      refreshToken: tokens.refresh_token || null,
      requiresReconsent: !tokens.refresh_token,
      message: "Credentials saved successfully",
    });
  } catch (error) {
    const detail = {
      error: error.message || String(error),
      response: error.response?.data || null,
      status: error.response?.status || null,
    };
    console.error("❌ Error exchanging code for tokens:", detail);
    return res.status(500).json({ error: "internal_error", detail });
  }
};
