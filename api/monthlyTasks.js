/**
 * Monthly Tasks - Unified Cron Job Handler
 * Runs on day 1 of each month at 03:00 UTC
 *
 * Tasks:
 * 1. Send Monthly Report (if action=report)
 * 2. Cleanup Old Data (if action=cleanup)
 * 3. Both (if no action specified)
 */

import nodemailer from "nodemailer";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { MongoClient } from "mongodb";

// Initialize Firebase Admin
let db;
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
  );
  initializeApp({
    credential: cert(serviceAccount),
  });
}
db = getFirestore();

// Configuration
const CRON_SECRET = process.env.CRON_SECRET;
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

/**
 * Task 1: Send Monthly Reports
 */
async function sendMonthlyReports() {
  console.log("📧 Starting monthly report generation...");

  const now = DateTime.now();
  const lastMonth = now.minus({ months: 1 });
  const monthName = lastMonth.setLocale("pt-BR").toFormat("MMMM/yyyy");

  // Get all users with email notifications enabled
  const usersSnapshot = await db
    .collection("users")
    .where("notifySettings.email", "==", true)
    .get();

  if (usersSnapshot.empty) {
    console.log("No users with email notifications enabled");
    return { sent: 0, errors: 0 };
  }

  const users = usersSnapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
  }));

  console.log(`Found ${users.length} users with email notifications enabled`);

  // Email configuration
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  let sentCount = 0;
  let errorCount = 0;

  for (const user of users) {
    if (!user.email) continue;

    try {
      const events = []; // Placeholder - in production, fetch from MongoDB

      const emailHtml = generateReportEmail(
        user.displayName || user.email,
        monthName,
        events
      );

      await transporter.sendMail({
        from: `"VidaExtra AC-4" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `📊 Relatório Mensal AC-4 - ${monthName}`,
        html: emailHtml,
      });

      sentCount++;
      console.log(`✅ Report sent to ${user.email}`);
    } catch (error) {
      errorCount++;
      console.error(`❌ Error sending to ${user.email}:`, error.message);
    }
  }

  console.log(
    `📧 Monthly reports complete: ${sentCount} sent, ${errorCount} errors`
  );
  return { sent: sentCount, errors: errorCount };
}

/**
 * Task 2: Cleanup Old MongoDB Data
 */
async function cleanupOldData() {
  console.log("🗑️ Starting MongoDB cleanup...");

  const mongodb = await getMongoDb();
  const collection = mongodb.collection("userShifts");

  // Calculate cutoff date (24 months ago)
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setMonth(cutoffDate.getMonth() - RETENTION_MONTHS);

  const cutoffYear = cutoffDate.getFullYear();
  const cutoffMonth = cutoffDate.getMonth() + 1;

  console.log(
    `📅 Cutoff date: ${cutoffYear}-${String(cutoffMonth).padStart(2, "0")}`
  );

  // Delete documents older than cutoff
  const deleteResult = await collection.deleteMany({
    $or: [
      { year: { $lt: cutoffYear } },
      {
        year: cutoffYear,
        month: { $lt: cutoffMonth },
      },
    ],
  });

  const deletedCount = deleteResult.deletedCount || 0;
  const remainingCount = await collection.countDocuments();

  console.log(`✅ Cleanup complete: ${deletedCount} documents deleted`);

  return {
    deletedCount,
    remainingCount,
    cutoffDate: `${cutoffYear}-${String(cutoffMonth).padStart(2, "0")}`,
  };
}

/**
 * Generate email HTML
 */
function generateReportEmail(userName, monthName, events) {
  const eventCount = events.length;
  const totalHours = events.reduce((sum, e) => sum + (e.hours || 0), 0);
  const totalValor = events.reduce((sum, e) => sum + (e.value || 0), 0);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                      📊 Relatório Mensal AC-4
                    </h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">${monthName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                      Olá <strong>${userName}</strong>,
                    </p>
                    <p style="margin: 0 0 30px 0; font-size: 15px; color: #666; line-height: 1.6;">
                      Aqui está o resumo das suas atividades AC-4 em <strong>${monthName}</strong>:
                    </p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 20px; background-color: #667eea; border-radius: 8px; text-align: center;">
                          <p style="color: #ffffff; margin: 0; font-size: 14px; opacity: 0.9;">Total de Eventos</p>
                          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 32px; font-weight: bold;">${eventCount}</p>
                        </td>
                        <td style="width: 20px;"></td>
                        <td style="padding: 20px; background-color: #28a745; border-radius: 8px; text-align: center;">
                          <p style="color: #ffffff; margin: 0; font-size: 14px; opacity: 0.9;">Total de Horas</p>
                          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 32px; font-weight: bold;">${totalHours.toFixed(
                            2
                          )}h</p>
                        </td>
                      </tr>
                    </table>

                    <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                      <p style="margin: 0; font-size: 15px; color: #333;">
                        <strong>💰 Valor Total:</strong> R$ ${totalValor.toFixed(
                          2
                        )}
                      </p>
                    </div>

                    <p style="margin: 30px 0 20px 0; font-size: 14px; color: #999; text-align: center;">
                      Este é um e-mail automático enviado no dia 1º de cada mês.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Main Handler
 */
export default async function handler(req, res) {
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

  // Validate cron secret
  if (CRON_SECRET) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      console.log("❌ Invalid or missing cron secret");
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const action = req.query.action || "all";
    const results = {};

    // Execute requested tasks
    if (action === "report" || action === "all") {
      results.monthlyReport = await sendMonthlyReports();
    }

    if (action === "cleanup" || action === "all") {
      results.cleanup = await cleanupOldData();
    }

    return res.status(200).json({
      success: true,
      action,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Monthly tasks error:", error);
    return res.status(500).json({
      error: "Task execution failed",
      message: error.message,
    });
  }
}
