/**
 * Email Service with Nodemailer
 * Sends reminder notifications via Gmail SMTP
 */

import nodemailer from "nodemailer";

/**
 * Cria um transporte SMTP configurado
 */
function createTransporter() {
  const config = {
    service: process.env.SMTP_SERVICE || "gmail",
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE !== "false", // true para porta 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  if (!config.auth.user || !config.auth.pass) {
    throw new Error("SMTP credentials not configured");
  }

  return nodemailer.createTransporter(config);
}

/**
 * Formata data para exibição em português
 * @param {Date|string} date - Data a formatar
 * @returns {string} Data formatada (ex: "14/11/2025 às 18:00")
 */
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

/**
 * Gera descrição textual do tipo de lembrete
 * @param {string} reminderType - Tipo: '24h', '1h', '30m'
 * @returns {string} Descrição formatada
 */
function getReminderDescription(reminderType) {
  const descriptions = {
    "24h": "24 horas antes",
    "1h": "1 hora antes",
    "30m": "30 minutos antes",
  };

  return descriptions[reminderType] || reminderType;
}

/**
 * Gera HTML do e-mail de lembrete
 * @param {Object} data - Dados do e-mail
 * @returns {string} HTML do e-mail
 */
function generateEmailHTML(data) {
  const { userName, event, reminderType } = data;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0d6efd;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #0d6efd;
      margin: 0;
    }
    .subtitle {
      color: #6c757d;
      margin: 5px 0 0 0;
    }
    .reminder-badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .event-details {
      background: #f8f9fa;
      border-left: 4px solid #0d6efd;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .event-title {
      font-size: 20px;
      font-weight: bold;
      color: #212529;
      margin: 0 0 15px 0;
    }
    .detail-row {
      display: flex;
      margin-bottom: 10px;
      align-items: start;
    }
    .detail-icon {
      width: 24px;
      margin-right: 10px;
      color: #0d6efd;
    }
    .detail-label {
      font-weight: 600;
      color: #495057;
      min-width: 80px;
    }
    .detail-value {
      color: #212529;
    }
    .cta-button {
      display: inline-block;
      background: #0d6efd;
      color: white;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 8px;
      font-weight: 600;
      margin-top: 20px;
      transition: background 0.3s;
    }
    .cta-button:hover {
      background: #0b5ed7;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      color: #6c757d;
      font-size: 14px;
    }
    .footer-logo {
      font-weight: bold;
      color: #0d6efd;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">📊 VidaExtra®</h1>
      <p class="subtitle">Calculadora AC-4</p>
    </div>

    <p>Olá <strong>${userName || "Usuário"}</strong>,</p>

    <div class="reminder-badge">
      🔔 Lembrete: ${getReminderDescription(reminderType)}
    </div>

    <p>Este é um lembrete automático do VidaExtra para o seguinte evento:</p>

    <div class="event-details">
      <h2 class="event-title">${event.summary || "Evento sem título"}</h2>
      
      <div class="detail-row">
        <span class="detail-icon">📅</span>
        <div>
          <span class="detail-label">Quando:</span>
          <span class="detail-value">${formatDate(event.start)}</span>
        </div>
      </div>

      ${
        event.location
          ? `
      <div class="detail-row">
        <span class="detail-icon">📍</span>
        <div>
          <span class="detail-label">Onde:</span>
          <span class="detail-value">${event.location}</span>
        </div>
      </div>
      `
          : ""
      }

      ${
        event.description
          ? `
      <div class="detail-row">
        <span class="detail-icon">📝</span>
        <div>
          <span class="detail-label">Detalhes:</span>
          <span class="detail-value">${event.description}</span>
        </div>
      </div>
      `
          : ""
      }
    </div>

    <div style="text-align: center;">
      <a href="${
        process.env.APP_URL || "https://vidaextra-8db27.web.app"
      }" class="cta-button">
        Abrir VidaExtra
      </a>
    </div>

    <div class="footer">
      <p>
        <span class="footer-logo">VidaExtra®</span><br>
        Desenvolvido por CB Antônio Rafael - 14ª CIPM
      </p>
      <p style="font-size: 12px; color: #adb5bd;">
        Você está recebendo este e-mail porque ativou lembretes no VidaExtra.<br>
        Para desativar, acesse as configurações do aplicativo.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Gera texto plano do e-mail (fallback)
 * @param {Object} data - Dados do e-mail
 * @returns {string} Texto plano
 */
function generateEmailText(data) {
  const { userName, event, reminderType } = data;

  return `
Olá ${userName || "Usuário"},

Este é um lembrete do VidaExtra para o evento:

Título: ${event.summary || "Evento sem título"}
Quando: ${formatDate(event.start)}
${event.location ? `Onde: ${event.location}` : ""}
${event.description ? `Detalhes: ${event.description}` : ""}

Tipo de lembrete: ${getReminderDescription(reminderType)}

Abra o app VidaExtra para mais detalhes: ${
    process.env.APP_URL || "https://vidaextra-8db27.web.app"
  }

--
VidaExtra®
Desenvolvido por CB Antônio Rafael - 14ª CIPM
  `.trim();
}

/**
 * Envia e-mail de lembrete
 * @param {Object} options - Opções do e-mail
 * @param {string} options.to - Destinatário
 * @param {string} options.userName - Nome do usuário
 * @param {Object} options.event - Dados do evento
 * @param {string} options.reminderType - Tipo de lembrete ('24h', '1h', '30m')
 * @returns {Promise<Object>} Resultado do envio
 */
export async function sendReminderEmail(options) {
  const { to, userName, event, reminderType } = options;

  if (!to || !event) {
    throw new Error("Missing required email parameters");
  }

  const transporter = createTransporter();

  const subject = `🔔 Lembrete: ${event.summary || "Evento"} em ${formatDate(
    event.start
  )}`;
  const html = generateEmailHTML({ userName, event, reminderType });
  const text = generateEmailText({ userName, event, reminderType });

  const mailOptions = {
    from: {
      name: "VidaExtra",
      address: process.env.SMTP_USER,
    },
    to: to,
    subject: subject,
    text: text,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", {
      messageId: info.messageId,
      to: to,
      reminderType: reminderType,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Envia e-mail de boas-vindas
 * @param {Object} options - Opções do e-mail
 * @param {string} options.to - Destinatário
 * @param {string} options.userName - Nome do usuário
 * @returns {Promise<Object>} Resultado do envio
 */
export async function sendWelcomeEmail(options) {
  const { to, userName } = options;

  if (!to) {
    throw new Error("Missing recipient email");
  }

  const transporter = createTransporter();

  const subject = "Bem-vindo ao VidaExtra®!";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #0d6efd;">Bem-vindo ao VidaExtra®!</h1>
      <p>Olá ${userName || "Usuário"},</p>
      <p>Seu login foi realizado com sucesso! Agora você pode:</p>
      <ul>
        <li>📊 Calcular horas extras AC-4</li>
        <li>📅 Sincronizar com Google Calendar</li>
        <li>🔔 Receber lembretes por e-mail</li>
        <li>📄 Exportar relatórios em PDF</li>
      </ul>
      <p>Acesse o aplicativo: <a href="${
        process.env.APP_URL || "https://vidaextra-8db27.web.app"
      }">VidaExtra</a></p>
      <p>--<br>Equipe VidaExtra</p>
    </div>
  `;

  const mailOptions = {
    from: {
      name: "VidaExtra",
      address: process.env.SMTP_USER,
    },
    to: to,
    subject: subject,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}

export default {
  sendReminderEmail,
  sendWelcomeEmail,
};
