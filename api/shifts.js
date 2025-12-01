/**
 * Shifts API - Consolidated endpoint
 * Handles list, upsert, and delete operations
 * Routes: GET /api/shifts?action=list, POST /api/shifts?action=upsert, DELETE /api/shifts?action=delete
 */

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDb, monthId } from "../lib/mongo.js";

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
        return {
          ok: false,
          error: "FIREBASE_SERVICE_ACCOUNT missing project_id",
        };
      }
      const pk =
        typeof sa.private_key === "string"
          ? sa.private_key.replace(/\\n/g, "\n")
          : sa.private_key;
      const saNorm = {
        project_id: sa.project_id,
        client_email: sa.client_email,
        private_key: pk,
      };
      initializeApp({ credential: cert(saNorm) });
    }
    return { ok: true, auth: getAuth() };
  } catch (e) {
    return {
      ok: false,
      error: typeof e?.message === "string" ? e.message : String(e),
    };
  }
}

function normalizeUserId(decoded) {
  const email = decoded?.email;
  const uid = decoded?.uid;
  return (email || uid || "unknown").trim().toLowerCase();
}

// Handler for LIST
async function handleList(req, res, decoded) {
  const userId = normalizeUserId(decoded);
  const ym = req.query.month || new Date().toISOString().slice(0, 7);
  const _id = monthId(userId, ym);

  try {
    const db = await getDb();
    const col = db.collection("userShifts");
    let doc = await col.findOne({ _id });

    if (!doc) {
      const legacyId = monthId(decoded.uid, ym);
      doc = await col.findOne({ _id: legacyId });
    }

    if (!doc) {
      return res.status(200).json({
        success: true,
        uid: decoded.uid,
        email: decoded.email || null,
        month: ym,
        shifts: [],
        totals: { hours: 0, extraHours: 0 },
        updatedAt: null,
      });
    }

    return res.status(200).json({
      success: true,
      uid: decoded.uid,
      email: decoded.email || null,
      month: ym,
      shifts: doc.shifts || [],
      totals: doc.totals || null,
      updatedAt: doc.updatedAt || null,
    });
  } catch (dbErr) {
    const msg =
      typeof dbErr?.message === "string" ? dbErr.message : String(dbErr);
    return res.status(500).json({ error: msg });
  }
}

// Handler for UPSERT
async function handleUpsert(req, res, decoded) {
  const userId = normalizeUserId(decoded);
  const { month, shifts, totals } = req.body || {};

  if (!month || !Array.isArray(shifts)) {
    return res.status(400).json({ error: "Missing month or shifts" });
  }

  const ym = month;
  const _id = monthId(userId, ym);

  try {
    const db = await getDb();
    const col = db.collection("userShifts");
    const now = new Date();
    const [year, m] = ym.split("-").map((v) => Number(v));

    await col.updateOne(
      { _id },
      {
        $set: {
          _id,
          uid: decoded.uid,
          email: decoded.email || null,
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
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// Handler for DELETE
async function handleDelete(req, res, decoded) {
  const userId = normalizeUserId(decoded);
  const { month, id } = req.body || {};

  if (!month || !id) {
    return res.status(400).json({ error: "Missing month or id" });
  }

  const _id = monthId(userId, month);

  try {
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

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Auth
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const init = ensureAdmin();
    if (!init.ok) {
      return res.status(500).json({ error: init.error });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await init.auth.verifyIdToken(idToken);

    // Route based on method
    if (req.method === "GET") {
      return handleList(req, res, decoded);
    } else if (req.method === "POST") {
      // Check action query param for upsert vs delete
      const action = req.query.action || "upsert";
      if (action === "delete") {
        return handleDelete(req, res, decoded);
      }
      return handleUpsert(req, res, decoded);
    } else if (req.method === "DELETE") {
      return handleDelete(req, res, decoded);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (e) {
    const msg = typeof e?.message === "string" ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
