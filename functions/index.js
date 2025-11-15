/**
 * Firebase Cloud Functions - VidaExtra
 * Calendar Integration and Email Notifications
 */

import { onRequest, onSchedule } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as dotenv from "dotenv";
import {
  exchangeCodeForTokens,
  refreshAccessToken,
  listCalendarEvents,
  createCalendarEvent as gcalCreateEvent,
} from "./googleClient.js";
import { sendReminderEmail, sendWelcomeEmail } from "./mail.js";

// Carrega variáveis de ambiente de .env.local para evitar conflito com o carregamento automático do emulador
dotenv.config({ path: ".env.local" });

// Inicializa Firebase Admin
initializeApp();
const db = getFirestore();
const auth = getAuth();

// Health check endpoint (no auth) to detect emulator availability from the frontend
export const ping = onRequest({ cors: true }, (req, res) => {
  res.status(200).send("ok");
});

// Explicit CORS handling to allow Authorization header and preflight
const ALLOWED_ORIGINS = [
  "https://vida-extra.vercel.app",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

function applyCors(req, res) {
  const origin = req.headers.origin;
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

/**
 * Endpoint: Registrar credenciais OAuth2 do usuário
 * POST /registerCredentials
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body: { uid, email, displayName, photoURL, accessToken }
 */
export const registerCredentials = onRequest(
  { cors: true },
  async (request, response) => {
    // Apenas método POST
    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      // Verifica autenticação
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        response.status(401).json({ error: "Unauthorized" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await auth.verifyIdToken(idToken);
      const { uid } = decodedToken;

      // Extrai dados do body
      const { email, displayName, photoURL, accessToken } = request.body;

      if (!email || !accessToken) {
        response.status(400).json({ error: "Missing required fields" });
        return;
      }

      console.log(`Registering credentials for user: ${uid} (${email})`);

      // Salva dados do usuário no Firestore
      const userRef = db.collection("users").doc(uid);
      await userRef.set(
        {
          uid,
          email,
          displayName: displayName || email.split("@")[0],
          photoURL: photoURL || null,
          // IMPORTANTE: Em produção, use Cloud Secret Manager para tokens
          // Por simplicidade, salvando direto (criptografar em produção!)
          refreshToken: accessToken, // Temporário: deve ser trocado por refresh_token
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

      // Envia e-mail de boas-vindas
      try {
        await sendWelcomeEmail({ to: email, userName: displayName });
      } catch (emailError) {
        console.warn("Failed to send welcome email:", emailError);
      }

      response.status(200).json({
        success: true,
        message: "Credentials registered successfully",
        uid,
      });
    } catch (error) {
      console.error("Error in registerCredentials:", error);
      response.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  }
);

/**
 * Endpoint: Atualizar preferências de notificação
 * POST /updateNotifySettings
 * Body: { emailNotifications, reminderTypes }
 */
export const updateNotifySettings = onRequest(
  { cors: true },
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        response.status(401).json({ error: "Unauthorized" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await auth.verifyIdToken(idToken);
      const { uid } = decodedToken;

      const { emailNotifications, reminderTypes } = request.body;

      const userRef = db.collection("users").doc(uid);
      await userRef.update({
        "notifySettings.email": emailNotifications !== false,
        "notifySettings.reminders": reminderTypes || ["24h", "1h", "30m"],
        updatedAt: Timestamp.now(),
      });

      response.status(200).json({
        success: true,
        message: "Notification settings updated",
      });
    } catch (error) {
      console.error("Error updating notify settings:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * Endpoint: Buscar eventos futuros do Google Calendar
 * GET /getUpcomingEvents
 * Headers: Authorization: Bearer <firebase-id-token>
 */
export const getUpcomingEvents = onRequest(
  { cors: true },
  async (request, response) => {
    // CORS preflight and headers
    if (applyCors(request, response)) return;
    if (request.method !== "GET") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        response.status(401).json({ error: "Unauthorized" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await auth.verifyIdToken(idToken);
      const { uid } = decodedToken;

      // Busca dados do usuário
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        response.status(404).json({ error: "User not found" });
        return;
      }

      const userData = userDoc.data();
      const { refreshToken } = userData;

      if (!refreshToken) {
        response.status(400).json({ error: "No refresh token found" });
        return;
      }

      // Atualiza access token
      const accessToken = await refreshAccessToken(refreshToken);

      // Busca eventos dos próximos 7 dias
      const now = new Date();
      const futureTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const events = await listCalendarEvents(accessToken, {
        timeMin: now.toISOString(),
        timeMax: futureTime.toISOString(),
        maxResults: 20,
      });

      response.status(200).json({
        success: true,
        events: events.map((event) => ({
          id: event.id,
          summary: event.summary,
          description: event.description,
          location: event.location,
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
        })),
      });
    } catch (error) {
      console.error("Error in getUpcomingEvents:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * Endpoint: Criar evento no Google Calendar do usuário
 * POST /createCalendarEvent
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body: { summary, description, location, startISO, endISO, reminders }
 */
export const createCalendarEvent = onRequest(
  { cors: true },
  async (request, response) => {
    // CORS preflight and headers
    if (applyCors(request, response)) return;
    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        response.status(401).json({ error: "Unauthorized" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await auth.verifyIdToken(idToken);
      const { uid } = decodedToken;

      // Busca refresh token salvo
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        response.status(404).json({ error: "User not found" });
        return;
      }
      const userData = userDoc.data();
      const { refreshToken } = userData;
      // Atualiza access token; se não houver refresh token salvo, tenta usar access token direto do body como fallback
      let accessToken;
      if (refreshToken) {
        accessToken = await refreshAccessToken(refreshToken);
      }

      // Monta requestBody do evento
      const {
        summary,
        description,
        location,
        startISO,
        endISO,
        reminders,
        googleAccessToken,
      } = request.body || {};
      if (!startISO || !endISO) {
        response.status(400).json({ error: "Missing startISO or endISO" });
        return;
      }

      // Se não foi possível obter novo access token via refresh, use o enviado pelo cliente como último recurso
      if (!accessToken && googleAccessToken) {
        accessToken = googleAccessToken;
      }
      if (!accessToken) {
        response.status(400).json({ error: "No access token available" });
        return;
      }

      const event = {
        summary: summary || "AC-4",
        description: description || undefined,
        location: location || undefined,
        start: { dateTime: new Date(startISO).toISOString() },
        end: { dateTime: new Date(endISO).toISOString() },
        reminders: reminders || { useDefault: true },
      };

      const created = await gcalCreateEvent(accessToken, event);

      response.status(200).json({
        success: true,
        id: created.id,
        htmlLink: created.htmlLink,
        status: created.status,
      });
    } catch (error) {
      console.error("Error creating calendar event:", error);
      response.status(500).json({ error: error.message || "Internal error" });
    }
  }
);

/**
 * Calcula timestamp do lembrete
 * @param {Date} eventStart - Data/hora do evento
 * @param {string} reminderType - Tipo: '24h', '1h', '30m'
 * @returns {number} Timestamp em milissegundos
 */
function calculateReminderTime(eventStart, reminderType) {
  const eventTime = new Date(eventStart).getTime();

  const offsets = {
    "24h": 24 * 60 * 60 * 1000, // 24 horas
    "1h": 60 * 60 * 1000, // 1 hora
    "30m": 30 * 60 * 1000, // 30 minutos
  };

  return eventTime - (offsets[reminderType] || 0);
}

/**
 * Verifica se lembrete já foi enviado
 * @param {string} userId - ID do usuário
 * @param {string} eventId - ID do evento
 * @param {string} reminderType - Tipo de lembrete
 * @returns {Promise<boolean>} true se já foi enviado
 */
async function wasReminderSent(userId, eventId, reminderType) {
  const sentRef = db
    .collection("users")
    .doc(userId)
    .collection("sentNotifications")
    .doc(`${eventId}_${reminderType}`);

  const doc = await sentRef.get();
  return doc.exists;
}

/**
 * Marca lembrete como enviado
 * @param {string} userId - ID do usuário
 * @param {string} eventId - ID do evento
 * @param {string} reminderType - Tipo de lembrete
 */
async function markReminderAsSent(userId, eventId, reminderType) {
  const sentRef = db
    .collection("users")
    .doc(userId)
    .collection("sentNotifications")
    .doc(`${eventId}_${reminderType}`);

  await sentRef.set({
    eventId,
    reminderType,
    sentAt: Timestamp.now(),
  });
}

/**
 * Processa lembretes para um usuário
 * @param {Object} userData - Dados do usuário
 * @param {string} userId - ID do usuário
 */
async function processUserReminders(userData, userId) {
  const { email, displayName, refreshToken, notifySettings } = userData;

  // Verifica se notificações estão ativas
  if (!notifySettings?.email) {
    console.log(`User ${userId} has email notifications disabled`);
    return;
  }

  try {
    // Atualiza access token
    let accessToken;
    try {
      accessToken = await refreshAccessToken(refreshToken);
    } catch (tokenError) {
      console.error(`Failed to refresh token for user ${userId}:`, tokenError);
      return;
    }

    // Busca eventos das próximas 48 horas
    const now = new Date();
    const futureTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const events = await listCalendarEvents(accessToken, {
      timeMin: now.toISOString(),
      timeMax: futureTime.toISOString(),
      maxResults: 20,
    });

    console.log(`Found ${events.length} events for user ${userId}`);

    const reminderTypes = notifySettings.reminders || ["24h", "1h", "30m"];
    const currentTime = Date.now();

    // Processa cada evento
    for (const event of events) {
      if (!event.start?.dateTime) continue;

      const eventStart = new Date(event.start.dateTime);
      const eventId = event.id;

      // Verifica cada tipo de lembrete
      for (const reminderType of reminderTypes) {
        const reminderTime = calculateReminderTime(eventStart, reminderType);

        // Janela de 5 minutos para enviar (evita perder lembretes)
        const timeDiff = currentTime - reminderTime;
        const shouldSend = timeDiff >= 0 && timeDiff < 5 * 60 * 1000;

        if (shouldSend) {
          // Verifica se já foi enviado
          const alreadySent = await wasReminderSent(
            userId,
            eventId,
            reminderType
          );

          if (!alreadySent) {
            console.log(
              `Sending ${reminderType} reminder for event ${eventId} to ${email}`
            );

            try {
              await sendReminderEmail({
                to: email,
                userName: displayName,
                event: {
                  summary: event.summary,
                  start: event.start.dateTime,
                  location: event.location,
                  description: event.description,
                },
                reminderType,
              });

              await markReminderAsSent(userId, eventId, reminderType);
              console.log(
                `Reminder sent successfully: ${eventId}_${reminderType}`
              );
            } catch (emailError) {
              console.error(`Failed to send reminder email:`, emailError);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error processing reminders for user ${userId}:`, error);
  }
}

/**
 * Job agendado: Verifica lembretes a cada 5 minutos
 * Cron: every 5 minutes (equivalente ao padrão cron: a cada 5 minutos)
 */
export const checkReminders = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "America/Sao_Paulo",
    memory: "256MiB",
  },
  async (event) => {
    console.log("Starting scheduled reminder check...");

    try {
      // Busca todos os usuários
      const usersSnapshot = await db.collection("users").get();

      console.log(`Processing ${usersSnapshot.size} users`);

      // Processa cada usuário
      const promises = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const userId = doc.id;

        if (userData.refreshToken) {
          promises.push(processUserReminders(userData, userId));
        }
      });

      await Promise.allSettled(promises);

      console.log("Reminder check completed successfully");
    } catch (error) {
      console.error("Error in checkReminders job:", error);
    }
  }
);

/**
 * Endpoint de teste: Força verificação de lembretes manualmente
 * GET /testReminders
 */
export const testReminders = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        response.status(401).json({ error: "Unauthorized" });
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await auth.verifyIdToken(idToken);
      const { uid } = decodedToken;

      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        response.status(404).json({ error: "User not found" });
        return;
      }

      await processUserReminders(userDoc.data(), uid);

      response.status(200).json({
        success: true,
        message: "Reminders checked manually",
      });
    } catch (error) {
      console.error("Error in testReminders:", error);
      response.status(500).json({ error: error.message });
    }
  }
);
