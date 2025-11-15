/**
 * Google Calendar OAuth Integration
 * Handles authorization flow for Google Calendar API
 */

/**
 * Inicia o fluxo OAuth do Google Calendar
 */
export async function connectGoogleCalendar() {
  const oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";

  // Buscar Client ID do ambiente
  const response = await fetch("/api/oauth-client-id");
  const { clientId } = await response.json();

  // Parâmetros OAuth
  const params = {
    client_id: clientId,
    redirect_uri: window.location.origin + "/pages/oauth2callback.html",
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ].join(" "),
    access_type: "offline",
    prompt: "consent", // Força mostrar tela de consentimento para obter refresh_token
  };

  // Construir URL
  const url = oauth2Endpoint + "?" + new URLSearchParams(params).toString();

  // Redirecionar
  window.location.href = url;
}

/**
 * Verifica se usuário já conectou o Google Calendar
 */
export async function isCalendarConnected() {
  const accessToken = localStorage.getItem("googleAccessToken");
  return !!accessToken;
}

/**
 * Desconectar Google Calendar
 */
export function disconnectCalendar() {
  localStorage.removeItem("googleAccessToken");
  console.log("Google Calendar desconectado");
}

export default {
  connectGoogleCalendar,
  isCalendarConnected,
  disconnectCalendar,
};
