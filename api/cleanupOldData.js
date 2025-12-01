/**
 * Cleanup Old MongoDB Data
 * Removes userShifts documents older than 24 months
 * Runs monthly via Vercel Cron (day 1 at 03:00)
 */

import { MongoClient } from "mongodb";

// Security: Validate cron secret (optional but recommended)
const CRON_SECRET = process.env.CRON_SECRET;

// Retention period: 24 months
const RETENTION_MONTHS = 24;

async function getMongoDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MongoDB not configured");
  }

  const client = new MongoClient(uri);
  await client.connect();
  return client.db(process.env.MONGODB_DB || "vidaextra");
}

export default async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional: Validate cron secret
  if (CRON_SECRET) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log("❌ Cleanup: Invalid or missing cron secret");
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    console.log("🗑️ Starting MongoDB cleanup...");

    const db = await getMongoDb();
    const collection = db.collection("userShifts");

    // Calculate cutoff date (24 months ago)
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setMonth(cutoffDate.getMonth() - RETENTION_MONTHS);

    const cutoffYear = cutoffDate.getFullYear();
    const cutoffMonth = cutoffDate.getMonth() + 1; // JavaScript months are 0-indexed

    console.log(
      `📅 Cutoff date: ${cutoffYear}-${String(cutoffMonth).padStart(2, "0")}`
    );

    // Delete documents older than cutoff
    // Documents have format: { year: YYYY, month: MM }
    const deleteResult = await collection.deleteMany({
      $or: [
        { year: { $lt: cutoffYear } }, // All years before cutoff year
        {
          year: cutoffYear,
          month: { $lt: cutoffMonth }, // Months before cutoff in cutoff year
        },
      ],
    });

    const deletedCount = deleteResult.deletedCount || 0;

    console.log(`✅ Cleanup complete: ${deletedCount} documents deleted`);

    // Get remaining document count
    const remainingCount = await collection.countDocuments();

    return res.status(200).json({
      success: true,
      deletedCount,
      remainingCount,
      cutoffDate: `${cutoffYear}-${String(cutoffMonth).padStart(2, "0")}`,
      retentionMonths: RETENTION_MONTHS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    return res.status(500).json({
      error: "Cleanup failed",
      message: error.message,
    });
  }
};
