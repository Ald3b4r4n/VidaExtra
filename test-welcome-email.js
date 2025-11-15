import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config({ path: ".env.local" });

async function testWelcomeEmail() {
  console.log("🧪 Testando email de boas-vindas...\n");

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

  const mailOptions = {
    from: `"VidaExtra® AC-4" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: "🎉 Bem-vindo ao VidaExtra®!",
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
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                      🎉 VidaExtra®
                    </h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                      Calculadora AC-4 para Policiais Militares
                    </p>
                  </td>
                </tr>
                
                <!-- Welcome Message -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">
                      Olá, ${firstName}! 👋
                    </h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Seja muito bem-vindo ao <strong>VidaExtra®</strong>, a plataforma que vai transformar a forma como você gerencia suas horas trabalhadas no AC-4!
                    </p>
                    <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                      Agora você tem acesso a:
                    </p>
                    
                    <!-- Features List -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #667eea; margin-bottom: 10px;">
                          <strong style="color: #667eea; font-size: 16px;">📊 Cálculo Automático</strong><br>
                          <span style="color: #666; font-size: 14px;">Calcule valores líquidos e brutos com base nas horas trabalhadas</span>
                        </td>
                      </tr>
                      <tr><td style="height: 10px;"></td></tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #667eea;">
                          <strong style="color: #667eea; font-size: 16px;">📅 Integração Google Calendar</strong><br>
                          <span style="color: #666; font-size: 14px;">Crie eventos automaticamente e receba lembretes por email</span>
                        </td>
                      </tr>
                      <tr><td style="height: 10px;"></td></tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #667eea;">
                          <strong style="color: #667eea; font-size: 16px;">📜 Histórico Completo</strong><br>
                          <span style="color: #666; font-size: 14px;">Acompanhe todos os seus cálculos e eventos salvos</span>
                        </td>
                      </tr>
                      <tr><td style="height: 10px;"></td></tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #667eea;">
                          <strong style="color: #667eea; font-size: 16px;">🔔 Lembretes Inteligentes</strong><br>
                          <span style="color: #666; font-size: 14px;">Receba notificações 24h, 1h, 30min e 15min antes dos eventos</span>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${
                            process.env.APP_URL ||
                            "https://vidaextra-calculadora-ac4.vercel.app"
                          }" 
                             style="background-color: #667eea; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 18px;">
                            🚀 Começar Agora
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Tips Section -->
                <tr>
                  <td style="background-color: #f9f9f9; padding: 30px;">
                    <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">
                      💡 Dicas para começar:
                    </h3>
                    <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li>Conecte seu <strong>Google Calendar</strong> na aba "Lembretes"</li>
                      <li>Faça seu primeiro cálculo e veja a mágica acontecer ✨</li>
                      <li>Confira o histórico para acompanhar suas horas trabalhadas</li>
                      <li>Configure suas preferências de notificação</li>
                    </ul>
                  </td>
                </tr>
                
                <!-- PIX Donation Section -->
                <tr>
                  <td style="background: linear-gradient(135deg, #fff3cd 0%, #ffe082 100%); padding: 30px; text-align: center; border-top: 3px dashed #ffc107;">
                    <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 20px;">
                      ☕ Gostou do VidaExtra®?
                    </h3>
                    <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                      Se esta ferramenta está ajudando você, considere me pagar um café! ❤️<br>
                      Seu apoio mantém o projeto funcionando e melhora a cada dia.
                    </p>
                    <a href="http://localhost:5500/pages/pix-cafe.html" 
                       style="background-color: #32bcad; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                      💜 Pague-me um Café via PIX
                    </a>
                    <p style="color: #856404; font-size: 12px; margin: 15px 0 0 0;">
                      PIX Copia e Cola também disponível dentro do app
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
    console.log("✅ Email de boas-vindas enviado com sucesso!");
    console.log("📧 Message ID:", info.messageId);
    console.log("📬 Destinatário:", userEmail);
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);
    throw error;
  }
}

testWelcomeEmail()
  .then(() => {
    console.log("\n✨ Teste concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Falha no teste:", error);
    process.exit(1);
  });
