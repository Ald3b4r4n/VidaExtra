import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

let auth = null;
let db = null;
try {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    if (sa && sa.project_id) initializeApp({ credential: cert(sa) });
  }
  auth = getAuth();
  db = getFirestore();
} catch {}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const { emailNotifications, reminderTypes } = req.body || {};
    await db.collection("users").doc(uid).update({
      "notifySettings.email": emailNotifications !== false,
      "notifySettings.reminders": reminderTypes || ["24h", "1h", "30m"],
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ success: true, message: "Notification settings updated" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}