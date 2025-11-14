/**
 * Authentication Guard
 * Verifies user login and redirects if necessary
 */

import { auth } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * Verifica se usuário está autenticado
 */
export function checkAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // Usuário está logado
        console.log("User authenticated:", user.email);
        updateUIWithUser(user);
        resolve(user);
      } else {
        // Não está logado - redireciona para login
        console.log("User not authenticated, redirecting to login");
        window.location.href = "pages/login.html";
        resolve(null);
      }
    });
  });
}

/**
 * Atualiza UI com dados do usuário
 */
function updateUIWithUser(user) {
  // Adiciona foto e nome do usuário no header
  const userInfoEl = document.getElementById("user-info");
  if (userInfoEl) {
    userInfoEl.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        ${
          user.photoURL
            ? `<img src="${user.photoURL}" alt="${user.displayName}" class="rounded-circle" style="width: 32px; height: 32px;">`
            : ""
        }
        <span class="text-muted small">${user.displayName || user.email}</span>
      </div>
    `;
  }
}

/**
 * Função de logout
 */
export async function handleLogout() {
  try {
    await signOut(auth);
    localStorage.removeItem("vidaextra-user");
    localStorage.removeItem("ac4-historico");
    localStorage.removeItem("ac4-totais");
    console.log("User logged out successfully");
    window.location.href = "pages/login.html";
  } catch (error) {
    console.error("Error logging out:", error);
    alert("Erro ao fazer logout. Tente novamente.");
  }
}

/**
 * Obtém dados do usuário atual
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Obtém ID token para chamadas ao backend
 */
export async function getIdToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user logged in");
  }
  return await user.getIdToken();
}

export default {
  checkAuth,
  handleLogout,
  getCurrentUser,
  getIdToken,
};
