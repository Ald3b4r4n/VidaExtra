/**
 * Reminders Management
 * Fetch and display upcoming reminders from Google Calendar
 */

import { firebasePromise } from "./firebase-config.js";
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
    await firebasePromise;
    const idToken = await getIdToken();
    // Primeiro tenta o access token obtido via oauth2callback; se não existir, usa o do popup
    let googleAccessToken = null;
    try {
      googleAccessToken = localStorage.getItem("googleAccessToken");
      if (!googleAccessToken) {
        const ls = localStorage.getItem("vidaextra-user");
        if (ls) {
          const parsed = JSON.parse(ls);
          googleAccessToken = parsed?.accessToken || null;
        }
      }
    } catch {}

    const response = await apiFetch(`/getUpcomingEvents`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        ...(googleAccessToken ? { "X-Google-Access-Token": googleAccessToken } : {}),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }

    const data = await response.json();
    const events = data.events || [];

    // Sincronizar eventos deletados
    await syncDeletedEvents(events);

    return events;
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return [];
  }
}

/**
 * Sincroniza eventos deletados do Google Calendar
 * Remove do histórico local eventos que foram deletados no Google Calendar
 */
async function syncDeletedEvents(currentEvents) {
  try {
    // Buscar histórico local
    const historico = JSON.parse(localStorage.getItem("historico") || "[]");

    if (!historico || historico.length === 0) {
      return; // Nada para sincronizar
    }

    // Criar mapa de event IDs que ainda existem no Google Calendar
    const existingEventIds = new Set(
      currentEvents.filter((event) => event.id).map((event) => event.id)
    );

    // Filtrar histórico removendo eventos que não existem mais no Google
    const syncedHistorico = historico.filter((item) => {
      // Se não tem eventId, manter (evento antigo ou sem ID)
      if (!item.eventId) return true;

      // Se o eventId ainda existe no Google Calendar, manter
      return existingEventIds.has(item.eventId);
    });

    // Atualizar localStorage se houve mudanças
    if (syncedHistorico.length !== historico.length) {
      const removed = historico.length - syncedHistorico.length;
      console.log(
        `🗑️ Sincronização: ${removed} evento(s) deletado(s) do Google Calendar removidos do histórico local`
      );
      localStorage.setItem("historico", JSON.stringify(syncedHistorico));

      // Disparar evento para atualizar UI do histórico se estiver aberto
      window.dispatchEvent(new CustomEvent("historico-updated"));
    }
  } catch (error) {
    console.error("Error syncing deleted events:", error);
  }
}

/**
 * Renderiza lista de lembretes
 */
export function renderReminders(events, containerId = "lembretes-lista") {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Filtrar apenas eventos válidos com data válida
  const validEvents = (events || []).filter((event) => {
    if (!event || !event.start) return false;
    const dateStr =
      typeof event.start === "object" && event.start.dateTime
        ? event.start.dateTime
        : event.start;
    const date = new Date(dateStr);
    return !isNaN(date.getTime()); // Só retorna eventos com data válida
  });

  if (validEvents.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="bi bi-calendar-x" style="font-size: 3rem;"></i>
        <p class="mt-3">Nenhum evento futuro encontrado</p>
        <small>Seus eventos do Google Calendar aparecerão aqui</small>
      </div>
    `;
    return;
  }

  const html = validEvents
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
    await firebasePromise;
    await (await import("./auth.js")).checkAuth();
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
  // Primeiro tenta o access token obtido via oauth2callback; se não existir, usa o do popup
  let googleAccessToken = null;
  try {
    googleAccessToken = localStorage.getItem("googleAccessToken");
    if (!googleAccessToken) {
      const ls = localStorage.getItem("vidaextra-user");
      if (ls) {
        const parsed = JSON.parse(ls);
        googleAccessToken = parsed?.accessToken || null;
      }
    }
  } catch {}
  const response = await (
    await import("./api.js")
  ).apiFetch("/createCalendarEvent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...(googleAccessToken ? { "X-Google-Access-Token": googleAccessToken } : {}),
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
