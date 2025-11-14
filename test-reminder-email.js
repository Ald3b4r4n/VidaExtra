/**
 * Script de Teste - Envio de E-mail de Lembrete Real
 * Testa o template completo de e-mail de notificação
 */

require("dotenv").config({ path: ".env.local" });
const nodemailer = require("nodemailer");

async function sendReminderEmail() {
  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || "gmail",
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Aceita certificados auto-assinados (apenas para testes locais)
    },
  });

  // Dados do evento de teste
  const event = {
    summary: "AC-4 17:00 às 00:00",
    description: "Horas: 7.00h | Valor líquido: R$ 264,81\nLocal: 14ª CIPM",
    location: "14ª CIPM - Noroeste",
    start: {
      dateTime: "2025-11-15T20:00:00.000Z",
      timeZone: "America/Sao_Paulo",
    },
    end: {
      dateTime: "2025-11-16T03:00:00.000Z",
      timeZone: "America/Sao_Paulo",
    },
    htmlLink: "https://calendar.google.com/calendar/event?eid=teste123",
  };

  const reminderType = "24h"; // ou '1h', '30m'
  const reminderLabel =
    reminderType === "24h"
      ? "24 horas"
      : reminderType === "1h"
      ? "1 hora"
      : "30 minutos";

  // Formatar data/hora
  const startDate = new Date(event.start.dateTime);
  const dateStr = startDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = startDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const mailOptions = {
    from: `"VidaExtra® AC-4" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER, // Envia para você mesmo no teste
    subject: `🔔 Lembrete: ${event.summary} em ${reminderLabel}`,
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
                      🔔 VidaExtra®
                    </h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                      Lembrete de Evento AC-4
                    </p>
                  </td>
                </tr>
                
                <!-- Alert Badge -->
                <tr>
                  <td style="padding: 30px 30px 0 30px;">
                    <div style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px; text-align: center;">
                      <p style="margin: 0; color: #856404; font-weight: bold; font-size: 16px;">
                        ⏰ Seu evento começa em ${reminderLabel}!
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Event Details -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">
                      ${event.summary}
                    </h2>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                          <strong style="color: #667eea;">📅 Data:</strong><br>
                          <span style="color: #666; font-size: 16px;">${dateStr}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                          <strong style="color: #667eea;">🕐 Horário:</strong><br>
                          <span style="color: #666; font-size: 16px;">${timeStr}</span>
                        </td>
                      </tr>
                      ${
                        event.location
                          ? `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                          <strong style="color: #667eea;">📍 Local:</strong><br>
                          <span style="color: #666; font-size: 16px;">${event.location}</span>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                      ${
                        event.description
                          ? `
                      <tr>
                        <td style="padding: 12px 0;">
                          <strong style="color: #667eea;">📝 Detalhes:</strong><br>
                          <span style="color: #666; font-size: 14px; white-space: pre-wrap;">${event.description}</span>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                    </table>
                    
                    <!-- CTA Buttons -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${event.htmlLink}" 
                             style="background-color: #667eea; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
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
                             style="color: #667eea; text-decoration: none; font-size: 14px;">
                            🏠 Ir para VidaExtra®
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Tips Section -->
                <tr>
                  <td style="background-color: #f9f9f9; padding: 20px 30px;">
                    <p style="margin: 0 0 10px 0; color: #999; font-size: 12px;">
                      💡 <strong>Dicas:</strong>
                    </p>
                    <ul style="color: #666; font-size: 12px; line-height: 1.6; margin: 0; padding-left: 20px;">
                      <li>Configure notificações no Google Calendar app para não perder lembretes</li>
                      <li>Você receberá outros lembretes: 24h, 1h e 30min antes do evento</li>
                      <li>Gerencie suas notificações na aba "Lembretes" do VidaExtra®</li>
                    </ul>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #333; color: #ffffff; padding: 20px 30px; text-align: center;">
                    <p style="margin: 0; font-size: 12px;">
                      Desenvolvido por <strong>CB Antônio Rafael</strong> - 14ª CIPM
                    </p>
                    <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">
                      © 2025 VidaExtra® - Calculadora AC-4
                    </p>
                    <p style="margin: 15px 0 0 0; font-size: 11px;">
                      <a href="${process.env.APP_URL}/pages/login.html" 
                         style="color: #667eea; text-decoration: none;">
                        ⚙️ Gerenciar notificações
                      </a>
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
    console.log("\n🚀 Enviando e-mail de teste...\n");
    console.log(`📧 De: ${mailOptions.from}`);
    console.log(`📬 Para: ${mailOptions.to}`);
    console.log(`📋 Assunto: ${mailOptions.subject}\n`);

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ E-mail enviado com sucesso!");
    console.log(`📨 Message ID: ${info.messageId}`);
    console.log(`📊 Response: ${info.response}\n`);
    console.log("💡 Verifique sua caixa de entrada (pode estar no spam)!\n");
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
    process.exit(1);
  }
}

// Executar teste
sendReminderEmail();
