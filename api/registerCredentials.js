/**
 * Vercel Serverless Function - Register OAuth Credentials
 * POST /api/registerCredentials
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import nodemailer from "nodemailer";

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
 * Send welcome email
 */
async function sendWelcomeEmail({ to, userName }) {
  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || "gmail",
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"VidaExtra® AC-4" <${process.env.SMTP_USER}>`,
    to,
    subject: "🎉 Bem-vindo ao VidaExtra® - Calculadora AC-4",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">VidaExtra®</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Calculadora de Horas Extras AC-4</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Olá, ${userName || "Operador"}! 👋</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Seja bem-vindo ao <strong>VidaExtra®</strong>! Sua conta foi criada com sucesso e agora você pode:
          </p>
          
          <ul style="color: #666; line-height: 1.8;">
            <li>📊 Calcular automaticamente suas horas extras</li>
            <li>📅 Sincronizar eventos com o Google Calendar</li>
            <li>🔔 Receber lembretes por e-mail (24h, 1h e 30min antes)</li>
            <li>📱 Acessar de qualquer dispositivo</li>
            <li>📄 Exportar relatórios em PDF</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.APP_URL ||
              "https://vidaextra-calculadora-ac4.vercel.app"
            }" 
               style="background-color: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Acessar VidaExtra®
            </a>
          </div>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            💡 <strong>Dica:</strong> Configure seus lembretes na aba "Lembretes" para não perder nenhum evento!
          </p>
        </div>
        
        <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">Desenvolvido por <strong>CB Antônio Rafael</strong> - 14ª CIPM</p>
          <p style="margin: 10px 0 0 0; color: #999;">© 2025 VidaExtra® - Todos os direitos reservados</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    // Don't throw - email is not critical
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
    const { email, displayName, photoURL, accessToken } = req.body;

    if (!email || !accessToken) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(`Registering credentials for user: ${uid} (${email})`);

    // Save user data to Firestore
    const userRef = db.collection("users").doc(uid);
    await userRef.set(
      {
        uid,
        email,
        displayName: displayName || email.split("@")[0],
        photoURL: photoURL || null,
        // Access token temporário do login Google (sem refresh)
        accessToken,
        notifySettings: {
          email: true,
          reminders: ["24h", "1h", "30m"],
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    console.log(`User ${uid} credentials saved successfully`);

    // Send welcome email (async, non-blocking)
    sendWelcomeEmail({ to: email, userName: displayName });

    return res.status(200).json({
      success: true,
      message: "Credentials registered successfully",
    });
  } catch (error) {
    console.error("Error in registerCredentials:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
