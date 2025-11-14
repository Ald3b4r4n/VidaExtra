/**
 * Vercel Serverless Function - Get Upcoming Google Calendar Events
 * GET /api/getUpcomingEvents
 */

import { google } from "googleapis";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin (singleton)
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT || "{}"
  );
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();
const db = getFirestore();

/**
 * Create OAuth2 client with credentials
 */
function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    process.env.APP_URL || "https://vidaextra-calculadora-ac4.vercel.app"
  );
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials.access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw new Error("Failed to refresh access token");
  }
}

/**
 * List upcoming calendar events
 */
async function listCalendarEvents(accessToken, timeMin, timeMax) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });
    return response.data.items || [];
  } catch (error) {
    console.error("Error listing calendar events:", error);
    throw new Error("Failed to list calendar events");
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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
        error: "No refresh token available. Please login again.",
      });
    }

    // Refresh access token
    const accessToken = await refreshAccessToken(userData.refreshToken);

    // Get events from next 7 days
    const timeMin = new Date().toISOString();
    const timeMax = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const events = await listCalendarEvents(accessToken, timeMin, timeMax);

    console.log(`Retrieved ${events.length} events for user ${uid}`);

    return res.status(200).json({ events });
  } catch (error) {
    console.error("Error in getUpcomingEvents:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
