/**
 * Vercel Serverless Function - Create Google Calendar Event
 * POST /api/createCalendarEvent
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
 * Create event in Google Calendar
 */
async function createCalendarEvent(accessToken, event) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw new Error("Failed to create calendar event");
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== "POST") {
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
      accessToken = await refreshAccessToken(userData.refreshToken);
    }

    if (!accessToken) {
      return res.status(400).json({
        error: "No access token available. Please login again.",
      });
    }

    // Build event object
    const event = {
      summary,
      description: description || "",
      location: location || "",
      start: {
        dateTime: startISO,
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: endISO,
        timeZone: "America/Sao_Paulo",
      },
      reminders: reminders || {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 24h
          { method: "email", minutes: 60 }, // 1h
          { method: "popup", minutes: 30 }, // 30min
        ],
      },
    };

    // Create the event
    const createdEvent = await createCalendarEvent(accessToken, event);

    console.log(`Event created for user ${uid}:`, createdEvent.id);

    return res.status(200).json({
      id: createdEvent.id,
      htmlLink: createdEvent.htmlLink,
      status: createdEvent.status,
      summary: createdEvent.summary,
      start: createdEvent.start,
      end: createdEvent.end,
    });
  } catch (error) {
    console.error("Error in createCalendarEvent:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
