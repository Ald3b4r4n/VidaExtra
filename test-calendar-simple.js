/**
 * Script de Teste Simplificado - Google Calendar
 * Cria evento usando apenas OAuth (sem Firestore)
 *
 * IMPORTANTE: Você precisa fazer login no app primeiro para obter um access token
 */

require("dotenv").config({ path: ".env.local" });
const { google } = require("googleapis");

console.log("\n═══════════════════════════════════════════════════");
console.log("🧪 TESTE SIMPLIFICADO: Google Calendar");
console.log("═══════════════════════════════════════════════════\n");

console.log("⚠️  INSTRUÇÕES:\n");
console.log("1. Abra o app: http://localhost:5500/pages/login.html");
console.log("2. Faça login com Google");
console.log("3. Autorize acesso ao Google Calendar");
console.log("4. Abra o Console do navegador (F12)");
console.log("5. Digite e execute:\n");
console.log("   firebase.auth().currentUser.getIdToken().then(console.log)\n");
console.log("6. Copie o token que aparecer");
console.log("7. Cole abaixo quando solicitado\n");

console.log("═══════════════════════════════════════════════════\n");

// Aguardar input do usuário
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Cole o Access Token aqui: ", async (accessToken) => {
  rl.close();

  if (!accessToken || accessToken.trim().length < 10) {
    console.error(
      "\n❌ Token inválido! Execute as instruções acima primeiro.\n"
    );
    process.exit(1);
  }

  console.log("\n✅ Token recebido! Testando...\n");

  try {
    // Configurar OAuth2
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken.trim() });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Dados do evento de teste
    const now = new Date();
    const startTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Daqui a 2 horas
    const endTime = new Date(startTime.getTime() + 7 * 60 * 60 * 1000); // 7 horas depois

    const eventData = {
      summary: "AC-4 17:00 às 00:00 - TESTE VidaExtra®",
      description: `🧪 EVENTO DE TESTE - VidaExtra® AC-4\n\nHoras: 7.00h | Valor líquido: R$ 264,81\nLocal: 14ª CIPM - Noroeste\n\nEste é um evento de teste criado via API.`,
      location: "14ª CIPM - Batalhão Noroeste, Salvador, BA",
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 24h antes
          { method: "email", minutes: 60 }, // 1h antes
          { method: "popup", minutes: 30 }, // 30min antes
        ],
      },
      colorId: "11", // Vermelho para destaque
    };

    console.log("📝 Dados do evento:");
    console.log(`   Título: ${eventData.summary}`);
    console.log(`   Início: ${startTime.toLocaleString("pt-BR")}`);
    console.log(`   Fim: ${endTime.toLocaleString("pt-BR")}`);
    console.log(`   Local: ${eventData.location}`);
    console.log(`   Lembretes: 24h (email), 1h (email), 30min (popup)\n`);

    console.log("🚀 Criando evento no Google Calendar...\n");

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventData,
    });

    const event = response.data;

    console.log("✅ EVENTO CRIADO COM SUCESSO!\n");
    console.log("═══════════════════════════════════════════════════");
    console.log("📊 Detalhes do evento:");
    console.log("═══════════════════════════════════════════════════");
    console.log(`   ID: ${event.id}`);
    console.log(`   Status: ${event.status}`);
    console.log(`   Link: ${event.htmlLink}`);
    console.log(
      `   Criado em: ${new Date(event.created).toLocaleString("pt-BR")}\n`
    );

    console.log("💡 Ações:");
    console.log(`   1. Acesse: ${event.htmlLink}`);
    console.log(`   2. Verifique se o evento aparece no Google Calendar`);
    console.log(`   3. Confirme que os lembretes estão configurados`);
    console.log(`   4. Teste as notificações do Google\n`);

    console.log("═══════════════════════════════════════════════════");
    console.log("✅ TESTE CONCLUÍDO COM SUCESSO!");
    console.log("═══════════════════════════════════════════════════\n");
  } catch (error) {
    console.error("\n═══════════════════════════════════════════════════");
    console.error("❌ TESTE FALHOU");
    console.error("═══════════════════════════════════════════════════");
    console.error(`\nErro: ${error.message}\n`);

    if (error.code === 401) {
      console.error(
        "💡 Token expirado ou inválido. Faça login novamente no app.\n"
      );
    } else if (error.code === 403) {
      console.error(
        "💡 Sem permissão. Verifique se autorizou acesso ao Google Calendar.\n"
      );
    } else if (error.response?.data) {
      console.error(
        "📋 Detalhes:",
        JSON.stringify(error.response.data, null, 2),
        "\n"
      );
    }

    process.exit(1);
  }
});
