/**
 * Google Calendar API Client
 * OAuth2 token management and Calendar API calls
 */

import { google } from "googleapis";

const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

/**
 * Cria um cliente OAuth2
 */
export function createOAuth2Client() {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const redirectUri = `${
    process.env.APP_URL || "http://localhost:5500"
  }/oauth2callback`;

  if (!clientId || !clientSecret) {
    throw new Error("OAuth credentials not configured");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Troca authorization code por tokens (access + refresh)
 * @param {string} code - Authorization code do Google OAuth
 * @returns {Promise<Object>} Tokens (access_token, refresh_token, expiry_date)
 */
export async function exchangeCodeForTokens(code) {
  const oauth2Client = createOAuth2Client();

  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    throw new Error("Failed to exchange authorization code");
  }
}

/**
 * Atualiza access token usando refresh token
 * @param {string} refreshToken - Refresh token armazenado
 * @returns {Promise<string>} Novo access token
 */
export async function refreshAccessToken(refreshToken) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials.access_token;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new Error("Failed to refresh access token");
  }
}

/**
 * Lista eventos do calendário do usuário
 * @param {string} accessToken - Access token válido
 * @param {Object} options - Opções de busca (timeMin, timeMax, maxResults)
 * @returns {Promise<Array>} Lista de eventos
 */
export async function listCalendarEvents(accessToken, options = {}) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: options.timeMin || new Date().toISOString(),
      timeMax: options.timeMax,
      maxResults: options.maxResults || 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Error listing calendar events:", error);
    throw new Error("Failed to fetch calendar events");
  }
}

/**
 * Obtém detalhes de um evento específico
 * @param {string} accessToken - Access token válido
 * @param {string} eventId - ID do evento
 * @returns {Promise<Object>} Dados do evento
 */
export async function getCalendarEvent(accessToken, eventId) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    const response = await calendar.events.get({
      calendarId: "primary",
      eventId: eventId,
    });

    return response.data;
  } catch (error) {
    console.error("Error getting calendar event:", error);
    throw new Error("Failed to fetch calendar event");
  }
}

/**
 * Valida se um refresh token ainda é válido
 * @param {string} refreshToken - Refresh token a validar
 * @returns {Promise<boolean>} true se válido
 */
export async function validateRefreshToken(refreshToken) {
  try {
    await refreshAccessToken(refreshToken);
    return true;
  } catch (error) {
    return false;
  }
}

export default {
  createOAuth2Client,
  exchangeCodeForTokens,
  refreshAccessToken,
  listCalendarEvents,
  getCalendarEvent,
  validateRefreshToken,
};
