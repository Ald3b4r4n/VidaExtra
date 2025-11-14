/**
 * Reminders Management
 * Fetch and display upcoming reminders from Google Calendar
 */

import { getIdToken } from "./auth.js";
import { apiFetch } from "./api.js";

/**
 * Formata data para exibição
 */
function formatDate(dateString) {
  // Se é um objeto com dateTime, extraia a string
  const dateStr =
    typeof dateString === "object" && dateString.dateTime
      ? dateString.dateTime
      : dateString;

  const date = new Date(dateStr);

  // Verifica se a data é válida
  if (isNaN(date.getTime())) {
    return "Data inválida";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

/**
 * Calcula tempo restante até o evento
 */
function getTimeUntil(dateString) {
  // Se é um objeto com dateTime, extraia a string
  const dateStr =
    typeof dateString === "object" && dateString.dateTime
      ? dateString.dateTime
      : dateString;

  const now = new Date();
  const eventDate = new Date(dateStr);

  // Verifica se a data é válida
  if (isNaN(eventDate.getTime())) {
    return "Data inválida";
  }

  const diff = eventDate - now;

  if (diff < 0) return "Evento passado";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Busca eventos futuros do Google Calendar
 */
export async function fetchUpcomingEvents() {
  try {
    const idToken = await getIdToken();

    const response = await apiFetch(`/getUpcomingEvents`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return [];
  }
}

/**
 * Renderiza lista de lembretes
 */
export function renderReminders(events, containerId = "lembretes-lista") {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!events || events.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="bi bi-calendar-x" style="font-size: 3rem;"></i>
        <p class="mt-3">Nenhum evento futuro encontrado</p>
        <small>Seus eventos do Google Calendar aparecerão aqui</small>
      </div>
    `;
    return;
  }

  const html = events
    .map((event) => {
      const reminderTypes = ["24h", "1h", "30m"];
      const reminderBadges = reminderTypes
        .map((type) => {
          const label =
            type === "24h"
              ? "24h antes"
              : type === "1h"
              ? "1h antes"
              : "30min antes";
          return `<span class="badge bg-info text-dark me-1">${label}</span>`;
        })
        .join("");

      return `
      <div class="list-group-item">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <h6 class="mb-1 fw-bold">${
              event.summary || "Evento sem título"
            }</h6>
            <p class="mb-1 text-muted small">
              <i class="bi bi-calendar3 me-1"></i> ${formatDate(event.start)}
            </p>
            ${
              event.location
                ? `
              <p class="mb-1 text-muted small">
                <i class="bi bi-geo-alt me-1"></i> ${event.location}
              </p>
            `
                : ""
            }
            <div class="mt-2">
              ${reminderBadges}
            </div>
          </div>
          <div class="text-end">
            <span class="badge bg-primary">${getTimeUntil(event.start)}</span>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  container.innerHTML = html;
}

/**
 * Atualiza configurações de notificações
 */
export async function updateNotificationSettings(settings) {
  try {
    const idToken = await getIdToken();

    const response = await apiFetch(`/updateNotifySettings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error("Failed to update settings");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating notification settings:", error);
    throw error;
  }
}

/**
 * Inicializa aba de lembretes
 */
export async function initReminders() {
  try {
    const events = await fetchUpcomingEvents();
    renderReminders(events);
  } catch (error) {
    console.error("Error initializing reminders:", error);
  }
}

/**
 * Utilitário: cria um evento no Google Calendar via backend
 * Mantém a responsabilidade de token/refresh no servidor.
 */
export async function createCalendarEvent({
  summary,
  description,
  location,
  startISO,
  endISO,
  reminders,
}) {
  const idToken = await (await import("./auth.js")).getIdToken();
  // Fallback: envia o accessToken do Google obtido no login para o backend usar caso não haja refresh_token salvo ainda
  let googleAccessToken;
  try {
    const ls = localStorage.getItem("vidaextra-user");
    if (ls) {
      const parsed = JSON.parse(ls);
      googleAccessToken = parsed?.accessToken;
    }
  } catch {}
  const response = await (
    await import("./api.js")
  ).apiFetch("/createCalendarEvent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      summary,
      description,
      location,
      startISO,
      endISO,
      reminders,
      googleAccessToken,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to create calendar event");
  }
  return await response.json();
}

export default {
  fetchUpcomingEvents,
  renderReminders,
  updateNotificationSettings,
  initReminders,
  createCalendarEvent,
};
