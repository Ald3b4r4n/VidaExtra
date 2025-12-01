/**
 * Admin Panel - Restricted Access
 * Only accessible by authorized admin users
 */

import { auth } from "./firebase-config.js";
import { getIdToken } from "./auth.js";

// Prevent infinite loop
let isLoading = false;
let currentFilter = "all";
let cachedData = null;

/**
 * Check if current user is admin
 */
export async function isAdmin() {
  const user = auth.currentUser;
  if (!user) return false;

  // Simple check - compare email
  return user.email === atob("cmFmYXNvdXphY3J1ekBnbWFpbC5jb20=");
}

/**
 * Initialize admin panel
 */
export async function initAdminPanel() {
  const adminCheck = await isAdmin();

  if (!adminCheck) {
    console.log("Access denied");
    return;
  }

  console.log("Admin access granted");

  // Show admin tab
  const adminTabButton = document.querySelector('[data-tab="admin"]');
  if (adminTabButton) {
    adminTabButton.style.display = "inline-block";
  }

  // Load admin data ONLY ONCE
  if (!isLoading && !cachedData) {
    loadAdminData();
  } else if (cachedData) {
    renderAdminDashboard(cachedData);
  }
}

/**
 * Load admin dashboard data from API
 */
async function loadAdminData() {
  // Prevent multiple simultaneous loads
  if (isLoading) {
    console.log("Already loading admin data, skipping...");
    return;
  }

  isLoading = true;

  try {
    console.log("Loading admin data from API...");

    const idToken = await getIdToken();

    const response = await fetch("/api/admin/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    console.log(`Loaded ${data.totalUsers} users from API`);

    cachedData = data;
    renderAdminDashboard(data);
  } catch (error) {
    console.error("Error loading admin data:", error);
    showAdminError("Erro ao carregar dados: " + error.message);
  } finally {
    isLoading = false;
  }
}

/**
 * Render admin dashboard with pagination
 */
function renderAdminDashboard(data) {
  const container = document.getElementById("admin-users-list");
  if (!container) return;

  if (!data.users || data.users.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="bi bi-people" style="font-size: 3rem;"></i>
        <p class="mt-3">Nenhum usuário encontrado</p>
      </div>
    `;
    return;
  }

  // Sort users by last access (most recent first)
  const sortedUsers = data.users.sort((a, b) => {
    const dateA = new Date(a.lastAccess || a.createdAt || 0);
    const dateB = new Date(b.lastAccess || b.createdAt || 0);
    return dateB - dateA;
  });

  // Create letter filter
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const filterHTML = `
    <div class="mb-3 d-flex gap-2 flex-wrap align-items-center">
      <small class="text-muted fw-bold">Filtrar:</small>
      <button class="btn btn-sm ${
        currentFilter === "all" ? "btn-primary" : "btn-outline-primary"
      }" onclick="window.filterUsersByLetter('all')">
        <i class="bi bi-people"></i> Todos (${sortedUsers.length})
      </button>
      ${letters
        .map((letter) => {
          const count = sortedUsers.filter((u) => {
            const name = (u.displayName || u.email || "").toUpperCase();
            return name.startsWith(letter);
          }).length;
          return count > 0
            ? `
          <button class="btn btn-sm ${
            currentFilter === letter ? "btn-primary" : "btn-outline-secondary"
          }" onclick="window.filterUsersByLetter('${letter}')">${letter} (${count})</button>
        `
            : "";
        })
        .join("")}
    </div>
  `;

  // Filter users by selected letter
  const filteredUsers =
    currentFilter === "all"
      ? sortedUsers
      : sortedUsers.filter((u) => {
          const name = (u.displayName || u.email || "").toUpperCase();
          return name.startsWith(currentFilter);
        });

  const usersHTML =
    filteredUsers.length === 0
      ? `<div class="alert alert-info"><i class="bi bi-info-circle"></i> Nenhum usuário encontrado com a letra "${currentFilter}"</div>`
      : filteredUsers
          .map(
            (user) => `
    <div class="card mb-3 border shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div class="d-flex align-items-center gap-3">
            ${
              user.photoURL
                ? `<img src="${user.photoURL}" alt="${user.displayName}" class="rounded-circle" style="width: 56px; height: 56px; object-fit: cover; border: 2px solid #0d6efd;">`
                : `<div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 56px; height: 56px; font-size: 24px; font-weight: bold; border: 2px solid #0d6efd;">
                ${(user.displayName || user.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>`
            }
            <div>
              <h6 class="mb-1 fw-bold">${user.displayName || "Sem nome"}</h6>
              <small class="text-muted"><i class="bi bi-envelope"></i> ${
                user.email
              }</small>
              <div class="mt-1">
                ${
                  user.calendarConnected
                    ? '<span class="badge bg-success me-1"><i class="bi bi-calendar-check"></i> Calendar</span>'
                    : ""
                }
                ${
                  user.shiftsCount > 0
                    ? `<span class="badge bg-info"><i class="bi bi-clock-history"></i> ${user.shiftsCount} shifts</span>`
                    : ""
                }
              </div>
            </div>
          </div>
          <span class="badge ${
            user.isOnline ? "bg-success" : "bg-secondary"
          } fs-6">
            ${
              user.isOnline
                ? '<i class="bi bi-circle-fill"></i> Online'
                : '<i class="bi bi-circle"></i> Offline'
            }
          </span>
        </div>

        <div class="row g-3">
          <div class="col-md-6">
            <div class="p-2 bg-light rounded">
              <small class="text-muted d-block"><i class="bi bi-calendar-plus"></i> Criado em</small>
              <strong>${formatDate(user.createdAt)}</strong>
            </div>
          </div>
          <div class="col-md-6">
            <div class="p-2 bg-light rounded">
              <small class="text-muted d-block"><i class="bi bi-clock-history"></i> Último acesso</small>
              <strong>${formatDate(user.lastAccess)}</strong>
            </div>
          </div>
        </div>

        ${
          user.shifts && user.shifts.length > 0
            ? `
          <div class="mt-3">
            <button 
              class="btn btn-sm btn-outline-primary" 
              type="button" 
              data-bs-toggle="collapse" 
              data-bs-target="#shifts-${user.uid}" 
              aria-expanded="false"
            >
              <i class="bi bi-calendar-event"></i> Ver Shifts (${
                user.shifts.length
              })
            </button>
            
            <div class="collapse mt-3" id="shifts-${user.uid}">
              <div class="table-responsive">
                <table class="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Período</th>
                      <th>Horas</th>
                      <th>Valor</th>
                      <th>Anotações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${user.shifts
                      .map(
                        (shift) => `
                      <tr>
                        <td>${shift.data || "-"}</td>
                        <td>${shift.periodo || "-"}</td>
                        <td>${(shift.horasTotais || 0).toFixed(2)}h</td>
                        <td>R$ ${(shift.totalLiquido || 0).toFixed(2)}</td>
                        <td><small>${shift.anotacoes || "-"}</small></td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `
          )
          .join("");

  container.innerHTML = filterHTML + usersHTML;

  // Update stats
  updateAdminStats(data);

  // Expose filter function globally
  window.filterUsersByLetter = (letter) => {
    currentFilter = letter;
    renderAdminDashboard(data);
  };
}

/**
 * Update admin statistics
 */
function updateAdminStats(data) {
  const statsContainer = document.getElementById("admin-stats");
  if (!statsContainer) return;

  const totalUsers = data.users.length;
  const onlineUsers = data.users.filter((u) => u.isOnline).length;
  const calendarConnected = data.users.filter(
    (u) => u.calendarConnected
  ).length;
  const totalShifts = data.users.reduce(
    (sum, u) => sum + (u.shiftsCount || 0),
    0
  );

  // Count new users (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const newUsersToday = data.users.filter((u) => {
    if (!u.createdAt) return false;
    const created = new Date(u.createdAt);
    return created > oneDayAgo;
  }).length;

  statsContainer.innerHTML = `
    <div class="row g-3">
      <div class="col-6 col-md-3">
        <div class="card bg-primary text-white h-100">
          <div class="card-body text-center p-2 p-md-3">
            <i class="bi bi-people-fill" style="font-size: 1.5rem;"></i>
            <h2 class="mt-2 mb-0 fs-4 fs-md-2">${totalUsers}</h2>
            <small class="d-block" style="font-size: 0.75rem;">Total de Usuários</small>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card bg-success text-white h-100">
          <div class="card-body text-center p-2 p-md-3">
            <i class="bi bi-circle-fill" style="font-size: 1.5rem;"></i>
            <h2 class="mt-2 mb-0 fs-4 fs-md-2">${onlineUsers}</h2>
            <small class="d-block" style="font-size: 0.75rem;">Online Agora</small>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card bg-info text-white h-100">
          <div class="card-body text-center p-2 p-md-3">
            <i class="bi bi-calendar-check-fill" style="font-size: 1.5rem;"></i>
            <h2 class="mt-2 mb-0 fs-4 fs-md-2">${calendarConnected}</h2>
            <small class="d-block" style="font-size: 0.75rem;">Calendar Conectado</small>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card bg-warning text-dark h-100">
          <div class="card-body text-center p-2 p-md-3">
            <i class="bi bi-clock-history" style="font-size: 1.5rem;"></i>
            <h2 class="mt-2 mb-0 fs-4 fs-md-2">${totalShifts}</h2>
            <small class="d-block" style="font-size: 0.75rem;">Total de Shifts</small>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Format date helper - handles ISO strings from Firebase Auth
 */
function formatDate(dateString) {
  if (!dateString) return "Nunca";

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Data inválida";
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Only show "Agora" if less than 2 minutes AND positive difference
    if (diffMins >= 0 && diffMins < 2) return "Agora";
    if (diffMins >= 2 && diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours >= 1 && diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays >= 1 && diffDays < 7) return `${diffDays}d atrás`;
    if (diffDays >= 7 && diffDays < 30)
      return `${Math.floor(diffDays / 7)} semana(s) atrás`;

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", error, dateString);
    return "Erro na data";
  }
}

/**
 * Show admin error
 */
function showAdminError(message) {
  const container = document.getElementById("admin-users-list");
  if (container) {
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle"></i> ${message}
      </div>
    `;
  }
}

/**
 * Refresh admin data
 */
export function refreshAdminData() {
  cachedData = null; // Clear cache
  if (!isLoading) {
    loadAdminData();
  }
}

export default {
  isAdmin,
  initAdminPanel,
  refreshAdminData,
};
