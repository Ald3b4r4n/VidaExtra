import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDb, monthId } from "../../lib/mongo.js";

function ensureAdmin() {
  try {
    if (!getApps().length) {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT || "{}";
      let sa;
      try {
        sa = JSON.parse(raw);
      } catch (e) {
        return { ok: false, error: "FIREBASE_SERVICE_ACCOUNT invalid JSON" };
      }
      if (!sa || !sa.project_id) {
        return { ok: false, error: "FIREBASE_SERVICE_ACCOUNT missing project_id" };
      }
      initializeApp({ credential: cert(sa) });
    }
    return { ok: true, auth: getAuth() };
  } catch (e) {
    return { ok: false, error: typeof e?.message === "string" ? e.message : String(e) };
  }
}

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
    const init = ensureAdmin();
    if (!init.ok) return res.status(500).json({ error: init.error });
    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await init.auth.verifyIdToken(idToken);
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