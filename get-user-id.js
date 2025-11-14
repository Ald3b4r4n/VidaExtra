/**
 * Script para obter User ID do Firebase
 */

require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function getUserId() {
  const email = process.env.SMTP_USER || "rafasouzacruz@gmail.com";

  console.log(`\n🔍 Buscando User ID para: ${email}\n`);

  try {
    const userRecord = await admin.auth().getUserByEmail(email);

    console.log("✅ Usuário encontrado!");
    console.log(`📧 E-mail: ${userRecord.email}`);
    console.log(`🆔 User ID: ${userRecord.uid}`);
    console.log(`👤 Nome: ${userRecord.displayName || "N/A"}`);
    console.log(
      `📅 Criado em: ${new Date(
        userRecord.metadata.creationTime
      ).toLocaleString("pt-BR")}`
    );
    console.log(
      `🔐 Provider: ${userRecord.providerData[0]?.providerId || "N/A"}\n`
    );

    console.log("💡 Use este UID para testar o Google Calendar:");
    console.log(`   node test-calendar-event.js ${userRecord.uid}\n`);

    // Salvar UID no .env.local
    console.log("💾 Quer salvar automaticamente no .env.local? (Y/n)");

    return userRecord.uid;
  } catch (error) {
    console.error("❌ Erro ao buscar usuário:", error.message);
    console.error("\n💡 Certifique-se de que:");
    console.error("   1. Você já fez login no app pelo menos uma vez");
    console.error("   2. O e-mail está correto no .env.local (SMTP_USER)");
    console.error("   3. Firebase Admin SDK está configurado corretamente\n");
    process.exit(1);
  }
}

getUserId();
