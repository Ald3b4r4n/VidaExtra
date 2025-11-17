import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDb, monthId } from "../../lib/mongo.js";

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
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    if (!auth) return res.status(500).json({ error: "Server auth not initialized" });
    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await auth.verifyIdToken(idToken);
    const userId = normalizeUserId(decoded);

    const ym = (req.query.month || new Date().toISOString().slice(0, 7));
    const _id = monthId(userId, ym);
    let db, col, doc;
    try {
      db = await getDb();
      col = db.collection("userShifts");
      doc = await col.findOne({ _id });
    } catch (dbErr) {
      const msg = typeof dbErr?.message === "string" ? dbErr.message : String(dbErr);
      return res.status(500).json({ error: msg });
    }
    if (!doc) {
      const legacyId = monthId(decoded.uid, ym);
      doc = await col.findOne({ _id: legacyId });
    }

    if (!doc) return res.status(200).json({ success: true, uid: decoded.uid, email: decoded.email || null, month: ym, shifts: [], totals: { hours: 0, extraHours: 0 }, updatedAt: null });
    return res.status(200).json({ success: true, uid: decoded.uid, email: decoded.email || null, month: ym, shifts: doc.shifts || [], totals: doc.totals || null, updatedAt: doc.updatedAt || null });
  } catch (e) {
    const msg = typeof e?.message === "string" ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}