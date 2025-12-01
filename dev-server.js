/* eslint-env node */
/* global require, process */
// Simple dev server with proxy to Firebase Functions to avoid CORS during local development
// Usage: npm run dev

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const admin = require("firebase-admin");
const { google } = require("googleapis");
require("dotenv").config({ path: ".env.local" });

const DEFAULT_PORT = Number(process.env.PORT) || 5500;
const APP_DIR = process.cwd();
const FUNCTIONS_BASE = "https://us-central1-vidaextra-8db27.cloudfunctions.net";

const app = express();

// Parse JSON bodies
app.use(express.json());

// Initialize Firebase Admin (singleton)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Local endpoint for Firebase Config (retorna variáveis de ambiente)
app.get("/api/firebase-config", (req, res) => {
  console.log("[LOCAL] firebase-config called");
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  });
});

// Local endpoint for OAuth Client ID
app.get("/api/oauth-client-id", (req, res) => {
  console.log("[LOCAL] oauth-client-id called");
  res.json({
    clientId: process.env.OAUTH_CLIENT_ID,
  });
});

// Local endpoint for exchangeCodeForTokens (não está deployado em Cloud Functions)
app.post("/api/exchangeCodeForTokens", async (req, res) => {
  try {
    console.log("[LOCAL] exchangeCodeForTokens called");

    const { code, userId, email, displayName, photoURL } = req.body;

    if (!code || !userId) {
      return res
        .status(400)
        .json({ error: "Missing required fields: code, userId" });
    }

    // Importar dependências
    const admin = require("firebase-admin");
    const { google } = require("googleapis");

    // Initialize Firebase Admin se ainda não foi
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      });
    }

    const db = admin.firestore();

    // Configure OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLIENT_SECRET,
      process.env.OAUTH_REDIRECT_URI ||
        "http://localhost:5500/pages/oauth2callback.html"
    );

    console.log("[LOCAL] Exchanging code for tokens...");

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return res
        .status(500)
        .json({ error: "Failed to obtain tokens from Google" });
    }

    console.log("[LOCAL] Tokens received, saving to Firestore...");
    console.log("[LOCAL] Project:", admin.app().options.projectId);
    console.log("[LOCAL] User ID:", userId);

    try {
      // Save user data and tokens to Firestore
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

      console.log(`✅ Tokens saved to Firestore for user: ${email}`);
    } catch (firestoreError) {
      console.warn(
        "⚠️ Firestore save failed, but tokens obtained:",
        firestoreError.message
      );
      // Continue anyway - o importante é que temos os tokens
    }

    // Return success with access token (mesmo se Firestore falhou)
    return res.status(200).json({
      success: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      message: "Credentials obtained successfully",
    });
  } catch (error) {
    console.error("❌ Error in exchangeCodeForTokens:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Local endpoint for createCalendarEvent
app.post("/api/createCalendarEvent", async (req, res) => {
  try {
    console.log("[LOCAL] createCalendarEvent called");

    // Verify Firebase ID token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    // Get request body
    const {
      summary,
      description,
      location,
      startISO,
      endISO,
      reminders,
      googleAccessToken,
    } = req.body;

    if (!summary || !startISO || !endISO) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get user's refresh token from Firestore
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();

    // Use googleAccessToken from body if no refresh token yet
    let accessToken = googleAccessToken;
    if (userData?.refreshToken) {
      // Refresh access token
      const oauth2Client = new google.auth.OAuth2(
        process.env.OAUTH_CLIENT_ID,
        process.env.OAUTH_CLIENT_SECRET
      );
      oauth2Client.setCredentials({ refresh_token: userData.refreshToken });
      const { credentials } = await oauth2Client.refreshAccessToken();
      accessToken = credentials.access_token;
    }

    if (!accessToken) {
      return res
        .status(400)
        .json({ error: "No access token available. Please login again." });
    }

    // Configure OAuth2 client with access token
    const oauth2Client = new google.auth.OAuth2(
      process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    // Build event object
    const event = {
      summary,
      description: description || "",
      location: location || "",
      start: { dateTime: startISO, timeZone: "America/Sao_Paulo" },
      end: { dateTime: endISO, timeZone: "America/Sao_Paulo" },
      reminders: reminders || {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 30 },
          { method: "popup", minutes: 15 },
        ],
      },
    };

    // Create the event
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    console.log(`✅ Event created for user ${uid}:`, response.data.id);

    return res.status(200).json({
      event: {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        status: response.data.status,
        summary: response.data.summary,
        start: response.data.start,
        end: response.data.end,
      },
    });
  } catch (error) {
    console.error("❌ Error in createCalendarEvent:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Local endpoint for getUpcomingEvents
app.get("/api/getUpcomingEvents", async (req, res) => {
  try {
    console.log("[LOCAL] getUpcomingEvents called");

    // Verify Firebase ID token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    // Get user's refresh token from Firestore
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();

    if (!userData?.refreshToken) {
      return res.status(400).json({
        error: "No refresh token available. Please connect Google Calendar.",
      });
    }

    // Refresh access token
    const oauth2Client = new google.auth.OAuth2(
      process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: userData.refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    // Get upcoming events
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    console.log(
      `✅ Retrieved ${response.data.items?.length || 0} events for user ${uid}`
    );

    return res.status(200).json({
      events: response.data.items || [],
      total: response.data.items?.length || 0,
    });
  } catch (error) {
    console.error("❌ Error in getUpcomingEvents:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

const { MongoClient } = require("mongodb");
const dns = require("dns");
let mongoClient;
async function getMongoDb() {
  if (!mongoClient) {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {}
    const uri = process.env.MONGODB_URI;
    try {
      mongoClient = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
      });
      await mongoClient.connect();
    } catch (e) {
      const isSrv = typeof uri === "string" && uri.startsWith("mongodb+srv://");
      const match = isSrv
        ? uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/?]+)(.*)$/)
        : null;
      if (!match) throw e;
      const [, user, pass, host, tail] = match;
      const https = require("https");
      const dohUrl = `https://dns.google/resolve?name=_mongodb._tcp.${host}&type=SRV`;
      const seeds = await new Promise((resolve, reject) => {
        https.get(dohUrl, (resp) => {
          let data = "";
          resp.on("data", (chunk) => (data += chunk));
          resp.on("end", () => {
            try {
              const json = JSON.parse(data);
              const list = (json.Answer || [])
                .map((a) => String(a.data))
                .map((s) => s.replace(/^\d+\s+\d+\s+27017\s+/, "").replace(/\.$/, ""));
              resolve(list.map((h) => `${h}:27017`));
            } catch (err) {
              reject(err);
            }
          });
        }).on("error", reject);
      });
      const seedUri = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${seeds.join(",")}/?tls=true&authSource=admin&retryWrites=true&w=majority`;
      mongoClient = new MongoClient(seedUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
      });
      await mongoClient.connect();
    }
  }
  return mongoClient.db(process.env.MONGODB_DB || "vidaextra");
}
function normalizeUserId(decoded) {
  const email = decoded?.email;
  const uid = decoded?.uid;
  return (email || uid || "unknown").trim().toLowerCase();
}
function monthId(userId, ym) {
  return `${userId}_${ym}`;
}

app.get("/api/shifts/list", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = normalizeUserId(decodedToken);

    const ym = req.query.month || new Date().toISOString().slice(0, 7);
    const _id = monthId(userId, ym);
    const dbm = await getMongoDb();
    const col = dbm.collection("userShifts");
    let doc = await col.findOne({ _id });
    if (!doc) {
      const legacyId = monthId(decodedToken.uid, ym);
      doc = await col.findOne({ _id: legacyId });
    }
    if (!doc) {
      return res.status(200).json({
        success: true,
        uid: decodedToken.uid,
        email: decodedToken.email || null,
        month: ym,
        shifts: [],
        totals: { hours: 0, extraHours: 0 },
        updatedAt: null,
      });
    }
    return res.status(200).json({
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      month: ym,
      shifts: doc.shifts || [],
      totals: doc.totals || null,
      updatedAt: doc.updatedAt || null,
    });
  } catch (error) {
    console.error("❌ Error in /api/shifts/list:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/shifts/upsert", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = normalizeUserId(decodedToken);

    const { month, shifts, totals } = req.body || {};
    if (!month || !Array.isArray(shifts)) {
      return res.status(400).json({ error: "Missing month or shifts" });
    }
    const _id = monthId(userId, month);
    const dbm = await getMongoDb();
    const col = dbm.collection("userShifts");
    const now = new Date();
    const [year, m] = month.split("-").map((v) => Number(v));
    await col.updateOne(
      { _id },
      {
        $set: {
          _id,
          uid: decodedToken.uid,
          email: decodedToken.email || null,
          year,
          month: m,
          shifts,
          totals: totals || null,
          updatedAt: now,
        },
      },
      { upsert: true }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error in /api/shifts/upsert:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/shifts/delete", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = normalizeUserId(decodedToken);

    const { month, id } = req.body || {};
    if (!month || !id) {
      return res.status(400).json({ error: "Missing month or id" });
    }
    const _id = monthId(userId, month);
    const dbm = await getMongoDb();
    const col = dbm.collection("userShifts");
    const now = new Date();
    await col.updateOne(
      { _id },
      { $pull: { shifts: { id } }, $set: { updatedAt: now } }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error in /api/shifts/delete:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Local endpoint to update notification settings
app.post("/api/updateNotifySettings", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    const { emailNotifications, reminderTypes } = req.body || {};
    await db.collection("users").doc(uid).update({
      "notifySettings.email": emailNotifications !== false,
      "notifySettings.reminders": reminderTypes || ["24h", "1h", "30m"],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ success: true, message: "Notification settings updated" });
  } catch (error) {
    console.error("❌ Error updating notify settings:", error);
    return res.status(500).json({ error: error.message || "Internal error" });
  }
});

// Admin endpoint - Get all users
app.get("/api/admin/users", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    
    const ADMIN_EMAIL = 'rafasouzacruz@gmail.com';
    if (decodedToken.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: "Forbidden" });
    }

    console.log(`[LOCAL] Admin access granted`);

    const listUsersResult = await auth.listUsers(1000);
    const mongodb = await getMongoDb().catch(() => null);
    
    const usersData = await Promise.all(
      listUsersResult.users.map(async (userRecord) => {
        let firestoreData = {};
        try {
          const userDoc = await db.collection("users").doc(userRecord.uid).get();
          if (userDoc.exists) firestoreData = userDoc.data();
        } catch {}

        let shifts = [];
        let shiftsCount = 0;
        if (mongodb) {
          try {
            const col = mongodb.collection("shifts");
            const userShifts = await col.find({ userId: userRecord.uid }).sort({ dataMillis: -1 }).limit(100).toArray();
            shifts = userShifts;
            shiftsCount = userShifts.length;
          } catch {}
        }

        return {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName || firestoreData.displayName || null,
          photoURL: userRecord.photoURL || firestoreData.photoURL || null,
          createdAt: userRecord.metadata.creationTime,
          lastAccess: userRecord.metadata.lastSignInTime || userRecord.metadata.lastRefreshTime,
          isOnline: firestoreData.isOnline || false,
          shifts: shifts.slice(0, 20),
          shiftsCount: shiftsCount,
          calendarConnected: !!firestoreData.accessToken,
          emailNotifications: firestoreData.notifySettings?.email !== false
        };
      })
    );

    usersData.sort((a, b) => new Date(b.lastAccess || b.createdAt) - new Date(a.lastAccess || a.createdAt));

    return res.status(200).json({
      success: true,
      users: usersData,
      totalUsers: usersData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Admin API Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Simple Mongo connectivity check
app.get("/api/mongo-ping", async (req, res) => {
  try {
    const dbm = await getMongoDb();
    const col = dbm.collection("userShifts");
    const count = await col.countDocuments();
    res.status(200).json({
      ok: true,
      db: dbm.databaseName,
      collection: "userShifts",
      count,
    });
  } catch (error) {
    console.error("❌ Mongo ping error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Proxy API routes to Cloud Functions (para outras funções)
app.use(
  "/api",
  createProxyMiddleware({
    target: FUNCTIONS_BASE,
    changeOrigin: true,
    pathRewrite: { "^/api": "" },
    xfwd: true,
    logLevel: "debug",
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `[PROXY] ${req.method} ${req.url} -> ${FUNCTIONS_BASE}${req.url.replace(
          "/api",
          ""
        )}`
      );
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[PROXY] Response ${proxyRes.statusCode} for ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[PROXY ERROR]`, err.message);
      res.status(500).json({ error: "Proxy error", details: err.message });
    },
  })
);

// Static files
app.use(express.static(APP_DIR));

// Serve index.html only for root path, not for other routes
app.get("/", (req, res) => {
  res.sendFile(require("path").join(APP_DIR, "index.html"));
});

function start(port) {
  const server = app.listen(port, () => {
    console.log(`Dev server running at http://localhost:${port}`);
    console.log(`Proxying API -> ${FUNCTIONS_BASE}`);
  });
  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE" && port !== 5501) {
      console.warn(`Port ${port} in use, retrying on 5501...`);
      start(5501);
    } else {
      console.error("Failed to start dev server:", err.message || err);
      process.exit(1);
    }
  });
}

start(DEFAULT_PORT);
