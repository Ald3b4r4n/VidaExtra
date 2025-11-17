import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDb, monthId } from "./_mongo.js";

let auth = null;
try {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    if (sa && sa.project_id) initializeApp({ credential: cert(sa) });
  }
  auth = getAuth();
} catch {}

function normalizeUserId(decoded) {
  const email = decoded?.email;
  const uid = decoded?.uid;
  return (email || uid || "unknown").trim().toLowerCase();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await auth.verifyIdToken(idToken);
    const userId = normalizeUserId(decoded);

    const { month, id } = req.body || {};
    if (!month || !id) return res.status(400).json({ error: "Missing month or id" });

    const _id = monthId(userId, month);
    const db = await getDb();
    const col = db.collection("userShifts");

    const now = new Date();
    await col.updateOne(
      { _id },
      { $pull: { shifts: { id } }, $set: { updatedAt: now } }
    );

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}