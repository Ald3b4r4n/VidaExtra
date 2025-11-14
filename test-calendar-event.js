/**
 * Script de Teste - Criação Real de Evento no Google Calendar
 * Testa a escrita de eventos na base do Google Calendar
 */

require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");
const { google } = require("googleapis");

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Atualiza o access token usando o refresh token
 */
async function refreshAccessToken(refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    process.env.OAUTH_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials.access_token;
  } catch (error) {
    throw new Error(`Falha ao atualizar access token: ${error.message}`);
  }
}

/**
 * Cria evento no Google Calendar
 */
async function createCalendarEvent(userId) {
  console.log("\n🔍 Buscando credenciais do usuário...");

  // Buscar dados do usuário
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    throw new Error("Usuário não encontrado no Firestore");
  }

  const userData = userDoc.data();
  console.log(`✅ Usuário encontrado: ${userData.email}`);

  // Atualizar access token
  console.log("🔄 Atualizando access token...");
  const accessToken = await refreshAccessToken(userData.refreshToken);
  console.log("✅ Access token atualizado\n");

  // Configurar OAuth2
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

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

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventData,
    });

    const event = response.data;

    console.log("✅ EVENTO CRIADO COM SUCESSO!\n");
    console.log("📊 Detalhes do evento:");
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

    return event;
  } catch (error) {
    console.error("❌ Erro ao criar evento:", error.message);
    if (error.response?.data) {
      console.error(
        "📋 Detalhes:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    throw error;
  }
}

/**
 * Executa teste completo
 */
async function runTest() {
  // Verificar variáveis de ambiente
  const requiredEnvVars = [
    "FIREBASE_SERVICE_ACCOUNT",
    "OAUTH_CLIENT_ID",
    "OAUTH_CLIENT_SECRET",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error("❌ Variáveis de ambiente faltando:");
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    console.error(
      "\n💡 Crie um arquivo .env.local com as credenciais necessárias"
    );
    process.exit(1);
  }

  console.log("═══════════════════════════════════════════════════");
  console.log("🧪 TESTE: Criação de Evento no Google Calendar");
  console.log("═══════════════════════════════════════════════════");

  // UID do usuário para teste (você deve fornecer)
  const userId = process.env.TEST_USER_ID || process.argv[2];

  if (!userId) {
    console.error("\n❌ UID do usuário não fornecido!");
    console.error("\n💡 Uso:");
    console.error("   node test-calendar-event.js <USER_ID>");
    console.error("   ou defina TEST_USER_ID no .env.local\n");
    process.exit(1);
  }

  console.log(`🔑 User ID: ${userId}\n`);

  try {
    await createCalendarEvent(userId);

    console.log("═══════════════════════════════════════════════════");
    console.log("✅ TESTE CONCLUÍDO COM SUCESSO!");
    console.log("═══════════════════════════════════════════════════\n");
    process.exit(0);
  } catch (error) {
    console.error("\n═══════════════════════════════════════════════════");
    console.error("❌ TESTE FALHOU");
    console.error("═══════════════════════════════════════════════════");
    console.error(`\nErro: ${error.message}\n`);
    process.exit(1);
  }
}

// Executar teste
runTest();
