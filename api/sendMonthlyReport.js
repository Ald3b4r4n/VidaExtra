import nodemailer from "nodemailer";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { DateTime } from "luxon";

// Initialize Firebase Admin
let db;
try {
  if (!db) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
    );
    initializeApp({
      credential: cert(serviceAccount),
    });
    db = getFirestore();
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // This endpoint should only be called by Vercel Cron
  // In production, verify the authorization header
  const authHeader = req.headers.authorization;
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("Starting monthly report generation...");

    // Get all users from Firestore
    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
      console.log("No users found");
      return res.status(200).json({
        success: true,
        message: "No users to send reports to",
        reportsSent: 0,
      });
    }

    // Get last month's date range
    const now = DateTime.now().setZone("America/Sao_Paulo");
    const lastMonth = now.minus({ months: 1 });
    const startOfLastMonth = lastMonth.startOf("month");
    const endOfLastMonth = lastMonth.endOf("month");

    console.log(
      `Generating reports for: ${startOfLastMonth.toFormat("MMMM yyyy", {
        locale: "pt-BR",
      })}`
    );

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    let reportsSent = 0;
    const errors = [];

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const userEmail = userData.email;
        const userName = userData.displayName || "Usuário";

        if (!userEmail) {
          console.log(`Skipping user ${userId} - no email`);
          continue;
        }

        // Get user's history from localStorage (this would need to be stored in Firestore)
        // For now, we'll use a placeholder structure
        const historyRef = db
          .collection("users")
          .doc(userId)
          .collection("history");
        const historySnapshot = await historyRef
          .where("createdAt", ">=", startOfLastMonth.toJSDate())
          .where("createdAt", "<=", endOfLastMonth.toJSDate())
          .get();

        if (historySnapshot.empty) {
          console.log(
            `No events for user ${userEmail} in ${lastMonth.toFormat(
              "MMMM yyyy"
            )}`
          );
          continue;
        }

        // Calculate totals
        let totalHours = 0;
        let totalValorLiquido = 0;
        let totalValorBruto = 0;
        let eventCount = 0;

        const events = [];
        historySnapshot.forEach((doc) => {
          const event = doc.data();
          events.push(event);
          totalHours += parseFloat(event.horas || 0);
          totalValorLiquido += parseFloat(event.valorLiquido || 0);
          totalValorBruto += parseFloat(event.valorBruto || 0);
          eventCount++;
        });

        // Sort events by date
        events.sort((a, b) => new Date(a.inicio) - new Date(b.inicio));

        // Generate events HTML
        const eventsHTML = events
          .map(
            (event) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #666;">
              ${DateTime.fromISO(event.inicio)
                .setLocale("pt-BR")
                .toFormat("dd/MM/yyyy")}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #666;">
              ${event.summary || "Evento AC-4"}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #666; text-align: center;">
              ${parseFloat(event.horas || 0).toFixed(2)}h
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #28a745; text-align: right; font-weight: bold;">
              R$ ${parseFloat(event.valorLiquido || 0).toFixed(2)}
            </td>
          </tr>
        `
          )
          .join("");

        const firstName = userName.split(" ")[0];
        const monthName = lastMonth
          .setLocale("pt-BR")
          .toFormat("MMMM 'de' yyyy");

        const mailOptions = {
          from: `"VidaExtra® AC-4" <${process.env.SMTP_USER}>`,
          to: userEmail,
          subject: `📊 Relatório Mensal VidaExtra® - ${monthName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                      
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                            📊 VidaExtra®
                          </h1>
                          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                            Relatório Mensal - ${monthName}
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Greeting -->
                      <tr>
                        <td style="padding: 30px 30px 20px 30px;">
                          <h2 style="color: #333; margin: 0 0 10px 0; font-size: 22px;">
                            Olá, ${firstName}! 👋
                          </h2>
                          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
                            Aqui está o resumo das suas horas trabalhadas em <strong>${monthName}</strong>.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Summary Cards -->
                      <tr>
                        <td style="padding: 0 30px 30px 30px;">
                          <table width="100%" cellpadding="0" cellspacing="10">
                            <tr>
                              <td width="50%" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; text-align: center;">
                                <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Total de Eventos</p>
                                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 32px; font-weight: bold;">${eventCount}</p>
                              </td>
                              <td width="50%" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 8px; text-align: center;">
                                <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Total de Horas</p>
                                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 32px; font-weight: bold;">${totalHours.toFixed(
                                  2
                                )}h</p>
                              </td>
                            </tr>
                            <tr>
                              <td width="50%" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 8px; text-align: center;">
                                <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Valor Bruto</p>
                                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 28px; font-weight: bold;">R$ ${totalValorBruto.toFixed(
                                  2
                                )}</p>
                              </td>
                              <td width="50%" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 20px; border-radius: 8px; text-align: center;">
                                <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Valor Líquido</p>
                                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 28px; font-weight: bold;">R$ ${totalValorLiquido.toFixed(
                                  2
                                )}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Events Table -->
                      <tr>
                        <td style="padding: 0 30px 30px 30px;">
                          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                            📅 Detalhamento dos Eventos
                          </h3>
                          <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                            <thead>
                              <tr style="background-color: #f9f9f9;">
                                <th style="padding: 12px 10px; text-align: left; font-size: 12px; color: #999; font-weight: bold; border-bottom: 2px solid #e0e0e0;">DATA</th>
                                <th style="padding: 12px 10px; text-align: left; font-size: 12px; color: #999; font-weight: bold; border-bottom: 2px solid #e0e0e0;">EVENTO</th>
                                <th style="padding: 12px 10px; text-align: center; font-size: 12px; color: #999; font-weight: bold; border-bottom: 2px solid #e0e0e0;">HORAS</th>
                                <th style="padding: 12px 10px; text-align: right; font-size: 12px; color: #999; font-weight: bold; border-bottom: 2px solid #e0e0e0;">VALOR LÍQ.</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${eventsHTML}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- CTA Button -->
                      <tr>
                        <td align="center" style="padding: 20px 30px;">
                          <a href="${
                            process.env.APP_URL ||
                            "https://vidaextra-calculadora-ac4.vercel.app"
                          }" 
                             style="background-color: #667eea; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                            📊 Ver Histórico Completo
                          </a>
                        </td>
                      </tr>
                      
                      <!-- PIX Donation Section -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #fff3cd 0%, #ffe082 100%); padding: 30px; text-align: center; border-top: 3px dashed #ffc107;">
                          <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 20px;">
                            ☕ VidaExtra® está te ajudando?
                          </h3>
                          <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                            Em ${monthName} você economizou tempo e organizou ${eventCount} eventos!<br>
                            Seu apoio mantém esta ferramenta gratuita e sempre melhorando. ❤️
                          </p>
                          <a href="${
                            process.env.APP_URL ||
                            "https://vidaextra-calculadora-ac4.vercel.app"
                          }/pages/pix-cafe.html" 
                             style="background-color: #32bcad; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                            💜 Pague-me um Café via PIX
                          </a>
                          <p style="color: #856404; font-size: 12px; margin: 15px 0 0 0;">
                            Qualquer valor é muito bem-vindo!
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #333; color: #ffffff; padding: 20px 30px; text-align: center;">
                          <p style="margin: 0 0 10px 0; font-size: 12px;">
                            Desenvolvido por <strong>CB Antônio Rafael</strong> - 14ª CIPM
                          </p>
                          <p style="margin: 0; font-size: 11px; color: #999;">
                            VidaExtra® - Calculadora AC-4 para Policiais Militares<br>
                            Este é um email automático enviado no dia 1 de cada mês.
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        };

        await transporter.sendMail(mailOptions);
        reportsSent++;
        console.log(`Monthly report sent to ${userEmail}`);
      } catch (userError) {
        console.error(`Error processing user ${userDoc.id}:`, userError);
        errors.push({ userId: userDoc.id, error: userError.message });
      }
    }

    console.log(
      `Monthly reports completed. Sent: ${reportsSent}, Errors: ${errors.length}`
    );

    return res.status(200).json({
      success: true,
      reportsSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in monthly report generation:", error);
    return res.status(500).json({
      error: "Failed to generate monthly reports",
      details: error.message,
    });
  }
}
