import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { DateTime } from "luxon";

dotenv.config({ path: ".env.local" });

async function testConfirmationEmail() {
  console.log("🧪 Testando email de confirmação de evento...\n");

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

  const userName = "Antonio Rafael";
  const userEmail = "rafasouzacruz@gmail.com";
  const firstName = userName.split(" ")[0];

  // Mock event data
  const event = {
    summary: "AC-4 20:00 às 08:00",
    description: "Horas: 12.00h | Valor líquido: R$ 471,71",
    start: {
      dateTime: "2025-11-16T20:00:00-03:00",
    },
    end: {
      dateTime: "2025-11-17T08:00:00-03:00",
    },
    htmlLink: "https://calendar.google.com/calendar/event?eid=test",
  };

  const startDateTime = DateTime.fromISO(event.start.dateTime, {
    zone: "America/Sao_Paulo",
  });
  const endDateTime = DateTime.fromISO(event.end.dateTime, {
    zone: "America/Sao_Paulo",
  });

  const dateStr = startDateTime
    .setLocale("pt-BR")
    .toFormat("EEEE, dd 'de' MMMM 'de' yyyy");
  const timeStr = `${startDateTime.toFormat("HH:mm")} às ${endDateTime.toFormat(
    "HH:mm"
  )}`;

  const mailOptions = {
    from: `"VidaExtra® AC-4" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: `✅ Evento Confirmado: ${event.summary}`,
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
                  <td style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                      ✅ VidaExtra®
                    </h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                      Confirmação de Evento AC-4
                    </p>
                  </td>
                </tr>
                
                <!-- Success Badge -->
                <tr>
                  <td style="padding: 30px 30px 0 30px;">
                    <div style="background-color: #d4edda; border: 2px solid #28a745; border-radius: 8px; padding: 15px; text-align: center;">
                      <p style="margin: 0; color: #155724; font-weight: bold; font-size: 16px;">
                        🎉 Evento criado com sucesso no Google Calendar!
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Greeting -->
                <tr>
                  <td style="padding: 30px 30px 20px 30px;">
                    <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
                      Olá, <strong>${firstName}</strong>! 👋
                    </p>
                    <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 10px 0 0 0;">
                      Seu evento foi adicionado ao Google Calendar e você receberá lembretes automáticos.
                    </p>
                  </td>
                </tr>
                
                <!-- Event Details -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px; border-bottom: 3px solid #28a745; padding-bottom: 10px;">
                      ${event.summary}
                    </h2>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                          <strong style="color: #28a745;">📅 Data:</strong><br>
                          <span style="color: #666; font-size: 16px;">${dateStr}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                          <strong style="color: #28a745;">🕐 Horário:</strong><br>
                          <span style="color: #666; font-size: 16px;">${timeStr}</span>
                        </td>
                      </tr>
                      ${
                        event.description
                          ? `
                      <tr>
                        <td style="padding: 12px 0;">
                          <strong style="color: #28a745;">📝 Detalhes:</strong><br>
                          <span style="color: #666; font-size: 14px; white-space: pre-wrap;">${event.description}</span>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                    </table>
                    
                    <!-- Reminders Info -->
                    <div style="background-color: #e7f3ff; border-left: 4px solid #0066cc; padding: 15px; margin-bottom: 20px;">
                      <p style="margin: 0 0 10px 0; color: #004085; font-weight: bold;">
                        🔔 Você receberá lembretes:
                      </p>
                      <ul style="margin: 0; padding-left: 20px; color: #004085; font-size: 14px; line-height: 1.8;">
                        <li><strong>24 horas antes</strong> (email)</li>
                        <li><strong>1 hora antes</strong> (email)</li>
                        <li><strong>30 minutos antes</strong> (popup no celular)</li>
                        <li><strong>15 minutos antes</strong> (popup no celular)</li>
                      </ul>
                    </div>
                    
                    <!-- CTA Buttons -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${event.htmlLink}" 
                             style="background-color: #28a745; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                            📆 Abrir no Google Calendar
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 0 0 20px 0;">
                          <a href="${
                            process.env.APP_URL ||
                            "https://vidaextra-calculadora-ac4.vercel.app"
                          }" 
                             style="color: #28a745; text-decoration: none; font-size: 14px;">
                            🏠 Ir para VidaExtra®
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- PIX Donation Section -->
                <tr>
                  <td style="background: linear-gradient(135deg, #fff3cd 0%, #ffe082 100%); padding: 30px; text-align: center; border-top: 3px dashed #ffc107;">
                    <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 20px;">
                      ☕ Gostando do VidaExtra®?
                    </h3>
                    <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                      Esta ferramenta economiza seu tempo e facilita seu dia a dia!<br>
                      Considere me pagar um café para manter o projeto ativo. ❤️
                    </p>
                    <a href="http://localhost:5500/pages/pix-cafe.html" 
                       style="background-color: #32bcad; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                      💜 Pague-me um Café via PIX
                    </a>
                    <p style="color: #856404; font-size: 12px; margin: 15px 0 0 0;">
                      PIX Copia e Cola disponível dentro do app
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
                      Este é um email automático, por favor não responda.
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

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email de confirmação enviado com sucesso!");
    console.log("📧 Message ID:", info.messageId);
    console.log("📬 Destinatário:", userEmail);
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);
    throw error;
  }
}

testConfirmationEmail()
  .then(() => {
    console.log("\n✨ Teste concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Falha no teste:", error);
    process.exit(1);
  });
